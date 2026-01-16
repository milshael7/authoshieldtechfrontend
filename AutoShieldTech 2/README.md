# AutoShield Tech (Owner/Admin + Manager + Company + Individual)

AutoShield Tech is a **global-ready cybersecurity operations platform** with an optional automation engine ("AutoProtect")
that helps users work faster **without doing the work for them** unless they have the AutoProtect add-on.

**Public-facing brand:** AutoShield Tech (no “AI” wording in UI/marketing).
**Internal engine name:** AutoProtect.

## Included (deployable)
- Role-based access: Admin, Manager, Company, Individual
- Subscription states: Trial ($19.99), Active, PastDue, Locked
- AutoProtect add-on ($500/mo) logic + gating (starter)
- Company onboarding fields (lite) + member management
- Notification board + email notification placeholders
- Audit logs
- Reports scaffold
- i18n scaffold
- Voice rules: Admin/Manager optional; Users text-only + Read Aloud

## Repo structure
- backend/  Node/Express API (JSON-file persistence)
- frontend/ React (Vite) UI
- docs/    Blueprint

## Local run
Backend:
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Frontend:
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
