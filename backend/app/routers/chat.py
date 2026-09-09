from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Business, BusinessMember, Conversation, Message, User
from app.schemas import ConversationCreateBody, MessageCreateBody

router = APIRouter(tags=["chat"])


def _provider_business_ids(db: Session, user: User) -> set[str]:
    return {
        row.business_id
        for row in db.query(BusinessMember).filter(BusinessMember.user_id == user.id)
    }


def _can_access(db: Session, user: User, conversation: Conversation) -> bool:
    if conversation.customer_id == user.id:
        return True
    return conversation.business_id in _provider_business_ids(db, user)


def _conversation_out(row: Conversation, user: User) -> dict:
    last = row.messages[-1] if row.messages else None
    return {
        "id": row.id,
        "businessId": row.business_id,
        "businessName": row.business.name,
        "businessMonogram": row.business.monogram,
        "customerId": row.customer_id,
        "customerName": row.customer.name,
        "lastMessage": last.body if last else None,
        "lastMessageAt": row.last_message_at,
        "unread": 0,
    }


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    query = db.query(Conversation).options(
        selectinload(Conversation.business),
        selectinload(Conversation.customer),
        selectinload(Conversation.messages),
    )
    if user.active_role == "provider":
        ids = _provider_business_ids(db, user)
        query = query.filter(Conversation.business_id.in_(ids or {"__none__"}))
    else:
        query = query.filter(Conversation.customer_id == user.id)
    rows = query.order_by(Conversation.last_message_at.desc()).all()
    return [_conversation_out(row, user) for row in rows]


@router.post("/conversations")
def create_conversation(
    body: ConversationCreateBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    business = db.query(Business).filter(Business.id == body.business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    row = (
        db.query(Conversation)
        .options(
            selectinload(Conversation.business),
            selectinload(Conversation.customer),
            selectinload(Conversation.messages),
        )
        .filter(
            Conversation.customer_id == user.id,
            Conversation.business_id == business.id,
        )
        .first()
    )
    if not row:
        row = Conversation(
            id=str(uuid4()),
            customer_id=user.id,
            business_id=business.id,
        )
        db.add(row)
        db.commit()
        row = (
            db.query(Conversation)
            .options(
                selectinload(Conversation.business),
                selectinload(Conversation.customer),
                selectinload(Conversation.messages),
            )
            .filter(Conversation.id == row.id)
            .one()
        )
    return _conversation_out(row, user)


@router.get("/conversations/{conversation_id}")
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    row = (
        db.query(Conversation)
        .options(
            selectinload(Conversation.business),
            selectinload(Conversation.customer),
            selectinload(Conversation.messages),
        )
        .filter(Conversation.id == conversation_id)
        .first()
    )
    if not row or not _can_access(db, user, row):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _conversation_out(row, user)


@router.get("/conversations/{conversation_id}/messages")
def list_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[dict]:
    row = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not row or not _can_access(db, user, row):
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = (
        db.query(Message)
        .options(selectinload(Message.sender), selectinload(Message.attachments))
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [_message_out(message, user) for message in messages]


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    body: MessageCreateBody,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    row = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not row or not _can_access(db, user, row):
        raise HTTPException(status_code=404, detail="Conversation not found")
    message = Message(
        id=str(uuid4()),
        conversation_id=row.id,
        sender_id=user.id,
        body=body.body.strip(),
        kind=body.kind,
    )
    row.last_message_at = datetime.now(timezone.utc)
    db.add(message)
    db.commit()
    db.refresh(message)
    message.sender = user
    return _message_out(message, user)


def _message_out(message: Message, user: User) -> dict:
    return {
        "id": message.id,
        "conversationId": message.conversation_id,
        "senderId": message.sender_id,
        "senderName": message.sender.name if message.sender else None,
        "mine": message.sender_id == user.id,
        "body": message.body,
        "kind": message.kind,
        "requestId": message.request_id,
        "createdAt": message.created_at,
        "attachments": [
            {
                "id": item.id,
                "fileName": item.file_name,
                "contentType": item.content_type,
                "url": item.url,
            }
            for item in message.attachments
        ],
    }
