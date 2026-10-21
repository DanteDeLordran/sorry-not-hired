"""Compare DeepSeek latency and roast quality using synthetic or supplied CV text."""

import argparse
import asyncio
import json
import logging
import statistics
import sys
from pathlib import Path
from time import monotonic

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from core.config import settings
from core.llm import create_client, stream_roast

SAMPLES = {
    "junior": """Experience: Junior developer, Example Co, 2025-2026. Built internal
dashboards with Python and SQL. Skills: Python, SQL, Kubernetes, leadership, AI.
Education: BSc Computer Science, 2025. Project: expense tracker using Flask.
Summary: Visionary full-stack ninja with unparalleled expertise in scalable systems.""",
    "senior": """Experience: Senior engineer, Example Systems, 2019-2026. Led a team
of six migrating billing from a monolith; reduced p95 latency from 900ms to 180ms.
Introduced tracing and incident reviews, cutting recovery time by 40%.
Skills: Go, PostgreSQL, distributed systems. Education: BSc Computing, 2016.
Summary: Results-oriented team player passionate about leveraging synergies.""",
    "spanish": """Experiencia: Analista de datos, Empresa Ejemplo, 2022-2026.
Automaticé informes de ventas con Python y SQL, ahorrando 12 horas semanales.
Habilidades: Python, SQL, Excel, aprendizaje automático, liderazgo estratégico.
Educación: Grado en Matemáticas, 2022. Proyecto: predicción de ventas en una hoja
de cálculo. Resumen: Profesional disruptivo, proactivo y orientado a resultados.""",
}


async def benchmark(args):
    samples = {str(path): path.read_text() for path in args.cv} if args.cv else SAMPLES
    async with create_client() as client:
        for model in args.models:
            durations, first_tokens = [], []
            for name, cv in samples.items():
                for run in range(args.runs):
                    started = monotonic()
                    first = None
                    parts = []
                    async for text in stream_roast(cv, client, model=model):
                        if first is None:
                            first = monotonic() - started
                        parts.append(text)
                    duration = monotonic() - started
                    durations.append(duration)
                    first_tokens.append(first)
                    result = {
                        "model": model,
                        "sample": name,
                        "run": run + 1,
                        "first_text_seconds": round(first, 3),
                        "total_seconds": round(duration, 3),
                    }
                    if args.show_output:
                        result["roast"] = "".join(parts)
                    print(json.dumps(result, ensure_ascii=False), flush=True)
            print(
                json.dumps(
                    {
                        "model": model,
                        "median_first_text_seconds": round(
                            statistics.median(first_tokens), 3
                        ),
                        "median_total_seconds": round(statistics.median(durations), 3),
                    }
                ),
                flush=True,
            )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--models", nargs="+", default=["deepseek-flash", "deepseek-v4-pro"]
    )
    parser.add_argument(
        "--cv",
        type=Path,
        action="append",
        help="Extracted CV text; repeat for multiple samples",
    )
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument(
        "--show-output",
        action="store_true",
        help="Print roasts for manual quality comparison",
    )
    args = parser.parse_args()
    if args.runs < 1:
        parser.error("--runs must be positive")
    if settings.api_key in {"", "lm_studio", "ollama", "your-deepseek-api-key"}:
        parser.error("Set API_KEY and BASE_URL for the hosted provider first")
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    asyncio.run(benchmark(args))
