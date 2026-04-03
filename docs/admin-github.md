# Decap CMS + GitHub (sign-in for `/admin/`)

The admin UI uses [Decap CMS](https://decapcms.org/) with the **GitHub** backend (`admin/config.yml`, repo **`tphal001/highschool`**).

GitHub login needs a **server-side OAuth step**. This project implements that **on Vercel** with two serverless routes (`api/auth.js`, `api/callback.js`) and URL rewrites so Decap still calls `/auth` and `/callback` on the **same** hostname as the site. You do **not** need Netlify.

## 1. GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Homepage URL:** your live site, e.g. `https://highschool-gold.vercel.app`
3. **Authorization callback URL:** **`https://highschool-gold.vercel.app/callback`**  
   (Must match `base_url` in `admin/config.yml` — same host, path `/callback`.)

If you add a custom domain or use Vercel preview URLs, add **additional** callback URLs in the same GitHub OAuth app (GitHub allows several).

## 2. Environment variables on Vercel

In the Vercel project → **Settings** → **Environment Variables** (Production, and Preview if staff use preview URLs):

| Name | Value |
|------|--------|
| `OAUTH_GITHUB_CLIENT_ID` | From the GitHub OAuth app |
| `OAUTH_GITHUB_CLIENT_SECRET` | From the GitHub OAuth app |

Redeploy after saving.

## 3. Match `base_url` to where you open `/admin/`

In `admin/config.yml`, **`backend.base_url`** must be the **origin** where the CMS runs (no trailing slash), e.g.:

```yaml
base_url: https://highschool-gold.vercel.app
```

If you change the Vercel project name or use a custom domain, update **`base_url`** and the GitHub **callback URL** to match.

## 4. Use the CMS

Open **`https://YOUR-SITE/admin/`** → **Login with GitHub** → editor loads after authorization.

Only GitHub users with **write** access to **`tphal001/highschool`** can publish.

## References

- [Decap: GitHub backend](https://decapcms.org/docs/github-backend/)
- [Decap: `base_url` / `auth_endpoint`](https://decapcms.org/docs/authentication-backends/)
- Community pattern similar to [decap-cms-oauth-vercel](https://github.com/GrassBlock1/decap-cms-oauth-vercel) (OAuth on Vercel)
