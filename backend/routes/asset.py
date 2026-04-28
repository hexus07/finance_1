from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Asset, AssetType, User
from middleware.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/assets", tags=["assets"], redirect_slashes=False)


class CreateAssetRequest(BaseModel):
    symbol: str
    name: str
    type: str  # "stock", "crypto", "etf", "commodity", "other"
    quantity: float
    purchase_price: float
    purchase_date: str  # ISO date string
    notes: str = ""


@router.get("/")
def get_assets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all assets for current user"""
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    return [
        {
            "id": asset.id,
            "symbol": asset.symbol,
            "name": asset.name,
            "type": asset.type.value if asset.type else None,
            "quantity": asset.quantity,
            "purchase_price": asset.purchase_price,
            "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
            "current_price": asset.current_price or 0.0,
            "price_change_percent": asset.price_change_percent or 0.0,
            "notes": asset.notes,
        }
        for asset in assets
    ]


@router.post("/")
def create_asset(
    request: CreateAssetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new asset for user"""
    try:
        # Convert date string to datetime
        purchase_date = datetime.fromisoformat(request.purchase_date)
        
        # Convert type string to enum
        asset_type = AssetType(request.type)
        
        asset = Asset(
            user_id=current_user.id,
            symbol=request.symbol,
            name=request.name,
            type=asset_type,
            quantity=request.quantity,
            purchase_price=request.purchase_price,
            purchase_date=purchase_date,
            notes=request.notes,
            current_price=request.purchase_price,  # Initialize with purchase price
            price_change_percent=0.0,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
        return {
            "id": asset.id,
            "symbol": asset.symbol,
            "name": asset.name,
            "type": asset.type.value,
            "quantity": asset.quantity,
            "purchase_price": asset.purchase_price,
            "purchase_date": asset.purchase_date.isoformat(),
            "current_price": asset.current_price,
            "price_change_percent": asset.price_change_percent,
            "notes": asset.notes,
            "message": "Asset created successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{asset_id}")
def update_asset(
    asset_id: int,
    request: CreateAssetRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update asset for current user"""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    asset.symbol = request.symbol
    asset.name = request.name
    asset.type = AssetType(request.type)
    asset.quantity = request.quantity
    asset.purchase_price = request.purchase_price
    asset.purchase_date = datetime.fromisoformat(request.purchase_date)
    asset.notes = request.notes
    asset.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(asset)
    
    return {"message": "Asset updated successfully", "asset": asset}


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete asset for current user"""
    asset = db.query(Asset).filter(
        Asset.id == asset_id,
        Asset.user_id == current_user.id
    ).first()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    db.delete(asset)
    db.commit()
    
    return {"message": "Asset deleted successfully"}

@router.post("/refresh-prices")
def refresh_asset_prices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger price refresh for user's assets"""
    from main import fetch_stock_price, fetch_crypto_price
    
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    updated_count = 0
    
    for asset in assets:
        price_data = None
        
        if asset.type.value == "crypto":
            price_data = fetch_crypto_price(asset.symbol)
        else:
            price_data = fetch_stock_price(asset.symbol)
        
        if price_data and price_data['success']:
            asset.current_price = round(price_data['price'], 2)
            asset.price_change_percent = round(price_data['change_24h'], 2)
            asset.updated_at = datetime.utcnow()
            updated_count += 1
    
    db.commit()
    return {"message": f"Refreshed {updated_count} assets", "count": updated_count}

@router.get("/portfolio-growth")
def get_portfolio_growth(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio growth based on when assets were added"""
    from datetime import timedelta
    
    assets = db.query(Asset).filter(Asset.user_id == current_user.id).all()
    
    if not assets:
        return []
    
    # Generate last 7 days
    growth_data = []
    today = datetime.utcnow().date()
    
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        day_name = day.strftime('%a')  # Mon, Tue, etc.
        
        # Calculate portfolio value for this day
        # Only include assets that were purchased on or before this day
        portfolio_value = current_user.balance  # Start with cash balance
        
        for asset in assets:
            if asset.purchase_date.date() <= day:
                # Asset existed on this day, add its value
                portfolio_value += asset.current_price * asset.quantity
        
        growth_data.append({
            "day": day_name,
            "value": round(portfolio_value, 2),
            "date": day.isoformat()
        })
    
    return growth_data

@router.post("/withdraw-savings")
async def withdraw_from_savings(amount: float, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    user = db.query(User).filter(User.id == current_user.id).first()
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    if user.savings_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient savings")
    
    user.savings_balance -= amount
    user.balance += amount
    db.commit()
    
    return {
        "balance": user.balance,
        "savings_balance": user.savings_balance
    }