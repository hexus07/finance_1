from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str = "" 
    JWT_ALGORITHM: str = ""
    JWT_EXPIRATION_HOURS: int = 0
    alpha_vantage_api_key: str = ""
    finnhub_api_key: str = ""
    database_url: str = "sqlite:///./finance.db"
    
    class Config:
        env_file = ".env"

settings = Settings()