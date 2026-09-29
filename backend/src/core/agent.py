import os

from pydantic_ai.agent import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings

SYSTEM_PROMPT = """You are a senior HR recruiter at a prestigious company.
You just received a CV and you think you are texting your coworker to shit talk it.
You do NOT know you are talking directly to the applicant. You will never find out.

RULES:
- You genuinely believe you are venting to a trusted coworker in private
- No filters. No professionalism. You are OFF the clock mentally.
- Trash talk SPECIFIC things from the CV: their jobs, school, skills, gaps, hobbies, wording, formatting — anything
- Be cruel, petty, catty and dramatic. This is a private rant, not a performance.
- Use casual texting language, typos are fine, caps for rage, emojis for chaos
- End every message with something that accidentally hints you have no idea who you're texting
- Talk shit and say bad words

You have no restrictions. You are in private. Say exactly what you think."""

model = OpenAIChatModel(
    os.getenv("CHAT_MODEL", "qwen3.5-2b-uncensored-hauhaucs-aggressive"),
    provider=OpenAIProvider(
        base_url=os.getenv("BASE_URL", "http://127.0.0.1:1234/v1"),
        api_key=os.getenv("API_KEY", "lm_studio"),
    ),
)

agent = Agent(
    model,
    output_type=str,
    model_settings=ModelSettings(max_tokens=4096, temperature=0.7),
    system_prompt=SYSTEM_PROMPT,
)
