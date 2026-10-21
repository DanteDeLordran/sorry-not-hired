import asyncio
import importlib
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import httpx
import pymupdf
from openai import AsyncOpenAI

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from core.config import settings
from core.llm import stream_roast
from core.pdf import InvalidPDF, PDFTooLarge, extract_pdf
from main import app

chat = importlib.import_module("api.chat.router")
pdf_module = importlib.import_module("core.pdf")

CV = """Professional experience: Software engineer building Python reporting tools.
Education: Bachelor of Computer Science. Skills: Python, SQL and testing.
Reduced reporting time by 25 percent by automating weekly data imports.
Project: Built an internal dashboard with Flask and PostgreSQL."""


def make_pdf(pages=1):
    with pymupdf.open() as doc:
        for number in range(pages):
            page = doc.new_page()
            page.insert_text((72, 72), CV + f"\nPage evidence {number + 1}")
        return doc.tobytes()


def provider_response(request, chunks=None):
    body = json.loads(request.content)
    frames = []
    if chunks is None:
        chunks = [
            ("Specific roast.", None),
            ("\n\nYour buzzwords need their own office.", "stop"),
        ]
    for content, finish in chunks:
        frames.append(
            "data: "
            + json.dumps(
                {
                    "id": "test",
                    "object": "chat.completion.chunk",
                    "created": 1,
                    "model": body["model"],
                    "choices": [
                        {
                            "index": 0,
                            "delta": {"content": content},
                            "finish_reason": finish,
                        }
                    ],
                }
            )
            + "\n\n"
        )
    frames.append(
        'data: {"id":"test","object":"chat.completion.chunk","created":1,"model":"test","choices":[],"usage":{"prompt_tokens":100,"completion_tokens":20,"total_tokens":120}}\n\n'
    )
    return httpx.Response(
        200,
        headers={"content-type": "text/event-stream"},
        text="".join(frames) + "data: [DONE]\n\n",
    )


class StalledStream(httpx.AsyncByteStream):
    def __init__(self):
        self.waiting = asyncio.Event()
        self.closed = False

    async def __aiter__(self):
        yield b'data: {"id":"test","object":"chat.completion.chunk","created":1,"model":"test","choices":[{"index":0,"delta":{"content":"Partial reply"},"finish_reason":null}]}\n\n'
        self.waiting.set()
        await asyncio.Event().wait()

    async def aclose(self):
        self.closed = True


class PDFTests(unittest.IsolatedAsyncioTestCase):
    async def test_real_multipage_extraction(self):
        text = await extract_pdf(make_pdf(3))
        self.assertTrue(all(f"Page evidence {page}" in text for page in (1, 2, 3)))

    async def test_page_and_text_budgets(self):
        with patch.object(settings, "max_pdf_pages", 1), self.assertRaises(PDFTooLarge):
            await extract_pdf(make_pdf(2))
        with (
            patch.object(settings, "max_cv_chars", 200),
            self.assertRaises(PDFTooLarge),
        ):
            await extract_pdf(make_pdf())

    async def test_corrupt_pdf(self):
        with self.assertRaises(InvalidPDF):
            await extract_pdf(b"%PDF-broken")

    async def test_timeout_kills_and_reaps_worker(self):
        spawned = []
        spawn = asyncio.create_subprocess_exec

        async def capture(*args, **kwargs):
            process = await spawn(*args, **kwargs)
            spawned.append(process)
            return process

        with tempfile.TemporaryDirectory() as directory:
            worker = Path(directory) / "slow.py"
            worker.write_text("import time\ntime.sleep(60)\n")
            with (
                patch.object(pdf_module, "WORKER", worker),
                patch.object(settings, "pdf_timeout_seconds", 0.1),
                patch.object(
                    pdf_module.asyncio, "create_subprocess_exec", side_effect=capture
                ),
                self.assertRaises(TimeoutError),
            ):
                await extract_pdf(make_pdf())
        self.assertIsNotNone(spawned[0].returncode)

    async def test_cancellation_kills_and_reaps_worker(self):
        spawned, ready = [], asyncio.Event()
        spawn = asyncio.create_subprocess_exec

        async def capture(*args, **kwargs):
            process = await spawn(*args, **kwargs)
            spawned.append(process)
            ready.set()
            return process

        with tempfile.TemporaryDirectory() as directory:
            worker = Path(directory) / "slow.py"
            worker.write_text("import time\ntime.sleep(60)\n")
            with (
                patch.object(pdf_module, "WORKER", worker),
                patch.object(
                    pdf_module.asyncio, "create_subprocess_exec", side_effect=capture
                ),
            ):
                task = asyncio.create_task(extract_pdf(make_pdf()))
                await asyncio.wait_for(ready.wait(), 2)
                task.cancel()
                with self.assertRaises(asyncio.CancelledError):
                    await task
        self.assertIsNotNone(spawned[0].returncode)

    async def test_worker_does_not_inherit_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            worker = Path(directory) / "environment.py"
            worker.write_text(
                'import json, os\nprint(json.dumps({"text": os.environ.get("API_KEY", "absent")}))\n'
            )
            with (
                patch.object(pdf_module, "WORKER", worker),
                patch.dict(os.environ, {"API_KEY": "secret"}),
            ):
                self.assertEqual(await extract_pdf(make_pdf()), "absent")


