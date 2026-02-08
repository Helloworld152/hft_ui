from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class Trade(BaseModel):
    account_id: str
    symbol: str
    direction: str # 'B'/'S'
    offset: str # 'O'/'C'/'T'
    price: float
    volume: int
    trade_time: datetime
    order_ref: str

class Order(BaseModel):
    account_id: str
    order_ref: str
    symbol: str
    status: str
    limit_price: float
    volume_total: int
    volume_traded: int
    insert_time: Optional[datetime] = None

class OrderCreate(BaseModel):
    account_id: Optional[str] = None
    symbol: str
    direction: str = "B"
    offset: str = "O"
    price: float
    volume: int

class EquitySnapshot(BaseModel):
    account_id: str
    timestamp: datetime
    total_pnl: float
    positions: list[dict]
