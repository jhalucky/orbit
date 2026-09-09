from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import BusinessMember, ServiceRequest, User
from app.serialize import STATUS_LABELS

router = APIRouter(prefix="/provider", tags=["provider"])


def _require_business_id(db: Session, user: User) -> str:
    membership = (
        db.query(BusinessMember)
        .options(selectinload(BusinessMember.business))
        .filter(BusinessMember.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail="This account is not linked to a business")
    return membership.business_id


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    business_id = _require_business_id(db, user)
    membership = (
        db.query(BusinessMember)
        .options(selectinload(BusinessMember.business))
        .filter(BusinessMember.user_id == user.id)
        .first()
    )
    rows = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.customer),
            selectinload(ServiceRequest.business),
        )
        .filter(ServiceRequest.business_id == business_id)
        .order_by(ServiceRequest.updated_at.desc())
        .all()
    )
    today = datetime.now(timezone.utc).date()
    todays = [
        row
        for row in rows
        if (row.created_at or row.updated_at).date() == today
        or row.status in {"PENDING", "ACCEPTED", "IN_PROGRESS", "READY"}
    ]
    return {
        "businessName": membership.business.name if membership else "",
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
            for row in todays
        ],
    }
