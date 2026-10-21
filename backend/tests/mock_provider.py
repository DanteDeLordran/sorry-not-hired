"""Local-only OpenAI-compatible streaming fixture for deployment checks."""

import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        self.rfile.read(int(self.headers["Content-Length"]))
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        try:
            for text, finish in [
                (
                    "You automated reporting with Python and SQL, but your skills "
                    "section reads like the agenda of a meeting nobody wanted. "
                    "That dashboard has more personality than your professional summary.",
                    None,
                ),
                ("\n\nFinal sentence.", "stop"),
            ]:
                data = {
                    "id": "test",
                    "object": "chat.completion.chunk",
                    "created": 1,
                    "model": "test",
                    "choices": [
                        {
                            "index": 0,
                            "delta": {"content": text},
                            "finish_reason": finish,
                        }
                    ],
                }
                self.wfile.write(("data: " + json.dumps(data) + "\n\n").encode())
                self.wfile.flush()
                if finish is None:
                    time.sleep(1)
            self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 9000), Handler).serve_forever()
