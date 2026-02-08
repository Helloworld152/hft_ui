from fastapi import APIRouter, Depends
from typing import Optional, List
from ..db.mongodb import get_database

router = APIRouter()

@router.get("/list")
async def get_accounts_list(db = Depends(get_database)):
    cursor = db.account.find({}, {"account_id": 1})
    accounts = []
    async for doc in cursor:
        if "account_id" in doc:
            accounts.append(doc["account_id"])
    return accounts

@router.get("/status")
async def get_account_status(account_id: Optional[str] = None, db = Depends(get_database)):
    query = {}
    if account_id:
        query["account_id"] = account_id
    
    cursor = db.connection_status.find(query)
    statuses = []
    async for doc in cursor:
        statuses.append({
            "account_id": doc.get("account_id", ""),
            "source": doc.get("source", ""),
            "code": doc.get("code", ""),
            "msg": doc.get("msg", "")
        })
    return statuses

@router.get("")
async def get_account(account_id: Optional[str] = None, db = Depends(get_database)):
    query = {}
    if account_id:
        query["account_id"] = account_id
        
    account = await db.account.find_one(query)
    
    # If not found but no ID specified, try to find any account
    if not account and not account_id:
        account = await db.account.find_one()

    if account:
        return {
            "account_id": account.get("account_id", ""),
            "balance": account.get("balance", 0.0),
            "available": account.get("available", 0.0),
            "margin": account.get("margin", 0.0),
            "pnl": account.get("pnl", 0.0)
        }
    return {
        "account_id": "N/A",
        "balance": 0.0,
        "available": 0.0,
        "margin": 0.0,
        "pnl": 0.0
    }
