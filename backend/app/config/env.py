from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PORT: int = 5000
    NODE_ENV: str = "development"
    MONGO_URI: str = "mongodb+srv://devops_db_user:FmSuxxKg4ZYRomyt@cluster0.bsyn8gp.mongodb.net/buyer_dna?retryWrites=true&w=majority"
    JWT_SECRET: str = "buyer_dna_production_jwt_secret_key_2026"
    JWT_EXPIRES_IN: str = "7d"
    ML_SERVICE_URL: str = "http://localhost:8000/ml"
    CLIENT_URL: str = "http://localhost:5173"
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
