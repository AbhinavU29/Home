import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Prasanth Jewellery Management System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7b6bcf36a8e8db6d953931be6f8df7f0c1a9f5d14e308f2a969f6cd9e89b4e54")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes session timeout

    # Fallback to local SQLite file if POSTGRES_URL isn't set or fails
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./jewellery.db")
    
    # Invoicing and Compliance defaults
    GST_PERCENTAGE: float = 3.0
    PAN_MANDATORY_LIMIT: float = 200000.0  # ₹2 Lakhs limit for PAN card in India

    class Config:
        case_sensitive = True

settings = Settings()
