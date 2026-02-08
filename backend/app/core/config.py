from pydantic_settings import BaseSettings
import os
import json
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "HFT-UI"
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "hft_db"
    ENGINE_WS_URL: str = "ws://localhost:8888"

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        config_path = Path(__file__).parent / "config.json"
        if config_path.exists():
            with open(config_path, "r") as f:
                config_data = json.load(f)
                for key, value in config_data.items():
                    if hasattr(self, key):
                        setattr(self, key, value)

settings = Settings()
