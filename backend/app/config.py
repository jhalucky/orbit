from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = f"sqlite:///{BACKEND_ROOT / 'data' / 'orbit.db'}"
    jwt_secret: str = "orbit-dev-change-me"
    jwt_days: int = 14
    frontend_url: str = "http://localhost:3000"
    cookie_name: str = "orbit_session"
    cookie_secure: bool = False

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = (
        "http://localhost:3000/orbit-api/auth/google/callback"
    )

    @property
    def google_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)


settings = Settings()
