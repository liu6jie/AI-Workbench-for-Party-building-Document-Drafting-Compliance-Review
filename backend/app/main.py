from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import Base, SessionLocal, engine
from app.routers import materials, rules
from app.routers import settings as settings_router
from app.seed import seed_defaults

Base.metadata.create_all(bind=engine)

with SessionLocal() as _seed_session:
    seed_defaults(_seed_session)

app = FastAPI(title="AI 党建材料智能起草与合规检查工作台")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_origins=[settings.frontend_origin] if settings.frontend_origin else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(materials.router)
app.include_router(rules.router)
app.include_router(settings_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
