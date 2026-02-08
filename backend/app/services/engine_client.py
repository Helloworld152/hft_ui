import asyncio
import json
import logging
import websockets
from collections import defaultdict
from ..db.mongodb import get_database
from ..core.config import settings

logger = logging.getLogger(__name__)

class EngineClient:
    def __init__(self):
        self.ws_url = settings.ENGINE_WS_URL
        self.ws = None
        self._lock = asyncio.Lock()
        self.pos_cache = {} # symbol -> position_dict

    async def connect(self):
        while True:
            try:
                print(f"DEBUG: Attempting to connect to Engine WebSocket at {self.ws_url}")
                async with websockets.connect(self.ws_url) as websocket:
                    async with self._lock:
                        self.ws = websocket
                    logger.info(f"Connected to Engine WebSocket at {self.ws_url}")
                    print(f"DEBUG: Successfully connected to {self.ws_url}")
                    while True:
                        message = await websocket.recv()
                        await self.handle_message(message)
            except Exception as e:
                logger.error(f"WebSocket connection error: {e}. Retrying in 5s...")
                print(f"DEBUG: WebSocket connection error: {e}")
                async with self._lock:
                    self.ws = None
                await asyncio.sleep(5)

    async def handle_message(self, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            # print(f"DEBUG: Received message type: {msg_type}") # Too noisy for all ticks
            
            db = get_database()
            if db is None:
                return

            if msg_type == "rtn":
                # 协议规定使用 client_id 作为客户端唯一标识
                await db.orders.update_one(
                    {"client_id": data["client_id"]},
                    {"$set": data},
                    upsert=True
                )
            elif msg_type == "trade":
                await db.trades.insert_one(data)
            elif msg_type == "account":
                # 更新账户资金信息
                # print(f"Saving account data to DB: {data}")
                account_id = data.get("account_id") or "default"
                await db.account.update_one(
                    {"account_id": account_id},
                    {"$set": data},
                    upsert=True
                )
                # 记录权益快照用于历史曲线
                from datetime import datetime
                snapshot = {
                    "account_id": account_id,
                    "timestamp": datetime.now(),
                    "balance": data.get("balance", 0.0),
                    "available": data.get("available", 0.0),
                    "pnl": data.get("pnl", 0.0)
                }
                await db.equity_snapshots.insert_one(snapshot)
            elif msg_type == "pos_snapshot":
                incoming_data = data.get("data", [])
                
                # Group positions by account_id
                positions_by_account = defaultdict(list)
                
                for pos in incoming_data:
                    symbol = pos.get("symbol")
                    if not symbol: continue
                    
                    # Extract account_id for this specific position item
                    acc_id = pos.get("account_id") or "default"
                    positions_by_account[acc_id].append(pos)
                    
                    # Optional: Update memory cache if needed (though DB is primary source of truth now)
                    # self.pos_cache[(acc_id, symbol)] = pos

                # Update DB for each account present in the snapshot
                # Note: This logic assumes the snapshot contains ALL positions for the included accounts.
                # If an account is not in the snapshot, its DB data remains touched.
                for acc_id, acc_positions in positions_by_account.items():
                    logger.info(f"Updating positions for account {acc_id}: {len(acc_positions)} items")
                    
                    # 1. Delete existing positions for this account
                    await db.positions.delete_many({"account_id": acc_id})
                    
                    # 2. Insert new positions
                    if acc_positions:
                        await db.positions.insert_many(acc_positions)

            elif msg_type == "status":
                print(f"DEBUG: Processing STATUS message: {data}")
                account_id = data.get("account_id", "default")
                source = data.get("source", "CTP")
                await db.connection_status.update_one(
                    {"account_id": account_id, "source": source},
                    {"$set": data},
                    upsert=True
                )
            elif msg_type == "tick":
                pass

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            print(f"DEBUG: Error handling message: {e}")

    async def send_order(self, order_data):
        async with self._lock:
            if self.ws:
                payload = {"action": "order", **order_data}
                await self.ws.send(json.dumps(payload))
                return True
        return False

    async def cancel_order(self, client_id, symbol, account_id=None):
        async with self._lock:
            if self.ws:
                try:
                    # 协议要求 client_id 为 18位整数，此处需强制转换
                    int_client_id = int(client_id)
                    payload = {
                        "action": "cancel",
                        "client_id": int_client_id,
                        "account_id": account_id,
                        "symbol": symbol
                    }
                    logger.info(f"Sending cancel request: {payload}")
                    await self.ws.send(json.dumps(payload))
                    return True
                except ValueError:
                    logger.error(f"Invalid client_id format: {client_id}")
                    return False
        return False

engine_client = EngineClient()