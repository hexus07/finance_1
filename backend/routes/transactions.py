from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from models import User, Transaction, TransactionType, Asset
from middleware.auth import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/transactions", tags=["transactions"])

class TransactionRequest(BaseModel):
    type: str  # 'income' or 'expense'
    amount: float
    category: str
    notes: str = None
    date: datetime
# POST /transactions - Create transaction
@router.post("")
def create_transaction(
    request: TransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    
    # Map frontend type to backend enum
    transaction_type = TransactionType.SELL if request.type == "income" else TransactionType.BUY
    
    transaction = Transaction(
        user_id=current_user.id,
        type=transaction_type,
        amount=request.amount,
        asset_symbol=request.category,
        notes=request.notes,
        date=request.date
    )
    
    # Skip balance update for savings-related transactions (they're already handled)
    if request.category not in ["Savings", "Withdraw Savings"]:
        # Update user balance
        if request.type == "income":
            current_user.balance += request.amount
        else:
            if current_user.balance < request.amount:
                raise HTTPException(status_code=400, detail="Insufficient balance")
            current_user.balance -= request.amount
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    db.refresh(current_user)
    
    return {
        "id": transaction.id,
        "type": transaction.type.value,
        "amount": transaction.amount,
        "category": transaction.asset_symbol,
        "notes": transaction.notes,
        "date": transaction.date,
        "new_balance": current_user.balance
    }

@router.get("")
def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get transactions for current user with pagination"""
    
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).limit(limit).offset(offset).all()
    
    return [
        {
            "id": t.id,
            "type": t.type.value,
            "amount": t.amount,
            "category": t.asset_symbol,
            "notes": t.notes,
            "created_at": t.created_at
        }
        for t in transactions
    ]
# PUT /transactions/{id} - Update transaction
@router.put("/{transaction_id}")
def update_transaction(
    transaction_id: int,
    request: TransactionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a transaction"""
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.type = TransactionType.SELL if request.type == "income" else TransactionType.BUY
    transaction.amount = request.amount
    transaction.asset_symbol = request.category
    transaction.notes = request.notes
    transaction.date = request.date
    
    db.commit()
    db.refresh(transaction)
    
    return {
        "id": transaction.id,
        "type": transaction.type.value,
        "amount": transaction.amount,
        "category": transaction.asset_symbol,
        "notes": transaction.notes,
        "date": transaction.date
    }

# DELETE /transactions/{id} - Delete transaction
@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    
    return {"message": "Transaction deleted successfully"}

class CreateAssetRequest(BaseModel):
    symbol: str
    name: str
    type: str  # e.g., "stock", "crypto"
    quantity: float
    purchase_price: float
    purchase_date: datetime
    notes: str = None





@router.post("/assets")
def create_asset(
    request: CreateAssetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new asset for user"""
    asset = Asset(
        user_id=current_user.id,
        symbol=request.symbol,
        name=request.name,
        type=request.type,
        quantity=request.quantity,
        purchase_price=request.purchase_price,
        purchase_date=request.purchase_date,
        notes=request.notes
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return {
        "id": asset.id,
        "symbol": asset.symbol,
        "name": asset.name,
        "type": asset.type,
        "message": "Asset created successfully"
    }
