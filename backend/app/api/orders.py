from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..db.mongodb import get_database
from ..services.engine_client import engine_client

router = APIRouter()

@router.get("")
async def get_orders(limit: int = 100, account_id: Optional[str] = None, db = Depends(get_database)):
    try:
        # 获取最近的报单
        query = {}
        if account_id:
            query["account_id"] = account_id
            
        cursor = db.orders.find(query).sort("timestamp", -1).limit(limit)
        orders = []
        async for doc in cursor:
            orders.append({
                "account_id": doc.get("account_id", ""),
                "client_id": str(doc.get("client_id", "")),
                "order_ref": str(doc.get("order_ref", "")),
                "symbol": doc.get("symbol", ""),
                "direction": doc.get("direction", ""),
                "offset": doc.get("offset", ""),
                "status": str(doc.get("status", "")),
                # 兼容不同来源的字段名
                "limit_price": doc.get("limit_price") or doc.get("price") or 0.0,
                "volume_total": doc.get("volume_total") or doc.get("vol_total") or 0,
                "volume_traded": doc.get("volume_traded") or doc.get("vol_traded") or 0,
                "msg": doc.get("msg") or doc.get("status_msg") or "",
                "insert_time": doc.get("timestamp") or doc.get("insert_time") or ""
            })
        return orders
    except Exception as e:
        print(f"Error fetching orders from DB: {e}")
        return []

@router.post("")
async def place_order(order: dict):
    success = await engine_client.send_order(order)
    if success:
        return {"status": "success", "message": "Order sent to engine"}
    raise HTTPException(status_code=503, detail="Engine not connected")

@router.delete("/{client_id}")
async def cancel_order(client_id: str, symbol: str, account_id: Optional[str] = None):
    success = await engine_client.cancel_order(client_id, symbol, account_id)
    if success:
        return {"status": "success", "message": "Cancel request sent to engine"}
    raise HTTPException(status_code=503, detail="Engine not connected")