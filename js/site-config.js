/**
 * Site-wide settings: navigation, footer links, contact details.
 * For page text and lists, edit js/content.js (SITE_CONTENT).
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
  /** Inbox for all website forms (contact, admissions, alumni). Uses FormSubmit.co — confirm email on first submission. */
  formSubmissionEmail: "tphalke9@gmail.com",
  /** Optional: full URL after successful submit. If empty, a URL to thank-you.html is built from the current page origin. */
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
