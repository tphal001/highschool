(function () {
  var cfg = typeof window.SITE_CONFIG !== "undefined" ? window.SITE_CONFIG : {};

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function parseJson(attr, fallback) {
    if (!attr || !attr.trim()) return fallback;
    try {
      return JSON.parse(attr);
    } catch (e) {
      console.warn("Invalid JSON attribute:", e);
      return fallback;
    }
  }

  class SiteNavbar extends HTMLElement {
    connectedCallback() {
      var schoolName =
        this.getAttribute("school-name") || cfg.schoolName || "School";
      var logoHref = this.getAttribute("logo-href") || cfg.logoHref || "#";
      var ctaHref = this.getAttribute("cta-href") || cfg.ctaHref || "admissions.html";
      var ctaLabel = this.getAttribute("cta-label") || cfg.ctaLabel || "Apply Now";
      var cta2Href =
        this.getAttribute("cta-secondary-href") || cfg.ctaSecondaryHref || "";
      var cta2Label =
        this.getAttribute("cta-secondary-label") || cfg.ctaSecondaryLabel || "";
      var links = parseJson(this.getAttribute("nav-links"), cfg.navLinks || []);

      var navHtml = links
        .map(function (item) {
          return (
            '<a href="' +
            esc(item.href) +
            '" class="relative transition-colors duration-300 ease-premium after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-school-gold after:transition-all after:duration-300 hover:text-white hover:after:w-full">' +
            esc(item.label) +
            "</a>"
          );
        })
        .join("");

      var ctaGroup =
        '<div class="order-2 flex shrink-0 items-center gap-2 md:order-3">' +
        (cta2Href
          ? '<a href="' +
            esc(cta2Href) +
            '" class="hidden rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-white/10 sm:inline-flex">' +
            esc(cta2Label) +
            "</a>"
          : "") +
        '<a href="' +
        esc(ctaHref) +
        '" class="rounded-full bg-school-gold px-4 py-2.5 text-sm font-semibold text-school-navy shadow-md shadow-amber-900/10 transition duration-300 ease-premium hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-lg sm:px-5">' +
        esc(ctaLabel) +
        "</a>" +
        "</div>";

      this.innerHTML =
        '<header id="site-header" class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-school-navy/90 backdrop-blur-md transition-shadow duration-500 ease-premium">' +
        '<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-5 py-4 sm:px-8 lg:px-10">' +
        '<a href="' +
        esc(logoHref) +
        '" class="order-1 font-display min-w-0 shrink text-base font-bold tracking-tight text-white transition-colors duration-300 hover:text-amber-100 sm:text-lg md:text-xl">' +
        esc(schoolName) +
        "</a>" +
        '<nav class="order-3 flex w-full basis-full flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs font-medium text-slate-300 sm:gap-x-6 sm:text-sm md:order-2 md:w-auto md:basis-auto md:flex-1 md:border-0 md:pt-0 md:gap-6 lg:gap-8" aria-label="Primary">' +
        navHtml +
        "</nav>" +
        ctaGroup +
        "</div>" +
        "</header>";
    }
  }

  class SiteFooter extends HTMLElement {
    connectedCallback() {
      var schoolName =
        this.getAttribute("school-name") || cfg.schoolName || "School";
      var address = this.getAttribute("address") || cfg.address || "";
      var phone = this.getAttribute("phone") || cfg.contactPhone || "";
      var email = this.getAttribute("email") || cfg.contactEmail || "";
      var links = parseJson(this.getAttribute("footer-links"), cfg.footerLinks || []);

      var linksHtml = links
        .map(function (item) {
          return (
            '<a href="' +
            esc(item.href) +
            '" class="transition-colors duration-300 hover:text-white">' +
            esc(item.label) +
            "</a>"
          );
        })
        .join("");

      var contactLines =
        (phone
          ? '<p class="mt-1 text-sm"><a href="tel:' +
            esc(phone.replace(/\s/g, "")) +
            '" class="hover:text-white">' +
            esc(phone) +
            "</a></p>"
          : "") +
        (email
          ? '<p class="mt-1 text-sm"><a href="mailto:' +
            esc(email) +
            '" class="hover:text-white">' +
            esc(email) +
            "</a></p>"
          : "");

      this.innerHTML =
        '<footer id="site-footer" class="border-t border-white/10 bg-school-navy px-5 py-16 text-slate-400 sm:px-8 lg:px-10">' +
        '<div class="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">' +
        "<div>" +
        '<p class="font-display text-xl font-bold text-white">' +
        esc(schoolName) +
        "</p>" +
        '<p class="mt-2 text-sm leading-relaxed">' +
        esc(address) +
        "</p>" +
        contactLines +
        "</div>" +
        '<div class="flex flex-wrap content-start gap-x-8 gap-y-3 text-sm lg:col-span-2">' +
        linksHtml +
        "</div>" +
        "</div>" +
        "</footer>";
    }
  }

  var CARD_ARTICLE_CLASS =
    "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_24px_-4px_rgba(15,23,42,0.08)] transition duration-500 ease-premium hover:-translate-y-1.5 hover:border-amber-200/80 hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.15)]";

  class AnnouncementCard extends HTMLElement {
    connectedCallback() {
      var datetime = this.getAttribute("datetime") || "";
      var dateDisplay = this.getAttribute("date") || "";
      var title = this.getAttribute("title") || "";
      var excerpt = this.getAttribute("excerpt") || "";
      var href = this.getAttribute("href") || "#";
      var readLabel = this.getAttribute("read-label") || "Read more →";

      this.innerHTML =
        '<article class="' +
        CARD_ARTICLE_CLASS +
        '">' +
        '<div class="border-b border-slate-100 bg-slate-50/90 px-6 py-4">' +
        '<time datetime="' +
        esc(datetime) +
        '" class="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">' +
        esc(dateDisplay) +
        "</time>" +
        "</div>" +
        '<div class="flex flex-1 flex-col p-6 sm:p-7">' +
        '<h3 class="font-display text-lg font-semibold text-school-navy transition-colors duration-300 group-hover:text-amber-900">' +
        esc(title) +
        "</h3>" +
        '<p class="mt-3 flex-1 text-sm leading-relaxed text-slate-600">' +
        esc(excerpt) +
        "</p>" +
        '<a href="' +
        esc(href) +
        '" class="mt-6 inline-flex items-center text-sm font-semibold text-amber-800 transition duration-300 group-hover:translate-x-1">' +
        esc(readLabel) +
        "</a>" +
        "</div>" +
        "</article>";
    }
  }

  customElements.define("site-navbar", SiteNavbar);
  customElements.define("site-footer", SiteFooter);
  customElements.define("announcement-card", AnnouncementCard);
})();
