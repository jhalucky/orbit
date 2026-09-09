from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Business,
    BusinessMember,
    Category,
    Neighbourhood,
    ServiceRequest,
    User,
    haversine_km,
)
from app.schemas import ProviderBusinessUpdate
from app.serialize import STATUS_LABELS, provider_business_out
from app.shop import (
    apply_neighbourhood,
    monogram_for,
    replace_services,
    shop_complete,
    slug_for,
)

router = APIRouter(prefix="/provider", tags=["provider"])


def _membership(db: Session, user: User) -> BusinessMember:
    membership = (
        db.query(BusinessMember)
        .options(
            selectinload(BusinessMember.business).selectinload(Business.category),
            selectinload(BusinessMember.business).selectinload(Business.services),
        )
        .filter(BusinessMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="This account is not linked to a business")
    return membership


def _require_business_id(db: Session, user: User) -> str:
    return _membership(db, user).business_id


def _location_id_for(db: Session, business: Business) -> str | None:
    places = db.query(Neighbourhood).all()
    if not places:
        return None
    nearest = min(
        places,
        key=lambda place: haversine_km(business.lat, business.lng, place.lat, place.lng),
    )
    return nearest.id


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    membership = _membership(db, user)
    business = membership.business
    rows = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.customer),
            selectinload(ServiceRequest.business),
        )
        .filter(ServiceRequest.business_id == business.id)
        .order_by(ServiceRequest.updated_at.desc())
        .all()
    )
    open_rows = [
        row
        for row in rows
        if row.status in {"PENDING", "ACCEPTED", "IN_PROGRESS", "READY"}
    ]
    return {
        "businessName": business.name,
        "categoryLabel": business.category.label if business.category else "",
        "neighborhood": business.neighborhood,
        "city": business.city,
        "address": business.address,
        "profileComplete": shop_complete(business),
        "serviceCount": len(business.services or []),
        "newRequests": sum(1 for row in rows if row.status == "PENDING"),
        "inProgress": sum(1 for row in rows if row.status in {"ACCEPTED", "IN_PROGRESS"}),
        "ready": sum(1 for row in rows if row.status == "READY"),
        "requests": [
            {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "customerName": row.customer.name if row.customer else "",
                "status": row.status,
                "statusLabel": STATUS_LABELS.get(row.status, row.status),
                "updatedAt": row.updated_at,
                "conversationId": row.conversation_id,
            }
            for row in open_rows
        ],
    }


@router.get("/business")
def get_business(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    business = _membership(db, user).business
    return provider_business_out(business, location_id=_location_id_for(db, business))


@router.patch("/business")
def update_business(
    body: ProviderBusinessUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    membership = _membership(db, user)
    business = membership.business

    if body.name is not None:
        business.name = body.name.strip()
        business.monogram = monogram_for(business.name)
        business.slug = slug_for(business.name, user.id)
    if body.category_id is not None:
        category = db.query(Category).filter(Category.id == body.category_id).first()
        if not category:
            raise HTTPException(status_code=400, detail="Unknown category")
        business.category_id = category.id
    if body.location_id is not None:
        place = db.query(Neighbourhood).filter(Neighbourhood.id == body.location_id).first()
        if not place:
            raise HTTPException(status_code=400, detail="Unknown neighbourhood")
        apply_neighbourhood(business, place)
        if not user.location_id:
            user.location_id = place.id
            user.lat = place.lat
            user.lng = place.lng
    if body.address is not None:
        business.address = body.address.strip()
    if body.description is not None:
        business.description = body.description.strip()
    if body.typical_response_minutes is not None:
        business.typical_response_minutes = body.typical_response_minutes
    if body.hours is not None:
        business.hours = body.hours
    if body.tags is not None:
        business.tags = [tag.strip() for tag in body.tags if tag.strip()][:8]
    if body.services is not None:
        replace_services(
            db,
            business,
            [(item.name, item.description) for item in body.services],
        )
        if not business.tags:
            business.tags = [item.name.strip() for item in body.services if item.name.strip()][:6]

    db.commit()
    db.refresh(business)
    business = (
        db.query(Business)
        .options(selectinload(Business.category), selectinload(Business.services))
        .filter(Business.id == business.id)
        .first()
    )
    return provider_business_out(business, location_id=_location_id_for(db, business))
