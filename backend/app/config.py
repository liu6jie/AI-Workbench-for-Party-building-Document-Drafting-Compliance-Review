from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    deepseek_api_key: str
    deepseek_base_url: str = "https://api.deepseek.com"
    frontend_origin: str = ""

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
