from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import (
    Business,
    BusinessMember,
    Conversation,
    Message,
    Notification,
    RequestEvent,
    SavedBusiness,
    ServiceRequest,
    User,
)
from app.schemas import RequestCreateBody, RequestStatusBody
from app.serialize import STATUS_LABELS

router = APIRouter(tags=["requests"])

ALLOWED_TRANSITIONS = {
    "PENDING": {"ACCEPTED", "CANCELLED"},
    "ACCEPTED": {"IN_PROGRESS", "CANCELLED"},
    "IN_PROGRESS": {"READY", "CANCELLED"},
    "READY": {"COMPLETED", "CANCELLED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}


def _request_out(row: ServiceRequest) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "description": row.description,
        "categoryLabel": row.category_label,
        "businessId": row.business_id,
        "businessName": row.business.name if row.business else "",
        "customerId": row.customer_id,
        "customerName": row.customer.name if row.customer else "",
        "conversationId": row.conversation_id,
        "status": row.status,
        "statusLabel": STATUS_LABELS.get(row.status, row.status),
        "createdAt": row.created_at,
        "updatedAt": row.updated_at,
    }


def _provider_business_ids(db: Session, user: User) -> list[str]:
    return [
        row.business_id
        for row in db.query(BusinessMember).filter(BusinessMember.user_id == user.id)
    ]


@router.get("/requests")
def list_requests(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    query = db.query(ServiceRequest).options(
        selectinload(ServiceRequest.business),
        selectinload(ServiceRequest.customer),
    )
    if user.active_role == "provider":
        ids = _provider_business_ids(db, user)
        query = query.filter(ServiceRequest.business_id.in_(ids or ["__none__"]))
    else:
        query = query.filter(ServiceRequest.customer_id == user.id)
    rows = query.order_by(ServiceRequest.updated_at.desc()).all()
    return [_request_out(row) for row in rows]


@router.post("/requests")
def create_request(
    body: RequestCreateBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    business = (
        db.query(Business)
        .options(selectinload(Business.category))
        .filter(Business.id == body.business_id)
        .first()
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    conversation = None
    if body.conversation_id:
        conversation = (
            db.query(Conversation).filter(Conversation.id == body.conversation_id).first()
        )
    if conversation is None:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.customer_id == user.id,
                Conversation.business_id == business.id,
            )
            .first()
        )
    if conversation is None:
        conversation = Conversation(
            id=str(uuid4()),
            customer_id=user.id,
            business_id=business.id,
        )
        db.add(conversation)
        db.flush()

    row = ServiceRequest(
        id=str(uuid4()),
        customer_id=user.id,
        business_id=business.id,
        conversation_id=conversation.id,
        title=body.title.strip(),
        description=body.description.strip(),
        category_label=business.category.label if business.category else "",
        status="PENDING",
    )
    db.add(row)
    db.flush()
    db.add(
        RequestEvent(
            id=str(uuid4()),
            request_id=row.id,
            actor_id=user.id,
            to_status="PENDING",
            note="Request sent",
        )
    )
    db.add(
        Message(
            id=str(uuid4()),
            conversation_id=conversation.id,
            sender_id=None,
            kind="request",
            request_id=row.id,
            body=f"Service request: {row.title}",
        )
    )
    conversation.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    row.business = business
    row.customer = user
    return _request_out(row)


@router.get("/requests/{request_id}")
def get_request(
    request_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    row = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.business),
            selectinload(ServiceRequest.customer),
        )
        .filter(ServiceRequest.id == request_id)
        .first()
    )
    if not row or not _can_see(db, user, row):
        raise HTTPException(status_code=404, detail="Request not found")
    return _request_out(row)


@router.patch("/requests/{request_id}")
def update_request(
    request_id: str,
    body: RequestStatusBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    row = (
        db.query(ServiceRequest)
        .options(
            selectinload(ServiceRequest.business),
            selectinload(ServiceRequest.customer),
        )
        .filter(ServiceRequest.id == request_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")

    provider_ids = _provider_business_ids(db, user)
    is_provider = row.business_id in provider_ids
    is_customer = row.customer_id == user.id

    if body.status == "CANCELLED":
        if not (is_customer or is_provider):
            raise HTTPException(status_code=403, detail="Not allowed")
    elif not is_provider:
        raise HTTPException(status_code=403, detail="Only the business can change this status")

    allowed = ALLOWED_TRANSITIONS.get(row.status, set())
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail="That status change isn’t allowed")

    previous = row.status
    row.status = body.status
    row.updated_at = datetime.now(timezone.utc)
    db.add(
        RequestEvent(
            id=str(uuid4()),
            request_id=row.id,
            actor_id=user.id,
            from_status=previous,
            to_status=body.status,
        )
    )
    if row.conversation_id:
        conversation = (
            db.query(Conversation).filter(Conversation.id == row.conversation_id).first()
        )
        db.add(
            Message(
                id=str(uuid4()),
                conversation_id=row.conversation_id,
                sender_id=None,
                kind="system",
                request_id=row.id,
                body=f"{row.business.name} updated the request: {STATUS_LABELS[body.status]}.",
            )
        )
        if conversation:
            conversation.last_message_at = datetime.now(timezone.utc)
    db.add(
        Notification(
            id=str(uuid4()),
            user_id=row.customer_id,
            title=row.title,
            body=f"{row.business.name}: {STATUS_LABELS[body.status]}",
            kind="request",
            request_id=row.id,
        )
    )
    db.commit()
    db.refresh(row)
    return _request_out(row)


@router.get("/saved")
def list_saved(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[str]:
    rows = db.query(SavedBusiness).filter(SavedBusiness.user_id == user.id).all()
    return [row.business_id for row in rows]


@router.put("/saved/{business_id}")
def save_business(
    business_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    existing = (
        db.query(SavedBusiness)
        .filter(
            SavedBusiness.user_id == user.id,
            SavedBusiness.business_id == business_id,
        )
        .first()
    )
    if not existing:
        db.add(SavedBusiness(user_id=user.id, business_id=business_id))
        db.commit()
    return {"saved": True}


@router.delete("/saved/{business_id}")
def unsave_business(
    business_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, bool]:
    db.query(SavedBusiness).filter(
        SavedBusiness.user_id == user.id,
        SavedBusiness.business_id == business_id,
    ).delete()
    db.commit()
    return {"saved": False}


def _can_see(db: Session, user: User, row: ServiceRequest) -> bool:
    if row.customer_id == user.id:
        return True
    return row.business_id in _provider_business_ids(db, user)
