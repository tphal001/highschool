/**
 * Site-wide settings: navigation, footer links, contact details.
 * For page text and lists, edit js/content.js (SITE_CONTENT).
 *
 * Deploy: push to GitHub → Vercel builds the same static site.
 *
 * FORMS (Contact, Admissions, Alumni):
 *   FormSubmit.co is NOT used (often shows “web server is down”).
 *   Use Web3Forms — free, works on Vercel:
 *     1. https://web3forms.com — sign up with tphalke9@gmail.com and copy your Access Key.
 *     2. Paste it into web3formsAccessKey below. Submissions go to that Gmail.
 *     3. In Web3Forms dashboard, add your site domain (e.g. highschool-gold.vercel.app) if asked.
 *     4. Push to GitHub and redeploy.
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
  web3formsAccessKey: "",

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
