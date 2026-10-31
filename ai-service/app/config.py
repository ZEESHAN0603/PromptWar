import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings validated using Pydantic Settings
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    SERVICE_NAME: str = "eventpilot-ai-service"
    SERVICE_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="Environment mode: development, test, production")
    PORT: int = Field(default=8000, ge=1, le=65535)
    HOST: str = Field(default="0.0.0.0")
    LOG_LEVEL: str = Field(default="info")

    INTERNAL_API_SECRET: str = Field(
        default="development-internal-ai-secret-key-32-chars",
        description="Shared secret for backend-to-AI communication"
    )

    # Prepared for future phases (Phase 5-7)
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash")
    BACKEND_INTERNAL_URL: str = Field(default="http://localhost:5000")


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton"""
    return Settings()

