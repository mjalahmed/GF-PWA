# Google sign-in (Supabase Auth)

The PWA uses **Google OAuth** as the primary sign-in method. Email/password and OTP are disabled in the UI for now.

## 1. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. **Create credentials** → **OAuth client ID** → type **Web application**.
3. **Authorized JavaScript origins** (add each environment you use):
   - `http://localhost:5173`
   - `https://garage-finder-007.netlify.app` (or your Netlify URL)
4. **Authorized redirect URIs** — add **only** the Supabase callback (not your app URL):

   ```text
   https://smazyodzkizzltmbseci.supabase.co/auth/v1/callback
   ```

   Replace with your project ref from the Supabase dashboard.

5. Copy the **Client ID** and **Client secret**.

## 2. Supabase Dashboard

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Providers** → **Google**.
2. Enable Google and paste **Client ID** and **Client secret**.
3. **Authentication** → **URL configuration**:
   - **Site URL**: `http://localhost:5173` (or production PWA URL when deploying)
   - **Redirect URLs** (allow list):

     ```text
     http://localhost:5173/auth/callback
     http://127.0.0.1:5173/auth/callback
     https://garage-finder-007.netlify.app/auth/callback
     ```

4. Save.

## 3. Test locally

```bash
npm run dev
```

Open http://localhost:5173/sign-in → **Continue with Google**.

After sign-in you should land on `/profile` with a Supabase session. The API uses the same JWT as before.

## Admin / roles

Google creates a new `auth.users` row on first login. To grant **super_admin**:

```bash
cd garagefinder-backend
# supabase/demo/.env → GARAGEFINDER_ADMIN_EMAIL=your@gmail.com
make seed-accounts
```

Or run `scripts/grant-admin.sql` with your Google email.

## Cost

- **Supabase**: Google sign-ins count toward Auth MAU like any login (included in your plan’s MAU limit).
- **Google Cloud**: OAuth client setup is free for normal sign-in volume.

## API transactional email

Invitation and notification emails still use backend `EMAIL_SMTP_*` (Gmail). That is separate from Google **sign-in**.
