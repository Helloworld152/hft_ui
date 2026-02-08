from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from ..db.mongodb import get_database

router = APIRouter()

@router.get("")
async def get_trades(limit: int = 100, account_id: Optional[str] = None, db = Depends(get_database)):
    try:
        query = {}
        if account_id:
            query["account_id"] = account_id
            
        # 按照时间戳降序排列，确保最近的成交在最上方
        cursor = db.trades.find(query).sort("timestamp", -1).limit(limit)
        trades = []
        async for doc in cursor:
            trades.append({
                "account_id": doc.get("account_id", ""),
                "client_id": str(doc.get("client_id", "")),
                "symbol": doc.get("symbol", ""),
                "direction": doc.get("direction", ""),
                "offset": doc.get("offset", ""),
                "price": doc.get("price", 0.0),
                "volume": doc.get("volume", 0),
                "trade_time": doc.get("timestamp") or doc.get("trade_time", ""),
                "order_ref": doc.get("order_ref", ""),
                "trade_id": doc.get("trade_id", "")
            })
        return trades
    except Exception as e:
        print(f"Error fetching trades from DB: {e}")
        return []