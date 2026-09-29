from pydantic import BaseModel


class RoastResponse(BaseModel):
    roast: str
