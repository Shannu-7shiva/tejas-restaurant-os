from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.core.security import decode_access_token
from app.websocket.connection_manager import manager

# Existing routers
from app.api.v1.auth import router as auth_router
from app.api.v1.public import router as public_router
from app.api.v1.menu import router as menu_router
from app.api.v1.tables import router as tables_router
from app.api.v1.orders import router as orders_router
from app.api.v1.kitchen import router as kitchen_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.staff import router as staff_router
from app.api.v1.settings import router as settings_router

# New SaaS routers
from app.api.v1.register import router as register_router
from app.api.v1.super_admin import router as super_admin_router
from app.api.v1.subscription import router as subscription_router
from app.api.v1.branches import router as branches_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="TEJAS RESTAURANT OS",
    version="2.0.0",
    description="Multi-Tenant Restaurant Management SaaS Platform by TEJAS TECHNOLOGIES.",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(register_router, prefix=settings.API_V1_STR)
app.include_router(public_router, prefix=settings.API_V1_STR)
app.include_router(menu_router, prefix=settings.API_V1_STR)
app.include_router(tables_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(kitchen_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(staff_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)
app.include_router(super_admin_router, prefix=settings.API_V1_STR)
app.include_router(subscription_router, prefix=settings.API_V1_STR)
app.include_router(branches_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TEJAS RESTAURANT OS",
        "version": "2.0.0",
        "platform": "TEJAS TECHNOLOGIES",
        "environment": settings.ENVIRONMENT
    }

@app.websocket("/ws/restaurant/{restaurant_id}")
async def websocket_restaurant_endpoint(
    websocket: WebSocket, restaurant_id: str, token: str = Query(default=None)
):
    if token:
        payload = decode_access_token(token)
        if not payload:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_res_id = payload.get("restaurant_id")
        user_role = payload.get("role")
        if user_role != "PLATFORM_ADMIN" and user_res_id != restaurant_id:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect_restaurant(websocket, restaurant_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_restaurant(websocket, restaurant_id)

@app.websocket("/ws/order/{order_id}")
async def websocket_customer_order_endpoint(websocket: WebSocket, order_id: str):
    await manager.connect_order(websocket, order_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect_order(websocket, order_id)
