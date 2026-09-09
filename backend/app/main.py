from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import BACKEND_ROOT, settings
from app.database import Base, SessionLocal, engine, ensure_schema
from app.routers import auth, catalog, chat, provider, requests
from app.seed import ensure_okhla, seed_if_empty

(BACKEND_ROOT / "data").mkdir(exist_ok=True)

app = FastAPI(title="Orbit API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(requests.router)
app.include_router(chat.router)
app.include_router(provider.router)


@app.on_event("startup")
def startup() -> None:
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        ensure_okhla(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
