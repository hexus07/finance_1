from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    oauth_id = Column(String, unique=True, index=True)  # Google/GitHub ID
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    balance = Column(Float, default=0.0)          # Cash balance
    savings_goal = Column(Float, default=0.0)     # Target savings amount
    savings_goal_description = Column(String, nullable=True)  # Optional description for the savings goal

    savings_balance = Column(Float, default=0.0)            # Current savings amount
    monthly_budget = Column(Float, default=0.0) 

    # Relationships
    transactions = relationship("Transaction", back_populates="owner", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="owner", cascade="all, delete-orphan")


class TransactionType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"


class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    date = Column(DateTime)
    type = Column(Enum(TransactionType))
    amount = Column(Float)
    asset_symbol = Column(String)  # e.g., "AAPL", "BTC"
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    owner = relationship("User", back_populates="transactions")

class AssetType(str, enum.Enum):
    STOCK = "stock"
    CRYPTO = "crypto"
    ETF = "etf"
    COMMODITY = "commodity"
    OTHER = "other"


class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    symbol = Column(String)  # e.g., "AAPL", "BTC"
    name = Column(String)  # e.g., "Apple Inc."
    type = Column(Enum(AssetType))  # stock, crypto, etf, etc.
    quantity = Column(Float)
    purchase_price = Column(Float)
    purchase_date = Column(DateTime)  # NEW
    current_price = Column(Float, default=0.0)  # NEW
    price_change_percent = Column(Float, default=0.0)  # NEW
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    owner = relationship("User", back_populates="assets")