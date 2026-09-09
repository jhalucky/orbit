from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import (
    Business,
    BusinessMember,
    Category,
    Conversation,
    Message,
    Neighbourhood,
    SavedBusiness,
    Service,
    ServiceRequest,
    User,
    UserRole,
)
from app.security import hash_password

DEMO_PASSWORD = "orbit-dev"


def week(open_at: str, close_at: str, closed_days: list[int] | None = None) -> list[dict]:
    closed = set(closed_days or [])
    return [
        {
            "day": day,
            "open": open_at,
            "close": close_at,
            "closed": day in closed,
        }
        for day in range(7)
    ]


def seed_if_empty(db: Session) -> None:
    if db.query(User).first():
        return
    seed(db)


def seed(db: Session) -> None:
    now = datetime.now(timezone.utc)

    neighbourhoods = [
        Neighbourhood(id="koramangala", label="Koramangala", city="Bengaluru", lat=12.9352, lng=77.6245),
        Neighbourhood(id="indiranagar", label="Indiranagar", city="Bengaluru", lat=12.9784, lng=77.6408),
        Neighbourhood(id="jayanagar", label="Jayanagar", city="Bengaluru", lat=12.9308, lng=77.5838),
        Neighbourhood(id="hsr", label="HSR Layout", city="Bengaluru", lat=12.9121, lng=77.6446),
        Neighbourhood(id="whitefield", label="Whitefield", city="Bengaluru", lat=12.9698, lng=77.7499),
        make_okhla_neighbourhood(),
    ]
    db.add_all(neighbourhoods)

    categories = [
        Category(id="print-documents", label="Print & Documents", sort_order=1),
        Category(id="repairs", label="Repairs", sort_order=2),
        Category(id="tailoring", label="Tailoring", sort_order=3),
        Category(id="photography", label="Photography", sort_order=4),
        Category(id="home-services", label="Home Services", sort_order=5),
        Category(id="stationery", label="Stationery", sort_order=6),
        Category(id="custom-work", label="Custom Work", sort_order=7),
        Category(id="more", label="More", sort_order=8),
    ]
    db.add_all(categories)

    password = hash_password(DEMO_PASSWORD)

    ananya = User(
        id="user_ananya",
        email="ananya@example.com",
        name="Ananya Sharma",
        password_hash=password,
        active_role="customer",
        location_id="koramangala",
    )
    ravi = User(
        id="user_ravi",
        email="ravi@example.com",
        name="Ravi Menon",
        password_hash=password,
        active_role="provider",
        location_id="koramangala",
    )
    meera = User(
        id="user_meera",
        email="meera@example.com",
        name="Meera Iyer",
        password_hash=password,
        active_role="provider",
        location_id="koramangala",
    )
    kabir = User(
        id="user_kabir",
        email="kabir@example.com",
        name="Kabir Seth",
        password_hash=password,
        active_role="provider",
        location_id="koramangala",
    )
    db.add_all([ananya, ravi, meera, kabir])
    db.add_all(
        [
            UserRole(user_id=ananya.id, role="customer"),
            UserRole(user_id=ravi.id, role="provider"),
            UserRole(user_id=meera.id, role="provider"),
            UserRole(user_id=kabir.id, role="provider"),
        ]
    )

    businesses = [
        Business(
            id="biz_corner_copy",
            slug="corner-copy-and-more",
            name="Corner Copy & More",
            category_id="print-documents",
            description="A neighbourhood print shop that still answers the phone. Documents, copies, and last-minute spiral binds.",
            tags=["Colour print", "B&W", "Binding", "Scanning"],
            rating=4.7,
            review_count=214,
            lat=12.9364,
            lng=77.6229,
            neighborhood="Koramangala 5th Block",
            address="14, 5th Cross, Koramangala, Bengaluru",
            hours=week("08:30", "21:00"),
            typical_response_minutes=8,
            monogram="CC",
            mark="fill",
        ),
        Business(
            id="biz_circuit_bench",
            slug="circuit-bench",
            name="Circuit Bench",
            category_id="repairs",
            description="Phone and laptop repairs without the mall-counter wait. Most screen jobs are done the same afternoon.",
            tags=["Mobiles", "Laptops", "Screens"],
            rating=4.6,
            review_count=189,
            lat=12.9379,
            lng=77.6258,
            neighborhood="Koramangala 6th Block",
            address="218, 80 Feet Road, Koramangala, Bengaluru",
            hours=week("10:00", "20:00", [0]),
            typical_response_minutes=12,
            monogram="CB",
            mark="soft",
        ),
        Business(
            id="biz_hemline",
            slug="hemline",
            name="Hemline",
            category_id="tailoring",
            description="Walk-in tailoring for everyday clothes. Hems, fits, and the odd emergency button.",
            tags=["Alterations", "Stitching", "Uniforms"],
            rating=4.8,
            review_count=96,
            lat=12.9321,
            lng=77.6214,
            neighborhood="Koramangala 4th Block",
            address="7, 4th Main, Koramangala, Bengaluru",
            hours=week("10:30", "19:30", [3]),
            typical_response_minutes=45,
            monogram="HE",
            mark="line",
        ),
        Business(
            id="biz_studio_24",
            slug="studio-24",
            name="Studio 24",
            category_id="photography",
            description="Passport photos, portraits, and a quiet back room for documents that need to look official.",
            tags=["Passport photos", "Portraits"],
            rating=4.5,
            review_count=151,
            lat=12.9392,
            lng=77.6296,
            neighborhood="Koramangala 7th Block",
            address="24, Industrial Layout, Koramangala, Bengaluru",
            hours=week("09:00", "20:00"),
            typical_response_minutes=20,
            monogram="S2",
            mark="fill",
        ),
        Business(
            id="biz_paper_drawer",
            slug="the-paper-drawer",
            name="The Paper Drawer",
            category_id="stationery",
            description="Notebooks, pens, files, and the stationery you always mean to restock.",
            tags=["Notebooks", "Files", "Art supplies"],
            rating=4.4,
            review_count=73,
            lat=12.934,
            lng=77.6188,
            neighborhood="Koramangala 4th Block",
            address="32, 8th Main, Koramangala, Bengaluru",
            hours=week("10:00", "20:30", [0]),
            typical_response_minutes=55,
            monogram="PD",
            mark="soft",
        ),
        Business(
            id="biz_househands",
            slug="househands",
            name="HouseHands",
            category_id="home-services",
            description="Electricians, plumbers, and the person who can look at that loose ceiling fan this week.",
            tags=["Electrical", "Plumbing", "Assembly"],
            rating=4.3,
            review_count=128,
            lat=12.9288,
            lng=77.6304,
            neighborhood="Jakkasandra",
            address="11, 1st Cross, Jakkasandra, Bengaluru",
            hours=week("08:00", "19:00", [0]),
            typical_response_minutes=25,
            monogram="HH",
            mark="line",
        ),
        Business(
            id="biz_forge_form",
            slug="forge-and-form",
            name="Forge & Form",
            category_id="custom-work",
            description="Small-run fabrication. Nameplates, frames, and custom pieces that shouldn’t need a factory.",
            tags=["Nameplates", "Frames", "Acrylic"],
            rating=4.9,
            review_count=41,
            lat=12.9411,
            lng=77.6231,
            neighborhood="Koramangala 6th Block",
            address="9, 3rd Cross, Koramangala, Bengaluru",
            hours=week("11:00", "19:00", [0, 1]),
            typical_response_minutes=120,
            monogram="FF",
            mark="fill",
        ),
        Business(
            id="biz_bindwell",
            slug="bindwell-press",
            name="Bindwell Press",
            category_id="print-documents",
            description="Spiral, thermal, and hard-cover binding. Thesis season is their busy season — message before you visit.",
            tags=["Binding", "Lamination", "Thesis"],
            rating=4.6,
            review_count=88,
            lat=12.9332,
            lng=77.6274,
            neighborhood="Koramangala 8th Block",
            address="41, 80 Feet Road, Koramangala, Bengaluru",
            hours=week("09:00", "20:00", [0]),
            typical_response_minutes=18,
            monogram="BW",
            mark="soft",
        ),
        Business(
            id="biz_quickfix",
            slug="quickfix-mobiles",
            name="QuickFix Mobiles",
            category_id="repairs",
            description="Cracked glass, dying batteries, and stubborn charging ports.",
            tags=["Screens", "Batteries"],
            rating=4.2,
            review_count=210,
            lat=12.9368,
            lng=77.6279,
            neighborhood="Koramangala 7th Block",
            address="105, 7th Main, Koramangala, Bengaluru",
            hours=week("10:00", "21:30"),
            typical_response_minutes=10,
            monogram="QF",
            mark="line",
        ),
        Business(
            id="biz_key_latch",
            slug="key-and-latch",
            name="Key & Latch",
            category_id="more",
            description="Keys cut while you wait. Duplicate house keys, lock work, and a tray of spare fobs.",
            tags=["Key cutting", "Locks"],
            rating=4.7,
            review_count=64,
            lat=12.9314,
            lng=77.6252,
            neighborhood="Koramangala 5th Block",
            address="2, 5th Main, Koramangala, Bengaluru",
            hours=week("09:30", "20:00", [0]),
            typical_response_minutes=15,
            monogram="KL",
            mark="soft",
        ),
        *make_okhla_businesses(),
    ]
    db.add_all(businesses)

    db.add_all(
        [
            BusinessMember(business_id="biz_corner_copy", user_id=ravi.id, member_role="owner"),
            BusinessMember(business_id="biz_circuit_bench", user_id=meera.id, member_role="owner"),
            BusinessMember(business_id="biz_studio_24", user_id=kabir.id, member_role="owner"),
        ]
    )

    db.add_all(
        [
            Service(id="svc_colour", business_id="biz_corner_copy", name="Colour print"),
            Service(id="svc_bind", business_id="biz_corner_copy", name="Binding"),
            Service(id="svc_screen", business_id="biz_circuit_bench", name="Screen replacement"),
            Service(id="svc_passport", business_id="biz_studio_24", name="Passport photos"),
        ]
    )

    db.add(SavedBusiness(user_id=ananya.id, business_id="biz_hemline"))

    conv_copy = Conversation(
        id="conv_ananya_copy",
        customer_id=ananya.id,
        business_id="biz_corner_copy",
        last_message_at=now - timedelta(hours=4),
    )
    conv_bench = Conversation(
        id="conv_ananya_bench",
        customer_id=ananya.id,
        business_id="biz_circuit_bench",
        last_message_at=now - timedelta(hours=3),
    )
    conv_studio = Conversation(
        id="conv_ananya_studio",
        customer_id=ananya.id,
        business_id="biz_studio_24",
        last_message_at=now - timedelta(hours=18),
    )
    db.add_all([conv_copy, conv_bench, conv_studio])

    req_doc = ServiceRequest(
        id="req_document_set",
        customer_id=ananya.id,
        business_id="biz_corner_copy",
        conversation_id=conv_copy.id,
        title="12-page document",
        description="Print 12 pages, black and white, spiral bound. Need it today if possible.",
        category_label="Print & Documents",
        status="PENDING",
        created_at=now - timedelta(hours=5),
        updated_at=now - timedelta(hours=4),
    )
    req_laptop = ServiceRequest(
        id="req_laptop_hinge",
        customer_id=ananya.id,
        business_id="biz_circuit_bench",
        conversation_id=conv_bench.id,
        title="Laptop hinge repair",
        description="Left hinge on a Dell laptop is loose. Still opens, but I don’t want it to snap.",
        category_label="Repairs",
        status="IN_PROGRESS",
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(hours=3),
    )
    req_photos = ServiceRequest(
        id="req_passport_photos",
        customer_id=ananya.id,
        business_id="biz_studio_24",
        conversation_id=conv_studio.id,
        title="Passport photos",
        description="Four Indian passport-size photos, white background.",
        category_label="Photography",
        status="READY",
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(hours=18),
    )
    db.add_all([req_doc, req_laptop, req_photos])

    db.add_all(
        [
            Message(
                id=str(uuid4()),
                conversation_id=conv_copy.id,
                sender_id=ananya.id,
                body="Hi — can you print a 12-page document, B&W, and spiral bind it today?",
                created_at=now - timedelta(hours=5),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_copy.id,
                sender_id=None,
                kind="request",
                request_id=req_doc.id,
                body="Service request: 12-page document",
                created_at=now - timedelta(hours=5, minutes=-1),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_bench.id,
                sender_id=ananya.id,
                body="The left hinge on my laptop is wobbling. Can you look at it this week?",
                created_at=now - timedelta(days=1),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_bench.id,
                sender_id=meera.id,
                body="Bring it in — we can usually tighten or replace a hinge the same afternoon.",
                created_at=now - timedelta(hours=20),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_bench.id,
                sender_id=None,
                kind="system",
                body="Circuit Bench marked this request in progress.",
                created_at=now - timedelta(hours=19),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_studio.id,
                sender_id=ananya.id,
                body="Need four passport photos. Can I come by after 6?",
                created_at=now - timedelta(days=2),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_studio.id,
                sender_id=kabir.id,
                body="Yes. They’re ready — white background, standard size. Collect whenever you’re nearby.",
                created_at=now - timedelta(hours=18),
            ),
            Message(
                id=str(uuid4()),
                conversation_id=conv_studio.id,
                sender_id=None,
                kind="system",
                body="Studio 24 marked this ready for pickup.",
                created_at=now - timedelta(hours=18),
            ),
        ]
    )

    db.commit()


