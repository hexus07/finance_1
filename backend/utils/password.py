from passlib.context import CryptContext

# Use Argon2 instead of bcrypt (no 72-byte limit, more secure)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plain password using Argon2"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare plain password with hash"""
    return pwd_context.verify(plain_password, hashed_password)