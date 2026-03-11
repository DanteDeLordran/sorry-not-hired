from pydantic import BaseModel, Field


class RoastOutput(BaseModel):
    """Structured output from the CV roast agent"""

    roast: str = Field(..., description="Your brutal, unfiltered roast of the CV")
    severity: str = Field(
        default="medium", description="Severity level: light, medium, or harsh"
    )


class RoastResponse(BaseModel):
    """Structured JSON response from the CV roast endpoint"""

    roast: str = Field(..., description="The roast/criticism of the CV")
    filename: str = Field(..., description="The name of the uploaded CV file")
    severity: str = Field(
        default="medium", description="Severity level: light, medium, harsh"
    )
