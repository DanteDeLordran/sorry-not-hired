import asyncio
import json
import logging
import math
import os
import signal
import sys
import tempfile
from pathlib import Path
from time import monotonic

from core.config import settings

logger = logging.getLogger(__name__)
MAX_PDF_BYTES = 5 * 1024 * 1024
WORKER = Path(__file__).with_name("pdf_worker.py")


class InvalidPDF(ValueError):
    pass


class PDFTooLarge(InvalidPDF):
    pass


async def extract_pdf(data: bytes) -> str:
    started = monotonic()
    # An anonymous temporary file avoids a second pipe and is removed on every exit.
    with tempfile.TemporaryFile() as source:
        source.write(data)
        source.seek(0)
        process = await asyncio.create_subprocess_exec(
            sys.executable,
            "-I",
            str(WORKER),
            str(settings.max_pdf_pages),
            str(settings.max_cv_chars),
            str(settings.pdf_memory_mb),
            str(math.ceil(settings.pdf_timeout_seconds)),
            stdin=source,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            # Do not pass API credentials or application configuration to the parser.
            env={"PATH": os.defpath, "LANG": "C.UTF-8"},
            start_new_session=True,
        )
        try:
            async with asyncio.timeout(settings.pdf_timeout_seconds):
                assert process.stdout is not None
                try:
                    # JSON escaping can expand each character to six bytes.
                    await process.stdout.readexactly(settings.max_cv_chars * 6 + 1024)
                except asyncio.IncompleteReadError as exc:
                    output = exc.partial
                else:
                    raise PDFTooLarge("Parser output exceeded its limit")
                if await process.wait() != 0:
                    raise InvalidPDF("Parser exited without a result")
                result = json.loads(output)
                if result.get("error") == "too_large":
                    raise PDFTooLarge("PDF exceeds page or text limits")
                if "text" not in result:
                    raise InvalidPDF("Could not extract PDF text")
                text = result["text"]
                if not isinstance(text, str) or len(text) > settings.max_cv_chars:
                    raise PDFTooLarge("PDF exceeds text limit")
                return text
        finally:
            # Kill the whole process group on timeout, cancellation, or oversized output.
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            await process.wait()
            logger.info("pdf_extraction duration_ms=%d", (monotonic() - started) * 1000)
