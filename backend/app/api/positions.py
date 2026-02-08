from fastapi import APIRouter, Depends
from typing import List, Optional
from ..db.mongodb import get_database
from pydantic import BaseModel

router = APIRouter()

class Position(BaseModel):
    symbol: str
    symbol_id: int
    long: int
    short: int
    pnl: float

@router.get("")
async def get_positions(account_id: Optional[str] = None, db = Depends(get_database)):
    try:
        query = {}
        if account_id:
            query["account_id"] = account_id
            
        cursor = db.positions.find(query)
        positions = []
        async for doc in cursor:
            # 严格按照协议获取 Td 和 Yd 仓位
            long_td = int(doc.get("long_td", 0))
            long_yd = int(doc.get("long_yd", 0))
            short_td = int(doc.get("short_td", 0))
            short_yd = int(doc.get("short_yd", 0))
            
            # 优先使用 Td + Yd 计算总仓位，除非引擎明确提供了更准确的 total 字段
            long_total = doc.get("long_total")
            if long_total is None:
                long_total = long_td + long_yd
                
            short_total = doc.get("short_total")
            if short_total is None:
                short_total = short_td + short_yd
            
            positions.append({
                "account_id": doc.get("account_id", ""),
                "symbol": doc.get("symbol", "Unknown"),
                "symbol_id": int(doc.get("symbol_id", 0)),
                "long_td": long_td,
                "long_yd": long_yd,
                "long_total": int(long_total),
                "long_price": float(doc.get("long_price", 0.0)),
                "long_pnl": float(doc.get("long_pnl", 0.0)),
                "short_td": short_td,
                "short_yd": short_yd,
                "short_total": int(short_total),
                "short_price": float(doc.get("short_price", 0.0)),
                "short_pnl": float(doc.get("short_pnl", 0.0)),
                "pnl": float(doc.get("pnl", 0.0))
            })
        return positions
    except Exception as e:
        print(f"Error fetching positions: {e}")
        return []
