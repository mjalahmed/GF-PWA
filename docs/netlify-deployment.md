# Netlify deployment (GarageFinder PWA)

## Remove “Powered by Netlify” for all visitors

Netlify injects this badge on **Free plan public sites** at the edge. It is **not** in your repo.

You need **both** of these for a clean production site:

### 1. Turn it off in Netlify (required)

1. Open [Netlify](https://app.netlify.com) → your **GarageFinder PWA** project  
2. **Project configuration** → **General**  
3. Find **Powered by Netlify badge**  
4. Set to **Off** → **Save**

This takes effect on the next request (no redeploy needed).

### 2. CSP headers (in repo — blocks injection if badge is left on)

This repo sets a strict `Content-Security-Policy` in:

- `netlify.toml`
- `public/_headers` (copied into `dist/` on build)

Per [Netlify docs](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/), a policy without `'unsafe-inline'` in `script-src` prevents the badge script from running.

After deploy, verify headers:

```bash
curl -sI https://app.garagefinder.app/ | grep -i content-security-policy
```

You should see `script-src 'self'` and `frame-src 'none'`.

## Build settings

| Setting | Value |
|---------|--------|
| Build command | `npm run build` |
| Publish directory | `dist` |

Configured in `netlify.toml`.

## Custom domain

Point `app.garagefinder.app` to Netlify and enable HTTPS. Ensure Supabase/Railway CORS includes `https://app.garagefinder.app`.
