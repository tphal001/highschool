(function () {
  if (typeof document !== "undefined" && !document.getElementById("site-nav-overflow-fix")) {
    var st = document.createElement("style");
    st.id = "site-nav-overflow-fix";
    st.textContent = "#site-header .site-nav-outer{overflow:visible;}";
    document.head.appendChild(st);
  }

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

  var CHEVRON =
    '<svg class="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>';

  var SEARCH_ICON =
    '<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';

  function buildTopBar() {
    var phone = cfg.contactPhone || "";
    var email = cfg.contactEmail || "";
    var socials = cfg.socialLinks || [];
    var socialParts = socials
      .filter(function (s) {
        return s && (s.href || "").trim();
      })
      .map(function (s) {
        return (
          '<a href="' +
          esc(s.href) +
          '" class="text-amber-100/90 transition hover:text-mes-accentLight" target="_blank" rel="noopener noreferrer">' +
          esc(s.label || "Link") +
          "</a>"
        );
      });
    var socialHtml =
      socialParts.length > 0
        ? '<div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[11px] sm:text-xs">' +
          socialParts.join('<span class="text-white/25" aria-hidden="true">·</span>') +
          "</div>"
        : "";

    return (
      '<div class="border-b border-white/10 bg-mes-topbar text-[11px] text-amber-50/95 sm:text-xs">' +
      '<div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-8 lg:px-10">' +
      '<div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">' +
      (phone
        ? '<a href="tel:' +
          esc(phone.replace(/\s/g, "")) +
          '" class="truncate font-medium hover:text-mes-accentLight">' +
          esc(phone) +
          "</a>"
        : "") +
      (phone && email ? '<span class="text-white/25" aria-hidden="true">|</span>' : "") +
      (email
        ? '<a href="mailto:' +
          esc(email) +
          '" class="hidden max-w-[220px] truncate hover:text-mes-accentLight sm:inline sm:max-w-none">' +
          esc(email) +
          "</a>" +
          '<a href="mailto:' +
          esc(email) +
          '" class="inline font-medium hover:text-mes-accentLight sm:hidden">Email</a>'
        : "") +
      "</div>" +
      socialHtml +
      "</div></div>"
    );
  }

  function buildHeaderInfoBoxes() {
    var boxes = cfg.headerInfoBoxes || [];
    if (!boxes.length) return "";
    var html = boxes
      .slice(0, 3)
      .map(function (b) {
        var inner =
          '<p class="text-[10px] font-bold uppercase tracking-wide text-slate-800 line-clamp-2 sm:text-xs">' +
          esc(b.title || "") +
          "</p>" +
          '<p class="mt-1 text-[10px] leading-snug text-slate-600 line-clamp-3 sm:text-xs">' +
          esc(b.text || "") +
          "</p>";
        var wrap =
          b.href && (b.href + "").trim()
            ? '<a href="' +
              esc(b.href) +
              '" class="relative block h-full border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-mes-accent/50 hover:shadow md:p-3">' +
              '<span class="pointer-events-none absolute right-0 top-0 h-0 w-0 border-l-[10px] border-t-[10px] border-l-transparent border-t-amber-600"></span>' +
              inner +
              "</a>"
            : '<div class="relative h-full border border-slate-200 bg-white p-2.5 shadow-sm md:p-3">' +
              '<span class="pointer-events-none absolute right-0 top-0 h-0 w-0 border-l-[10px] border-t-[10px] border-l-transparent border-t-amber-600"></span>' +
              inner +
              "</div>";
        return '<li class="min-w-0 flex-1 sm:max-w-[11rem] lg:max-w-[12.5rem]">' + wrap + "</li>";
      })
      .join("");
    return (
      '<ul class="mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:max-w-md sm:flex-row sm:justify-end lg:max-w-xl">' +
      html +
      "</ul>"
    );
  }

  /**
   * Main nav only: avoid #fragment (no jump). Put the anchor id in ?sub= so Related information
   * can hide the active submenu; sidebar links still use full # URLs.
   */
  function stripHashAppendSubParam(href) {
    var h = (href || "").trim();
    var hashIdx = h.indexOf("#");
    if (hashIdx === -1) return h;
    var base = h.slice(0, hashIdx);
    var frag = h.slice(hashIdx + 1);
    if (!frag) return base;
    var join = base.indexOf("?") >= 0 ? "&" : "?";
    return base + join + "sub=" + encodeURIComponent(frag);
  }

  function normalizeNavHref(href) {
    var h = (href || "").trim().split("#")[0].split("?")[0].toLowerCase();
    if (h.indexOf("./") === 0) h = h.slice(2);
    return h;
  }

  /** Marks the Home nav link so site.js can open the vimp notice without leaving the page. */
  function isHomeNavItem(item) {
    var vn = cfg.vimpNews;
    if (!vn || !vn.enabled) return false;
    if (item.children && item.children.length) return false;
    var home = normalizeNavHref(cfg.homePageHref || "index.html");
    var href = normalizeNavHref(item.href);
    var label = (item.label || "").trim().toLowerCase();
    if (label === "home") return true;
    if (!href || href === home) return true;
    if (href === "index.html" || /(^|\/)index\.html$/.test(href)) return true;
    return false;
  }

  /**
   * RLMSS-style nav: maroon bar, gold line under bar, white hover tab + chevron, white or gold dropdown.
   * item.variant === "gold" → yellow/gold panel (like "More" on reference site).
   */
  function navItemHtml(item) {
    var children = item.children;
    var isGold = item.variant === "gold";

    if (children && children.length) {
      var triggerHover = isGold
        ? "border-b-[3px] border-transparent bg-transparent text-white transition-colors group-hover:border-mes-goldLine group-hover:bg-mes-accentLight group-hover:text-mes-primaryDark"
        : "border-b-[3px] border-transparent bg-transparent text-white transition-colors group-hover:border-mes-goldLine group-hover:bg-white group-hover:text-mes-primary";

      var panelWrap = isGold
        ? "invisible absolute left-0 top-full z-[70] min-w-[min(100vw-2rem,20rem)] max-w-[min(100vw-2rem,28rem)] overflow-visible rounded-b-lg border-t-2 border-mes-goldLine bg-mes-accentLight py-2 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:opacity-100"
        : "invisible absolute left-0 top-full z-[70] min-w-[min(100vw-2rem,18rem)] max-w-[min(100vw-2rem,28rem)] overflow-visible border-t-2 border-mes-goldLine bg-white py-2 opacity-0 shadow-xl transition duration-150 group-hover:visible group-hover:opacity-100";

      var childClass = isGold
        ? "block px-4 py-2.5 text-sm font-bold leading-snug text-mes-primaryDark hover:bg-amber-200/40"
        : "block px-4 py-2.5 text-sm font-bold leading-snug text-mes-primary hover:bg-mes-light";

      return (
        '<div class="group relative flex h-full min-h-[3rem] items-stretch">' +
        '<a href="' +
        esc(item.href || "#") +
        '" class="flex h-full items-center gap-1 px-2.5 py-3 text-xs font-bold md:px-3 md:text-sm ' +
        triggerHover +
        '">' +
        esc(item.label) +
        CHEVRON +
        "</a>" +
        '<div class="' +
        panelWrap +
        '" role="menu">' +
        children
          .map(function (c) {
            return (
              '<a href="' +
              esc(stripHashAppendSubParam(c.href)) +
              '" class="' +
              childClass +
              '" role="menuitem">' +
              esc(c.label) +
              "</a>"
            );
          })
          .join("") +
        "</div></div>"
      );
    }
    var homeMark = isHomeNavItem(item) ? " js-nav-home-vimp" : "";
    return (
      '<a href="' +
      esc(item.href || "#") +
      '" class="flex h-full min-h-[3rem] items-center border-b-[3px] border-transparent px-2.5 py-3 text-xs font-bold text-white transition hover:border-mes-goldLine hover:bg-white hover:text-mes-primary md:px-3 md:text-sm' +
      homeMark +
      '">' +
      esc(item.label) +
      "</a>"
    );
  }

  function buildNav(links) {
    var items = links
      .map(function (item) {
        return (
          '<li class="flex h-full shrink-0 items-stretch">' + navItemHtml(item) + "</li>"
        );
      })
      .join("");
    var searchHref = (cfg.navSearchHref || "news.html").trim() || "news.html";
    return (
      '<div class="site-nav-outer mx-auto flex max-w-7xl items-stretch justify-between gap-1 px-1 sm:px-3 lg:px-6">' +
      '<nav class="min-w-0 flex-1 overflow-visible" aria-label="Primary navigation">' +
      '<ul class="flex min-w-0 list-none flex-wrap items-stretch justify-center gap-y-1 gap-x-0 md:justify-start">' +
      items +
      "</ul></nav>" +
      '<div class="flex shrink-0 items-center border-l border-white/25 pl-1 sm:pl-2">' +
      '<a href="' +
      esc(searchHref) +
      '" class="flex items-center justify-center p-2.5 text-white transition hover:bg-white/10 hover:text-mes-goldLine" aria-label="Search">' +
      SEARCH_ICON +
      "</a></div></div>"
    );
  }

  function floatingSocialRail() {
    var socials = cfg.socialLinks || [];
    if (!socials.length) return "";
    var colors = ["bg-[#1877f2]", "bg-[#FF0000]", "bg-gradient-to-br from-purple-600 to-pink-500"];
    var items = socials.slice(0, 3).map(function (s, i) {
      return (
        '<a href="' +
        esc(s.href) +
        '" target="_blank" rel="noopener noreferrer" class="flex h-10 w-10 items-center justify-center rounded-l-md text-[10px] font-bold text-white shadow-md transition hover:opacity-90 ' +
        (colors[i] || "bg-slate-600") +
        '" title="' +
        esc(s.label) +
        '">' +
        esc((s.label || "?").charAt(0)) +
        "</a>"
      );
    });
    return (
      '<aside class="pointer-events-none fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-0.5 md:flex" aria-label="Social links">' +
      '<div class="pointer-events-auto flex flex-col">' +
      items.join("") +
      "</div></aside>"
    );
  }

  class SiteNavbar extends HTMLElement {
    connectedCallback() {
      var schoolName =
        this.getAttribute("school-name") || cfg.schoolName || "School";
      var affiliation = this.getAttribute("header-affiliation") || cfg.headerAffiliation || "";
      var tagline = this.getAttribute("tagline") || cfg.tagline || "";
      var address = this.getAttribute("address") || cfg.address || "";
      var logoHref = this.getAttribute("logo-href") || cfg.logoHref || "#";
      var links = parseJson(this.getAttribute("nav-links"), cfg.navLinks || []);

      var initials = (cfg.logoInitials || "S").trim() || "S";
      var logoImg = (cfg.logoImageUrl || "").trim();
      var logoBlock = logoImg
        ? '<img src="' +
          esc(logoImg) +
          '" alt="" class="h-14 w-14 rounded-full border-2 border-slate-200 object-cover shadow-sm sm:h-[4.5rem] sm:w-[4.5rem]" />'
        : '<div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-mes-primary/25 bg-gradient-to-br from-mes-light to-amber-50/50 text-base font-bold text-mes-primary shadow-inner sm:h-[4.5rem] sm:w-[4.5rem] sm:text-lg">' +
          esc(initials) +
          "</div>";

      var infoBoxes = buildHeaderInfoBoxes();

      this.innerHTML =
        '<header id="site-header" class="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white shadow-sm transition-shadow duration-500 ease-premium">' +
        buildTopBar() +
        '<div class="relative bg-gradient-to-r from-mes-light/70 via-white to-white">' +
        '<div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-5 lg:px-10">' +
        '<a href="' +
        esc(logoHref) +
        '" class="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">' +
        logoBlock +
        '<div class="min-w-0 pt-0.5">' +
        (affiliation
          ? '<p class="text-[11px] font-medium leading-snug text-slate-700 sm:text-xs">' +
            esc(affiliation) +
            "</p>"
          : "") +
        '<p class="mt-1 font-display text-lg font-bold leading-tight text-mes-primary sm:text-xl md:text-2xl">' +
        esc(schoolName) +
        "</p>" +
        (tagline
          ? '<p class="mt-1 text-[11px] text-slate-600 sm:text-sm">' + esc(tagline) + "</p>"
          : "") +
        (address
          ? '<p class="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500 sm:text-sm">' +
            esc(address) +
            "</p>"
          : "") +
        "</div></a>" +
        infoBoxes +
        "</div></div>" +
        '<div class="border-b-2 border-mes-goldLine bg-mes-nav overflow-visible">' +
        buildNav(links) +
        "</div>" +
        "</header>" +
        floatingSocialRail();
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
      var links2 = cfg.footerSecondaryLinks || [];
      var intro = cfg.footerIntro || "";
      var y = new Date().getFullYear();

      function linkList(items) {
        return items
          .map(function (item) {
            return (
              '<li><a href="' +
              esc(item.href) +
              '" class="text-sm text-slate-700 transition hover:text-mes-accent">' +
              esc(item.label) +
              "</a></li>"
            );
          })
          .join("");
      }

      var col2 =
        '<div><p class="text-sm font-bold text-slate-900">Quick links</p><ul class="mt-3 space-y-2">' +
        linkList(links) +
        "</ul></div>";

      var col3 =
        links2.length > 0
          ? '<div><p class="text-sm font-bold text-slate-900">Explore</p><ul class="mt-3 space-y-2">' +
            linkList(links2) +
            "</ul></div>"
          : "";

      var gridClass =
        links2.length > 0
          ? "grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          : "grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8";

      var contactBlock =
        '<div><p class="text-sm font-bold text-slate-900">Contact us</p>' +
        (address ? '<p class="mt-3 text-sm leading-relaxed text-slate-600">' + esc(address) + "</p>" : "") +
        (phone
          ? '<p class="mt-2 text-sm"><a href="tel:' +
            esc(phone.replace(/\s/g, "")) +
            '" class="text-mes-accent hover:underline">' +
            esc(phone) +
            "</a></p>"
          : "") +
        (email
          ? '<p class="mt-1 text-sm"><a href="mailto:' +
            esc(email) +
            '" class="text-mes-accent hover:underline">' +
            esc(email) +
            "</a></p>"
          : "") +
        '<div class="mt-4 flex gap-3">' +
        (cfg.socialLinks || [])
          .slice(0, 3)
          .map(function (s) {
            return (
              '<a href="' +
              esc(s.href) +
              '" class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-700 transition hover:border-mes-accent" target="_blank" rel="noopener noreferrer" title="' +
              esc(s.label) +
              '">' +
              esc((s.label || "?").charAt(0)) +
              "</a>"
            );
          })
          .join("") +
        "</div></div>";

      this.innerHTML =
        '<footer id="site-footer" class="border-t border-mes-primary/10 bg-mes-light px-5 py-12 text-slate-700 sm:px-8 lg:px-10">' +
        '<div class="mx-auto max-w-7xl ' +
        gridClass +
        '">' +
        '<div class="sm:col-span-2 lg:col-span-1">' +
        '<p class="font-display text-lg font-bold text-slate-900">' +
        esc(schoolName) +
        "</p>" +
        (intro ? '<p class="mt-3 text-sm leading-relaxed text-slate-600">' + esc(intro) + "</p>" : "") +
        "</div>" +
        col2 +
        col3 +
        contactBlock +
        "</div>" +
        '<p class="mx-auto mt-10 max-w-7xl border-t border-slate-300/80 pt-6 text-center text-xs text-slate-500">' +
        "© " +
        y +
        " " +
        esc(schoolName) +
        ". All rights reserved." +
        (cfg.cmsShowFooterLink && (cfg.cmsAdminPath || "").trim()
          ? '<span class="mx-2 text-slate-300" aria-hidden="true">|</span><a href="' +
            esc((cfg.cmsAdminPath || "admin/index.html").replace(/^\//, "")) +
            '" class="text-slate-400 hover:text-mes-accent">Staff content</a>'
          : "") +
        "</p>" +
        "</footer>";
    }
  }

  var CARD_ARTICLE_CLASS =
    "group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-mes-accent/30 hover:shadow-md";

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
        '<div class="border-b border-slate-100 bg-slate-50/90 px-5 py-3">' +
        '<time datetime="' +
        esc(datetime) +
        '" class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">' +
        esc(dateDisplay) +
        "</time>" +
        "</div>" +
        '<div class="flex flex-1 flex-col p-5">' +
        '<h3 class="text-base font-bold text-mes-primary transition group-hover:underline">' +
        esc(title) +
        "</h3>" +
        '<p class="mt-2 flex-1 text-sm leading-relaxed text-slate-600">' +
        esc(excerpt) +
        "</p>" +
        '<a href="' +
        esc(href) +
        '" class="mt-4 inline-flex text-sm font-semibold text-slate-500 underline decoration-slate-300">' +
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
