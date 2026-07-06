/**
 * Site-wide settings: navigation, footer links, contact details.
 * Page copy and lists are edited in the CMS at /admin/ (content builds from content/cms/).
 *
 * Deploy: push to GitHub → Vercel runs npm run build → site updates.
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
  /** Small line above the school name. */
  headerAffiliation: "Committed to excellence in education · Est. 1976",
  /** Line under the school name in the header. */
  tagline: "Learning with heart · Leading with purpose · Inspiring Futures",
  /** Shown in the circular crest when logoImageUrl is empty. */
  logoInitials: "DG",
  /** School logo in the header (PNG/SVG). Leave "" to use initials badge. */
  logoImageUrl: "/images/logo.png",
  address: "Dr. Gadagkar Highschool, Satararoad, Tal. Koregaon, Dist. Satara - 415010",
  logoHref: "index.html",
  /** Must match the Home nav link href (used for the “vimp” notice modal). */
  homePageHref: "index.html",

  /** Show “Staff content” link in footer → opens Decap CMS at /admin/ */
  cmsShowFooterLink: true,
  /** Path to CMS (no leading slash ok). */
  cmsAdminPath: "admin/index.html",

  /**
   * Flash notice: opens when “Home” is clicked (capture handler avoids same-page reload issues).
   * From other pages, navigation uses index.html#flash-news then opens once; plain index.html visit
   * does not auto-open. Set imageUrl in SITE_CONTENT.flashNews or site-config.js.
   */
  vimpNews: {
    enabled: true,
    imageUrl: "images/flash.jpg",
    imageAlt: "Flash news",
    cacheBust: "v2",
  },
  contactPhone: "02163 299 190",
  contactEmail: "ghschool63@gmail.com",

  /** Top bar (optional). Empty array hides the social column. */
  socialLinks: [
    { label: "Facebook", href: "https://www.facebook.com/" },
    { label: "YouTube", href: "https://www.youtube.com/" },
  ],

  /**
   * Three header call-out boxes (right side on large screens). RLMSS-style bordered cards.
   * title, text, optional href.
   */
  headerInfoBoxes: [
    {
      title: "Admissions",
      text: "Applications for the new academic year — visit Admissions for details.",
      href: "admissions.html",
    },
    {
      title: "News & events",
      text: "Stay updated with campus announcements and key dates.",
      href: "news.html?ctx=events",
    },
    {
      title: "Location",
      text: "Dr. Gadagkar Highschool, Satararoad, Tal. Koregaon, Dist. Satara - 415010.",
      href: "contact.html",
    },
  ],

  /**
   * Nav: RLMSS-style horizontal bar with chevrons + dropdowns. Optional `variant: "gold"` = gold panel.
   * Edit labels/hrefs here. Search icon target: navSearchHref.
   */
  navSearchHref: "news.html?ctx=events",

  navLinks: [
    { label: "Home", href: "index.html" },
    {
      id: "aboutUs",
      label: "About Us",
      href: "about.html",
      children: [
        { label: "About our school", href: "about.html#history" },
        { label: "Mission and Vision", href: "about.html#mission" },
        { label: "Board and Governing Body Members", href: "about.html#board" },
        { label: "Principal Desk", href: "about.html#principal" },
        { label: "Staff", href: "about.html#staff" },
      ],
    },
    {
      id: "campus",
      label: "Campus",
      href: "academics.html",
      children: [
        { label: "Campus and Facilities", href: "academics.html" },
        { label: "Student life on campus", href: "gallery.html?ctx=gallery#student-life" },
        { label: "Events", href: "news.html?ctx=events#events" },
      ],
    },
    {
      id: "admission",
      label: "Admissions",
      href: "admissions.html",
      children: [
        { label: "Overview", href: "admissions.html#overview" },
        { label: "Inquiry form", href: "admissions.html#inquiry" },
      ],
    },
    {
      id: "events",
      label: "Events",
      href: "news.html?ctx=events",
      dynamicChildren: "events",
    },
    {
      id: "results",
      label: "Results",
      href: "news.html?ctx=results",
      dynamicChildren: "results",
    },
    {
      id: "activity",
      label: "Activities",
      href: "gallery.html?ctx=activity",
    },
    {
      id: "gallery",
      label: "Gallery",
      href: "gallery.html?ctx=gallery",
      children: [
        { label: "Photo Gallery", href: "gallery.html?ctx=gallery#photo" },
        { label: "Video Gallery", href: "gallery.html?ctx=gallery#video" },
      ],
    },
    { label: "Contact", href: "contact.html" },
  ],

  /**
   * Related information sidebar: data-page → nav dropdown id. news/gallery use ?ctx= in the URL instead of merging.
   */
  sidebarNavParent: {
    about: "aboutUs",
    academics: "campus",
    admissions: "admission",
  },

  /** Pages with no matching nav group (alumni, contact). Fund appeal has no related links — only fund content in the aside. */
  innerSidebarFallback: {
    alumni: [
      { label: "Alumni", href: "alumni.html" },
      { label: "About our school", href: "about.html#history" },
      { label: "News", href: "news.html?ctx=events" },
    ],
    contact: [
      { label: "Admissions", href: "admissions.html#overview" },
      { label: "News", href: "news.html?ctx=events" },
      { label: "Gallery", href: "gallery.html?ctx=gallery#photo" },
    ],
  },

  /** REQUIRED for forms. Get from https://web3forms.com - leave empty until set (forms show setup instructions). */
  web3formsAccessKey: "0fcbbf69-3552-4c1e-9f97-bba9b7e3daeb",

  /** Optional: full https URL to thank-you.html after submit. Leave "" to auto from current site. */
  formThankYouUrl: "",

  footerLinks: [
    { label: "News", href: "news.html?ctx=events" },
    { label: "Gallery", href: "gallery.html?ctx=gallery" },
    { label: "Contact", href: "contact.html" },
  ],

  /** Second link column in footer (RLMSS multi-column footer). */
  footerSecondaryLinks: [
    { label: "Principal's desk", href: "about.html#principal" },
    { label: "Facilities", href: "academics.html" },
    { label: "Events", href: "news.html?ctx=events" },
  ],

  /** Intro paragraph above quick links (column 1). */
  footerIntro:
    "The school has served generations of learners with strong academics, caring staff, and a safe, inspiring campus.",
};
