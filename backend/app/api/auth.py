from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..core.database import get_database
from ..models.user import UserCreate, UserLogin, UserResponse, Token
from ..services.auth_service import AuthService
from ..services.research_service import ResearchService
from ..models.schemas import ResearchSession

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def get_auth_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service)
):
    try:
        user, token = await service.create_user(user_data)
        # Use the id from the returned user object
        user_id = user.id if user.id else None
        return Token(
            access_token=token,
            user=UserResponse(
                _id=user_id,
                email=user.email,
                username=user.username,
                created_at=user.created_at
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=Token)
async def login(
    user_data: UserLogin,
    service: AuthService = Depends(get_auth_service)
):
    try:
        user, token = await service.authenticate_user(user_data)
        return Token(
            access_token=token,
            user=UserResponse(
                _id=user.id,
                email=user.email,
                username=user.username,
                created_at=user.created_at
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    service: AuthService = Depends(get_auth_service),
    token: str = None
):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = service.decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        _id=user.id,
        email=user.email,
        username=user.username,
        created_at=user.created_at
    )


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
