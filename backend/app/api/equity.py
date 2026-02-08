from fastapi import APIRouter, Depends
from typing import List, Optional
from ..db.mongodb import get_database

router = APIRouter()

@router.get("/history")
async def get_equity_history(limit: int = 500, account_id: Optional[str] = None, db = Depends(get_database)):
    try:
        # 获取最近的历史快照
        query = {}
        if account_id:
            query["account_id"] = account_id
            
        cursor = db.equity_snapshots.find(query).sort("timestamp", -1).limit(limit)
        snapshots = []
        async for doc in cursor:
            snapshots.append({
                "account_id": doc.get("account_id", ""),
                "timestamp": str(doc.get("timestamp", "")),
                "balance": float(doc.get("balance") or 0.0),
                "available": float(doc.get("available") or 0.0),
                "pnl": float(doc.get("pnl") or 0.0)
            })
        # 返回前反转一下，让时间正序排列供图表显示
        return snapshots[::-1]
    except Exception as e:
        print(f"Error fetching equity history from DB: {e}")
        return []

@router.get("/latest")
async def get_latest_equity(db = Depends(get_database)):
    try:
        doc = await db.equity_snapshots.find_one(sort=[("timestamp", -1)])
        if doc:
            return {
                "account_id": doc.get("account_id", ""),
                "timestamp": str(doc.get("timestamp", "")),
                "balance": float(doc.get("balance") or 0.0),
                "available": float(doc.get("available") or 0.0),
                "pnl": float(doc.get("pnl") or 0.0)
            }
    except Exception as e:
        print(f"Error fetching latest equity: {e}")
    return None
