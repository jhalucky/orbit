from __future__ import annotations

from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    google_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    active_role: Mapped[str | None] = mapped_column(String, nullable=True)
    location_id: Mapped[str | None] = mapped_column(
        ForeignKey("neighbourhoods.id"),
        nullable=True,
    )
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
    )

    roles: Mapped[list[UserRole]] = relationship(back_populates="user")
    location: Mapped[Neighbourhood | None] = relationship()
    memberships: Mapped[list[BusinessMember]] = relationship(back_populates="user")

    @property
    def initials(self) -> str:
        parts = [part for part in self.name.split() if part]
        if not parts:
            return "?"
        if len(parts) == 1:
            return parts[0][:2].upper()
        return (parts[0][0] + parts[-1][0]).upper()

    @property
    def role_names(self) -> list[str]:
        return [item.role for item in self.roles]


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String)

    user: Mapped[User] = relationship(back_populates="roles")


class Neighbourhood(Base):
    __tablename__ = "neighbourhoods"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    label: Mapped[str] = mapped_column(String)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[str] = mapped_column(Text)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    rating: Mapped[float] = mapped_column(Float, default=0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    neighborhood: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    city: Mapped[str] = mapped_column(String, default="Bengaluru")
    hours: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    typical_response_minutes: Mapped[int] = mapped_column(Integer, default=30)
    monogram: Mapped[str] = mapped_column(String)
    mark: Mapped[str] = mapped_column(String, default="soft")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    category: Mapped[Category] = relationship()
    members: Mapped[list[BusinessMember]] = relationship(back_populates="business")
    services: Mapped[list[Service]] = relationship(back_populates="business")


class BusinessMember(Base):
    __tablename__ = "business_members"
    __table_args__ = (UniqueConstraint("business_id", "user_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[str] = mapped_column(ForeignKey("businesses.id"))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    member_role: Mapped[str] = mapped_column(String, default="owner")

    business: Mapped[Business] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="memberships")


class Service(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    business_id: Mapped[str] = mapped_column(ForeignKey("businesses.id"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    business: Mapped[Business] = relationship(back_populates="services")


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (UniqueConstraint("customer_id", "business_id"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    business_id: Mapped[str] = mapped_column(ForeignKey("businesses.id"))
    last_message_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    customer: Mapped[User] = relationship(foreign_keys=[customer_id])
    business: Mapped[Business] = relationship()
    messages: Mapped[list[Message]] = relationship(
        back_populates="conversation",
        order_by="Message.created_at",
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"))
    sender_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String, default="text")
    request_id: Mapped[str | None] = mapped_column(
        ForeignKey("service_requests.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
    sender: Mapped[User | None] = relationship()
    attachments: Mapped[list[MessageAttachment]] = relationship(
        back_populates="message",
    )


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    message_id: Mapped[str] = mapped_column(ForeignKey("messages.id"))
    file_name: Mapped[str] = mapped_column(String)
    content_type: Mapped[str] = mapped_column(String)
    url: Mapped[str] = mapped_column(String)
    size: Mapped[int] = mapped_column(Integer, default=0)

    message: Mapped[Message] = relationship(back_populates="attachments")


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    customer_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    business_id: Mapped[str] = mapped_column(ForeignKey("businesses.id"))
    conversation_id: Mapped[str | None] = mapped_column(
        ForeignKey("conversations.id"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text, default="")
    category_label: Mapped[str] = mapped_column(String, default="")
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="PENDING", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow,
        onupdate=utcnow,
    )

    customer: Mapped[User] = relationship(foreign_keys=[customer_id])
    business: Mapped[Business] = relationship()
    events: Mapped[list[RequestEvent]] = relationship(back_populates="request")


class RequestEvent(Base):
    __tablename__ = "request_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    request_id: Mapped[str] = mapped_column(ForeignKey("service_requests.id"))
    actor_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    from_status: Mapped[str | None] = mapped_column(String, nullable=True)
    to_status: Mapped[str] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    request: Mapped[ServiceRequest] = relationship(back_populates="events")


class SavedBusiness(Base):
    __tablename__ = "saved_businesses"
    __table_args__ = (UniqueConstraint("user_id", "business_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    business_id: Mapped[str] = mapped_column(ForeignKey("businesses.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String, default="request")
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    request_id: Mapped[str | None] = mapped_column(
        ForeignKey("service_requests.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius = 6371
    d_lat = radians(lat2 - lat1)
    d_lng = radians(lng2 - lng1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lng / 2) ** 2
    )
    return 2 * radius * asin(min(1, sqrt(a)))
