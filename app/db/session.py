from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Обновленные данные для подключения к БД на виртуальной машине
DATABASE_URL = os.getenv(" DATABASE_URL\, \postgresql://vibe_user:vibe_pass@192.168.1.14:5432/vibe_taxi\)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
 db = SessionLocal()
 try:
 yield db
 finally:
 db.close()
