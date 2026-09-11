# Dr. Gadagkar High School — Website Handbook

**For school staff, management, and content editors**

This guide explains how the school website works, what visitors see, and how to update content without editing code.

---

## 1. Quick reference

| Item | Details |
|------|---------|
| **Live website** | [https://www.dghschool.in](https://www.dghschool.in) |
| **Staff content login** | [https://www.dghschool.in/admin/#/](https://www.dghschool.in/admin/#/) |
| **Footer shortcut** | “Staff content” link at the bottom of every page (when enabled) |
| **Sign-in** | GitHub account with access to the school repository |
| **After you Publish** | Changes go live in about **1–3 minutes** (automatic rebuild) |
| **School email (forms)** | ghschool63@gmail.com |
| **School phone** | 02163 299 190 |
| **Website technical support** | Tushar Shankar Phalke — see Contact page “Website developer & maintainer” |

> **Custom domain:** The site can use a school-owned address (e.g. `www.gadagkarhighschool.in`) when the school purchases a domain and connects it to hosting. Until then, the Vercel address above is official.

---

## 2. What the website includes

### Main menu (top navigation)

| Menu | What visitors find |
|------|-------------------|
| **Home** | Welcome area, fund appeal summary, latest updates ticker, announcements, about preview, alumni spotlight, highlights |
| **About Us** | School history, mission & vision, board members, Principal’s Desk, staff |
| **Campus** | Facilities, student life, events |
| **Admissions** | Overview, process, requirements, inquiry form |
| **Events** | Event news and notices (from CMS) |
| **Results** | Result announcements and recognitions |
| **Activities** | Activity photos and captions |
| **Gallery** | Photo albums and video albums (horizontal slideshows) |
| **Contact** | Address, map, contact form, office hours |

### Other important pages

| Page | Purpose |
|------|---------|
| **Alumni** | Success stories and alumni registration form |
| **Fund appeal** | Development fund information and donate link |
| **Thank you** | Shown after a form is submitted successfully |

### Always visible

- **Latest Updates** — scrolling text strip under the main menu (all pages), when lines are added in CMS.
- **Footer** — quick links, campus, admissions, contact details, and optional staff login link.

---

## 3. How content updates work (simple flow)

```
Staff opens /admin/  →  Signs in with GitHub  →  Edits a section  →  Publish
                                                              ↓
                                    Site rebuilds automatically  →  Live in 1–3 min
```

**You do not need to:**

- Edit files on a computer
- Run any commands
- Use FTP or cPanel

**You do need to:**

- Have GitHub login access (granted by the website administrator)
- Click **Publish** after making changes
- Wait a short time, then **refresh** the live site (Ctrl+F5 or hard refresh on mobile)

---

## 4. Logging into the content admin

1. Open **https://www.dghschool.in/admin/#/**
2. Click **Login with GitHub**
3. Approve access if GitHub asks
4. Choose **School content (staff)** in the left panel
5. Open the section you want to edit
6. Make changes
7. Click **Publish** (top of screen)

**First-time setup:** Each editor needs a GitHub account and **write access** to the project repository. Ask the website maintainer to add you as a collaborator.

**If login fails:** The maintainer should check GitHub OAuth settings and Vercel environment variables (technical — see `docs/admin-github.md`).

---

## 5. CMS sections — what to edit and where it appears

All sections are under **School content (staff)** in the admin panel.

### About the school

| CMS section | Appears on website |
|-------------|-------------------|
| **Board and Governing Body Members** | About Us → Board section |
| **Principal’s Desk** | About Us → Leadership (Principal’s photo and message) |
| **Staff** | About Us → Staff list with photos |

### Admissions

| CMS section | Appears on website |
|-------------|-------------------|
| **Admissions** | Admissions page — intro, session label, process steps, requirements |

The **inquiry form** on the Admissions page sends submissions to **ghschool63@gmail.com**.

### News & results

| CMS section | Appears on website |
|-------------|-------------------|
| **Events** | News (Events), Events submenu, Campus → Events |
| **Results** | News (Results), Results submenu |
| **Recognitions** | News → Recognitions section |
| **Notices** | News → Notices |

**Tip:** Newest items appear **first** after Publish. Uncheck **Show in main menu** when an event or result should leave the top menu but stay on the page.

### Home page

| CMS section | Appears on website |
|-------------|-------------------|
| **Latest Updates** | Scrolling ticker under menu (all pages) |
| **Quick Announcements** | Home → announcement cards; “Read more” opens popup |
| **Highlights (posters & popup)** | Home → dark poster cards; popup when opening Home |
| **Alumni spotlight (home page)** | Home → alumni quotes + “Network at a glance” stats |

### Gallery & activities

| CMS section | Appears on website |
|-------------|-------------------|
| **Gallery** | Photo Gallery and Video Gallery pages |
| **Activity** | Activities page |

### Gallery upload (important)

1. Open **Gallery** in CMS  
2. Click **Add album +** (new albums appear at the **top**)  
3. Enter **Title**  
4. Use the blue **Pick photos from your computer** button inside that album row  
5. Select one or many files  
6. **Publish**

Do **not** rely on the default “Choose image” media library for gallery albums — use the blue **Pick photos…** button.

For **videos:** use **Add album +** under video batches and **Pick videos from your computer**.

---

## 6. Highlights — posters and popup

Used for achievements, announcements, alumni meet invites, etc.

### Each highlight item has:

- **Headline** and **accomplishment text** (Marathi or English is fine)
- **Poster photo** — upload a clear portrait or event poster image
- **Active** — turn off to hide without deleting
- **Show on home page** — show as a card on Home
- **Link URL (optional)** — e.g. Google Form; opens in a new tab

### Popup settings (top of Highlights section)

| Setting | Meaning |
|---------|---------|
| **Popup when site opens** | Shows full-screen highlight when someone visits **Home** |
| **Once per browser session** | Popup shows once per visit session (not every page click) |
| **Cache bust** | Change e.g. from `v1` to `v2` when you publish new posters so the popup can show again to returning visitors |

**Note:** Highlights do **not** auto-expire. Turn off **Active** or delete the item when it should come down.

---

## 7. Latest Updates (ticker)

- Short lines of text scrolling under the menu.
- Add lines in **Latest Updates (home ticker)**.
- Newest lines appear first.
- No automatic removal — delete or edit lines when outdated.
- Scroll speed is fixed (~48 seconds per full loop); not editable in CMS.

---

## 8. Forms — where submissions go

All forms send email to **ghschool63@gmail.com** (via Web3Forms).

| Form | Page |
|------|------|
| Contact | Contact → Send a message |
| Admissions inquiry | Admissions → Inquiry |
| Alumni registration | Alumni → Register |

After submit, the visitor sees a **Thank you** page.

**For school office:** Check **ghschool63@gmail.com** (and spam folder) for submissions.

---

## 9. What staff cannot change in CMS

These need the **website maintainer** (technical update):

| Item | Why |
|------|-----|
| Main menu structure and footer layout | Built into site configuration |
| School phone, email, address (header/footer) | Central site settings |
| Fund appeal full page text and payment setup | Not in current CMS menu |
| Alumni page intro and default success stories | Default content file |
| Logo, colours, fonts | Design settings |
| Adding new GitHub editors | Repository access |
| Custom domain and hosting | Vercel / registrar setup |

---

## 10. Tips for good content

### Photos

- Use **JPEG** or **PNG**, reasonably sized (under 2 MB per photo when possible).
- For highlights, **portrait posters** work best (clear text, not blurry).
- For gallery, group photos by **event or album title**.

### Text

- **Headlines:** short and clear.
- **Marathi and English** both work in CMS fields.
- Use line breaks in long text; they will display as paragraphs.

### Events and results

- Publish promptly after exams or events for best impact.
- Add a photo when available — pages look stronger with images.

### When something doesn’t look updated

1. Confirm you clicked **Publish** in CMS  
2. Wait 2–3 minutes  
3. Hard refresh: **Ctrl+Shift+R** (Windows) or clear browser cache on phone  
4. For highlight popup: try **Cache bust** → `v2`, Publish again, open Home in a **new private/incognito** window  

---

## 11. Hosting and domain (for management)

| Topic | Summary |
|-------|---------|
| **Hosting** | Vercel (free tier for normal school traffic) |
| **Code storage** | GitHub — `tphal001/highschool` |
| **SSL (padlock)** | Automatic on Vercel |
| **Recommended next step** | School buys a **.in** domain (~₹500–₹1,500/year) and connects it in Vercel |
| **Usage monitoring** | Vercel dashboard → **Usage** (bandwidth, requests) |

The website maintainer can connect a custom domain without rebuilding the site.

---

## 12. Roles and responsibilities

| Role | Responsibility |
|------|----------------|
| **Principal / office** | Approve content; provide photos and text; manage ghschool63@gmail.com inbox |
| **CMS editors** | Update news, gallery, highlights, admissions text, staff photos |
| **Website maintainer** | GitHub access, login issues, domain, forms setup, design changes, new features |

**Website developer & maintainer (on Contact page):**  
Tushar Shankar Phalke · Class of 2008 · phalke.tushar1@gmail.com · +91 9404650064

For **admissions, fees, or general school enquiries**, use official school phone/email — not the developer personal line.

---

## 13. Quick troubleshooting

| Problem | What to try |
|---------|-------------|
| Cannot log in to /admin/ | Confirm GitHub access; try another browser; contact maintainer |
| Publish button error | Save work (copy text); refresh admin; try again; contact maintainer if image upload failed |
| Gallery upload stuck | Use **Pick photos from your computer** only; publish one album at a time |
| Form not received | Check spam; confirm ghschool63@gmail.com; contact maintainer to verify Web3Forms |
| Old highlight popup still showing | Change **Cache bust** to new value; Publish; open Home in incognito |
| Event missing from menu | Check **Show in main menu** is still on for that event |

---

## 14. Document history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | August 2026 | Initial handbook for Dr. Gadagkar High School website |

---

*This handbook describes the website as built for Dr. Gadagkar High School, Satararoad. For technical documentation, see the `docs/` folder in the project repository.*
