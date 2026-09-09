# Orbit

Local services platform. Find a nearby business, message them, get the work done.

## Run locally

Needs Node 20 and Python 3.12.

```bash
nvm use
npm install
npm run dev
```

In a second terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:3000

Demo password: `orbit-dev`

- Customer: ananya@example.com
- Corner Copy: ravi@example.com
- Circuit Bench: meera@example.com

Google sign-in: add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `backend/.env`.
