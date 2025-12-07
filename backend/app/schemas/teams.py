from pydantic import BaseModel
from typing import Optional, List

# Forward reference for leader info to avoid circular deps structure issues if needed, 
# but simple int id is fine for input, and nested for output.

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None
    leader_id: Optional[int] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(TeamBase):
    pass

class TeamResponse(TeamBase):
    id: int
    leader_name: Optional[str] = None # Computed or joined field
    member_count: Optional[int] = 0   # Computed field

    class Config:
        from_attributes = True