class APITests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.lifespan = app.router.lifespan_context(app)
        await self.lifespan.__aenter__()
        self.model = AsyncOpenAI(
            base_url="https://api.deepseek.com",
            api_key="test",
            max_retries=0,
            http_client=httpx.AsyncClient(
                transport=httpx.MockTransport(provider_response)
            ),
        )
        self.client_patch = patch.object(app.state, "llm", self.model)
        self.client_patch.start()
        self.api = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        )
        self.files = {"file": ("cv.pdf", make_pdf(), "application/pdf")}

    async def asyncTearDown(self):
        await self.api.aclose()
        self.client_patch.stop()
        await self.model.close()
        await self.lifespan.__aexit__(None, None, None)

    async def test_json_and_sse_contracts(self):
        with patch.object(chat, "extract_pdf", AsyncMock(return_value=CV)):
            response = await self.api.post("/api/v1/chat/message", files=self.files)
            expected = "Specific roast.\n\nYour buzzwords need their own office.\n\nsorry, not hired"
            self.assertEqual(response.json(), {"roast": expected})
            response = await self.api.post(
                "/api/v1/chat/message",
                files=self.files,
                headers={"Accept": "text/event-stream"},
            )
        self.assertEqual(response.status_code, 200)
        self.assertIn('"type": "delta"', response.text)
        events = [
            json.loads(line.removeprefix("data: "))
            for line in response.text.splitlines()
            if line.startswith("data: ")
        ]
        self.assertEqual(
            "".join(event["text"] for event in events if event["type"] == "delta"),
            expected,
        )
        self.assertTrue(response.text.endswith('data: {"type": "done"}\n\n'))
        self.assertEqual(response.headers["cache-control"], "no-store")

    async def test_invalid_upload_rejected_before_extraction(self):
        with patch.object(chat, "extract_pdf", AsyncMock()) as extract:
            response = await self.api.post(
                "/api/v1/chat/message", files={"file": ("bad.pdf", b"bad")}
            )
        self.assertEqual(response.status_code, 400)
        extract.assert_not_called()

    async def test_total_admission_limit_includes_stream_lifetime(self):
        entered, release = asyncio.Event(), asyncio.Event()

        async def slow_stream(*args, **kwargs):
            entered.set()
            await release.wait()
            yield "done"

        with (
            patch.object(app.state, "roast_slots", asyncio.Semaphore(1)),
            patch.object(chat, "extract_pdf", AsyncMock(return_value=CV)),
            patch.object(chat, "stream_roast", slow_stream),
        ):
            first = asyncio.create_task(
                self.api.post(
                    "/api/v1/chat/message",
                    files=self.files,
                    headers={"Accept": "text/event-stream"},
                )
            )
            await asyncio.wait_for(entered.wait(), 2)
            try:
                second = await self.api.post("/api/v1/chat/message", files=self.files)
                self.assertEqual(second.status_code, 429)
                self.assertIn("retry-after", second.headers)
            finally:
                release.set()
                await first
            self.assertFalse(app.state.roast_slots.locked())

    async def test_pdf_limit_releases_request_slot(self):
        with (
            patch.object(app.state, "pdf_slots", asyncio.Semaphore(0)),
            patch.object(chat, "extract_pdf", AsyncMock()) as extract,
        ):
            response = await self.api.post("/api/v1/chat/message", files=self.files)
        self.assertEqual(response.status_code, 429)
        extract.assert_not_called()
        self.assertFalse(app.state.roast_slots.locked())

    async def test_partial_stream_error_is_sanitized(self):
        async def failing_stream(*args, **kwargs):
            yield "Partial reply"
            raise RuntimeError("PRIVATE CV CONTENT")

        with (
            patch.object(chat, "extract_pdf", AsyncMock(return_value=CV)),
            patch.object(chat, "stream_roast", failing_stream),
            self.assertLogs("api.chat.router", level="WARNING") as logs,
        ):
            response = await self.api.post(
                "/api/v1/chat/message",
                files=self.files,
                headers={"Accept": "text/event-stream"},
            )
        self.assertIn('"status": 503', response.text)
        self.assertNotIn("PRIVATE", response.text)
        self.assertNotIn('"type": "done"', response.text)
        self.assertNotIn("PRIVATE", "\n".join(logs.output))

    async def test_client_closes_on_shutdown(self):
        async with app.router.lifespan_context(app):
            client = app.state.llm
            self.assertFalse(client.is_closed())
        self.assertTrue(client.is_closed())


