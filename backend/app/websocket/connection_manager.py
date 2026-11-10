import json
import logging
from typing import Dict, List, Set, Any
from fastapi import WebSocket

logger = logging.getLogger("aurelia.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps restaurant_id -> list of active WebSockets (kitchen, manager, waiter)
        self.restaurant_rooms: Dict[str, Set[WebSocket]] = {}
        # Maps order_id -> list of customer WebSockets tracking their individual order
        self.order_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_restaurant(self, websocket: WebSocket, restaurant_id: str):
        await websocket.accept()
        if restaurant_id not in self.restaurant_rooms:
            self.restaurant_rooms[restaurant_id] = set()
        self.restaurant_rooms[restaurant_id].add(websocket)
        logger.info(f"WebSocket client connected to restaurant room {restaurant_id}. Total: {len(self.restaurant_rooms[restaurant_id])}")

    def disconnect_restaurant(self, websocket: WebSocket, restaurant_id: str):
        if restaurant_id in self.restaurant_rooms:
            self.restaurant_rooms[restaurant_id].discard(websocket)
            if not self.restaurant_rooms[restaurant_id]:
                del self.restaurant_rooms[restaurant_id]
        logger.info(f"WebSocket client disconnected from restaurant room {restaurant_id}")

    async def connect_order(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.order_rooms:
            self.order_rooms[order_id] = set()
        self.order_rooms[order_id].add(websocket)
        logger.info(f"Customer connected to order stream {order_id}")

    def disconnect_order(self, websocket: WebSocket, order_id: str):
        if order_id in self.order_rooms:
            self.order_rooms[order_id].discard(websocket)
            if not self.order_rooms[order_id]:
                del self.order_rooms[order_id]
        logger.info(f"Customer disconnected from order stream {order_id}")

    async def broadcast_restaurant(self, restaurant_id: str, message: Dict[str, Any]):
        if restaurant_id in self.restaurant_rooms:
            dead_sockets = set()
            payload = json.dumps(message)
            for ws in self.restaurant_rooms[restaurant_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Failed to send to restaurant socket: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.restaurant_rooms[restaurant_id].discard(ws)

    async def notify_order(self, order_id: str, message: Dict[str, Any]):
        if order_id in self.order_rooms:
            dead_sockets = set()
            payload = json.dumps(message)
            for ws in self.order_rooms[order_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Failed to send to order socket: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.order_rooms[order_id].discard(ws)

    broadcast_order = notify_order

manager = ConnectionManager()
