# Auth email & OTP (Supabase)

Sign-up **OTP codes** and password-reset **links** are sent by Supabase Auth, not by the GarageFinder API Gmail service.

API email (invitations, appointment alerts, etc.) uses `EMAIL_SMTP_*` in the **backend** `.env`.

Auth email uses **Supabase project settings**.

## Why OTP / reset mail might not arrive

1. **Default Supabase mail** is rate-limited and often lands in spam.
2. **Custom SMTP is not configured** in the Supabase dashboard.
3. **Confirm email** is enabled but SMTP is empty.

Password **reset** emails contain a **link** (not a 6-digit code). The app opens `/auth/reset-password` from that link. Add `http://localhost:5173/auth/reset-password` and your production URL to Supabase → Authentication → URL Configuration → Redirect URLs.


## Fix: use your Gmail app password in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Authentication** → **SMTP Settings** → enable custom SMTP.
3. Use the same Gmail app password as the backend:

| Field | Value |
|-------|--------|
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `garagefinder007@gmail.com` |
| Password | your Google app password (no spaces) |
| Sender email | `garagefinder007@gmail.com` |
| Sender name | `GarageFinder` |

4. Save, then use **Resend code** on `/auth/verify` or sign up again.

## Dev without OTP

Use seeded test accounts (backend `make seed-accounts`):

| Email | Password |
|-------|----------|
| `customer@garagefinder.test` | `GarageFinderDemo123!` |
| `business@garagefinder.test` | `GarageFinderDemo123!` |
| Your admin email | your existing password |

These are created with `email_confirm: true` — no OTP step.

## Optional: disable email confirmation (dev only)

Supabase → **Authentication** → **Providers** → **Email** → turn off **Confirm email**.

New sign-ups get a session immediately (no verify page).