class ModelTests(unittest.IsolatedAsyncioTestCase):
    async def test_generation_deadline_closes_upstream(self):
        upstream = StalledStream()
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, stream=upstream)
        )
        async with AsyncOpenAI(
            api_key="test", http_client=httpx.AsyncClient(transport=transport)
        ) as client:
            with (
                patch.object(settings, "agent_timeout_seconds", 0.25),
                self.assertRaises(TimeoutError),
            ):
                async for _ in stream_roast(CV, client):
                    pass
        self.assertTrue(upstream.closed)

    async def test_consumer_cancellation_closes_upstream(self):
        upstream = StalledStream()
        transport = httpx.MockTransport(
            lambda request: httpx.Response(200, stream=upstream)
        )
        async with AsyncOpenAI(
            api_key="test", http_client=httpx.AsyncClient(transport=transport)
        ) as client:

            async def consume():
                return [part async for part in stream_roast(CV, client)]

            task = asyncio.create_task(consume())
            await asyncio.wait_for(upstream.waiting.wait(), 2)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task
        self.assertTrue(upstream.closed)

    async def test_incomplete_upstream_is_not_success(self):
        def incomplete(request):
            response = provider_response(request)
            return httpx.Response(
                200, text=response.text.split("\n\n")[0] + "\n\ndata: [DONE]\n\n"
            )

        async with AsyncOpenAI(
            api_key="test",
            http_client=httpx.AsyncClient(transport=httpx.MockTransport(incomplete)),
        ) as client:
            with self.assertRaisesRegex(RuntimeError, "incomplete"):
                async for _ in stream_roast(CV, client):
                    pass

    async def test_request_budget_and_provider_options(self):
        for base_url in ("https://api.deepseek.com", "http://localhost:11434/v1"):
            requests = []

            def respond(request, requests=requests):
                requests.append(request)
                return provider_response(request)

            async with AsyncOpenAI(
                base_url=base_url,
                api_key="test",
                http_client=httpx.AsyncClient(transport=httpx.MockTransport(respond)),
            ) as client:
                text = "".join([part async for part in stream_roast(CV, client)])
            body = json.loads(requests[0].content)
            self.assertEqual(body["messages"][-1]["content"], CV)
            self.assertEqual(body["max_tokens"], settings.max_output_tokens)
            self.assertEqual(body["stream_options"], {"include_usage": True})
            self.assertEqual("thinking" in body, "api.deepseek.com" in base_url)
            self.assertEqual(
                text,
                "Specific roast.\n\nYour buzzwords need their own office.\n\nsorry, not hired",
            )

    async def test_verdict_normalization_preserves_streamed_body(self):
        body = (
            "You cut reporting time by 25 percent, yet your skills section still "
            "needs an entire quarterly meeting to explain itself.\n\n"
            "Python, SQL, Flask: your dashboard has a stack and your buzzwords have a fan club."
        )
        for suffix in (
            "",
            "\n\nsorry, not hired",
            "\n\nSorry, not hired.  \n",
            "\n\nsorry, not hired\n\nsorry, not hired!",
        ):
            for chunk_size in (1, 17, 512):
                with self.subTest(suffix=suffix, chunk_size=chunk_size):
                    raw = body + suffix
                    chunks = [
                        (raw[index : index + chunk_size], None)
                        for index in range(0, len(raw), chunk_size)
                    ]
                    chunks.append(("", "stop"))

                    def respond(request, chunks=chunks):
                        return provider_response(request, chunks)

                    async with AsyncOpenAI(
                        api_key="test",
                        http_client=httpx.AsyncClient(
                            transport=httpx.MockTransport(respond)
                        ),
                    ) as client:
                        parts = [part async for part in stream_roast(CV, client)]
                    self.assertGreater(len(parts), 1)
                    self.assertEqual("".join(parts), body + "\n\nsorry, not hired")

    async def test_truncated_and_filtered_output_are_not_success(self):
        for reason in ("length", "content_filter"):
            with self.subTest(reason=reason):

                def respond(request, reason=reason):
                    return provider_response(request, [("Partial reply. " * 20, reason)])

                async with AsyncOpenAI(
                    api_key="test",
                    http_client=httpx.AsyncClient(transport=httpx.MockTransport(respond)),
                ) as client:
                    parts = []
                    with self.assertRaisesRegex(RuntimeError, "incomplete"):
                        async for part in stream_roast(CV, client):
                            parts.append(part)
                self.assertNotIn("sorry, not hired", "".join(parts))

    async def test_input_limit_prevents_provider_call(self):
        async with AsyncOpenAI(api_key="test") as client:
            with self.assertRaises(ValueError):
                async for _ in stream_roast("x" * (settings.max_cv_chars + 1), client):
                    pass


if __name__ == "__main__":
    unittest.main()
