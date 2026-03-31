/**
 * Site-wide settings: navigation, footer links, contact details.
 * For page text and lists, edit js/content.js (SITE_CONTENT).
 *
 * Deploy: push to GitHub → Vercel builds the same static site.
 *
 * FORMS (Contact, Admissions, Alumni) — Web3Forms:
 *   1. Go to https://web3forms.com and sign in (use tphalke9@gmail.com if you want mail there).
 *   2. When it asks to “Create a form” / “Add form” — that is normal. Create one form, name it anything
 *      (e.g. “School website”). You are not building the HTML there; we already did in this project.
 *   3. Open that form in the dashboard and copy the Access Key (long string).
 *   4. Paste it into web3formsAccessKey below (quotes, one line).
 *   5. If the dashboard has “Allowed domains” / “Sites”, add highschool-gold.vercel.app (or your domain).
 *   6. Push to GitHub and redeploy Vercel.
 */
window.SITE_CONFIG = {
  schoolName: "Dr. Gadagkar High School, Satararoad",
  address: "Satararoad, Near City Centre · Maharashtra, India — 411001",
  logoHref: "index.html",
  ctaHref: "admissions.html",
  ctaLabel: "Apply Now",
  ctaSecondaryHref: "contact.html",
  ctaSecondaryLabel: "Contact",
  contactPhone: "+91 20 1234 5678",
  contactEmail: "tphalke9@gmail.com",

  /** REQUIRED for forms. Get from https://web3forms.com - leave empty until set (forms show setup instructions). */
  web3formsAccessKey: "0fcbbf69-3552-4c1e-9f97-bba9b7e3daeb",

  /** Optional: full https URL to thank-you.html after submit. Leave "" to auto from current site. */
  formThankYouUrl: "",

  navLinks: [
    { label: "Home", href: "index.html" },
    { label: "About Us", href: "about.html" },
    { label: "Academics", href: "academics.html" },
    { label: "News", href: "news.html" },
    { label: "Gallery", href: "gallery.html" },
    { label: "Alumni", href: "alumni.html" },
    { label: "Admissions", href: "admissions.html" },
    { label: "Contact", href: "contact.html" },
  ],

  footerLinks: [
    { label: "About", href: "about.html" },
    { label: "Academics", href: "academics.html" },
    { label: "News", href: "news.html" },
    { label: "Gallery", href: "gallery.html" },
    { label: "Alumni", href: "alumni.html" },
    { label: "Admissions", href: "admissions.html" },
    { label: "Contact", href: "contact.html" },
  ],
};
