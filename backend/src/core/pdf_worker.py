"""One-shot PDF parser. Invoked in an isolated Python process, never imported by the API."""

import contextlib
import json
import resource
import sys


def extract() -> dict[str, str]:
    max_pages, max_chars, memory_mb, cpu_seconds = map(int, sys.argv[1:])
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
    # macOS does not enforce RLIMIT_AS reliably; production runs in Linux containers.
    if sys.platform == "linux":
        memory_bytes = memory_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (memory_bytes, memory_bytes))

    import pymupdf
    import pymupdf4llm

    with pymupdf.open(stream=sys.stdin.buffer.read(), filetype="pdf") as document:
        if document.needs_pass or not document.page_count:
            return {"error": "unreadable"}
        if document.page_count > max_pages:
            return {"error": "too_large"}
        parts = []
        size = 0
        for page in range(document.page_count):
            text = pymupdf4llm.to_markdown(
                document, pages=[page], ignore_images=True, show_progress=False
            )
            size += len(text) + 2
            if size > max_chars:
                return {"error": "too_large"}
            parts.append(text)
        return {"text": "\n\n".join(parts)}


if __name__ == "__main__":
    # Library diagnostics must not corrupt the JSON protocol or expose document data.
    with contextlib.redirect_stdout(sys.stderr):
        try:
            result = extract()
        except Exception:  # noqa: BLE001 - Contain parser failures within its protocol.
            result = {"error": "unreadable"}
    print(json.dumps(result, ensure_ascii=False))
