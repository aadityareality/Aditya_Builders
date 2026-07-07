# Aditya Builders — Official Website

> **"You Dream it, We Build it. Quality + Time = Aditya"**
>
> Official website for **Aditya Builders**, a trusted construction and real estate company based in Bhavnagar, Gujarat, India with 15+ years of experience and 1000+ satisfied customers.

---

## Tech Stack

| Layer        | Technology                                                          |
|--------------|---------------------------------------------------------------------|
| **Client**   | React 19 (Vite), Tailwind CSS, Framer Motion, React Router v7      |
| **Server**   | Node.js, Express.js (ES Modules), Morgan, Helmet, Express-Rate-Limit |
| **Database** | MongoDB via Mongoose                                                 |
| **Auth**     | JWT + bcryptjs (Phase 3)                                            |
| **Images**   | Cloudinary (Phase 2)                                                |
| **Email**    | Resend.com (Phase 2)                                                |

---

## Project Structure

```
adityabuilders/
├── server/           # Express REST API
│   ├── config/       # DB, Cloudinary, Resend config
│   ├── models/       # Mongoose models (Phase 2)
│   ├── routes/       # API route definitions (Phase 2)
│   ├── controllers/  # Route handlers (Phase 2)
│   ├── middleware/   # Auth, upload, error middleware (Phase 2+)
│   ├── utils/        # Helper functions (Phase 2+)
│   └── server.js     # Express app entry point
└── client/           # React (Vite) SPA
    └── src/
        ├── pages/    # Public route pages
        ├── admin/    # Hidden admin panel (NOT in public nav)
        ├── components/ # Reusable UI components (Phase 2)
        ├── context/  # React context providers (Phase 2+)
        ├── hooks/    # Custom React hooks (Phase 2+)
        └── styles/   # Global CSS & design tokens
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repo-url>
cd adityabuilders
```

### 2. Server Setup

```bash
cd server
npm install

# Create your .env from the example
cp .env.example .env
# → Open .env and fill in MONGO_URI, JWT_SECRET, and all other values
```

### 3. Client Setup

```bash
cd ../client
npm install

# Create your client .env
cp .env.example .env
# → Set VITE_ADMIN_SLUG to a long, private, random slug
```

### 4. Run in Development

**Terminal 1 — Server:**
```bash
cd server
npm run dev
# → Starts on http://localhost:5000
# → Health check: http://localhost:5000/api/health
```

**Terminal 2 — Client:**
```bash
cd client
npm run dev
# → Starts on http://localhost:5173
```

---

## Environment Variables

### Server (`server/.env`)

| Variable                | Description                                     |
|-------------------------|-------------------------------------------------|
| `PORT`                  | Server port (default: 5000)                     |
| `MONGO_URI`             | MongoDB connection string                        |
| `CLIENT_URL`            | Client origin for CORS                           |
| `JWT_SECRET`            | Secret key for signing JWTs                      |
| `JWT_EXPIRES_IN`        | JWT expiry (e.g. `7d`)                           |
| `ADMIN_PANEL_SLUG`      | Private admin slug (reference only in server)    |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name                            |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                            |
| `RESEND_API_KEY`        | Resend API key                                   |
| `RESEND_FROM_EMAIL`     | From address for outgoing emails                 |
| `NOTIFY_EMAIL_TO`       | Email to receive contact form notifications      |

### Client (`client/.env`)

| Variable         | Description                                              |
|------------------|----------------------------------------------------------|
| `VITE_API_URL`   | Server API base URL (e.g. `http://localhost:5000/api`)   |
| `VITE_ADMIN_SLUG`| Private slug for the admin panel route                   |

---

## ⚠️ Admin Panel — Security Note

The admin panel is intentionally **not linked anywhere** in the public UI — no navbar, no footer, no sitemap, no `robots.txt`. It is accessible only by navigating directly to the private URL slug configured via `VITE_ADMIN_SLUG`.

**Before going live:**
- Change `VITE_ADMIN_SLUG` to a long, random, unguessable string (e.g. `/panel-a7f3d9k2m2p1`).
- Never expose this slug in any anchor tag, sitemap, or public-facing page.
- Phase 3 will add full JWT authentication as an additional security layer.

---

## Development Phases

| Phase | Status      | Scope                                                        |
|-------|-------------|--------------------------------------------------------------|
| 1-5   | ✅ Complete | Core MERN modules, pages, contact, database schemas          |
| 6-7   | ✅ Complete | Dynamic settings, Cloudinary upload & Resend attachment flow|
| 8     | ✅ Complete | Production Security, Performance, SEO & Deployment ready     |

---

## Production Deployment Preparation

### Approach A: Integrated Deployment (Single Server)
If you wish to host both client and server on a single host (e.g. Render, Railway, or VPS):
1. Build the client locally or on the host server:
   ```bash
   cd client
   npm run build
   ```
2. The built assets compile into `client/dist/`.
3. Set `NODE_ENV=production` on your server environment.
4. Run `npm start` inside `server/`. The Express backend will host the API endpoints and automatically serve the built static client from `../client/dist` for any non-API routes.

### Approach B: Separated Deployment (Decoupled Static Host + API Host)
If you wish to host the React client on a static CDN provider (like Vercel or Netlify) and the backend API on a separate runtime host (like Render Web Service):
1. **Frontend Deployment**: Configure your CDN to build the project using command `npm run build` with output directory `dist/`. Set `VITE_API_URL` environment variable pointing to your deployed API server URL (e.g. `https://api.adityabuilders.in/api`).
2. **Backend Deployment**: Host the `server/` directory. Set `NODE_ENV=production`, `CLIENT_URL` pointing to your deployed frontend domain (e.g. `https://adityabuilders.in`), and start the server using `npm start`.

---

## 🚀 Going Live Checklist

Follow these checklist items before announcing the site to homebuyers in Bhavnagar:

- [ ] **Production Environment Configurations**: Ensure all server and client `.env` production keys are filled. Never leave test secrets or development database connection strings in place.
- [ ] **CORS Settings Verification**: Ensure the server's `CLIENT_URL` points exactly to the deployed client homepage domain (with no trailing slash), locking access to your domain.
- [ ] **Avoid Data Overwrite (Seed Scripts)**: Re-verify that seed scripts (`npm run seed`) are NOT configured to run automatically in production post-deployment hooks, as it would drop and recreate collections, wiping production leads database data.
- [ ] **Cloudinary & Resend Verification**: Verify that the Resend API key is configured with a verified custom sending domain (e.g. `no-reply@adityabuilders.in` instead of test accounts) to prevent email spam filters.
- [ ] **End-to-End Test Run**: Perform a test lead submission from a mobile phone using the live public site, attaching 2-3 photos. Ensure the success alert fires, the database stores the inquiry, Resend sends the email, and the admin Leads screen highlights the new lead with clickable attachments.
- [ ] **Search Engine Index Blocking**: Check that the `robots.txt` configuration disallows crawler indices from scraping the admin slug endpoint (e.g. `/secure-panel-x9k2`).
- [ ] **Uptime & Health Checks**: Configure a free uptime monitor (e.g. UptimeRobot or Better Stack) pointed directly to `https://<your-api-domain>/api/health` checking response state. Since home buyer leads form submissions directly affect residential property sales volume, ensure the API is fully monitored.

---

*Aditya Builders · Bhavnagar, Gujarat · Instagram: [@adityabuilders_](https://instagram.com/adityabuilders_)*
#   A d i t y a _ B u i l d e r s  
 