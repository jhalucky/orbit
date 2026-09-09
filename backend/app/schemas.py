from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["customer", "provider"]
RequestStatus = Literal[
    "PENDING",
    "ACCEPTED",
    "IN_PROGRESS",
    "READY",
    "COMPLETED",
    "CANCELLED",
]


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)
    intent: Role
    business_name: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str
    intent: Role | None = None


class RoleBody(BaseModel):
    role: Role
    business_name: str | None = None


class MeUpdateBody(BaseModel):
    location_id: str | None = None
    active_role: Role | None = None
    lat: float | None = None
    lng: float | None = None


class LocateBody(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    source: Literal["gps", "network"] = "gps"
    accuracy_m: float | None = Field(default=None, ge=0)


class RequestCreateBody(BaseModel):
    business_id: str
    title: str = Field(min_length=2)
    description: str = ""
    conversation_id: str | None = None


class RequestStatusBody(BaseModel):
    status: RequestStatus


class ConversationCreateBody(BaseModel):
    business_id: str


class MessageCreateBody(BaseModel):
    body: str = Field(min_length=1)
    kind: Literal["text"] = "text"


class NeighbourhoodOut(BaseModel):
    id: str
    label: str
    city: str
    lat: float
    lng: float


class CategoryOut(BaseModel):
    id: str
    label: str


class BusinessOut(BaseModel):
    id: str
    slug: str
    name: str
    categoryId: str
    categoryLabel: str
    description: str
    tags: list[str]
    rating: float
    reviewCount: int
    location: dict[str, float]
    neighborhood: str
    address: str
    hours: list[dict[str, Any]]
    typicalResponseMinutes: int
    monogram: str
    mark: str
    distanceKm: float | None = None
    saved: bool = False


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    initials: str
    roles: list[str]
    activeRole: str | None
    locationId: str | None
    location: NeighbourhoodOut | None = None
    lat: float | None = None
    lng: float | None = None
    usingDeviceLocation: bool = False
    locationSource: Literal["gps", "network"] | None = None
    locationAccuracyM: float | None = None
    businessId: str | None = None
    businessName: str | None = None


class RequestOut(BaseModel):
    id: str
    title: str
    description: str
    categoryLabel: str
    businessId: str
    businessName: str
    customerId: str
    customerName: str
    conversationId: str | None
    status: str
    statusLabel: str
    createdAt: datetime
    updatedAt: datetime


class ConversationOut(BaseModel):
    id: str
    businessId: str
    businessName: str
    businessMonogram: str
    customerId: str
    customerName: str
    lastMessage: str | None
    lastMessageAt: datetime
    unread: int = 0


class AttachmentOut(BaseModel):
    id: str
    fileName: str
    contentType: str
    url: str


class MessageOut(BaseModel):
    id: str
    conversationId: str
    senderId: str | None
    senderName: str | None
    mine: bool
    body: str
    kind: str
    requestId: str | None
    createdAt: datetime
    attachments: list[AttachmentOut] = []


class ProviderStatsOut(BaseModel):
    newRequests: int
    inProgress: int
    ready: int
    businessName: str
