# MARG — Dual Login Full-Stack Starter

This version implements the requested two-role structure based on the supplied MARG PDF.

## Source requirements represented
The PDF describes MARG as a bridge between travellers and tourism services; services include smart hotel/transport booking, smart route/destination suggestions, AI-based trip planning, Emergency SOS support and companion traveller details. It also lists AI with budget intelligence, crowd-aware tourism, multilingual support, local community focus and a complete travel ecosystem. The vision/mission focus on smarter, safer, sustainable and personalized travel, connecting travellers with local communities and responsible tourism. The technical approach names HTML5/CSS/JavaScript, AI trip planning, maps/routing APIs, hotel/transport booking APIs, and Node.js/Python with Firebase/PostgreSQL. See the supplied PDF, pages 2–8.

## Two login systems
### Traveller
- `traveller-login.html`
- `traveller-register.html`
- `traveller-dashboard.html`

After traveller login, the traveller dashboard contains:
- AI-based trip planning
- budget field
- interests
- crowd preference / less-crowded option
- published local services
- hotel / transport / experience booking starter
- bookings
- companion traveller details
- SOS
- responsible-travel concepts

### Service Provider
- `provider-login.html`
- `provider-register.html`
- `provider-dashboard.html`

After Service Provider login, the Service Provider dashboard lets a Service Provider publish:
- Hotel
- Artisan
- Food
- Transport
- Experience
- Guide

Each listing has:
- service name
- category
- destination
- price
- capacity
- contact phone
- description
- published/draft status

## Data flow
Service Provider:
`provider-register -> provider-login -> provider-dashboard -> POST /api/services -> PostgreSQL`

Traveller:
`traveller-register -> traveller-login -> traveller-dashboard -> GET /api/services`

Only `published=true` services are public, so when a service provider publishes a service it becomes available to the traveller marketplace.

## Run locally

### Backend
```bash
cd backend
cp .env.example .env
npm install
# Start PostgreSQL yourself or use the docker-compose from the earlier MARG backend package
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
From the frontend folder:
```bash
python -m http.server 8080
```
Open:
`http://localhost:8080`

The frontend defaults to `http://localhost:4000`.
To point it to Render:
```js
localStorage.setItem("marg_api","https://YOUR-RENDER-API.onrender.com")
```
Then reload.

## Render
The backend contains `render.yaml`.
- Build: `npm install && npx prisma generate`
- Pre-deploy: `npx prisma migrate deploy`
- Start: `npm start`
- PostgreSQL is provisioned and connected through `DATABASE_URL`
- Set `CORS_ORIGIN` to the public frontend URL.

## Important production notes
This is a functional starter/prototype, not a finished production travel marketplace. Before accepting real bookings or presenting SOS as a live emergency-response service, add:
- service provider verification/approval
- payment gateway + signed webhooks
- real hotel/transport inventory APIs
- availability locking and cancellation/refund rules
- real maps/routing API
- AI service with server-side API keys
- multilingual localization system
- crowd/real-time tourism data provider
- review moderation and user verification
- notifications
- emergency escalation/monitoring provider
- rate limiting, WAF, audit logs
- secure session/cookie architecture
- privacy/consent/retention controls
- database backups and monitoring
- automated tests and CI/CD


## Admin portal

New pages:
- `frontend/admin-login.html`
- `frontend/admin-dashboard.html`

Admin dashboard sections:
- Dashboard statistics
- Traveller management
- Service Provider approval
- Service/listing management
- Booking monitoring
- SOS/safety center
- Reviews & reports placeholder
- Destinations
- AI trip-planning integration status
- Maps/tourism-data integration status
- Analytics
- Responsible tourism principles

Admin APIs:
- `GET /api/admin/stats`
- `GET /api/admin/users?role=TRAVELER|VENDOR|ADMIN`
- `POST /api/admin/providers/:id/approve`
- `GET /api/admin/services`
- `GET /api/admin/bookings`
- `GET /api/admin/sos`
- `POST /api/admin/sos/:id/resolve`

### Creating the first admin

There is intentionally no public admin registration route. After the first deployment, create a user through a controlled process and set its role in PostgreSQL:

```sql
UPDATE "User"
SET "role" = 'ADMIN'
WHERE "email" = 'admin@example.com';
```

Service Provider accounts are created with `VENDOR` role but are not allowed to publish services until an administrator approves them. The approval endpoint sets `providerApproved=true`.

For a real production deployment, use a controlled seed/operations workflow for the first administrator, add MFA, audit logs, rate limits and stronger session controls.

## OTP authentication

Traveller and Service Provider registration/login now use two-factor OTP verification: an email OTP and an SMS OTP when a phone number is available. Admin login remains password-based.

### Email OTP
Set `RESEND_API_KEY` and `OTP_FROM_EMAIL`. `OTP_FROM_EMAIL` must be a sender/domain allowed by your Resend account.

### SMS OTP
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Phone numbers should be entered in international/E.164 format when required by the SMS provider.

### Render environment variables
Add the OTP variables to the backend Web Service environment. Never put these secrets in the frontend or commit them to GitHub.
