from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET: str = "" 
    JWT_ALGORITHM: str = ""
    JWT_EXPIRATION_HOURS: int = 0

    finnhub_api_key: str = ""
    database_url: str = ""
    coingecko_api_key: str = ""
    news_api_key: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()