from sqlmodel import SQLModel, Field
from datetime import datetime


class Player(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True)
    gold: int = 0


# One row per fish, for its whole life: ticket -> caught -> sold.
class Fish(SQLModel, table=True):
    
    id: int | None = Field(default=None, primary_key=True)
    owner: int = Field(foreign_key="player.id")
    fish_id: str  # species, e.g. "perch"
    status: str  # "issued" -> "caught" -> "sold" (+ "trading" later)
    issued_at: datetime
    length: float  # cm
    fish_weight: float  # kg
    shiny: bool = False
    caught_at: datetime | None = None
    session_id: str | None = None  # the app's session ids are strings
    cam_verified: bool | None = None
    sold_price: int | None = None
    sold_at: datetime | None = None
