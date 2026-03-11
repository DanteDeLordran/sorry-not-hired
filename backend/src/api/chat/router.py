from fastapi import APIRouter
from fastapi.datastructures import UploadFile
from fastapi.params import Depends
from pydantic_ai.agent import Agent

from core.agent import create_agent

router = APIRouter(prefix="/chat")


@router.post("/message")
async def send_message(file: UploadFile, agent: Agent = Depends(create_agent)):

    if file.content_type != "application/pdf" and not file.filename.lower().endswith(
        ".pdf"
    ):
        return {"error": "Not a PDF file"}

    content = await file.read()

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
    }
