from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloudPulse"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Dual DB: PostgreSQL if specified, else SQLite
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./cloudpulse.db"
    )
    
    # Dual Redis: Redis if running, else in-memory fallback
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Integrations
    KUBERNETES_ENABLED: bool = os.getenv("KUBERNETES_ENABLED", "false").lower() == "true"
    PROMETHEUS_URL: str = os.getenv("PROMETHEUS_URL", "http://localhost:9090")
    GRAFANA_URL: str = os.getenv("GRAFANA_URL", "http://localhost:3000")
    
    CORS_ORIGINS: List[str] = ["*"]
    
    # Telemetry and Simulation settings
    DEFAULT_CPU_TARGET: int = 70
    DEFAULT_MIN_REPLICAS: int = 2
    DEFAULT_MAX_REPLICAS: int = 10
    SCALE_UP_COOLDOWN_SEC: int = 15
    SCALE_DOWN_COOLDOWN_SEC: int = 30

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
