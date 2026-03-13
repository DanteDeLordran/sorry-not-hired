from typing import Annotated
from fastapi import APIRouter, File, UploadFile
from fastapi.params import Depends
from pydantic_ai.agent import Agent

from api.chat.models import RoastResponse, RoastOutput
from dependencies import get_agent

router = APIRouter(prefix="/chat")


@router.post(
    "/message",
    response_model=RoastResponse,
    summary="Roast a CV",
    description="Upload a PDF CV and get a brutal roast in return",
)
async def send_message(
    agent: Annotated[Agent[None, RoastOutput], Depends(get_agent)],
    file: Annotated[
        UploadFile, File(description="PDF file containing the CV to roast")
    ],
) -> RoastResponse | dict[str, str]:

    if not file or not file.filename:
        return {"error": "No file"}

    if file.content_type != "application/pdf" and not file.filename.lower().endswith(
        ".pdf"
    ):
        return {"error": "Not a PDF file"}

    content = await file.read()

    # Extract text from PDF using pymupdf4llm
    try:
        from io import BytesIO

        import pymupdf4llm

        cv_text = pymupdf4llm.to_markdown(BytesIO(content))
    except Exception as e:
        cv_text = f"[Error reading PDF: {str(e)}]"

    # Run the agent with the CV content
    result = await agent.run(f"Roast this CV:\n\n{cv_text}")

    # Return structured JSON response
    return RoastResponse(
        roast=result.output.roast,
        severity=result.output.severity,
        filename=file.filename,
    )
