from __future__ import annotations

import re
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import Business, BusinessMember, Category, Neighbourhood, Service, User

PLACEHOLDER_DESCRIPTION = (
    "Tell customers what you do. You can edit this from your business profile."
)
PLACEHOLDER_ADDRESS = "Add your address in Settings"


def default_hours() -> list[dict]:
    return [
        {"day": day, "open": "09:00", "close": "19:00", "closed": day == 0}
        for day in range(7)
    ]


def monogram_for(name: str) -> str:
    parts = [part for part in name.strip().split() if part]
    if not parts:
        return "OR"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def slug_for(name: str, suffix: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "shop"
    return f"{slug}-{suffix[:8]}"


def shop_complete(business: Business | None) -> bool:
    if not business:
        return False
    description = (business.description or "").strip()
    address = (business.address or "").strip()
    if PLACEHOLDER_DESCRIPTION in description or len(description) < 12:
        return False
    if PLACEHOLDER_ADDRESS in address or len(address) < 6:
        return False
    if not list(business.services or []):
        return False
    return True


def apply_neighbourhood(business: Business, place: Neighbourhood) -> None:
    business.neighborhood = place.label
    business.city = place.city
    business.lat = place.lat
    business.lng = place.lng


def replace_services(
    db: Session,
    business: Business,
    services: list[tuple[str, str]],
) -> None:
    db.query(Service).filter(Service.business_id == business.id).delete()
    for name, description in services:
        trimmed = name.strip()
        if len(trimmed) < 2:
            continue
        db.add(
            Service(
                id=str(uuid4()),
                business_id=business.id,
                name=trimmed,
                description=description.strip() or None,
            )
        )


def create_business(
    db: Session,
    user: User,
    *,
    name: str,
    category_id: str | None = None,
    location_id: str | None = None,
    address: str | None = None,
    description: str | None = None,
    services: list[tuple[str, str]] | None = None,
) -> Business:
    if category_id:
        if not db.query(Category).filter(Category.id == category_id).first():
            category_id = "more"
    place = None
    if location_id:
        place = db.query(Neighbourhood).filter(Neighbourhood.id == location_id).first()
    if not place and user.location_id:
        place = db.query(Neighbourhood).filter(Neighbourhood.id == user.location_id).first()
    if not place:
        place = db.query(Neighbourhood).order_by(Neighbourhood.label).first()

    business = Business(
        id=str(uuid4()),
        slug=slug_for(name, user.id),
        name=name.strip(),
        category_id=category_id or "more",
        description=(description or "").strip() or PLACEHOLDER_DESCRIPTION,
        tags=[item[0] for item in (services or []) if item[0].strip()][:6],
        rating=0,
        review_count=0,
        lat=place.lat if place else 12.9352,
        lng=place.lng if place else 77.6245,
        neighborhood=place.label if place else "Nearby",
        address=(address or "").strip() or PLACEHOLDER_ADDRESS,
        city=place.city if place else "",
        hours=default_hours(),
        typical_response_minutes=30,
        monogram=monogram_for(name),
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
    db.flush()
    if services:
        replace_services(db, business, services)
    if place:
        user.location_id = place.id
        user.lat = place.lat
        user.lng = place.lng
    return business
