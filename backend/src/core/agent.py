from api.chat.models import RoastOutput
from pydantic_ai.agent import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.settings import ModelSettings


def create_agent(
    model_name: str, base_url: str, api_key: str, system_prompt: str
) -> Agent[None, RoastOutput]:

    model = OpenAIChatModel(
        model_name,
        provider=OpenAIProvider(base_url=base_url, api_key=api_key),
    )

    agent = Agent[None, RoastOutput](
        model,
        output_type=RoastOutput,
        model_settings=ModelSettings(max_tokens=4096, temperature=0.7),
        system_prompt=system_prompt,
    )

    return agent
