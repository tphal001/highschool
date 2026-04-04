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
  /** Small line above the main title (RLMSS-style affiliation line). */
  headerAffiliation: "Committed to excellence in education · Est. 1976",
  /** Short line under the name in the header. */
  tagline: "Excellence in education · Nurturing character",
  /** Shown in the circular crest when logoImageUrl is empty. */
  logoInitials: "DG",
  /** Optional: URL to a PNG/SVG logo; leave "" to use initials badge. */
  logoImageUrl: "",
  address: "Cooper Cricket Ground, Satara-road, Maharashtra 415010",
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
  },
  contactPhone: "+91 20 1234 5678",
  contactEmail: "tphalke9@gmail.com",

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
      text: "Cooper Cricket Ground, Satara-road — Maharashtra 415010.",
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
        { label: "Management", href: "about.html#mission" },
        { label: "Board and Governing Body Members", href: "about.html#board" },
        { label: "Principal Desk", href: "about.html#principal" },
        { label: "Staff", href: "about.html#staff" },
        { label: "Achievers", href: "about.html#achievers" },
        { label: "News", href: "news.html?ctx=events" },
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
      label: "Admission",
      href: "admissions.html",
      children: [
        { label: "Admissions Overview", href: "admissions.html#overview" },
        { label: "Admissions 2025 – 26", href: "admissions.html#inquiry" },
      ],
    },
    {
      id: "events",
      label: "Events",
      href: "news.html?ctx=events",
      children: [
        { label: "Silver Jubilee Year (2021 – 2022)", href: "news.html?ctx=events#evt-silver" },
        { label: "Ashwarohan Mohim", href: "news.html?ctx=events#evt-ashwarohan" },
        { label: "Virangana", href: "news.html?ctx=events#evt-virangana" },
      ],
    },
    {
      id: "results",
      label: "Results",
      href: "news.html?ctx=results",
      children: [
        { label: "SSC Result – March 2024", href: "news.html?ctx=results#res-ssc" },
        { label: "HSC Result – March 2024", href: "news.html?ctx=results#res-hsc" },
      ],
    },
    {
      id: "activity",
      label: "Activity",
      href: "gallery.html?ctx=activity",
      children: [{ label: "2025 – 26", href: "gallery.html?ctx=activity#activity-2026" }],
    },
    {
      id: "gallery",
      label: "Gallery",
      href: "gallery.html?ctx=gallery",
      children: [
        { label: "Photo Gallery", href: "gallery.html?ctx=gallery#photo" },
        { label: "Video Gallery", href: "gallery.html?ctx=gallery#video" },
        {
          label: "रौप्य महोत्सवी वर्षाच्या उद्घाटन सोहळा – १३ जुलै, २०२१",
          href: "gallery.html?ctx=gallery#marathi-1",
        },
        {
          label: "संस्था हीरक महोत्सवी वर्षपूर्ती – प्रशालेत उत्साहात साजरी……",
          href: "gallery.html?ctx=gallery#marathi-2",
        },
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
    { label: "About Us", href: "about.html" },
    { label: "Academics", href: "academics.html" },
    { label: "News", href: "news.html?ctx=events" },
    { label: "Gallery", href: "gallery.html?ctx=gallery" },
    { label: "Alumni", href: "alumni.html" },
    { label: "Admissions", href: "admissions.html" },
    { label: "Fund appeal", href: "fund-appeal.html" },
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
    "Dr. Gadagkar High School, Satararoad has served generations of learners with strong academics, caring staff, and a safe, inspiring campus.",
};
