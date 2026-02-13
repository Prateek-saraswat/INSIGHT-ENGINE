from datetime import datetime, timedelta
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from ..models.user import User, UserCreate, UserLogin
from ..core.config import settings
import bcrypt
import re


def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    password_bytes = password.encode('utf-8')
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.users = db.users
    
    def create_access_token(self, user_id: str, expires_delta: Optional[timedelta] = None) -> str:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=7)
        
        to_encode = {
            "sub": user_id,
            "exp": expire,
            "iat": datetime.utcnow()
        }
        from jwt import encode
        encoded_jwt = encode(to_encode, settings.secret_key, algorithm="HS256")
        return encoded_jwt
    
    def decode_token(self, token: str) -> Optional[str]:
        from jwt import decode
        try:
            payload = decode(token, settings.secret_key, algorithms=["HS256"])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except:
            return None
    
    async def create_user(self, user_data: UserCreate) -> tuple[User, str]:
        # Validate email format
        if not validate_email(user_data.email):
            raise ValueError("Invalid email format")
        
        # Check if user exists
        existing = await self.users.find_one({"$or": [
            {"email": user_data.email.lower()},
            {"username": user_data.username}
        ]})
        if existing:
            raise ValueError("User with this email or username already exists")
        
        # Validate password
        if user_data.password != user_data.confirm_password:
            raise ValueError("Passwords do not match")
        
        if len(user_data.password) < 8:
            raise ValueError("Password must be at least 8 characters")
        
        # Create user
        user = User(
            email=user_data.email.lower(),
            username=user_data.username,
            hashed_password=get_password_hash(user_data.password)
        )
        
        result = await self.users.insert_one(user.dict())
        user.id = str(result.inserted_id)
        
        token = self.create_access_token(str(result.inserted_id))
        
        return user, token
    
    async def authenticate_user(self, user_data: UserLogin) -> tuple[User, str]:
        # Validate email format
        if not validate_email(user_data.email):
            raise ValueError("Invalid email format")
        
        user_doc = await self.users.find_one({"email": user_data.email.lower()})
        
        if not user_doc:
            raise ValueError("Invalid email or password")
        
        # Convert ObjectId to string for id field
        user_doc['id'] = str(user_doc['_id'])
        user = User(**user_doc)
        
        if not verify_password(user_data.password, user.hashed_password):
            raise ValueError("Invalid email or password")
        
        if user.status.value != "active":
            raise ValueError("Account is deactivated")
        
        token = self.create_access_token(user_doc['id'])
        
        return user, token
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        try:
            user_doc = await self.users.find_one({"_id": ObjectId(user_id)})
            if user_doc:
                user_doc['id'] = str(user_doc['_id'])
                return User(**user_doc)
        except:
            pass
        return None
