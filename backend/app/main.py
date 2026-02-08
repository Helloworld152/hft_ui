import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .db.mongodb import connect_to_mongo, close_mongo_connection
from .api import trades, orders, equity, positions, account
from .services.engine_client import engine_client

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源，开发环境先全开
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    # 异步启动引擎连接
    asyncio.create_task(engine_client.connect())

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

@app.get("/")
async def root():
    return {"message": "HFT-UI Backend API is running"}

# Include routers
app.include_router(trades.router, prefix="/api/trades", tags=["trades"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(equity.router, prefix="/api/equity", tags=["equity"])
app.include_router(positions.router, prefix="/api/positions", tags=["positions"])
app.include_router(account.router, prefix="/api/account", tags=["account"])
