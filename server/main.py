from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()  # runs at startup
    yield                   # the server runs while we're "paused" here

app = FastAPI(lifespan=lifespan)

@app.get("/health")
def health():
     return {"status":"ok"}

