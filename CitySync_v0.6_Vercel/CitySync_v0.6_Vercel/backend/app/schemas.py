from datetime import datetime
from pydantic import BaseModel, Field

class IssueCreate(BaseModel):
    category: str
    description: str = ""
    severity: str = Field(default="Medium")
    latitude: float
    longitude: float

class IssueOut(BaseModel):
    id: int
    category: str
    description: str
    severity: str
    status: str
    reported_at: datetime
    latitude: float
    longitude: float
