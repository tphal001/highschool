# Decap CMS + GitHub (sign-in for `/admin/`)

The admin UI uses [Decap CMS](https://decapcms.org/) with the **GitHub** backend (see `admin/config.yml`, repo **`tphal001/highschool`**).

## 1. OAuth App on GitHub

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**.
2. **Application name:** e.g. `School site CMS`
3. **Homepage URL:** your live site, e.g. `https://highschool-gold.vercel.app`
4. **Authorization callback URL:** use the URL Decap expects for GitHub backend — see [Decap: GitHub backend](https://decapcms.org/docs/github-backend/) (callback is tied to your deployment URL; often `https://YOUR-DOMAIN/admin/` or the value listed in current Decap docs).
5. Register the app and note the **Client ID** (and **Client Secret** if your setup requires the full server flow).

## 2. Enable the CMS in the repo

- Ensure **`admin/index.html`** and **`admin/config.yml`** are deployed.
- Open **`https://YOUR-DOMAIN/admin/`** and complete GitHub authorization.

## 3. Who can edit

Only GitHub users with **write** access to **`tphal001/highschool`** can publish from the CMS. Invite staff as collaborators or use a **team** / **org** repo with appropriate permissions.

## References

- [Decap CMS documentation](https://decapcms.org/docs/)
- [GitHub backend](https://decapcms.org/docs/github-backend/)
