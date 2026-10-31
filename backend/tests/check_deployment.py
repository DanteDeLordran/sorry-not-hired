"""Exercise built containers with a local provider; removes all test containers afterwards."""

import asyncio
import json
import os
import re
import subprocess
import uuid
from pathlib import Path
from time import monotonic

import httpx
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
BACKEND = os.getenv("TEST_BACKEND_IMAGE", "sorry-not-hired-check-backend:security")
FRONTEND = os.getenv("TEST_FRONTEND_IMAGE", "sorry-not-hired-check-frontend:security")


def docker(*args, check=True):
    result = subprocess.run(["docker", *args], text=True, capture_output=True, check=False)
    if check and result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return result.stdout.strip()


async def ready(url):
    async with httpx.AsyncClient() as client:
        for _ in range(80):
            try:
                if (await client.get(url)).status_code in (200, 308):
                    return
            except httpx.HTTPError:
                pass
            await asyncio.sleep(0.1)
    raise RuntimeError(f"Container did not become ready: {url}")


async def check_deployment():
    network = "snh-check-" + uuid.uuid4().hex[:8]
    containers = []

    def run(
        suffix,
        image,
        *,
        env=(),
        command=(),
        mounts=(),
        alias=None,
        port=None,
        entrypoint=None,
    ):
        name = f"{network}-{suffix}"
        args = [
            "run",
            "-d",
            "--name",
            name,
            "--network",
            network,
            "--read-only",
            "--cap-drop",
            "ALL",
            "--security-opt",
            "no-new-privileges",
            "--tmpfs",
            "/tmp:rw,noexec,nosuid,size=128m,mode=1777",
            "--pids-limit",
            "64",
            "--memory",
            "1536m",
        ]
        if alias:
            args += ["--network-alias", alias]
        if port:
            args += ["-p", f"127.0.0.1::{port}"]
        if entrypoint:
            args += ["--entrypoint", entrypoint]
        for key, value in env:
            args += ["-e", f"{key}={value}"]
        for mount in mounts:
            args += ["-v", mount]
        docker(*args, image, *command)
        containers.append(name)
        url = "http://" + docker("port", name, f"{port}/tcp") if port else None
        return name, url

    docker("network", "create", network)
    try:
        run(
            "provider",
            BACKEND,
            alias="provider",
            entrypoint="python",
            command=["/provider.py"],
            mounts=[f"{ROOT / 'backend/tests/mock_provider.py'}:/provider.py:ro"],
        )
        backend, backend_url = run(
            "backend",
            BACKEND,
            alias="backend",
            port=8000,
            env=[
                ("BASE_URL", "http://provider:9000/v1"),
                ("API_KEY", "test"),
                ("CHAT_MODEL", "test"),
            ],
        )
        await ready(backend_url + "/api/v1/health/liveness")
        front, url = run("frontend", FRONTEND, port=8080)
        await ready(url)
        assert docker("exec", front, "id", "-u") == "101"
        assert docker("exec", backend, "id", "-u") == "10001"
        docker("exec", front, "nginx", "-t")
        print("PASS: rootless read-only containers start; Nginx validates")

        with pymupdf.open() as document:
            page = document.new_page()
            page.insert_text(
                (72, 72),
                "Professional experience: Software Engineer using Python and SQL.\nEducation: Bachelor of Computer Science. Skills: testing and API design.\nBuilt dashboards and automated reporting, reducing processing time by 25 percent.\nProject: an internal dashboard using Flask and PostgreSQL.",
            )
            pdf = document.tobytes()
        files = {"file": ("cv.pdf", pdf, "application/pdf")}

        async with httpx.AsyncClient(timeout=20) as client:
            page = await client.get(url)
            asset = re.search(r'src="(/assets/[^\"]+\.js)"', page.text)[1]
            for path in ("/", asset, "/api/v1/health/liveness"):
                response = await client.get(url + path)
                assert response.status_code == 200, (path, response.text)
                assert (
                    "script-src 'self'" in response.headers["content-security-policy"]
                )
                assert response.headers["x-content-type-options"] == "nosniff"
                assert response.headers["x-frame-options"] == "DENY"
                assert (
                    "immutable" if path.startswith("/assets/") else "no-store"
                ) in response.headers["cache-control"]
            print("PASS: HTML, assets, and API inherit security and cache headers")

            preview = await client.get(
                url + "/share", headers={"Host": "roast.example.com"}
            )
            assert 'content="https://roast.example.com/og-image.png"' in preview.text
            image = await client.get(url + "/og-image.png")
            assert image.headers["content-type"] == "image/png"
            print("PASS: link previews use an absolute image URL for the request host")

            timestamps = []
            roast = []
            async with client.stream(
                "POST",
                url + "/api/v1/chat/message",
                files=files,
                headers={"Accept": "text/event-stream"},
            ) as response:
                assert response.status_code == 200, await response.aread()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        event = json.loads(line[6:])
                        assert event["type"] != "error", event
                        timestamps.append((event["type"], monotonic()))
                        if event["type"] == "delta":
                            roast.append(event["text"])
            assert timestamps[-1][0] == "done"
            assert all(kind == "delta" for kind, _ in timestamps[:-1])
            assert len(roast) >= 2
            assert timestamps[-2][1] - timestamps[0][1] > 0.8
            assert "".join(roast).endswith("\n\nsorry, not hired")
            print("PASS: real PDF -> bounded Linux parser -> live, unbuffered SSE")

            codes = []
            for number in range(6):
                response = await client.get(
                    url + "/api/v1/health/liveness",
                    headers={"X-Forwarded-For": f"203.0.113.{number + 1}"},
                )
                codes.append(response.status_code)
                if response.status_code == 429:
                    assert "content-security-policy" in response.headers
            assert 429 in codes, codes
            print("PASS: forged client IPs cannot bypass edge rate limits")

            for scope, global_limit, per_ip in [
                ("global", "1", "2"),
                ("per-IP", "4", "1"),
            ]:
                _, limited_url = run(
                    scope.lower(),
                    FRONTEND,
                    port=8080,
                    env=[
                        ("MAX_CONCURRENT_ROASTS", global_limit),
                        ("MAX_ROASTS_PER_IP", per_ip),
                        ("ROAST_REQUESTS_PER_MINUTE", "1000"),
                        ("ROAST_BURST", "10"),
                    ],
                )
                await ready(limited_url)
                async with client.stream(
                    "POST",
                    limited_url + "/api/v1/chat/message",
                    files=files,
                    headers={"Accept": "text/event-stream"},
                ) as stream:
                    assert stream.status_code == 200
                    async for line in stream.aiter_lines():
                        if line.startswith("data: "):
                            response = await client.get(
                                limited_url + "/api/v1/health/liveness"
                            )
                            assert response.status_code == 429
                            break
                print(f"PASS: {scope} concurrent request cap includes active streams")

        backend_ip = json.loads(docker("inspect", backend))[0]["NetworkSettings"][
            "Networks"
        ][network]["IPAddress"]
        secure_front, secure_url = run(
            "secure",
            FRONTEND,
            port=8080,
            env=[("REQUIRE_HTTPS", "1"), ("TRUSTED_PROXY_CIDRS", backend_ip + "/32")],
        )
        await ready(secure_url)
        async with httpx.AsyncClient() as client:
            response = await client.get(
                secure_url,
                headers={"X-Forwarded-Proto": "https", "X-Forwarded-For": "1.2.3.4"},
            )
            assert response.status_code == 308
            assert "strict-transport-security" not in response.headers
        script = f"import urllib.request; r=urllib.request.urlopen(urllib.request.Request('http://{secure_front}:8080/',headers={{'X-Forwarded-Proto':'https','X-Forwarded-For':'203.0.113.10'}})); print(r.status); print(r.headers.get('Strict-Transport-Security'))"
        output = docker("exec", backend, "python", "-c", script)
        assert "200" in output and "max-age=31536000" in output, output
        print("PASS: HTTPS redirect/HSTS respect only the configured ingress")
    except BaseException:
        for name in containers:
            await asyncio.to_thread(
                subprocess.run, ["docker", "logs", "--tail", "15", name], check=False
            )
        raise
    finally:
        for name in reversed(containers):
            docker("rm", "-f", name, check=False)
        docker("network", "rm", network, check=False)


if __name__ == "__main__":
    asyncio.run(check_deployment())
