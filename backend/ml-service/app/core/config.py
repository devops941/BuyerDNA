from pydantic_settings import BaseSettings
import os
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "BuyerDNA ML Analytics Engine"
    API_PREFIX: str = "/ml"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    SERVICE_SECRET_KEY: str = "buyer_dna_internal_secure_key_2026"
    CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
