# School content (CMS) — no file editing required for staff

**Repository:** [github.com/tphal001/highschool](https://github.com/tphal001/highschool)

## What staff use

1. Open **`https://YOUR-DOMAIN/admin/`** (e.g. `https://highschool-gold.vercel.app/admin/`).
2. Sign in with **GitHub** (each editor needs access to the repo — see [admin-github.md](admin-github.md)).
3. Edit sections (News, Gallery, Home, Flash news, Alumni, Fund appeal, etc.) and **Publish** — changes are saved as commits to GitHub; **Vercel** redeploys and runs **`npm run build`**.

Footer link **“Staff content”** (optional) also opens the admin. Your site administrator can turn that link on or off in the technical site settings if needed.

---

## One-time setup (developer)

1. Install [Node.js](https://nodejs.org) LTS.
2. Clone: `git clone https://github.com/tphal001/highschool.git`
3. In the project folder:

```bash
npm install
npm run build
npm run seed
```

4. Commit **`content/defaults.json`**, **`content/cms/*.json`**, and the generated **`js/content.js`**.
5. Complete **GitHub OAuth** for Decap so `/admin/` login works — [admin-github.md](admin-github.md).

After that, **staff never touch JSON files** unless you want a fallback; the CMS writes updates for them.

---

## Technical pipeline

- **`content/defaults.json`** — full default copy (created on first `npm run build` if missing).
- **`content/cms/*.json`** — sections edited by Decap (created by `npm run seed`).
- **`npm run build`** — merges CMS files over defaults, normalizes list fields, writes **`js/content.js`**.

---

## Vercel

- **Build command:** `npm run build` (see `vercel.json`).
- **Output:** project root (static site).

---

## If the build fails

- Invalid JSON in `content/cms/*.json` — fix in the CMS or restore from Git.
- See **`admin-github.md`** if `/admin/` login fails.
