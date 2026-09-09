from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Business, BusinessMember, User
from app.security import decode_token, read_token


def load_user(db: Session, user_id: str) -> User | None:
    return (
        db.query(User)
        .options(
            selectinload(User.roles),
            selectinload(User.location),
            selectinload(User.memberships)
            .selectinload(BusinessMember.business)
            .selectinload(Business.services),
        )
        .filter(User.id == user_id)
        .first()
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = read_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue",
        )
    user = load_user(db, decode_token(token))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue",
        )
    return user


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User | None:
    token = read_token(request)
    if not token:
        return None
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None
