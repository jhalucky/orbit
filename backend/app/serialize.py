from app.models import Business, Neighbourhood, User
from app.shop import shop_complete
from app.schemas import BusinessOut, NeighbourhoodOut, UserOut

STATUS_LABELS = {
    "PENDING": "Waiting for reply",
    "ACCEPTED": "Accepted",
    "IN_PROGRESS": "In progress",
    "READY": "Ready for pickup",
    "COMPLETED": "Completed",
    "CANCELLED": "Cancelled",
}


def neighbourhood_out(row: Neighbourhood | None) -> NeighbourhoodOut | None:
    if not row:
        return None
    return NeighbourhoodOut(
        id=row.id,
        label=row.label,
        city=row.city,
        lat=row.lat,
        lng=row.lng,
    )


def user_out(user: User) -> UserOut:
    membership = next(iter(user.memberships), None)
    using_device = bool(user.using_device_location)
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        initials=user.initials,
        roles=user.role_names,
        activeRole=user.active_role,
        locationId=user.location_id,
        location=neighbourhood_out(user.location),
        lat=user.lat,
        lng=user.lng,
        usingDeviceLocation=using_device,
        locationSource=user.location_source if user.location_source in ("gps", "network") else None,
        locationAccuracyM=user.location_accuracy_m,
        businessId=membership.business_id if membership else None,
        businessName=membership.business.name if membership else None,
        shopComplete=shop_complete(membership.business) if membership else False,
    )


def business_out(
    business: Business,
    *,
    distance_km: float | None = None,
    saved: bool = False,
) -> BusinessOut:
    return BusinessOut(
        id=business.id,
        slug=business.slug,
        name=business.name,
        categoryId=business.category_id,
        categoryLabel=business.category.label if business.category else "",
        description=business.description,
        tags=list(business.tags or []),
        rating=business.rating,
        reviewCount=business.review_count,
        location={"lat": business.lat, "lng": business.lng},
        neighborhood=business.neighborhood,
        address=business.address,
        hours=list(business.hours or []),
        typicalResponseMinutes=business.typical_response_minutes,
        monogram=business.monogram,
        mark=business.mark,
        distanceKm=distance_km,
        saved=saved,
    )


def provider_business_out(business: Business, *, location_id: str | None = None) -> dict:
    return {
        "id": business.id,
        "slug": business.slug,
        "name": business.name,
        "categoryId": business.category_id,
        "categoryLabel": business.category.label if business.category else "",
        "description": business.description,
        "tags": list(business.tags or []),
        "address": business.address,
        "neighborhood": business.neighborhood,
        "city": business.city,
        "locationId": location_id,
        "lat": business.lat,
        "lng": business.lng,
        "hours": list(business.hours or []),
        "typicalResponseMinutes": business.typical_response_minutes,
        "monogram": business.monogram,
        "mark": business.mark,
        "profileComplete": shop_complete(business),
        "services": [
            {
                "id": service.id,
                "name": service.name,
                "description": service.description or "",
            }
            for service in (business.services or [])
        ],
    }
