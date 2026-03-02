from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Resend Email Settings
    RESEND_API_KEY: str = ""
    MAIL_FROM: str = "onboarding@resend.dev"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore other env vars not declared here
    )

settings = Settings()
