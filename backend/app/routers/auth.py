from urllib.parse import urlencode
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user, load_user
from app.models import Business, BusinessMember, User, UserRole
from app.schemas import LoginBody, MeUpdateBody, RegisterBody, RoleBody
from app.security import (
    clear_session_cookie,
    create_token,
    hash_password,
    set_session_cookie,
    verify_password,
)
from app.serialize import user_out

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/features")
def features() -> dict[str, bool]:
    return {"google": settings.google_enabled}


@router.post("/register")
def register(
    body: RegisterBody,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    user = User(
        id=str(uuid4()),
        email=email,
        name=body.name.strip(),
        password_hash=hash_password(body.password),
        active_role=body.intent,
        location_id="koramangala",
    )
    db.add(user)
    db.add(UserRole(user_id=user.id, role=body.intent))
    if body.intent == "provider":
        _create_business_for(db, user, body.business_name or f"{body.name}'s business")
    db.commit()
    user = load_user(db, user.id)
    set_session_cookie(response, user.id)
    return user_out(user).model_dump()


@router.post("/login")
def login(
    body: LoginBody,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    user = db.query(User).filter(User.email == body.email.lower().strip()).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is wrong")

    if body.intent:
        if body.intent not in user.role_names:
            db.add(UserRole(user_id=user.id, role=body.intent))
            if body.intent == "provider" and not user.memberships:
                _create_business_for(db, user, f"{user.name}'s business")
        user.active_role = body.intent
        db.commit()

    set_session_cookie(response, user.id)
    user = load_user(db, user.id)
    return user_out(user).model_dump()


@router.post("/logout")
def logout(response: Response) -> dict[str, bool]:
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return user_out(user).model_dump()


@router.patch("/me")
def update_me(
    body: MeUpdateBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if body.location_id is not None:
        user.location_id = body.location_id
    if body.active_role:
        if body.active_role not in user.role_names:
            raise HTTPException(status_code=400, detail="You don’t have that role yet")
        user.active_role = body.active_role
    if body.lat is not None:
        user.lat = body.lat
    if body.lng is not None:
        user.lng = body.lng
    db.commit()
    loaded = load_user(db, user.id)
    return user_out(loaded).model_dump()


@router.post("/role")
def choose_role(
    body: RoleBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    if body.role not in user.role_names:
        db.add(UserRole(user_id=user.id, role=body.role))
    user.active_role = body.role
    if body.role == "provider" and not user.memberships:
        _create_business_for(db, user, body.business_name or f"{user.name}'s business")
    db.commit()
    loaded = load_user(db, user.id)
    return user_out(loaded).model_dump()


@router.get("/google")
def google_start() -> RedirectResponse:
    if not settings.google_enabled:
        raise HTTPException(
            status_code=501,
            detail="Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
        )
    state = create_token("google")
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "online",
            "prompt": "select_account",
        }
    )
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{query}")


@router.get("/google/callback")
def google_callback(
    db: Session = Depends(get_db),
    code: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    if error or not code:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google")
    if not settings.google_enabled:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google")

    token_response = httpx.post(
        GOOGLE_TOKEN_URL,
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=15,
    )
    if token_response.status_code >= 400:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google")
    access_token = token_response.json().get("access_token")
    if not access_token:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google")

    info_response = httpx.get(
        GOOGLE_USERINFO_URL,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=15,
    )
    info = info_response.json()
    google_id = info.get("sub")
    email = (info.get("email") or "").lower()
    name = info.get("name") or email.split("@")[0]
    if not google_id or not email:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google")

    user = (
        db.query(User).filter(User.google_id == google_id).first()
        or db.query(User).filter(User.email == email).first()
    )
    if user:
        user.google_id = google_id
    else:
        user = User(
            id=str(uuid4()),
            email=email,
            name=name,
            google_id=google_id,
            location_id="koramangala",
        )
        db.add(user)
    db.commit()

    redirect = (
        f"{settings.frontend_url}/onboarding"
        if not user.active_role
        else (
            f"{settings.frontend_url}/provider"
            if user.active_role == "provider"
            else settings.frontend_url
        )
    )
    response = RedirectResponse(redirect)
    set_session_cookie(response, user.id)
    return response


def _create_business_for(db: Session, user: User, name: str) -> Business:
    slug = f"{name.lower().replace(' ', '-')}-{user.id[:8]}"
    business = Business(
        id=str(uuid4()),
        slug=slug,
        name=name.strip(),
        category_id="more",
        description="Tell customers what you do. You can edit this from your business profile.",
        tags=[],
        rating=0,
        review_count=0,
        lat=12.9352,
        lng=77.6245,
        neighborhood="Koramangala",
        address="Add your address in Settings",
        hours=[
            {"day": day, "open": "09:00", "close": "19:00", "closed": day == 0}
            for day in range(7)
        ],
        typical_response_minutes=30,
        monogram=(name.strip()[:2] or "OR").upper(),
        mark="line",
    )
    db.add(business)
    db.add(
        BusinessMember(
            business_id=business.id,
            user_id=user.id,
            member_role="owner",
        )
    )
    return business
