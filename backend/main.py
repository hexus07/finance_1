from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
import models
from routes.auth import router as auth_router


from routes.auth import router as auth_router
from routes.transactions import router as transactions_router
from routes.asset import router as asset_router
from datetime import datetime


import asyncio
import random

from config import settings
ALPHA_VANTAGE_API_KEY = settings.alpha_vantage_api_key
FINNHUB_API_KEY = settings.finnhub_api_key

# Create all tables on startup
Base.metadata.create_all(bind=engine)

import requests

def fetch_stock_price(symbol: str) -> dict:
    """Fetch stock price from Finnhub (60 calls/minute)"""
    try:
        response = requests.get(
            'https://finnhub.io/api/v1/quote',
            params={
                'symbol': symbol,
                'token': FINNHUB_API_KEY
            },
            timeout=10
        )
        
        data = response.json()
        
        # Check for errors
        if 'error' in data:
            print(f"Finnhub error: {data['error']}")
            return {'success': False}
        
        # Check if we got valid data
        if 'c' not in data or data['c'] == 0:
            print(f"No data for {symbol}")
            return {'success': False}
        
        current_price = data['c']
        previous_close = data.get('pc', current_price)
        change_percent = ((current_price - previous_close) / previous_close * 100) if previous_close else 0
        
        print(f"DEBUG: {symbol} price: {current_price}, change: {change_percent}%")
        
        return {
            'price': current_price,
            'change_24h': change_percent,
            'success': True
        }
    except Exception as e:
        print(f"Failed to fetch {symbol}: {e}")
        return {'success': False}
    
def fetch_crypto_price(symbol: str) -> dict:
    """Fetch crypto price from CoinGecko - supports any cryptocurrency"""
    try:
        # First, try to get the crypto ID from CoinGecko's search
        search_response = requests.get(
            'https://api.coingecko.com/api/v3/search',
            params={'query': symbol},
            timeout=5
        )
        
        search_data = search_response.json()
        
        # Find the coin in search results (match by symbol first, then name)
        coin = None
        for result in search_data.get('coins', []):
            if result.get('symbol', '').upper() == symbol.upper():
                coin = result
                break
        
        # If no exact symbol match, try to find by name
        if not coin and search_data.get('coins'):
            coin = search_data['coins'][0]
        
        if not coin:
            print(f"Crypto {symbol} not found on CoinGecko")
            return {'success': False}
        
        crypto_id = coin['id']
        
        # Now fetch the price with the correct ID
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price',
            params={
                'ids': crypto_id,
                'vs_currencies': 'eur',
                'include_24hr_change': 'true'
            },
            timeout=10
        )
        
        data = response.json()
        if crypto_id not in data:
            return {'success': False}
        
        crypto_data = data[crypto_id]
        return {
            'price': crypto_data['eur'],
            'change_24h': crypto_data.get('eur_24h_change', 0),
            'success': True
        }
    except Exception as e:
        print(f"Failed to fetch crypto {symbol}: {e}")
        return {'success': False}


async def update_asset_prices():
    """Periodically fetch and update real asset prices"""
    await asyncio.sleep(5)  # Wait for app startup
    
    while True:
        try:
            db = SessionLocal()
            assets = db.query(Asset).all()
            
            for asset in assets:
                price_data = None
                
                # Determine if crypto or stock
                if asset.type.value == "crypto":
                    price_data = fetch_crypto_price(asset.symbol)
                else:  # stock, etf, commodity, other
                    price_data = fetch_stock_price(asset.symbol)
                
                if price_data and price_data['success']:
                    asset.current_price = round(price_data['price'], 2)
                    asset.price_change_percent = round(price_data['change_24h'], 2)
                    asset.updated_at = datetime.utcnow()
                    print(f"✅ Updated {asset.symbol}: €{asset.current_price} ({asset.price_change_percent}%)")
                else:
                    print(f"⚠️ Failed to update {asset.symbol}")
                await asyncio.sleep(0.1) 
            
            db.commit()
            db.close()
            
            # Update every 5 minutes (Alpha Vantage free: 5 calls/min)
            await asyncio.sleep(300)
        except Exception as e:
            print(f"Error in price update task: {e}")
            await asyncio.sleep(300)


from database import SessionLocal
from models import Asset


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("✅ Database tables created")
    print("✅ Starting price update task...")
    # Start price update task
    asyncio.create_task(update_asset_prices())
    yield
    print("✅ Shutting down...")

app = FastAPI(title="Finance API", lifespan=lifespan)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Register routers
app.include_router(auth_router)
# Register routers
app.include_router(auth_router)
app.include_router(transactions_router)
app.include_router(asset_router)

@app.get("/")
def read_root():
    return {"message": "Finance API running"}