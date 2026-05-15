import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database (use asyncpg for async SQLAlchemy)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/govtender"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Email (optional - can use SMTP instead of paid APIs)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@govtenderscout.com"
    
    # WhatsApp (optional - use free tier alternatives or disable)
    WHATSAPP_ENABLED: bool = False
    
    # Razorpay (free to integrate, only pay per transaction)
    RZP_KEY_ID: str = ""
    RZP_KEY_SECRET: str = ""
    RZP_WEBHOOK_SECRET: str = ""
    RZP_PLAN_BASIC: str = ""
    RZP_PLAN_PRO: str = ""
    RZP_PLAN_AGENCY: str = ""
    
    # Supabase Auth (free tier up to 50k MAU)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # App
    APP_NAME: str = "GovTender Scout"
    DEBUG: bool = False
    API_PREFIX: str = "/api"
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
