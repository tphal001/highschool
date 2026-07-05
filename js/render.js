(function () {
  var C = typeof window.SITE_CONTENT !== "undefined" ? window.SITE_CONTENT : {};

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /** CMS /images uploads and legacy paths → usable img src */
  function mediaSrc(url) {
    if (url == null || url === "") return "";
    var u = String(url).trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u) || u.indexOf("//") === 0) return u;
    if (u.charAt(0) === "/") return u;
    if (u.indexOf("images/") === 0) return "/" + u;
    return u;
  }

  function formatINR(n) {
    if (n == null || n === "") return "";
    var num = typeof n === "number" ? n : parseFloat(String(n).replace(/[^\d.]/g, ""), 10);
    if (isNaN(num)) return "";
    return "₹" + Math.round(num).toLocaleString("en-IN");
  }

  function shuffleArray(arr) {
    var a = arr.slice();
    var i;
    for (i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  /** Home hero: bulleted quick news, random order, vertical scroll (duplicated block for seamless loop). */
  function buildQuickNewsCardHtml(h) {
    var raw = (h && h.quickNews) || [];
    var lines = [];
    var i;
    for (i = 0; i < raw.length; i++) {
      var x = raw[i];
      var s = typeof x === "string" ? x : (x && (x.text || x.line)) || "";
      if (s) lines.push(s);
    }
    if (!lines.length) {
      lines = ["Add quick news lines in the CMS (Home → Quick news)."];
    } else {
      lines = shuffleArray(lines);
    }
    var liHtml = "";
    for (i = 0; i < lines.length; i++) {
      liHtml += '<li class="text-left">' + esc(lines[i]) + "</li>";
    }
    var ulClass =
      "list-disc space-y-1 pl-4 text-xs leading-snug text-sky-900 marker:text-sky-600";
    var twin =
      '<ul class="' +
      ulClass +
      '">' +
      liHtml +
      "</ul>" +
      '<ul class="motion-reduce:hidden ' +
      ulClass +
      '" aria-hidden="true">' +
      liHtml +
      "</ul>";
    return (
      '<div class="h-[6rem] overflow-hidden rounded-lg border border-mes-primary/15 bg-white/90 px-1 py-1 shadow-inner sm:h-[6.25rem]">' +
      '<div class="animate-marquee-y motion-reduce:animate-none">' +
      twin +
      "</div></div>"
    );
  }

  function fundAppealPageUrl() {
    try {
      if (typeof window !== "undefined" && window.location && window.location.href) {
        return new URL("fund-appeal.html", window.location.href).href;
      }
    } catch (e) {}
    return "fund-appeal.html";
  }

  /** True for absolute http(s) URLs (e.g. payment links); same-tab for relative paths like contact.html */
  function isExternalHref(href) {
    var h = (href || "").trim();
    return /^https?:\/\//i.test(h) || h.indexOf("//") === 0;
  }

  /** fundAppeal.donateHref: use as-is when set. Empty → donate-payment.html */
  function resolveFundAppealDonateHref(fa) {
    var raw = fa && fa.donateHref != null ? String(fa.donateHref).trim() : "";
    if (raw) return raw;
    return "donate-payment.html";
  }

  function thankYouRedirectUrl() {
    var cfg = window.SITE_CONFIG || {};
    var next = (cfg.formThankYouUrl || "").trim();
    if (!next && typeof window !== "undefined" && window.location.protocol !== "file:") {
      try {
        next = new URL("thank-you.html", window.location.href).href;
      } catch (e) {
        next = "";
      }
    }
    return next;
  }

  var WEB3_FORMS_ACTION = "https://api.web3forms.com/submit";

  function web3formsEnabled() {
    var k = (window.SITE_CONFIG && window.SITE_CONFIG.web3formsAccessKey || "").trim();
    if (!k) return false;
    if (/YOUR_|PLACEHOLDER|CHANGE_ME|^xxx/i.test(k)) return false;
    return true;
  }

  /** Hidden fields for Web3Forms (replaces FormSubmit.co — that service often errors or is unreachable). */
  function web3FormHiddenFields(subjectLine) {
    if (!web3formsEnabled()) return "";
    var cfg = window.SITE_CONFIG || {};
    var next = thankYouRedirectUrl();
    var out =
      '<input type="hidden" name="access_key" value="' +
      esc((cfg.web3formsAccessKey || "").trim()) +
      '" />' +
      '<input type="hidden" name="subject" value="' +
      esc(subjectLine) +
      '" />';
    if (next) {
      out += '<input type="hidden" name="redirect" value="' + esc(next) + '" />';
    }
    return out;
  }

  function web3FormsSetupNoticeHtml() {
    var mail = (window.SITE_CONFIG && window.SITE_CONFIG.contactEmail) || "";
    var mailto = mail ? 'mailto:' + esc(mail) : "#";
    return (
      '<div class="rounded-xl border border-mes-accent/50 bg-mes-light p-6 text-mes-primaryDark">' +
      '<p class="font-display text-lg font-semibold text-mes-primary">Set up form delivery (one-time)</p>' +
      '<p class="mt-2 text-sm leading-relaxed">' +
      "This site uses <strong>Web3Forms</strong> to deliver messages to your inbox." +
      "</p>" +
      '<ol class="mt-4 list-decimal space-y-2 pl-5 text-sm">' +
      '<li>Open <a href="https://web3forms.com" class="font-semibold underline" target="_blank" rel="noopener">web3forms.com</a> and create a free access key for your inbox.</li>' +
      "<li>Paste the access key into the site’s Web3Forms setting (your web administrator can update this in the site configuration).</li>" +
      "<li>Push to GitHub and redeploy on Vercel.</li>" +
      "</ol>" +
      (mail
        ? '<p class="mt-4 text-sm">Until then, email <a href="' +
          mailto +
          '" class="font-semibold underline">' +
          esc(mail) +
          "</a> directly.</p>"
        : "") +
      "</div>"
    );
  }

  /** CMS image fields may be a string path or nested object. */
  function resolveMediaField(val) {
    if (val == null || val === "") return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "object") {
      return String(val.url || val.path || val.src || val.image || "").trim();
    }
    return "";
  }

  var ANNOUNCEMENT_CARD_CLASS =
    "site-auto-glass site-card-3d group flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-accent/40 hover:shadow-xl hover:shadow-mes-primary/15 hover:ring-1 hover:ring-mes-accent/20";

  function cardFromData(a) {
    var img = mediaSrc(resolveMediaField(a.image));
    var href = (a.href || "news.html?ctx=events").trim() || "news.html?ctx=events";
    var readLabel = "Read more →";
    var ext = isExternalHref(href);
    var linkTarget = ext ? ' target="_blank" rel="noopener noreferrer"' : "";
    var imageBlock = img
      ? '<a href="' +
        esc(href) +
        '"' +
        linkTarget +
        ' class="announcement-card__media-link block shrink-0 overflow-hidden border-b border-slate-100 bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-inset">' +
        '<div class="announcement-card__media">' +
        '<img src="' +
        esc(img) +
        '" alt="" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]" loading="lazy"/>' +
        "</div></a>"
      : "";
    return (
      '<article class="' +
      ANNOUNCEMENT_CARD_CLASS +
      '">' +
      imageBlock +
      '<div class="shrink-0 border-b border-slate-100 bg-slate-50/90 px-5 py-3 transition-colors duration-300 group-hover:bg-amber-50/60">' +
      '<time datetime="' +
      esc(a.datetime) +
      '" class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">' +
      esc(a.date) +
      "</time></div>" +
      '<div class="flex min-h-0 flex-1 flex-col p-5">' +
      '<h3 class="shrink-0 text-base font-bold text-mes-primary transition-colors duration-200 group-hover:text-mes-primaryDark group-hover:underline">' +
      esc(a.title) +
      "</h3>" +
      '<p class="mt-2 min-h-0 flex-1 text-sm leading-relaxed text-slate-600">' +
      esc(a.excerpt) +
      "</p>" +
      '<a href="' +
      esc(href) +
      '"' +
      linkTarget +
      ' class="mt-auto inline-flex pt-4 text-sm font-semibold text-slate-500 underline decoration-slate-300 transition-colors duration-200 group-hover:text-mes-primary group-hover:decoration-mes-accent">' +
      esc(readLabel) +
      "</a></div></article>"
    );
  }

  function highlightLinkButtons(hn, index) {
    var viewLabel = (hn.linkLabel || "View").trim() || "View";
    var viewBtn =
      '<button type="button" class="js-open-highlight-modal inline-flex items-center gap-2 rounded-full bg-mes-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-mes-primaryDark hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2" data-highlight-index="' +
      index +
      '">' +
      esc(viewLabel) +
      ' <span aria-hidden="true">→</span></button>';
    var url = (hn.linkUrl || hn.linkHref || "").trim();
    var parts = [viewBtn];
    if (url) {
      var ext = isExternalHref(url);
      var urlLabel = (hn.linkUrlLabel || "Open link").trim() || "Open link";
      parts.push(
        '<a href="' +
          esc(url) +
          '"' +
          (ext ? ' target="_blank" rel="noopener noreferrer"' : "") +
          ' class="inline-flex items-center gap-2 rounded-full border border-mes-goldLine/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-mes-goldLine shadow-sm transition hover:border-mes-goldLine hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2">' +
          esc(urlLabel) +
          ' <span aria-hidden="true">↗</span></a>'
      );
    }
    return '<div class="mt-6 flex flex-wrap gap-3">' + parts.join("") + "</div>";
  }

  function buildHighlightCardHtml(hn, index) {
    var img = mediaSrc(resolveMediaField(hn.posterImage));
    var student =
      hn.studentName && hn.studentName.trim()
        ? '<p class="mt-2 font-display text-xl font-bold text-mes-goldLine sm:text-2xl">' +
          esc(hn.studentName) +
          "</p>"
        : "";
    return (
      '<article class="site-highlight-poster site-card-3d overflow-hidden rounded-3xl border border-mes-goldLine/40 bg-gradient-to-br from-mes-nav via-mes-navDeep to-slate-950 shadow-2xl" data-reveal>' +
      '<div class="grid gap-0 lg:grid-cols-2 lg:items-start">' +
      (img
        ? '<div class="site-highlight-poster__media border-b border-mes-goldLine/15 bg-black/25 p-5 sm:p-8 lg:border-b-0 lg:border-r">' +
          '<img src="' +
          esc(img) +
          '" alt="" class="mx-auto w-full max-w-md object-contain object-center lg:max-w-none" loading="lazy"/>' +
          "</div>"
        : "") +
      '<div class="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-10 lg:py-12">' +
      '<h3 class="font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">' +
      esc(hn.headline || "") +
      "</h3>" +
      student +
      '<p class="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">' +
      esc(hn.accomplishment || "") +
      "</p>" +
      highlightLinkButtons(hn, index) +
      "</div></div></article>"
    );
  }

  function getEnabledHighlights() {
    var hl = C.highlights || {};
    var items = hl.items || [];
    return items.filter(function (it) {
      return it && it.enabled !== false;
    });
  }

  /** Poster-style accomplishment blocks on the home page (CMS: Highlights). */
  function renderHomeHighlight() {
    var sec = document.getElementById("home-highlight-section");
    var el = document.getElementById("home-highlight");
    if (!sec || !el) return;
    var homeItems = getEnabledHighlights().filter(function (it) {
      return it.showOnHome !== false;
    });
    if (!homeItems.length) {
      sec.classList.add("hidden");
      return;
    }
    sec.classList.remove("hidden");
    var modalItems = getEnabledHighlights();
    var cards = homeItems
      .map(function (hn) {
        var modalIdx = 0;
        for (var i = 0; i < modalItems.length; i++) {
          if (modalItems[i] === hn || modalItems[i].headline === hn.headline) {
            modalIdx = i;
            break;
          }
        }
        return buildHighlightCardHtml(hn, modalIdx);
      })
      .join("");
    el.innerHTML =
      '<div class="mb-8 sm:mb-10" data-reveal>' +
      '<span class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-mes-primary">' +
      '<span class="text-base leading-none text-mes-accent" aria-hidden="true">★</span> Highlights' +
      "</span></div>" +
      '<div class="site-highlights-stack flex flex-col gap-8 lg:gap-10">' +
      cards +
      "</div>";
  }

  function galleryLightboxButton(imgSrc, alt, caption) {
    return (
      '<button type="button" class="js-gallery-lightbox group block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2" data-lightbox-src="' +
      esc(imgSrc) +
      '" data-lightbox-alt="' +
      esc(alt) +
      '" data-lightbox-caption="' +
      esc(caption || alt) +
      '" aria-label="View full size: ' +
      esc(alt) +
      '">' +
      '<span class="sr-only">View full size</span>'
    );
  }

  function galleryLightboxClose() {
    return "</button>";
  }

  function renderHomePage() {
    var h = C.home;
    if (!h) return;

    var hero = document.getElementById("home-hero");
    if (hero && h.hero) {
      var he = h.hero;
      var accent = he.headlineAccent || "";
      function headlineHtml() {
        var line = he.headline || "";
        if (!accent || line.indexOf(accent) === -1) return esc(line);
        var i = line.indexOf(accent);
        return (
          esc(line.slice(0, i)) +
          '<span class="text-mes-accent">' +
          esc(accent) +
          "</span>" +
          esc(line.slice(i + accent.length))
        );
      }
      var slides = he.slides && he.slides.length ? he.slides : [he.image];
      var firstSlide = slides[0] || he.image || "";
      var fr = h.fundraising || {};
      var crest = ((window.SITE_CONFIG && window.SITE_CONFIG.logoInitials) || "DG").trim().slice(0, 3);
      var fundHref = (fr.href || "fund-appeal.html").trim() || "fund-appeal.html";

      hero.innerHTML =
        '<div class="mx-auto max-w-7xl">' +
        '<div class="grid gap-4 lg:grid-cols-12 lg:items-stretch lg:gap-x-6 lg:gap-y-5">' +
        '<div class="min-w-0 lg:col-span-7 lg:row-start-1">' +
        '<div id="hero-slider" class="site-card-3d relative aspect-[16/10] overflow-hidden rounded-xl border border-white/60 bg-slate-100 shadow-lg transition-all duration-300 ease-out hover:border-mes-accent/25">' +
        '<img id="hero-slide-img" src="' +
        esc(firstSlide) +
        '" alt="' +
        esc(he.imageAlt || "") +
        '" class="h-full w-full object-cover transition-opacity duration-500" loading="eager"/>' +
        '<button type="button" id="hero-prev" class="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50" aria-label="Previous slide">' +
        '<span class="text-lg leading-none" aria-hidden="true">&#8249;</span></button>' +
        '<button type="button" id="hero-next" class="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded border border-white/40 bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50" aria-label="Next slide">' +
        '<span class="text-lg leading-none" aria-hidden="true">&#8250;</span></button>' +
        '<div id="hero-dots" class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"></div>' +
        "</div></div>" +
        '<div class="min-w-0 lg:col-span-7 lg:row-start-2" data-reveal>' +
        '<p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">' +
        esc(he.badge) +
        "</p>" +
        '<h1 class="mt-2 font-display text-2xl font-bold leading-tight text-mes-primary sm:text-3xl md:text-4xl">' +
        headlineHtml() +
        "</h1>" +
        '<p class="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">' +
        esc(he.subtext) +
        "</p>" +
        "</div>" +
        '<div class="min-w-0 lg:col-span-5 lg:row-start-2 flex flex-col justify-start lg:self-end" data-reveal>' +
        '<div class="site-glass site-card-3d rounded-xl border border-mes-primary/15 p-2.5 shadow-sm transition-all duration-300 ease-out hover:border-mes-primary/35">' +
        '<p class="text-[10px] font-bold uppercase tracking-wider text-black">Latest updates</p>' +
        '<div class="mt-1.5">' +
        buildQuickNewsCardHtml(h) +
        "</div>" +
        "</div></div>" +
        '<aside class="flex min-h-0 min-w-0 flex-col lg:col-span-5 lg:row-start-1 lg:h-full">' +
        '<a href="' +
        esc(fundHref) +
        '" class="group flex h-full min-h-0 flex-col rounded-lg focus:outline-none focus:ring-2 focus:ring-mes-primary/40 focus:ring-offset-2" aria-label="Open full fund appeal">' +
        '<div class="site-glass site-card-3d flex min-h-0 flex-1 flex-col rounded-xl border border-mes-primary/10 p-4 shadow-sm transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-mes-primary/40 group-hover:shadow-lg group-hover:shadow-mes-primary/20">' +
        '<div class="shrink-0 border-b border-slate-200 pb-3">' +
        '<h2 class="relative inline-block pb-2 font-display text-lg font-bold text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-14 after:bg-mes-red">' +
        esc(fr.sectionTitle || "Fund raising appeal") +
        "</h2>" +
        "</div>" +
        '<h3 class="mt-4 shrink-0 text-sm font-bold leading-snug text-mes-primary">' +
        esc(fr.title || "") +
        "</h3>" +
        '<div class="relative mt-3 min-h-[6rem] flex-1 overflow-hidden rounded-md border border-slate-200 bg-white lg:min-h-0">' +
        '<img src="' +
        esc(fr.image || he.image) +
        '" alt="" class="absolute inset-0 h-full w-full object-cover" loading="lazy"/>' +
        (fr.amount
          ? '<div class="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow">' +
            esc(fr.amount) +
            "</div>"
          : "") +
        "</div>" +
        '<div class="mt-3 flex shrink-0 items-center gap-2 text-xs text-slate-600">' +
        '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">' +
        esc(crest) +
        "</span>" +
        "<span>" +
        esc(fr.footerLine || "") +
        '</span></div><p class="mt-3 shrink-0 text-xs font-semibold text-mes-accent group-hover:underline">View full appeal →</p>' +
        "</div></a></aside></div></div>";
    }

    renderHomeHighlight();

    var leg = document.getElementById("home-legacy");
    if (leg && h.legacy) {
      var l = h.legacy;
      leg.innerHTML =
        '<div class="absolute inset-0 bg-gradient-to-r from-mes-nav via-mes-navDeep to-mes-nav bg-[length:200%_100%] animate-gradient-shift motion-reduce:animate-none"></div>' +
        '<div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>' +
        '<div class="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 px-4 py-8 text-center sm:flex-row sm:gap-10 sm:px-8 sm:py-10 lg:px-10" data-reveal>' +
        '<span class="font-display shrink-0 rounded-full border border-mes-goldLine/60 bg-mes-navDeep/80 px-5 py-2 text-sm font-bold tracking-wide text-white shadow-lg sm:text-base">' +
        esc(l.badge) +
        "</span>" +
        '<p class="max-w-2xl text-sm font-medium leading-relaxed text-white/95 sm:text-base md:text-lg"><span class="font-semibold text-mes-goldLine">' +
        esc(l.title) +
        "</span> — " +
        esc(l.line) +
        "</p>" +
        '<a href="' +
        esc(l.linkHref) +
        '" class="shrink-0 text-sm font-semibold text-white underline decoration-mes-goldLine/80 underline-offset-[6px] transition duration-300 hover:text-mes-goldLine">' +
        esc(l.linkLabel) +
        "</a>" +
        "</div>";
    }

    var qa = document.getElementById("home-quick-announcements");
    if (qa && C.quickAnnouncements) {
      var items = C.quickAnnouncements.slice(0, 3);
      qa.innerHTML = items
        .map(function (a, i) {
          var span = i === 2 ? "sm:col-span-2 lg:col-span-1 " : "";
          return (
            '<li class="' +
            span +
            'flex h-full min-h-0 flex-col" data-reveal>' +
            cardFromData(a) +
            "</li>"
          );
        })
        .join("");
    }

    var ap = document.getElementById("home-about-preview");
    if (ap && h.aboutPreview) {
      var b = h.aboutPreview;
      ap.innerHTML =
        '<div class="grid gap-12 lg:grid-cols-2 lg:items-center">' +
        '<div data-reveal>' +
        '<div class="border-b border-slate-200 pb-2">' +
        '<h2 class="relative inline-block pb-2 font-display text-3xl font-bold tracking-tight text-mes-primary sm:text-4xl after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-20 after:bg-mes-red">' +
        esc(b.title) +
        "</h2></div>" +
        '<p class="mt-4 text-lg font-medium text-mes-accent">' +
        esc(b.subtitle) +
        "</p>" +
        b.paragraphs
          .map(function (p) {
            return '<p class="mt-4 text-lg leading-relaxed text-slate-600">' + esc(p) + "</p>";
          })
          .join("") +
        '<a href="' +
        esc(b.linkHref) +
        '" class="mt-8 inline-flex font-semibold text-mes-accent hover:underline">' +
        esc(b.linkLabel) +
        " →</a>" +
        "</div>" +
        '<div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-2xl ring-1 ring-white/60 site-card-3d" data-reveal>' +
        '<img src="' +
        esc(C.home.hero.image) +
        '" alt="" class="h-full w-full object-cover" loading="lazy"/>' +
        "</div>" +
        "</div>";
    }

    var als = document.getElementById("home-alumni-spotlight");
    if (als && h.alumniSpotlight) {
      var al = h.alumniSpotlight;
      var st = al.story;
      var statsHtml = (al.stats || [])
        .map(function (s) {
          return (
            "<div><dt class=\"text-sm font-medium uppercase tracking-wider text-slate-400\">" +
            esc(s.label) +
            '</dt><dd class="mt-2 font-display text-3xl font-bold text-mes-accent">' +
            esc(s.value) +
            "</dd></div>"
          );
        })
        .join("");
      var photoUrl = st && st.photo != null ? mediaSrc(st.photo) : "";
      var avatarBlock =
        photoUrl !== ""
          ? '<img src="' +
            esc(photoUrl) +
            '" alt="" class="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-mes-primary/25 shadow-sm" loading="lazy"/>'
          : '<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mes-primary to-mes-primaryDark text-lg font-bold text-mes-accent">' +
            esc(st.initials) +
            "</div>";
      als.innerHTML =
        '<div class="mx-auto max-w-3xl text-center" data-reveal>' +
        '<h2 class="relative inline-block pb-2 font-display text-3xl font-bold tracking-tight text-mes-primary sm:text-4xl after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-24 after:-translate-x-1/2 after:bg-mes-red">' +
        esc(al.sectionTitle) +
        "</h2>" +
        '<p class="mt-5 text-lg leading-relaxed text-slate-600">' +
        esc(al.sectionSubtitle) +
        "</p>" +
        "</div>" +
        '<div class="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16" data-reveal-stagger>' +
        '<blockquote data-reveal class="site-auto-glass site-card-3d group rounded-2xl border border-slate-200/90 p-8 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-accent/35 hover:shadow-xl hover:shadow-mes-primary/10 sm:p-10">' +
        '<p class="text-lg leading-relaxed text-slate-700 sm:text-xl">“' +
        esc(st.quote) +
        '”</p>' +
        '<footer class="mt-8 flex items-center gap-5">' +
        avatarBlock +
        "<div>" +
        '<cite class="not-italic text-lg font-semibold text-mes-primary">' +
        esc(st.name) +
        "</cite>" +
        '<p class="mt-1 text-sm text-slate-600">' +
        esc(st.role) +
        "</p>" +
        "</div>" +
        "</footer>" +
        "</blockquote>" +
        '<div data-reveal class="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-mes-primary via-mes-primaryDark to-slate-900 p-10 text-white shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-goldLine/40 hover:shadow-2xl hover:shadow-black/30 sm:p-12">' +
        '<h3 class="font-display text-xl font-bold text-white">Network at a glance</h3>' +
        '<dl class="mt-8 grid grid-cols-2 gap-8">' +
        statsHtml +
        "</dl>" +
        '<a href="' +
        esc(al.linkHref) +
        '" class="mt-10 inline-flex w-full items-center justify-center rounded-full bg-mes-accent py-4 text-base font-semibold text-mes-primaryDark transition hover:bg-mes-accentLight sm:w-auto sm:px-10">' +
        esc(al.linkLabel) +
        "</a>" +
        "</div>" +
        "</div>";
    }
  }

  function getPageCtx(defaultCtx) {
    try {
      var v = (new URLSearchParams(window.location.search || "").get("ctx") || defaultCtx).toLowerCase();
      return v;
    } catch (e) {
      return defaultCtx;
    }
  }

  function renderMemberCards(members, opts) {
    opts = opts || {};
    if (!members || !members.length) return "";
    return (
      '<ul class="mt-6 grid gap-4 sm:grid-cols-2">' +
      members
        .map(function (m) {
          var photo = (m.photo || "").trim();
          var photoHtml = photo
            ? '<img src="' +
              esc(mediaSrc(photo)) +
              '" alt="" class="h-16 w-16 shrink-0 rounded-full object-cover" loading="lazy"/>'
            : '<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-mes-primary/10 text-lg font-bold text-mes-primary">' +
              esc((m.name || "?").charAt(0)) +
              "</div>";
          return (
            '<li class="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">' +
            photoHtml +
            '<div class="min-w-0"><p class="font-semibold text-mes-primary">' +
            esc(m.name) +
            "</p>" +
            (m.role ? '<p class="text-sm text-mes-accent">' + esc(m.role) + "</p>" : "") +
            (opts.department && m.department
              ? '<p class="mt-1 text-sm text-slate-600">' + esc(m.department) + "</p>"
              : "") +
            "</div></li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function renderAboutPage() {
    var el = document.getElementById("page-about");
    if (!el || !C.about) return;
    var a = C.about;
    el.innerHTML =
      '<section id="history" class="scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-3xl font-bold text-mes-primary">Our history</h2>' +
      '<p class="mt-2 text-lg text-mes-accent">Since <strong>' +
      esc(String(a.history.sinceYear)) +
      "</strong> — more than 50 years of excellence.</p>" +
      '<div class="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">' +
      a.history.paragraphs.map(function (p) {
        return "<p>" + esc(p) + "</p>";
      }).join("") +
      "</div></section>" +
      '<section id="mission" class="mt-16 scroll-mt-52 grid gap-10 md:grid-cols-2" data-reveal>' +
      "<div>" +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">' +
      esc(a.mission.title) +
      "</h2>" +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc(a.mission.text) +
      "</p></div>" +
      "<div>" +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">' +
      esc(a.vision.title) +
      "</h2>" +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc(a.vision.text) +
      "</p></div></section>" +
      '<section id="board" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Board and Governing Body Members</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc((a.board && a.board.intro) || "Governance details can be published here when available.") +
      "</p>" +
      renderMemberCards(a.board && a.board.members) +
      "</section>" +
      '<section id="principal" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Leadership</h2>' +
      '<div class="mt-8 flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:flex-row md:items-start md:gap-10 lg:gap-12">' +
      '<div class="flex w-full shrink-0 flex-col items-center md:w-56 md:items-start lg:w-64">' +
      '<img src="' +
      esc(mediaSrc(a.principal.photo)) +
      '" alt="' +
      esc(a.principal.name) +
      '" class="h-48 w-48 rounded-2xl object-cover shadow-sm" loading="lazy"/>' +
      '<h3 class="mt-4 w-full text-center font-display text-xl font-bold leading-snug text-mes-primary md:text-left">' +
      esc(a.principal.name) +
      "</h3>" +
      '<p class="mt-1 w-full text-center text-base font-medium text-mes-accent md:text-left">' +
      esc(a.principal.title) +
      "</p>" +
      "</div>" +
      '<div class="min-w-0 flex-1 border-t border-slate-100 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0 lg:pl-12">' +
      '<div class="space-y-3 text-lg leading-relaxed text-slate-600">' +
      a.principal.message
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("") +
      "</div></div></div></section>" +
      '<section id="staff" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Staff</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc((a.staff && a.staff.intro) || "Faculty and staff listings can be added when ready.") +
      "</p>" +
      renderMemberCards(a.staff && a.staff.members, { department: true }) +
      "</section>" +
      '<section id="achievers" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Achievers</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      "Student achievements and honours can be listed here when ready." +
      "</p></section>";
  }

  function renderAcademicsPage() {
    var el = document.getElementById("page-academics");
    if (!el || !C.academics) return;
    var a = C.academics;
    el.innerHTML =
      '<p class="text-xl leading-relaxed text-slate-600" data-reveal>' +
      esc(a.intro) +
      "</p>" +
      '<div class="mt-12 space-y-10" data-reveal-stagger>' +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-mes-primary">Programs offered</h2><div class="mt-6 grid gap-6 md:grid-cols-3">' +
      a.programs
        .map(function (p) {
          return (
            '<div class="rounded-xl border border-slate-200 bg-mes-light/50 p-6"><h3 class="font-semibold text-mes-primary">' +
            esc(p.title) +
            '</h3><p class="mt-2 text-slate-600">' +
            esc(p.text) +
            "</p></div>"
          );
        })
        .join("") +
      "</div></section>" +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-mes-primary">Curriculum</h2><ul class="mt-4 list-inside list-disc space-y-2 text-lg text-slate-600">' +
      a.curriculum
        .map(function (c) {
          return "<li>" + esc(c) + "</li>";
        })
        .join("") +
      "</ul></section>" +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-mes-primary">Facilities</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2">' +
      a.facilities
        .map(function (f) {
          return (
            '<li class="flex items-center gap-2 text-slate-700"><span class="text-mes-accent">✓</span> ' +
            esc(f) +
            "</li>"
          );
        })
        .join("") +
      "</ul></section></div>";
  }

  function renderNewsPage() {
    var el = document.getElementById("page-news");
    if (!el || !C.news) return;
    var n = C.news;
    var ctx = getPageCtx("events");

    function eventImageHtml(x) {
      var src = x && x.image ? mediaSrc(x.image) : "";
      if (!src) return "";
      return (
        '<img src="' +
        esc(src) +
        '" alt="" class="mt-3 max-h-40 w-full rounded-lg border border-slate-200 object-cover" loading="lazy"/>'
      );
    }

    function itemRow(x) {
      return (
        '<li class="border-b border-slate-100 py-4 last:border-0">' +
        '<time class="text-xs font-semibold uppercase tracking-wide text-mes-primary">' +
        esc(x.displayDate) +
        '</time><h3 class="mt-1 font-display text-lg font-semibold text-mes-primary">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p>" +
        eventImageHtml(x) +
        "</li>"
      );
    }
    function itemRowWithId(x, anchorId) {
      var idPart = anchorId
        ? ' id="' + esc(anchorId) + '" class="scroll-mt-32 border-b border-slate-100 py-4 last:border-0"'
        : ' class="border-b border-slate-100 py-4 last:border-0"';
      return (
        "<li" +
        idPart +
        ">" +
        (x.displayDate
          ? '<time class="text-xs font-semibold uppercase tracking-wide text-mes-primary">' +
            esc(x.displayDate) +
            "</time>"
          : "") +
        '<h3 class="mt-1 font-display text-lg font-semibold text-mes-primary">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p>" +
        eventImageHtml(x) +
        "</li>"
      );
    }

    if (ctx === "results") {
      var results = n.results || [];
      el.innerHTML =
        '<div id="results" class="scroll-mt-52"></div>' +
        '<p class="text-xl text-slate-600" data-reveal>Examination results and official announcements.</p>' +
        '<div class="mt-12 grid gap-6 sm:grid-cols-2" data-reveal-stagger>' +
        results
          .map(function (x) {
            var anchor = (x.anchorId || "").trim();
            var idAttr = anchor ? ' id="' + esc(anchor) + '" class="scroll-mt-52 rounded-xl border border-slate-200 bg-mes-light/50 p-5 text-sm text-slate-700"' : ' class="rounded-xl border border-slate-200 bg-mes-light/50 p-5 text-sm text-slate-700"';
            var imgSrc = x.image ? mediaSrc(x.image) : "";
            var imgHtml = imgSrc
              ? '<img src="' +
                esc(imgSrc) +
                '" alt="" class="mt-3 max-h-36 w-full rounded-lg border border-slate-200 object-cover" loading="lazy"/>'
              : "";
            return (
              "<div" +
              idAttr +
              ">" +
              '<strong class="font-display text-mes-primary">' +
              esc(x.title) +
              "</strong>" +
              '<p class="mt-2">' +
              esc(x.summary) +
              "</p>" +
              imgHtml +
              "</div>"
            );
          })
          .join("") +
        "</div>";
      return;
    }

    var evtAnchors = ["evt-silver", "evt-ashwarohan", "evt-virangana"];
    el.innerHTML =
      '<div id="events" class="scroll-mt-52"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(n.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-3" data-reveal-stagger>' +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Events</h2><ul class="mt-4">' +
      (n.events || [])
        .map(function (x, i) {
          var anchor = (x.anchorId || "").trim() || evtAnchors[i] || "";
          return itemRowWithId(x, anchor);
        })
        .join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Circulars</h2><ul class="mt-4">' +
      (n.circulars || []).map(itemRow).join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Notices</h2><ul class="mt-4">' +
      (n.notices || []).map(itemRow).join("") +
      "</ul></div></div>";
  }

  function renderGalleryPage() {
    var el = document.getElementById("page-gallery");
    if (!el) return;
    var ctx = getPageCtx("gallery");

    if (ctx === "activity") {
      var act = C.activity || { intro: "", items: [] };
      el.innerHTML =
        '<div id="activity-2026" class="scroll-mt-40"></div>' +
        '<p class="text-xl text-slate-600" data-reveal>' +
        esc(act.intro || "School activities and highlights.") +
        "</p>" +
        '<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
        (act.items || [])
          .map(function (it) {
            var src = mediaSrc(it.image);
            return (
              '<figure data-reveal class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">' +
              '<div class="aspect-[4/3] overflow-hidden">' +
              galleryLightboxButton(src, it.title, it.caption || it.title) +
              '<img src="' +
              esc(src) +
              '" alt="' +
              esc(it.title) +
              '" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/>' +
              galleryLightboxClose() +
              "</div>" +
              '<figcaption class="p-4"><h3 class="font-display font-semibold text-mes-primary">' +
              esc(it.title) +
              "</h3>" +
              (it.caption ? '<p class="mt-1 text-sm text-slate-600">' + esc(it.caption) + "</p>" : "") +
              "</figcaption></figure>"
            );
          })
          .join("") +
        "</div>";
      return;
    }

    if (!C.gallery) return;
    var g = C.gallery;
    el.innerHTML =
      '<div id="student-life" class="scroll-mt-40"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(g.intro) +
      "</p>" +
      '<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
      (g.items || [])
        .map(function (it, idx) {
          var len = g.items.length;
          var figId = "";
          if (idx === 0) figId = ' id="photo"';
          else if (len >= 3 && idx === len - 2) figId = ' id="marathi-1"';
          else if (len >= 2 && idx === len - 1 && idx > 0) figId = ' id="marathi-2"';
          var src = mediaSrc(it.image);
          return (
            "<figure" +
            figId +
            ' data-reveal class="group scroll-mt-32 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">' +
            '<div class="aspect-[4/3] overflow-hidden">' +
            galleryLightboxButton(src, it.title, it.title + " — " + it.category) +
            '<img src="' +
            esc(src) +
            '" alt="' +
            esc(it.title) +
            '" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/>' +
            galleryLightboxClose() +
            "</div>" +
            '<figcaption class="p-4"><span class="text-xs font-semibold uppercase tracking-wide text-mes-primary">' +
            esc(it.category) +
            '</span><h3 class="font-display font-semibold text-mes-primary">' +
            esc(it.title) +
            "</h3></figcaption></figure>"
          );
        })
        .join("") +
      "</div>" +
      '<p id="video" class="mt-10 scroll-mt-40 text-sm text-slate-500" data-reveal>' +
      esc(g.videoNote || "Video gallery can be added here when ready.") +
      "</p>";
  }

  function renderAlumniPage() {
    var el = document.getElementById("page-alumni");
    if (!el || !C.alumni) return;
    var a = C.alumni;
    var stories = a.stories
      .map(function (s) {
        return (
          '<blockquote class="rounded-2xl border border-slate-200 bg-mes-light/80 p-8">' +
          '<p class="text-lg text-slate-700">“' +
          esc(s.quote) +
          '”</p><footer class="mt-6 flex items-center gap-4">' +
          '<div class="flex h-14 w-14 items-center justify-center rounded-full bg-mes-primary text-mes-accent font-bold">' +
          esc(s.initials) +
          "</div><div>" +
          '<cite class="not-italic font-semibold text-mes-primary">' +
          esc(s.name) +
          "</cite>" +
          '<p class="text-sm text-slate-600">' +
          esc(s.classYear) +
          " · " +
          esc(s.role) +
          "</p></div></footer></blockquote>"
        );
      })
      .join("");

    el.innerHTML =
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(a.intro) +
      "</p>" +
      '<div class="mt-12 space-y-10" data-reveal-stagger>' +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-mes-primary">Success stories</h2><div class="mt-6 space-y-6">' +
      stories +
      "</div></section>" +
      '<section data-reveal class="rounded-2xl border border-mes-accent/30 bg-mes-light p-8">' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Alumni registration</h2>' +
      '<p class="mt-2 text-slate-600">' +
      esc(a.registrationBlurb) +
      "</p>" +
      (web3formsEnabled()
        ? '<form class="alumni-form mt-6 grid gap-4 sm:grid-cols-2" action="' +
          esc(WEB3_FORMS_ACTION) +
          '" method="POST">' +
          web3FormHiddenFields("Dr. Gadagkar High School — Alumni registration") +
          '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-name">Full name</label><input id="alumni-name" name="name" type="text" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium text-slate-700" for="alumni-year">Class year</label><input id="alumni-year" name="classYear" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium text-slate-700" for="alumni-city">City</label><input id="alumni-city" name="city" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium text-slate-700" for="alumni-email">Email</label><input id="alumni-email" name="email" type="email" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium text-slate-700" for="alumni-phone">Phone</label><input id="alumni-phone" name="phone" type="tel" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-profession">Profession / organisation</label><input id="alumni-profession" name="profession" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-msg">Message</label><textarea id="alumni-msg" name="message" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
          '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-mes-primary px-8 py-3 font-semibold text-white transition hover:bg-mes-primaryDark">Submit registration</button> <span class="ml-2 text-sm text-slate-500">Sent via Web3Forms to your configured inbox.</span></div>' +
          "</form>"
        : web3FormsSetupNoticeHtml()) +
      "</section></div>";
  }

  function renderAdmissionsPage() {
    var el = document.getElementById("page-admissions");
    if (!el || !C.admissions) return;
    var a = C.admissions;
    el.innerHTML =
      '<section id="overview" class="scroll-mt-52" data-reveal>' +
      '<p class="text-xl text-slate-600">' +
      esc(a.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-2">' +
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Admission process</h2><ol class="mt-6 list-decimal space-y-3 pl-5 text-lg text-slate-700">' +
      a.process
        .map(function (p) {
          return "<li>" + esc(p) + "</li>";
        })
        .join("") +
      "</ol></section>" +
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Requirements</h2><ul class="mt-6 list-inside list-disc space-y-2 text-lg text-slate-700">' +
      a.requirements
        .map(function (r) {
          return "<li>" + esc(r) + "</li>";
        })
        .join("") +
      "</ul></section></div></section>" +
      '<section id="inquiry" class="mt-12 scroll-mt-52 rounded-2xl border border-mes-accent/30 bg-mes-light p-8" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Inquiry form</h2>' +
      (web3formsEnabled()
        ? '<form class="inquiry-form mt-6 grid gap-4 sm:grid-cols-2" action="' +
          esc(WEB3_FORMS_ACTION) +
          '" method="POST">' +
          web3FormHiddenFields("Dr. Gadagkar High School — Admissions inquiry") +
          '<div><label class="block text-sm font-medium" for="in-name">Student name</label><input id="in-name" name="studentName" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="in-grade">Grade seeking</label><input id="in-grade" name="grade" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="in-parent">Parent / guardian</label><input id="in-parent" name="parentName" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="in-phone">Phone</label><input id="in-phone" name="phone" type="tel" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div class="sm:col-span-2"><label class="block text-sm font-medium" for="in-email">Email</label><input id="in-email" name="email" type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div class="sm:col-span-2"><label class="block text-sm font-medium" for="in-msg">Message</label><textarea id="in-msg" name="message" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
          '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-mes-accent px-8 py-3 font-semibold text-mes-primaryDark hover:bg-mes-accentLight">Submit inquiry</button></div>' +
          "</form>"
        : '<div class="mt-6">' + web3FormsSetupNoticeHtml() + "</div>") +
      "</section>";
  }

  function renderContactPage() {
    var el = document.getElementById("page-contact");
    if (!el) return;
    var cfg = window.SITE_CONFIG || {};
    var co = C.contact || {};
    el.innerHTML =
      '<div class="grid gap-12 lg:grid-cols-2">' +
      '<div data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Visit & reach us</h2>' +
      '<p class="mt-4 text-lg text-slate-600">' +
      esc(cfg.address) +
      "</p>" +
      '<p class="mt-4 text-slate-600"><strong>Hours:</strong> ' +
      esc(co.hours) +
      "</p>" +
      '<p class="mt-4"><a class="font-semibold text-mes-primary hover:underline" href="tel:' +
      esc((cfg.contactPhone || "").replace(/\s/g, "")) +
      '">' +
      esc(cfg.contactPhone) +
      "</a></p>" +
      '<p class="mt-2"><a class="font-semibold text-mes-primary hover:underline" href="mailto:' +
      esc(cfg.contactEmail) +
      '">' +
      esc(cfg.contactEmail) +
      "</a></p>" +
      '<div class="mt-8 aspect-video overflow-hidden rounded-xl border border-slate-200">' +
      '<iframe title="School location" class="h-full w-full border-0" loading="lazy" src="' +
      esc(co.mapEmbed) +
      '"></iframe></div></div>' +
      '<div data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Send a message</h2>' +
      (web3formsEnabled()
        ? '<form id="contact-form" class="contact-form mt-6 grid gap-4" action="' +
          esc(WEB3_FORMS_ACTION) +
          '" method="POST">' +
          web3FormHiddenFields("Dr. Gadagkar High School — Website contact") +
          '<div><label class="block text-sm font-medium" for="cf-name">Name</label><input id="cf-name" name="name" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="cf-email">Email</label><input id="cf-email" name="email" type="email" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="cf-subject">Subject</label><input id="cf-subject" name="topic" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
          '<div><label class="block text-sm font-medium" for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="4" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
          '<div><button type="submit" class="rounded-full bg-mes-primary px-8 py-3 font-semibold text-white hover:bg-mes-primaryDark">Send message</button></div>' +
          "</form>"
        : '<div class="mt-6">' + web3FormsSetupNoticeHtml() + "</div>") +
      "</div></div>";
  }

  function wrapSidebarPanel(content) {
    return (
      '<div class="site-sidebar-panel site-glass site-card-3d">' + content + "</div>"
    );
  }

  function innerSidebarSectionHeading(title) {
    return (
      '<h2 class="font-display text-lg font-bold text-slate-900">' +
      esc(title) +
      "</h2>" +
      '<div class="mt-2 flex h-1 w-full overflow-hidden rounded-full" aria-hidden="true">' +
      '<span class="w-2/3 bg-mes-red"></span><span class="flex-1 bg-slate-300"></span></div>'
    );
  }

  function buildFundraisingTeaserCardHtml() {
    var fr = C.home && C.home.fundraising;
    var fa = C.fundAppeal || {};
    var cfg = window.SITE_CONFIG || {};
    var href = (fr && fr.href) || "fund-appeal.html";
    var title = (fa && fa.pageTitle) || (fr && fr.title) || "Fund appeal";
    var img = (fr && fr.image) || (fa && fa.heroImage) || "";
    var goalBadge =
      fa.goal != null && Number(fa.goal) > 0
        ? formatINR(fa.goal)
        : (fr && fr.amount) || "";
    var footer = (fr && fr.footerLine) || cfg.schoolName || "";
    var sectionTitle = (fr && fr.sectionTitle) || "Fund raising appeal";
    var crest = ((cfg.logoInitials || "DG").trim() || "DG").slice(0, 3);
    return wrapSidebarPanel(
      innerSidebarSectionHeading(sectionTitle) +
      '<a href="' +
      esc(href) +
      '" class="site-sidebar-panel__card group mt-4 block overflow-hidden rounded-lg border border-slate-200/90 bg-white/95 shadow-sm transition hover:border-mes-primary/30 hover:shadow-md">' +
      '<div class="p-4">' +
      '<h3 class="text-sm font-bold leading-snug text-slate-900 group-hover:text-mes-primary">' +
      esc(title) +
      "</h3>" +
      '<div class="relative mt-3 overflow-hidden rounded-md border border-slate-100">' +
      '<img src="' +
      esc(mediaSrc(img)) +
      '" alt="" class="aspect-[4/3] w-full object-cover" loading="lazy"/>' +
      (goalBadge
        ? '<div class="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow">' +
          esc(goalBadge) +
          "</div>"
        : "") +
      "</div>" +
      '<div class="mt-3 flex min-w-0 items-center gap-2 text-xs text-slate-600">' +
      '<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">' +
      esc(crest) +
      "</span>" +
      '<span class="min-w-0 break-words">' +
      esc(footer) +
      "</span></div>" +
      '<p class="mt-2 text-xs font-semibold text-mes-accent group-hover:underline">View full appeal →</p>' +
      "</div></a>"
    );
  }

  function buildFundAppealProgressAsideHtml(fa) {
    var raised = Math.max(0, Number(fa.raised) || 0);
    var goal = Math.max(1, Number(fa.goal) || 1);
    var pct = Math.min(100, Math.round((raised / goal) * 100));
    var shareUrl = fundAppealPageUrl();
    var enc = encodeURIComponent(shareUrl);

    var donorsHtml = (fa.donors || [])
      .map(function (d) {
        return (
          '<li class="flex gap-3 border-b border-slate-100 py-3 last:border-0">' +
          '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mes-light text-xs font-bold text-mes-primary">' +
          esc(d.initials || "") +
          "</span>" +
          '<p class="min-w-0 text-sm leading-snug text-slate-700">' +
          esc(d.name) +
          ' donated <strong class="text-mes-primary">' +
          formatINR(d.amount) +
          "</strong></p></li>"
        );
      })
      .join("");

    var donateRaw = resolveFundAppealDonateHref(fa);
    var donateLinkAttrs = isExternalHref(donateRaw) ? ' target="_blank" rel="noopener noreferrer"' : "";

    return wrapSidebarPanel(
      '<div class="space-y-6">' +
      '<div class="site-sidebar-panel__card rounded-xl border border-slate-200/90 bg-white/95 p-5 shadow-sm">' +
      '<p class="text-lg font-bold leading-snug text-slate-900">' +
      formatINR(raised) +
      " raised of " +
      formatINR(goal) +
      "</p>" +
      '<div class="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-mes-light">' +
      '<div class="h-full rounded-full bg-mes-primary transition-[width] duration-500" style="width:' +
      pct +
      '%"></div></div>' +
      '<div class="mt-4 text-sm text-slate-600">' +
      '<span class="inline-flex items-center gap-1.5"><span aria-hidden="true">👥</span>' +
      esc(String(fa.donationCount != null ? fa.donationCount : "0")) +
      " donations</span></div>" +
      '<div class="mt-5 flex flex-wrap justify-center gap-2">' +
      '<a href="https://www.facebook.com/sharer/sharer.php?u=' +
      esc(enc) +
      '" target="_blank" rel="noopener noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-mes-light" title="Share on Facebook">f</a>' +
      '<a href="https://twitter.com/intent/tweet?url=' +
      esc(enc) +
      '" target="_blank" rel="noopener noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-mes-light" title="Share on X">𝕏</a>' +
      '<a href="https://wa.me/?text=' +
      esc(enc) +
      '" target="_blank" rel="noopener noreferrer" class="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-mes-light" title="Share on WhatsApp">W</a>' +
      '<button type="button" class="js-copy-page-url flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-mes-light" data-url="' +
      esc(shareUrl) +
      '" title="Copy page link" aria-label="Copy page link">⎘</button></div>' +
      '<a href="' +
      esc(donateRaw) +
      '"' +
      donateLinkAttrs +
      ' class="mt-5 flex w-full items-center justify-center rounded-lg bg-mes-primary py-3 text-center text-base font-bold text-white transition hover:bg-mes-primaryDark">' +
      esc(fa.donateLabel || "Donate now") +
      "</a></div>" +
      '<div class="site-sidebar-panel__card rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-sm">' +
      '<h2 class="font-display text-lg font-bold text-mes-primary">Recent donors</h2>' +
      '<ul class="mt-3 max-h-64 overflow-y-auto pr-1">' +
      (donorsHtml || '<li class="text-sm text-slate-500">No donors listed yet — add them in the CMS under Fund appeal.</li>') +
      "</ul></div></div>"
    );
  }

  function findNavItemById(navLinks, id) {
    if (!navLinks || !id) return null;
    for (var i = 0; i < navLinks.length; i++) {
      if (navLinks[i].id === id) return navLinks[i];
    }
    return null;
  }

  function mergeNavChildrenByIds(cfg, ids) {
    var navLinks = cfg.navLinks || [];
    var seen = {};
    var out = [];
    for (var j = 0; j < ids.length; j++) {
      var item = findNavItemById(navLinks, ids[j]);
      if (!item || !item.children) continue;
      for (var k = 0; k < item.children.length; k++) {
        var c = item.children[k];
        var key = (c.href || "") + "\0" + (c.label || "");
        if (seen[key]) continue;
        seen[key] = true;
        out.push(c);
      }
    }
    return out;
  }

  function getSidebarLinksForPage(page, cfg) {
    var fb = cfg.innerSidebarFallback || {};
    if (fb[page] && fb[page].length) return fb[page].slice();
    var navLinks = cfg.navLinks || [];
    if (page === "news") {
      var nctx = "";
      try {
        nctx = (new URLSearchParams(window.location.search || "").get("ctx") || "").toLowerCase();
      } catch (e) {}
      var nid = nctx === "results" ? "results" : "events";
      var nitem = findNavItemById(navLinks, nid);
      return nitem && nitem.children ? nitem.children.slice() : [];
    }
    if (page === "gallery") {
      var gctx = "";
      try {
        gctx = (new URLSearchParams(window.location.search || "").get("ctx") || "").toLowerCase();
      } catch (e) {}
      var gid = gctx === "activity" ? "activity" : "gallery";
      var gitem = findNavItemById(navLinks, gid);
      return gitem && gitem.children ? gitem.children.slice() : [];
    }
    var spec = cfg.sidebarNavParent && cfg.sidebarNavParent[page];
    if (!spec) return [];
    if (typeof spec === "string") {
      var one = findNavItemById(navLinks, spec);
      return one && one.children ? one.children.slice() : [];
    }
    if (Object.prototype.toString.call(spec) === "[object Array]") {
      return mergeNavChildrenByIds(cfg, spec);
    }
    return [];
  }

  function linkMatchesCurrentLocation(href) {
    var a = document.createElement("a");
    a.href = href;
    var curPath = (window.location.pathname.split("/").pop() || "").toLowerCase();
    var linkPath = (a.pathname.split("/").pop() || "").toLowerCase();
    if (curPath !== linkPath) return false;
    var curParams = new URLSearchParams((window.location.search || "").replace(/^\?/, ""));
    var linkParams = new URLSearchParams((a.search || "").replace(/^\?/, ""));
    var curCtx = (curParams.get("ctx") || "").toLowerCase();
    var linkCtx = (linkParams.get("ctx") || "").toLowerCase();
    if (curPath === "news.html") {
      if ((curCtx || "events") !== (linkCtx || "events")) return false;
    } else if (curPath === "gallery.html") {
      if ((curCtx || "gallery") !== (linkCtx || "gallery")) return false;
    } else if (curCtx !== linkCtx) {
      return false;
    }
    var curSub = (curParams.get("sub") || "").toLowerCase();
    var linkSubFromQuery = (linkParams.get("sub") || "").toLowerCase();
    var linkHashRaw = (a.hash || "").replace(/^#/, "").toLowerCase();
    var curHashRaw = (window.location.hash || "").replace(/^#/, "").toLowerCase();
    var linkTarget = linkHashRaw || linkSubFromQuery;
    if (linkTarget) {
      if (curHashRaw && curHashRaw === linkTarget) return true;
      if (curSub && curSub === linkTarget) return true;
      return false;
    }
    /** Link has no section anchor — current only when URL has no #fragment and no sub. */
    if (!curHashRaw && !curSub) return true;
    return false;
  }

  function filterSidebarLinksExceptCurrent(links) {
    return links.filter(function (l) {
      return !linkMatchesCurrentLocation(l.href);
    });
  }

  function renderInnerPageSidebar() {
    var page = document.body.getAttribute("data-page");
    if (!page || page === "home") return;
    var aside = document.getElementById("page-sidebar");
    if (!aside) return;
    var cfg = window.SITE_CONFIG || {};
    var links = getSidebarLinksForPage(page, cfg);
    links = filterSidebarLinksExceptCurrent(links);
    var navHtml = "";
    if (links.length) {
      navHtml = wrapSidebarPanel(
        innerSidebarSectionHeading("Related information") +
          '<ul class="site-sidebar-related-links list-none space-y-3 pl-0">' +
          links
            .map(function (l) {
              return (
                '<li class="min-w-0"><a href="' +
                esc(l.href) +
                '" class="site-sidebar-link block break-words text-sm font-semibold leading-snug text-mes-primary transition hover:text-mes-accent hover:underline">' +
                esc(l.label) +
                "</a></li>"
              );
            })
            .join("") +
          "</ul>"
      );
    }
    var teaser = page === "fund-appeal" ? "" : buildFundraisingTeaserCardHtml();
    var fundExtra =
      page === "fund-appeal" && C.fundAppeal ? buildFundAppealProgressAsideHtml(C.fundAppeal) : "";
    aside.classList.add("site-sidebar-stack");
    aside.innerHTML = navHtml + teaser + fundExtra;
  }

  function renderDonatePaymentPage() {
    var el = document.getElementById("page-donate-payment");
    if (!el || !C.fundAppeal) return;
    var fa = C.fundAppeal;
    var po = fa.paymentOptions || {};
    var cfg = window.SITE_CONFIG || {};
    var school = (cfg.schoolName || "").trim() || "School";
    var upiId = (po.upiId || "").trim();
    var upiPn = encodeURIComponent(school);
    var upiUri = "";
    if (upiId) {
      upiUri = "upi://pay?pa=" + encodeURIComponent(upiId) + "&pn=" + upiPn + "&cu=INR";
    }
    var gatewayUrl = (po.gatewayUrl || "").trim();
    var gatewayLabel = (po.gatewayLabel || "Pay online").trim();
    var netLines = po.netBankingLines || [];
    var netHtml = netLines
      .map(function (line) {
        return '<p class="text-slate-700">' + esc(line) + "</p>";
      })
      .join("");

    var gatewaySection = gatewayUrl
      ? '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal>' +
        '<h2 class="font-display text-xl font-bold text-mes-primary">Online payment (all options)</h2>' +
        '<p class="mt-3 text-slate-700">UPI, cards, net banking, and wallets — choose on the secure payment page.</p>' +
        '<a href="' +
        esc(gatewayUrl) +
        '" target="_blank" rel="noopener noreferrer" class="mt-4 inline-flex rounded-lg bg-mes-primary px-6 py-3 font-semibold text-white transition hover:bg-mes-primaryDark">' +
        esc(gatewayLabel) +
        "</a></div>"
      : "";

    var upiSection =
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal>' +
      '<h2 class="font-display text-xl font-bold text-mes-primary">UPI — Google Pay, PhonePe, Paytm, BHIM</h2>' +
      '<p class="mt-3 text-slate-700">' +
      (upiId
        ? "Use any UPI app and pay to this VPA:"
        : "Add your school UPI ID in the CMS (Fund appeal → Payment page options) to show the VPA and an “Open UPI app” button.") +
      "</p>" +
      (upiId
        ? '<p class="mt-2 font-mono text-lg font-semibold text-mes-primary">' +
          esc(upiId) +
          '</p><a href="' +
          esc(upiUri) +
          '" class="mt-4 inline-flex rounded-lg bg-mes-accent px-6 py-3 font-semibold text-mes-primaryDark transition hover:bg-mes-accentLight">Open UPI app to pay</a>'
        : "") +
      '<p class="mt-4 text-sm text-slate-600">On mobile, the button opens your default UPI app. You can also enter the VPA manually in Google Pay, PhonePe, or Paytm.</p>' +
      "</div>";

    var netSection =
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal>' +
      '<h2 class="font-display text-xl font-bold text-mes-primary">Internet banking (NEFT / RTGS / IMPS)</h2>' +
      '<div class="mt-3 space-y-2 text-sm leading-relaxed">' +
      (netHtml || '<p class="text-slate-600">Add bank transfer details in the CMS (Fund appeal → Net banking lines).</p>') +
      "</div></div>";

    el.innerHTML =
      '<article data-reveal>' +
      '<h1 class="font-display text-3xl font-bold leading-tight text-mes-primary sm:text-4xl">Donate — payment options</h1>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-700">' +
      esc(po.intro || "") +
      "</p>" +
      '<div class="mt-10 grid gap-6">' +
      gatewaySection +
      upiSection +
      netSection +
      "</div>" +
      '<p class="mt-10 text-sm text-slate-500"><a href="fund-appeal.html" class="font-semibold text-mes-primary hover:underline">← Back to fund appeal</a></p>' +
      "</article>";
  }

  function renderFundAppealPage() {
    var el = document.getElementById("page-fund-appeal");
    if (!el || !C.fundAppeal) return;
    var fa = C.fundAppeal;
    var paras = (fa.paragraphs || [])
      .map(function (p) {
        return '<p class="mt-4 text-lg leading-relaxed text-slate-700">' + esc(p) + "</p>";
      })
      .join("");
    el.innerHTML =
      '<article data-reveal>' +
      '<h1 class="font-display text-3xl font-bold leading-tight text-mes-primary sm:text-4xl">' +
      esc(fa.pageTitle) +
      "</h1>" +
      '<p class="mt-2 text-sm text-slate-500">Created by: ' +
      esc(fa.createdBy) +
      "</p>" +
      '<div class="relative mt-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm">' +
      '<img src="' +
      esc(fa.heroImage) +
      '" alt="" class="h-auto w-full object-cover" loading="lazy"/>' +
      "</div>" +
      paras +
      "</article>" +
      (fa.poweredBy
        ? '<p class="mt-12 text-right text-xs text-slate-400">' + esc(fa.poweredBy) + "</p>"
        : "");
  }

  function runPageRenderer() {
    var page = document.body.getAttribute("data-page");
    if (page === "home") renderHomePage();
    else if (page === "about") renderAboutPage();
    else if (page === "academics") renderAcademicsPage();
    else if (page === "news") renderNewsPage();
    else if (page === "gallery") renderGalleryPage();
    else if (page === "alumni") renderAlumniPage();
    else if (page === "admissions") renderAdmissionsPage();
    else if (page === "contact") renderContactPage();
    else if (page === "fund-appeal") renderFundAppealPage();
    else if (page === "donate-payment") renderDonatePaymentPage();
    renderInnerPageSidebar();
  }

  window.renderPageContent = runPageRenderer;
  window.renderHomePage = renderHomePage;
})();
