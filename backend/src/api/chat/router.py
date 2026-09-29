import asyncio
import logging
import re
from typing import Annotated

import pymupdf
import pymupdf4llm
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from api.chat.models import RoastResponse
from core.agent import agent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat")

MAX_PDF_BYTES = 5 * 1024 * 1024  # 5 MB
AGENT_TIMEOUT_SECONDS = 60.0
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


@router.post(
    "/message",
    response_model=RoastResponse,
    summary="Roast a CV",
    description="Upload a PDF CV and get a brutal roast in return",
)
async def send_message(
    file: Annotated[
        UploadFile, File(description="PDF file containing the CV to roast")
    ],
) -> RoastResponse:
    pdf_bytes = await file.read()
    if len(pdf_bytes) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size is {MAX_PDF_BYTES // (1024 * 1024)} MB.",
        )

    if not pdf_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    try:
        cv_text = pymupdf4llm.to_markdown(pymupdf.open(stream=pdf_bytes, filetype="pdf"))
    except Exception as exc:
        logger.warning("PDF extraction failed for %s: %s", file.filename, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not read this PDF. It may be corrupted or password-protected.",
        ) from exc

    if not _looks_like_cv(cv_text):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This doesn't look like a CV. Try a resume PDF instead.",
        )

    try:
        result = await asyncio.wait_for(
            agent.run(f"Roast this CV:\n\n{cv_text}"),
            timeout=AGENT_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        logger.warning("Agent timed out after %ss", AGENT_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The model took too long to respond. Try again in a moment.",
        )
    except Exception as exc:
        logger.exception("Agent run failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The roast engine is unavailable right now. Try again soon.",
        ) from exc

    return RoastResponse(roast=result.output)
