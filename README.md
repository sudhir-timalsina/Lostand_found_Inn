# Lost & Found — QR-based Item Tracking

Simple for finders. Powerful for owners. Private by design.

---

## Tech Stack

| Layer      | Tech                                         |
|------------|----------------------------------------------|
| Frontend   | React + Vite, Tailwind CSS, React Router v6  |
| Backend    | Node.js + Express                            |
| Database   | Supabase (PostgreSQL + Auth + Storage)       |
| QR Code    | `qrcode` npm package                         |
| Maps       | Leaflet + react-leaflet                      |
| Email      | Nodemailer + Gmail App Password              |
| Deploy     | Vercel (frontend) + Railway (backend)        |

---

## Quick Start

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the entire contents of [`supabase/schema.sql`](./supabase/schema.sql)
3. Go to **Storage** → Create bucket:
   - Name: `item-photos`
   - Public: ✅
   - Max file size: 5 MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
4. Copy your **Project URL** and **anon key** (Settings → API)
5. Copy your **service_role key** (keep this secret — backend only)

### 2. Gmail App Password

1. Enable 2FA on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Create a password for "Mail"
4. Copy the 16-character password

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in .env with your values
npm install
npm run dev        # http://localhost:4000
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Fill in .env with your Supabase URL and anon key
npm install
npm run dev        # http://localhost:5173
```

---

## Environment Variables

### `frontend/.env`

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:4000
```

### `backend/.env`

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...    # service_role key, never expose publicly
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:5173
PORT=4000
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Push to GitHub, connect repo to Vercel
# Add environment variables in Vercel dashboard
```

### Backend → Railway

1. Create account at [railway.app](https://railway.app)
2. New project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and runs `npm start`

After deploying:
- Update `VITE_API_URL` in frontend to your Railway URL
- Update `FRONTEND_URL` in backend to your Vercel URL
- Rebuild frontend

---

## User Flows

### Owner
1. Register at `/register` → confirm email
2. Sign in at `/login`
3. Register an item at `/items/new` (get QR code)
4. Print/attach QR code to item
5. Mark item as **Lost** if it goes missing
6. Receive email when someone scans it
7. View location on map in `/items/:id`
8. Mark as **Returned** when recovered

### Finder
1. Scan QR code on item (no app needed)
2. See item name and "I Found This Item" button
3. Press button → location shared automatically
4. See thank-you screen
5. Done — no account, no form, no friction

---

## Security

- `helmet()` on all Express responses
- CORS restricted to `FRONTEND_URL` only
- Rate limit: scan endpoint 10 req / 15 min per IP
- Rate limit: auth endpoints 5 req / 15 min per IP
- QR tokens are UUID v4 — non-guessable
- Service role key used server-side only
- RLS on every Supabase table
- Finder data minimisation: no name, no email, location only
- Scan page returns only `name + category + status` — no owner data
This is good!!