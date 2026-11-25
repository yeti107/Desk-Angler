from sqlmodel import SQLModel, create_engine
import models

engine = create_engine("sqlite:///desk_angler.db", echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)