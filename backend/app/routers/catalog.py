from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Business, Category, Neighbourhood, SavedBusiness, User, haversine_km
from app.serialize import business_out, neighbourhood_out

router = APIRouter(tags=["catalog"])

DEFAULT_LAT = 12.9352
DEFAULT_LNG = 77.6245
NEARBY_KM = 40


def origin_for(
    user: User,
    lat: float | None = None,
    lng: float | None = None,
) -> tuple[float, float]:
    origin_lat = (
        lat
        if lat is not None
        else user.lat
        if user.lat is not None
        else user.location.lat
        if user.location
        else DEFAULT_LAT
    )
    origin_lng = (
        lng
        if lng is not None
        else user.lng
        if user.lng is not None
        else user.location.lng
        if user.location
        else DEFAULT_LNG
    )
    return origin_lat, origin_lng


@router.get("/neighbourhoods")
def list_neighbourhoods(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Neighbourhood).order_by(Neighbourhood.label).all()
    return [neighbourhood_out(row).model_dump() for row in rows]


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Category).order_by(Category.sort_order).all()
    return [{"id": row.id, "label": row.label} for row in rows]


@router.get("/businesses")
def list_businesses(
    q: str | None = None,
    category_id: str | None = Query(default=None, alias="categoryId"),
    lat: float | None = None,
    lng: float | None = None,
    saved: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    query = db.query(Business).options(selectinload(Business.category))
    if category_id:
        query = query.filter(Business.category_id == category_id)
    if saved:
        saved_ids = [
            row.business_id
            for row in db.query(SavedBusiness).filter(SavedBusiness.user_id == user.id)
        ]
        query = query.filter(Business.id.in_(saved_ids or ["__none__"]))

    origin_lat, origin_lng = origin_for(user, lat, lng)

    saved_set = {
        row.business_id
        for row in db.query(SavedBusiness).filter(SavedBusiness.user_id == user.id)
    }

    results = []
    needle = (q or "").strip().lower()
    for business in query.all():
        if needle:
            haystack = " ".join(
                [
                    business.name,
                    business.description,
                    business.neighborhood,
                    business.category.label if business.category else "",
                    " ".join(business.tags or []),
                ]
            ).lower()
            if needle not in haystack:
                continue
        distance = haversine_km(origin_lat, origin_lng, business.lat, business.lng)
        if not saved and distance > NEARBY_KM:
            continue
        results.append(
            business_out(
                business,
                distance_km=round(distance, 2),
                saved=business.id in saved_set,
            ).model_dump()
        )

    results.sort(key=lambda item: item["distanceKm"] or 0)
    return results


@router.get("/businesses/{slug}")
def get_business(
    slug: str,
    lat: float | None = None,
    lng: float | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    business = (
        db.query(Business)
        .options(selectinload(Business.category), selectinload(Business.services))
        .filter(Business.slug == slug)
        .first()
    )
    if not business:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Business not found")

    origin_lat, origin_lng = origin_for(user, lat, lng)
    saved = (
        db.query(SavedBusiness)
        .filter(
            SavedBusiness.user_id == user.id,
            SavedBusiness.business_id == business.id,
        )
        .first()
        is not None
    )
    payload = business_out(
        business,
        distance_km=round(haversine_km(origin_lat, origin_lng, business.lat, business.lng), 2),
        saved=saved,
    ).model_dump()
    payload["services"] = [
        {"id": service.id, "name": service.name, "description": service.description}
        for service in business.services
    ]
    return payload
