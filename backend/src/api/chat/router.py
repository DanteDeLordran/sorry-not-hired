import json
import logging
import re
from contextlib import aclosing
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from openai import APITimeoutError

from api.chat.models import RoastResponse
from core.config import settings
from core.llm import stream_roast
from core.pdf import MAX_PDF_BYTES, InvalidPDF, PDFTooLarge, extract_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat")

MIN_CV_TEXT_CHARS = 200
CV_KEYWORDS = (
    "experience",
    "education",
    "skills",
    "work",
    "employment",
    "university",
    "degree",
    "professional",
    "career",
    "summary",
    "objective",
    "references",
    "linkedin",
    "github",
    "portfolio",
    "certification",
    "internship",
    "bachelor",
    "master",
    "phd",
)
MIN_CV_KEYWORD_HITS = 2


def _looks_like_cv(text: str) -> bool:
    """Cheap heuristic: enough text and at least N CV-flavored keywords."""
    if len(text) < MIN_CV_TEXT_CHARS:
        return False
    lowered = text.lower()
    hits = sum(1 for kw in CV_KEYWORDS if re.search(rf"\b{kw}\b", lowered))
    return hits >= MIN_CV_KEYWORD_HITS


async def admit_roast(request: Request):
    # One async API worker per container; Nginx also enforces a shared global cap.
    slots = request.app.state.roast_slots
    if slots.locked():
        raise HTTPException(
            429,
            "The roast engine is busy. Try again shortly.",
            headers={"Retry-After": "10"},
        )
    async with slots:
        yield


def model_error(exc: Exception) -> HTTPException:
    # Provider errors can contain request data; log only their class.
    logger.warning("generation_failed error=%s", type(exc).__name__)
    if isinstance(exc, (TimeoutError, APITimeoutError)):
        return HTTPException(
            504, "The model took too long to respond. Try again shortly."
        )
    return HTTPException(
        503, "The roast engine is unavailable right now. Try again soon."
    )


@router.post(
    "/message",
    response_model=RoastResponse,
    summary="Roast a CV",
    description="Upload a PDF CV and get a brutal roast in return",
    dependencies=[Depends(admit_roast)],
)
async def send_message(
    request: Request,
    file: Annotated[
        UploadFile, File(description="PDF file containing the CV to roast")
    ],
) -> RoastResponse | StreamingResponse:
    pdf_bytes = await file.read(MAX_PDF_BYTES + 1)
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File too large. Max size is {MAX_PDF_BYTES // (1024 * 1024)} MB.",
        )

    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    try:
        slots = request.app.state.pdf_slots
        if slots.locked():
            raise HTTPException(
                429,
                "PDF processing is busy. Try again shortly.",
                headers={"Retry-After": "5"},
            )
        async with slots:
            cv_text = await extract_pdf(pdf_bytes)
    except PDFTooLarge as exc:
        raise HTTPException(
            413,
            f"PDF exceeds {settings.max_pdf_pages} pages or {settings.max_cv_chars} extracted characters.",
        ) from exc
    except TimeoutError as exc:
        raise HTTPException(504, "This PDF took too long to process.") from exc
    except (InvalidPDF, ValueError) as exc:
        logger.warning("pdf_rejected error=%s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not read this PDF. It may be corrupted or password-protected.",
        ) from exc

    if not _looks_like_cv(cv_text):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This doesn't look like a CV. Try a resume PDF instead.",
        )

    if await request.is_disconnected():
        raise HTTPException(499, "Client disconnected")

    if "text/event-stream" in request.headers.get("accept", ""):

        async def events():
            try:
                async with aclosing(
                    stream_roast(cv_text, request.app.state.llm)
                ) as chunks:
                    async for text in chunks:
                        yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"
                yield 'data: {"type": "done"}\n\n'
            except Exception as exc:  # noqa: BLE001 - Emit a sanitized terminal SSE error.
                error = model_error(exc)
                yield f"data: {json.dumps({'type': 'error', 'status': error.status_code, 'message': error.detail})}\n\n"

        return StreamingResponse(
            events(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-store",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        roast = "".join(
            [text async for text in stream_roast(cv_text, request.app.state.llm)]
        )
        return RoastResponse(roast=roast.strip())
    except Exception as exc:
        raise model_error(exc) from exc
