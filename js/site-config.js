/**
 * Site-wide settings: navigation, footer links, contact details.
 * For page text and lists, edit js/content.js (SITE_CONTENT).
 *
 * Deploy: push to GitHub → Vercel builds the same static site. No server code required.
 *
 * All form submissions (Contact “Send message”, Admissions “Submit inquiry”, Alumni “Submit registration”)
 * go to ONE inbox via FormSubmit.co — set both emails below to the same address.
 *
 * RECOMMENDED on Vercel: Web3Forms (free, reliable native POST — no JavaScript fetch).
 *   1) Open https://web3forms.com — enter tphalke9@gmail.com → get your Access Key.
 *   2) Paste it into web3formsAccessKey below. Submissions go to that Gmail.
 *   3) Leave web3formsAccessKey empty to use FormSubmit.co instead (see formSubmissionEmail).
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
  /** Paste your key from https://web3forms.com (same inbox as Gmail you register). Leave "" to use FormSubmit only. */
  web3formsAccessKey: "",

  /** Inbox for FormSubmit.co only (when web3formsAccessKey is empty or placeholder). */
  formSubmissionEmail: "tphalke9@gmail.com",
  /** Optional: full https URL to thank-you.html after submit. Leave "" — it is set automatically from your live site (e.g. Vercel). */
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
