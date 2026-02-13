from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "insightengine"
    secret_key: str = "your-secret-key-change-in-production"
    openai_api_key: str
    environment: str = "development"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
        case_sensitive = False


settings = Settings()
