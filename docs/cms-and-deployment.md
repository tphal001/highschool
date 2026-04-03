# Deployment (GitHub + Vercel + domain) and CMS

**Repository:** [github.com/tphal001/highschool](https://github.com/tphal001/highschool) (`git clone https://github.com/tphal001/highschool.git`)

You do **not** need a database that the school runs. Editors use the **Decap CMS** at **`/admin/`** (see [cms-run.md](cms-run.md) and [admin-github.md](admin-github.md)). Content is stored as JSON under **`content/cms/`**, merged with **`content/defaults.json`**, and **`npm run build`** generates **`js/content.js`** for the live site.

---

## 1. Hosting flow

1. **Code on GitHub** — [tphal001/highschool](https://github.com/tphal001/highschool).
2. **Vercel** — import the repo; **Build command:** `npm run build` (see `vercel.json`).
3. **Domain** — buy at Namecheap, Porkbun, Cloudflare Registrar, etc.
4. **Connect domain to Vercel** — Project → Settings → Domains; add DNS records at your registrar. SSL is automatic.

---

## 2. Who edits what

| Area | How it is edited |
|------|-------------------|
| News, gallery, home, alumni, fund appeal, flash, about, academics, admissions, contact | **CMS** at `/admin/` → files in `content/cms/` |
| Navigation, footer links, phone, email, Web3Forms key | **`js/site-config.js`** (technical; rare changes) |

---

## 3. Optional: other CMS products

Hosted options (Sanity, Contentful) are still possible if you later want content off-repo; the current setup is **Git + Decap** only.

---

## 4. Forms (contact, admissions)

Forms can use **Web3Forms**; the access key is set in **`js/site-config.js`** (one-time technical setup). See site-config comments for Web3Forms steps.