OKHLA_ID = "okhla"


def make_okhla_neighbourhood() -> Neighbourhood:
    return Neighbourhood(
        id=OKHLA_ID,
        label="Okhla Industrial Estate",
        city="New Delhi",
        lat=28.5352,
        lng=77.2734,
    )


def make_okhla_businesses() -> list[Business]:
    return [
        Business(
            id="biz_alps_printers",
            slug="alps-printers",
            name="Alps Printers",
            category_id="print-documents",
            description="Offset press in the DDA sheds. Brochures, stationery, and the commercial jobs Okhla still runs on.",
            tags=["Offset", "Brochures", "Stationery"],
            rating=4.4,
            review_count=38,
            lat=28.5268,
            lng=77.2759,
            neighborhood="Okhla Phase 1",
            address="C-12-13, DDA Sheds, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("10:00", "19:00", [0]),
            typical_response_minutes=40,
            monogram="AP",
            mark="fill",
        ),
        Business(
            id="biz_niyogi_offset",
            slug="niyogi-offset",
            name="Niyogi Offset",
            category_id="print-documents",
            description="Catalogues, calendars, and annual reports. A long-running Phase 1 offset house near the old Airtel office.",
            tags=["Catalogues", "Calendars", "Reports"],
            rating=4.5,
            review_count=29,
            lat=28.5286,
            lng=77.2778,
            neighborhood="Okhla Phase 1",
            address="D-78, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("09:00", "19:00", [0]),
            typical_response_minutes=90,
            monogram="NO",
            mark="soft",
        ),
        Business(
            id="biz_pearl_printers",
            slug="pearl-printers-okhla",
            name="Pearl Printers",
            category_id="print-documents",
            description="Offset printing from C-105 since the late nineties. Short commercial runs and finishing on site.",
            tags=["Offset", "Finishing"],
            rating=4.3,
            review_count=22,
            lat=28.5271,
            lng=77.2785,
            neighborhood="Okhla Phase 1",
            address="C-105, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("09:30", "18:30", [0]),
            typical_response_minutes=60,
            monogram="PP",
            mark="line",
        ),
        Business(
            id="biz_fortune_print",
            slug="fortune-print-service",
            name="Fortune Print Service",
            category_id="print-documents",
            description="Offset and digital jobs on F-25, by the Honda showroom. Visiting cards through to bulk leaflets.",
            tags=["Offset", "Visiting cards", "Leaflets"],
            rating=4.7,
            review_count=41,
            lat=28.5259,
            lng=77.2748,
            neighborhood="Okhla Phase 1",
            address="F-25, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("09:00", "18:30", [0]),
            typical_response_minutes=35,
            monogram="FP",
            mark="fill",
        ),
        Business(
            id="biz_friends_digital",
            slug="friends-digital-color-print-shop",
            name="Friends Digital Color Print Shop",
            category_id="print-documents",
            description="Digital colour print in the FIEE complex. Notebooks, posters, and the small jobs you need the same day.",
            tags=["Digital print", "Posters", "Notebooks"],
            rating=4.2,
            review_count=17,
            lat=28.5359,
            lng=77.2728,
            neighborhood="Okhla Phase 2",
            address="A-43, FIEE Complex, Okhla Industrial Area Phase 2, New Delhi 110020",
            city="New Delhi",
            hours=week("10:00", "19:00", [0]),
            typical_response_minutes=25,
            monogram="FD",
            mark="soft",
        ),
        Business(
            id="biz_aone_copy",
            slug="a-one-enterprises-okhla",
            name="A-One Enterprises",
            category_id="print-documents",
            description="Photocopy, fax, and the Phase 2 copy shop people still walk to between sheds.",
            tags=["Photocopy", "Scanning", "Printouts"],
            rating=4.1,
            review_count=14,
            lat=28.5374,
            lng=77.2746,
            neighborhood="Okhla Phase 2",
            address="A-94/2, Okhla Industrial Area Phase 2, New Delhi 110020",
            city="New Delhi",
            hours=week("09:30", "20:00", [0]),
            typical_response_minutes=12,
            monogram="AO",
            mark="line",
        ),
        Business(
            id="biz_jio_okhla",
            slug="jio-service-centre-okhla",
            name="Jio Service Centre",
            category_id="repairs",
            description="Official Jio walk-in on C-124. Screens, batteries, and device jobs that need a proper service desk.",
            tags=["Mobiles", "Screens", "Batteries"],
            rating=4.0,
            review_count=63,
            lat=28.5294,
            lng=77.2761,
            neighborhood="Okhla Phase 1",
            address="C-124, Ground & 1st Floor, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("10:00", "19:00"),
            typical_response_minutes=30,
            monogram="JI",
            mark="fill",
        ),
        Business(
            id="biz_naresh_paper",
            slug="naresh-paper-bhandar",
            name="Naresh Paper Bhandar",
            category_id="stationery",
            description="Paper merchant in the DSIDC sheds. Reams, boards, gumming sheets, and stock for the presses around you.",
            tags=["Paper", "Boards", "Gumming sheets"],
            rating=4.6,
            review_count=19,
            lat=28.5262,
            lng=77.2772,
            neighborhood="Okhla Phase 1",
            address="52, Ground Floor, DSIDC Sheds, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("10:00", "18:30", [0]),
            typical_response_minutes=50,
            monogram="NP",
            mark="soft",
        ),
        Business(
            id="biz_uni_style",
            slug="uni-style-images",
            name="Uni Style Images",
            category_id="tailoring",
            description="Garment unit on B-237. Sampling, small production runs, and the stitching work Okhla’s apparel sheds are built for.",
            tags=["Sampling", "Stitching", "Apparel"],
            rating=4.3,
            review_count=11,
            lat=28.5302,
            lng=77.2754,
            neighborhood="Okhla Phase 1",
            address="B-237, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("10:00", "18:00", [0]),
            typical_response_minutes=180,
            monogram="US",
            mark="line",
        ),
        Business(
            id="biz_print_plus_okhla",
            slug="print-plus-okhla",
            name="Print Plus",
            category_id="custom-work",
            description="Printed cartons, garment tags, and short-run packaging from a DSIDC shed in Phase 1.",
            tags=["Packaging", "Cartons", "Tags"],
            rating=4.4,
            review_count=16,
            lat=28.5265,
            lng=77.2768,
            neighborhood="Okhla Phase 1",
            address="39, DSIDC Shed, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("09:30", "18:00", [0]),
            typical_response_minutes=120,
            monogram="PL",
            mark="fill",
        ),
        Business(
            id="biz_courtesy_honda",
            slug="courtesy-honda-okhla",
            name="Courtesy Honda",
            category_id="more",
            description="Honda sales and service on the Tughlakabad road. Lally Automobiles’ Okhla workshop for booked jobs and walk-ins.",
            tags=["Car service", "Honda"],
            rating=4.2,
            review_count=88,
            lat=28.5248,
            lng=77.2736,
            neighborhood="Okhla Phase 1",
            address="D-196 & 160, Okhla Industrial Area Phase 1, New Delhi 110020",
            city="New Delhi",
            hours=week("09:00", "18:00", [0]),
            typical_response_minutes=90,
            monogram="CH",
            mark="soft",
        ),
    ]


def ensure_okhla(db: Session) -> None:
    if db.query(Neighbourhood).filter(Neighbourhood.id == OKHLA_ID).first() is None:
        db.add(make_okhla_neighbourhood())
    existing = {item[0] for item in db.query(Business.id).all()}
    for business in make_okhla_businesses():
        if business.id not in existing:
            db.add(business)
    db.flush()
    served = {item[0] for item in db.query(Service.business_id).distinct()}
    for business in make_okhla_businesses():
        if business.id in served:
            continue
        for index, tag in enumerate(business.tags or []):
            db.add(
                Service(
                    id=f"svc_{business.id}_{index}",
                    business_id=business.id,
                    name=tag,
                )
            )
    db.commit()
