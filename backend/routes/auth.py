from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from utils.password import hash_password, verify_password
from utils.jwt import create_access_token
from middleware.auth import get_current_user  # ← ADD THIS IMPORT
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

# Request schemas
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user: dict

class UpdateSavingsGoalRequest(BaseModel):
    savings_goal: float
    savings_goal_description: str = None  # Optional

class AddToSavingsRequest(BaseModel):
    amount: float 

# POST /auth/register
@router.post("/register", response_model=AuthResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Create new account"""
    
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        name=request.name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "balance": user.balance,
            "monthly_budget": user.monthly_budget,  # ADD THIS
            "savings_balance": user.savings_balance,  # ADD THIS
            "savings_goal": user.savings_goal,
            "savings_goal_description": user.savings_goal_description,
        }
    }

# POST /auth/login
@router.post("/login", response_model=AuthResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "balance": user.balance,
            "monthly_budget": user.monthly_budget,  # ADD THIS
            "savings_balance": user.savings_balance,  # ADD THIS
            "savings_goal": user.savings_goal,
            "savings_goal_description": user.savings_goal_description,
        }
    }

# GET /auth/me (get current user)
@router.get("/me")
def get_user_profile(current_user: User = Depends(get_current_user)):  # ← CHANGED function name
    """Get authenticated user info"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "monthly_budget": current_user.monthly_budget,
        "balance": current_user.balance,
        "savings_balance": current_user.savings_balance,
        "savings_goal": current_user.savings_goal,
        "savings_goal_description": current_user.savings_goal_description,
    }


# PUT /auth/me/savings-goal
# PUT /auth/me/savings-goal
@router.put("/me/savings-goal")
def update_savings_goal(request: UpdateSavingsGoalRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user's savings goal"""
    current_user.savings_goal = request.savings_goal
    if request.savings_goal_description:
        current_user.savings_goal_description = request.savings_goal_description
    db.commit()
    db.refresh(current_user)
    return {
        "id": current_user.id,
        "savings_goal": current_user.savings_goal,
        "savings_goal_description": current_user.savings_goal_description,
        "message": "Savings goal updated successfully"
    }

# POST /auth/me/add-to-savings
@router.post("/me/add-to-savings")
def add_to_savings(request: AddToSavingsRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Add money to savings from balance"""
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if current_user.balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    current_user.balance -= request.amount
    current_user.savings_balance = (current_user.savings_balance or 0) + request.amount
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "balance": current_user.balance,
        "savings_balance": current_user.savings_balance,
        "message": "Amount added to savings successfully"
    }

class UpdateBudgetRequest(BaseModel):
    monthly_budget: float

# PUT /auth/me/budget
@router.put("/me/budget")
def update_budget(request: UpdateBudgetRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user's monthly budget"""
    if request.monthly_budget < 0:
        raise HTTPException(status_code=400, detail="Budget cannot be negative")
    
    current_user.monthly_budget = request.monthly_budget
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "monthly_budget": current_user.monthly_budget,
        "message": "Monthly budget updated successfully"
    }

class WithdrawFromSavingsRequest(BaseModel):
    amount: float

class WithdrawFromSavingsRequest(BaseModel):
    amount: float

# POST /auth/me/withdraw-from-savings
@router.post("/me/withdraw-from-savings")
def withdraw_from_savings(request: WithdrawFromSavingsRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Withdraw money from savings to main balance"""
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if current_user.savings_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient savings balance")
    
    current_user.savings_balance -= request.amount
    current_user.balance += request.amount
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "balance": current_user.balance,
        "savings_balance": current_user.savings_balance,
        "message": "Amount withdrawn from savings successfully"
    }