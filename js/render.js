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

  /** Latest update lines from CMS (newest first). */
  function getQuickNewsLines(h) {
    var raw = (h && h.quickNews) || [];
    var lines = [];
    var i;
    for (i = 0; i < raw.length; i++) {
      var x = raw[i];
      var s = typeof x === "string" ? x : (x && (x.text || x.line)) || "";
      if (s) lines.push(s);
    }
    if (lines.length) lines.reverse();
    return lines;
  }

  /** Horizontal ticker under the main menu (all pages). */
  function buildNewsTickerHtml(h) {
    var lines = getQuickNewsLines(h);
    if (!lines.length) return "";
    var sep =
      '<span class="mx-4 inline-flex h-1 w-1 shrink-0 rounded-full bg-mes-accent/70" aria-hidden="true"></span>';
    var chunk = lines
      .map(function (line) {
        return (
          '<span class="inline-flex items-center px-0.5 text-xs font-medium text-slate-800 sm:text-sm">' +
          esc(line) +
          "</span>"
        );
      })
      .join(sep);
    return (
      '<div class="flex items-center overflow-hidden py-2 sm:py-2.5">' +
      '<span class="site-news-ticker-label mr-3 shrink-0 border-l-[3px] border-mes-primary pl-2 text-xs font-bold uppercase tracking-wide text-mes-primary">Updates</span>' +
      '<div class="relative min-w-0 flex-1 overflow-hidden site-news-ticker-scroll">' +
      '<div class="site-news-ticker-track animate-marquee-x flex w-max items-center whitespace-nowrap motion-reduce:animate-none">' +
      chunk +
      sep +
      chunk +
      "</div></div></div>"
    );
  }

  function renderSiteNewsTicker() {
    var el = document.getElementById("site-news-ticker");
    if (!el) return;
    var html = buildNewsTickerHtml(C.home);
    if (!html) {
      el.classList.add("hidden");
      el.innerHTML = "";
      return;
    }
    el.innerHTML = html;
    el.classList.remove("hidden");
  }

  /** Compact gallery preview for the home hero (replaces the old updates card). */
  function buildGalleryPreviewCardHtml() {
    var galleryHref = "gallery.html?ctx=gallery#photo";
    var items = (C.gallery && C.gallery.items) || [];
    var imgs = [];
    var i;
    for (i = 0; i < items.length; i++) {
      var src = mediaSrc(items[i].image);
      if (src) imgs.push(src);
    }
    if (!imgs.length) {
      var he = C.home && C.home.hero;
      var slides = (he && he.slides && he.slides.length && he.slides) || [];
      if (!slides.length && he && he.image) slides = [he.image];
      for (i = 0; i < slides.length; i++) {
        if (slides[i]) imgs.push(mediaSrc(slides[i]));
      }
    }
    var first = imgs[0] || "";
    var mediaHtml = first
      ? '<img id="home-gallery-preview-img" src="' +
        esc(first) +
        '" alt="" class="h-full w-full object-cover transition-opacity duration-500" loading="lazy"/>'
      : '<div class="flex h-full items-center justify-center px-4 text-center text-xs text-slate-500">Add photos in the CMS gallery.</div>';
    return (
      '<a href="' +
      esc(galleryHref) +
      '" class="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2" aria-label="Open campus photo gallery">' +
      '<div class="site-glass site-card-3d rounded-xl border border-mes-primary/15 p-2.5 shadow-sm transition-all duration-300 ease-out hover:border-mes-primary/35">' +
      '<p class="text-[10px] font-bold uppercase tracking-wider text-mes-primary">Our picture gallery</p>' +
      '<div id="home-gallery-preview" class="relative mt-1.5 h-[6rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-[6.25rem]"' +
      (imgs.length > 1 ? ' data-gallery-preview="1"' : "") +
      ">" +
      mediaHtml +
      (imgs.length > 1
        ? '<div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 pb-1.5 pt-6">' +
          '<span class="text-[10px] font-semibold text-white/95 opacity-90 transition group-hover:opacity-100">Explore photos →</span></div>'
        : "") +
      "</div></div></a>"
    );
  }

  function buildLightboxImageButton(src, title, imgClass, wrapClass) {
    if (!src) return "";
    imgClass =
      imgClass ||
      "w-full rounded-lg border border-slate-200 object-cover pointer-events-none";
    wrapClass = wrapClass || "block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2";
    return (
      '<button type="button" class="js-gallery-lightbox ' +
      wrapClass +
      '" data-lightbox-src="' +
      esc(src) +
      '" data-lightbox-alt="' +
      esc(title || "") +
      '" data-lightbox-caption="' +
      esc(title || "") +
      '">' +
      '<img src="' +
      esc(src) +
      '" alt="" class="' +
      imgClass +
      '" loading="lazy"/>' +
      "</button>"
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

  function formsInboxEmail() {
    var cfg = window.SITE_CONFIG || {};
    return (cfg.formsInboxEmail || cfg.contactEmail || "").trim();
  }

  function formDeliveryNoteHtml() {
    var mail = formsInboxEmail();
    if (!mail) return "";
    return (
      '<span class="ml-2 text-sm text-slate-500">Delivered to ' + esc(mail) + ".</span>"
    );
  }

  /** Hidden fields for Web3Forms (replaces FormSubmit.co — that service often errors or is unreachable). */
  function web3FormHiddenFields(subjectLine) {
    if (!web3formsEnabled()) return "";
    var cfg = window.SITE_CONFIG || {};
    var next = thankYouRedirectUrl();
    var school = (cfg.schoolName || "Dr. Gadagkar High School").trim();
    var out =
      '<input type="hidden" name="access_key" value="' +
      esc((cfg.web3formsAccessKey || "").trim()) +
      '" />' +
      '<input type="hidden" name="subject" value="' +
      esc(subjectLine) +
      '" />' +
      '<input type="hidden" name="from_name" value="' +
      esc(school) +
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
      '<li>Open <a href="https://web3forms.com" class="font-semibold underline" target="_blank" rel="noopener">web3forms.com</a> and create a free access key using <strong>' +
      esc(formsInboxEmail() || "your school inbox") +
      "</strong>.</li>" +
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
    "site-auto-glass site-card-3d group flex flex-col rounded-lg border border-slate-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-accent/40 hover:shadow-xl hover:shadow-mes-primary/15 hover:ring-1 hover:ring-mes-accent/20";

  var DEFAULT_ANNOUNCEMENT_HREF = "news.html?ctx=events";

  function announcementCustomHref(a) {
    var href = ((a && a.href) || "").trim();
    if (!href || href === DEFAULT_ANNOUNCEMENT_HREF) return "";
    return href;
  }

  function announcementBodyText(a) {
    var body = ((a && a.body) || "").trim();
    if (body) return body;
    return ((a && a.excerpt) || "").trim();
  }

  /** Newest first (uses internal sort key from build, or CMS list order). */
  function sortedQuickAnnouncements(list) {
    if (!list || !list.length) return [];
    return list
      .slice()
      .map(function (a, idx) {
        return Object.assign({}, a, { _cmsIdx: idx });
      })
      .sort(function (a, b) {
        if (a.datetime && b.datetime) {
          var byDate = String(b.datetime).localeCompare(String(a.datetime));
          if (byDate !== 0) return byDate;
        }
        return (b._cmsIdx || 0) - (a._cmsIdx || 0);
      });
  }

  function sortNewsList(list) {
    if (!list || !list.length) return list || [];
    return sortedQuickAnnouncements(list);
  }

  function cardFromData(a, index) {
    var img = mediaSrc(resolveMediaField(a.image));
    var readLabel = "Read more →";
    var idxAttr =
      ' data-announcement-index="' + String(typeof index === "number" ? index : 0) + '"';
    var openBtnClass =
      "js-open-announcement-modal cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2";
    var imageBlock = img
      ? '<button type="button" class="js-gallery-lightbox group announcement-card__media-link block w-full shrink-0 cursor-zoom-in overflow-hidden border-b border-slate-100 bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-inset" data-lightbox-src="' +
        esc(img) +
        '" data-lightbox-alt="' +
        esc(a.title) +
        '" data-lightbox-caption="' +
        esc(a.title) +
        '">' +
        '<div class="announcement-card__media">' +
        '<img src="' +
        esc(img) +
        '" alt="" class="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02] pointer-events-none" loading="lazy"/>' +
        "</div></button>"
      : "";
    return (
      '<article class="' +
      ANNOUNCEMENT_CARD_CLASS +
      '">' +
      imageBlock +
      '<div class="flex flex-1 flex-col p-5">' +
      '<button type="button"' +
      idxAttr +
      ' class="' +
      openBtnClass +
      ' shrink-0 text-base font-bold text-mes-primary transition-colors duration-200 group-hover:text-mes-primaryDark group-hover:underline">' +
      esc(a.title) +
      "</button>" +
      '<p class="mt-2 text-sm leading-relaxed text-slate-600">' +
      esc(a.excerpt) +
      "</p>" +
      '<button type="button"' +
      idxAttr +
      ' class="' +
      openBtnClass +
      ' mt-auto inline-flex pt-4 text-sm font-semibold text-slate-500 underline decoration-slate-300 transition-colors duration-200 group-hover:text-mes-primary group-hover:decoration-mes-accent">' +
      esc(readLabel) +
      "</button></div></article>"
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
    var items = sortCmsList(hl.items || []);
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
      '<div class="mb-3 sm:mb-4" data-reveal>' +
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
        buildGalleryPreviewCardHtml() +
        "</div>" +
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
    if (qa && C.quickAnnouncements && C.quickAnnouncements.length) {
      qa.innerHTML = sortedQuickAnnouncements(C.quickAnnouncements)
        .map(function (a, i) {
          return (
            '<li class="flex flex-col" data-reveal>' + cardFromData(a, i) + "</li>"
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
      var alumniStories = Array.isArray(al.stories)
        ? al.stories
        : al.story
          ? [al.story]
          : [];
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
      var storiesHtml = alumniStories
        .map(function (st) {
          if (!st) return "";
          var photoUrl = st.photo != null ? mediaSrc(st.photo) : "";
          var avatarBlock =
            photoUrl !== ""
              ? '<img src="' +
                esc(photoUrl) +
                '" alt="" class="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-mes-primary/25 shadow-sm" loading="lazy"/>'
              : '<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mes-primary to-mes-primaryDark text-lg font-bold text-mes-accent">' +
                esc(st.initials || (st.name || "?").charAt(0)) +
                "</div>";
          return (
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
            "</blockquote>"
          );
        })
        .join("");
      als.innerHTML =
        '<div class="mx-auto max-w-3xl text-center" data-reveal>' +
        '<h2 class="relative inline-block pb-2 font-display text-3xl font-bold tracking-tight text-mes-primary sm:text-4xl after:absolute after:bottom-0 after:left-1/2 after:h-[3px] after:w-24 after:-translate-x-1/2 after:bg-mes-red">' +
        esc(al.sectionTitle) +
        "</h2>" +
        '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
        esc(al.sectionSubtitle) +
        "</p>" +
        "</div>" +
        '<div class="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10" data-reveal-stagger>' +
        '<div class="space-y-8">' +
        storiesHtml +
        "</div>" +
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

  /** Section anchor from ?sub= or #hash (nav uses ?sub= for admissions inquiry). */
  function getPageSub(defaultSub) {
    try {
      var sub = (new URLSearchParams(window.location.search || "").get("sub") || "").trim();
      if (sub) return sub.toLowerCase();
      var hash = (window.location.hash || "").replace(/^#/, "").trim();
      if (hash) return hash.toLowerCase();
      return (defaultSub || "").toLowerCase();
    } catch (e) {
      return (defaultSub || "").toLowerCase();
    }
  }

  function setInnerPageHeader(page, opts) {
    opts = opts || {};
    var pageTitle = document.querySelector("body[data-page='" + page + "'] main h1");
    var pageLead = pageTitle && pageTitle.nextElementSibling;
    if (pageTitle) {
      if (opts.title != null) pageTitle.textContent = opts.title;
      pageTitle.classList.toggle("hidden", !!opts.hideTitle);
    }
    if (pageLead && pageLead.tagName === "P") {
      if (opts.lead != null) pageLead.textContent = opts.lead;
      pageLead.classList.toggle("hidden", !!opts.hideLead);
    }
  }

  /** Show one submenu section only (excludes full-page menus listed in site-config behaviour). */
  function isSectionOnlySub(page, sub, ctx) {
    if (!sub) return false;
    sub = String(sub).toLowerCase();
    if (page === "about" && sub === "history") return false;
    if (page === "admissions") return false;
    if (page === "academics") return false;
    if (page === "gallery" && ctx === "activity") return false;
    if (page === "gallery" && sub === "student-life") return false;
    if (page === "news" && sub === "events") return false;
    return true;
  }

  /** Newest first — respects build datetime; otherwise last CMS entry is treated as newest. */
  function sortCmsList(list) {
    if (!list || !list.length) return [];
    var items = list.slice();
    var anyDatetime = items.some(function (x) {
      return x && x.datetime;
    });
    if (anyDatetime) {
      return items.sort(function (a, b) {
        var da = String((a && a.datetime) || "");
        var db = String((b && b.datetime) || "");
        if (da && db) {
          var cmp = db.localeCompare(da);
          if (cmp !== 0) return cmp;
        } else if (da && !db) return -1;
        else if (!da && db) return 1;
        return 0;
      });
    }
    return newestFirstList(items);
  }

  function setAdmissionsLayoutMode(inquiryOnly) {
    if (document.body.getAttribute("data-page") !== "admissions") return;
    var pageTitle = document.querySelector("body[data-page='admissions'] main h1");
    var pageLead = pageTitle && pageTitle.nextElementSibling;
    if (pageTitle) pageTitle.classList.toggle("hidden", inquiryOnly);
    if (pageLead && pageLead.tagName === "P") pageLead.classList.toggle("hidden", inquiryOnly);
  }

  function setNewsPageLayoutMode(resultsOnly) {
    if (document.body.getAttribute("data-page") !== "news") return;
    var pageTitle = document.querySelector("body[data-page='news'] main h1");
    var pageLead = pageTitle && pageTitle.nextElementSibling;
    if (!pageTitle) return;
    if (resultsOnly) {
      pageTitle.textContent = "Results";
      if (pageLead) pageLead.classList.add("hidden");
    } else {
      pageTitle.textContent = "News & Announcements";
      if (pageLead) {
        pageLead.textContent = "Events, circulars, and official notices.";
        pageLead.classList.remove("hidden");
      }
    }
  }

  function setGalleryPageLayoutMode(activityMode, activityIntro) {
    if (document.body.getAttribute("data-page") !== "gallery") return;
    var pageTitle = document.querySelector("body[data-page='gallery'] main h1");
    var pageLead = pageTitle && pageTitle.nextElementSibling;
    if (!pageTitle) return;
    if (activityMode) {
      pageTitle.textContent = "Activities";
      if (pageLead) {
        pageLead.textContent =
          activityIntro ||
          "Sports, cultural programs, competitions, and co-curricular activities.";
        pageLead.classList.remove("hidden");
      }
    } else {
      pageTitle.textContent = "Gallery";
      if (pageLead) {
        pageLead.textContent = "Photos and moments from campus life.";
        pageLead.classList.remove("hidden");
      }
    }
  }

  function buildAdmissionsInquiryHtml(withTopMargin) {
    var sectionClass =
      (withTopMargin ? "mt-12 " : "") +
      "scroll-mt-52 rounded-2xl border border-mes-accent/30 bg-mes-light p-8";
    return (
      '<section id="inquiry" class="' +
      sectionClass +
      '" data-reveal>' +
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
          '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-mes-accent px-8 py-3 font-semibold text-mes-primaryDark hover:bg-mes-accentLight">Submit inquiry</button>' +
          formDeliveryNoteHtml() +
          "</div>" +
          "</form>"
        : '<div class="mt-6">' + web3FormsSetupNoticeHtml() + "</div>") +
      "</section>"
    );
  }

  function renderMemberCards(members, opts) {
    opts = opts || {};
    members = sortCmsList(members || []);
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

  function newestFirstList(list) {
    if (!list || !list.length) return list || [];
    return list.slice().reverse();
  }

  function buildAboutHistorySection(a) {
    return (
      '<section id="history" class="scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-3xl font-bold text-mes-primary">Our history</h2>' +
      '<p class="mt-2 text-lg text-mes-accent">Since <strong>' +
      esc(String(a.history.sinceYear)) +
      "</strong> — more than 50 years of excellence.</p>" +
      '<div class="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">' +
      a.history.paragraphs
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("") +
      "</div></section>"
    );
  }

  function buildAboutMissionSection(a) {
    return (
      '<section id="mission" class="scroll-mt-52 grid gap-10 md:grid-cols-2" data-reveal>' +
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
      "</p></div></section>"
    );
  }

  function buildAboutBoardSection(a) {
    return (
      '<section id="board" class="scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Board and Governing Body Members</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc((a.board && a.board.intro) || "Governance details can be published here when available.") +
      "</p>" +
      renderMemberCards(a.board && a.board.members) +
      "</section>"
    );
  }

  function buildAboutPrincipalSection(a) {
    return (
      '<section id="principal" class="scroll-mt-52" data-reveal>' +
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
      "</div></div></div></section>"
    );
  }

  function buildAboutStaffSection(a) {
    return (
      '<section id="staff" class="scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Staff</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc((a.staff && a.staff.intro) || "Faculty and staff listings can be added when ready.") +
      "</p>" +
      renderMemberCards(a.staff && a.staff.members, { department: true }) +
      "</section>"
    );
  }

  var ABOUT_SECTION_HEADERS = {
    mission: "Mission and Vision",
    board: "Board and Governing Body Members",
    principal: "Principal Desk",
    staff: "Staff",
  };

  function renderAboutPage() {
    var el = document.getElementById("page-about");
    if (!el || !C.about) return;
    var a = C.about;
    var sub = getPageSub("");
    var sectionBuilders = {
      mission: buildAboutMissionSection,
      board: buildAboutBoardSection,
      principal: buildAboutPrincipalSection,
      staff: buildAboutStaffSection,
    };

    if (sub && isSectionOnlySub("about", sub, "") && sectionBuilders[sub]) {
      setInnerPageHeader("about", {
        title: ABOUT_SECTION_HEADERS[sub] || "About",
        hideLead: true,
      });
      el.innerHTML = sectionBuilders[sub](a);
      return;
    }

    setInnerPageHeader("about", { title: "About", hideLead: false });
    el.innerHTML =
      buildAboutHistorySection(a) +
      buildAboutMissionSection(a).replace('class="scroll-mt-52 grid', 'class="mt-16 scroll-mt-52 grid') +
      buildAboutBoardSection(a).replace('class="scroll-mt-52"', 'class="mt-16 scroll-mt-52"') +
      buildAboutPrincipalSection(a).replace('class="scroll-mt-52"', 'class="mt-16 scroll-mt-52"') +
      buildAboutStaffSection(a).replace('class="scroll-mt-52"', 'class="mt-16 scroll-mt-52"');
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

    function recognitionItemTitle(item) {
      if (!item) return "";
      return String(item.name || item.title || "").trim();
    }

    function buildRecognitionsSectionHtml(recognitionData) {
      var data = recognitionData || {};
      var items = sortCmsList(data.items || []);
      var cardClass =
        "result-card site-card-3d rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-accent/45 hover:shadow-lg hover:shadow-mes-primary/10";
      var intro = (data.intro || "").trim();
      var introHtml = intro
        ? '<p class="mb-6 text-lg leading-relaxed text-slate-600" data-reveal>' + esc(intro) + "</p>"
        : "";
      if (!items.length) {
        return (
          '<div id="recognitions" class="scroll-mt-52"></div>' +
          introHtml +
          '<p class="text-slate-600" data-reveal>No recognitions listed yet.</p>'
        );
      }
      return (
        '<div id="recognitions" class="scroll-mt-52"></div>' +
        introHtml +
        '<div class="mt-2 grid gap-6 sm:grid-cols-2" data-reveal-stagger>' +
        items
          .map(function (item) {
            var title = recognitionItemTitle(item);
            var imgSrc = item.image ? mediaSrc(item.image) : "";
            var imgHtml = imgSrc
              ? buildLightboxImageButton(
                  imgSrc,
                  title,
                  "mt-3 max-h-40 w-full rounded-lg border border-slate-200 object-cover",
                  "mt-3 block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2"
                )
              : "";
            return (
              '<div class="' +
              cardClass +
              '" data-reveal>' +
              '<strong class="font-display text-lg text-mes-primary">' +
              esc(title || "Recognition") +
              "</strong>" +
              '<p class="mt-2">' +
              esc(item.summary || "") +
              "</p>" +
              imgHtml +
              "</div>"
            );
          })
          .join("") +
        "</div>"
      );
    }

    function eventImageHtml(x) {
      var src = x && x.image ? mediaSrc(x.image) : "";
      if (!src) return "";
      return buildLightboxImageButton(
        src,
        x.title || "",
        "mt-3 max-h-40 w-full rounded-lg border border-slate-200 object-cover",
        "mt-3 block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2"
      );
    }

    function itemRow(x) {
      return (
        '<li class="border-b border-slate-100 py-4 last:border-0">' +
        '<h3 class="font-display text-lg font-semibold text-mes-primary">' +
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
        '<h3 class="font-display text-lg font-semibold text-mes-primary">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p>" +
        eventImageHtml(x) +
        "</li>"
      );
    }

    var evtAnchors = ["evt-silver", "evt-ashwarohan", "evt-virangana"];
    var allEvents = n.events || [];
    var allResults = n.results || [];

    function eventAnchorAt(x) {
      if (typeof window.findNewsItemBySub === "function" && typeof window.newsItemAnchorId === "function") {
        for (var ei = 0; ei < allEvents.length; ei++) {
          if (allEvents[ei] === x) return window.newsItemAnchorId(x, "evt-", ei);
        }
      }
      var i = allEvents.indexOf(x);
      if (typeof window.newsItemAnchorId === "function") {
        return window.newsItemAnchorId(x, "evt-", i >= 0 ? i : 0);
      }
      return (x.anchorId || "").trim().toLowerCase() || evtAnchors[i] || "evt-" + i;
    }
    function resultAnchorAt(x) {
      if (typeof window.newsItemAnchorId === "function") {
        for (var ri = 0; ri < allResults.length; ri++) {
          if (allResults[ri] === x) return window.newsItemAnchorId(x, "res-", ri);
        }
        return window.newsItemAnchorId(x, "res-", 0);
      }
      var j = allResults.indexOf(x);
      return (x.anchorId || "").trim().toLowerCase() || "res-" + j;
    }
    function findEventBySub(sub) {
      if (typeof window.findNewsItemBySub === "function") {
        return window.findNewsItemBySub(allEvents, sub, "evt-");
      }
      return null;
    }
    function findResultBySub(sub) {
      if (typeof window.findNewsItemBySub === "function") {
        return window.findNewsItemBySub(allResults, sub, "res-");
      }
      return null;
    }

    if (ctx === "results") {
      var sub = getPageSub("");
      var results = sortCmsList(n.results || []);
      var resultCardClass =
        "result-card site-card-3d scroll-mt-52 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-mes-accent/45 hover:shadow-lg hover:shadow-mes-primary/10";

      if (sub === "recognitions") {
        setInnerPageHeader("news", { title: "Recognitions", hideLead: true });
        el.innerHTML = buildRecognitionsSectionHtml(n.recognitions);
        return;
      }

      if (isSectionOnlySub("news", sub, ctx)) {
        var singleResult = findResultBySub(sub);
        if (singleResult) {
          setInnerPageHeader("news", {
            title: singleResult.title || "Results",
            hideLead: true,
          });
          var imgSrc = singleResult.image ? mediaSrc(singleResult.image) : "";
          var imgHtml = imgSrc
            ? buildLightboxImageButton(
                imgSrc,
                singleResult.title || "",
                "mt-3 max-h-36 w-full rounded-lg border border-slate-200 object-cover",
                "mt-3 block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2"
              )
            : "";
          el.innerHTML =
            '<div class="mt-2" data-reveal>' +
            '<div class="' +
            resultCardClass +
            '">' +
            '<strong class="font-display text-lg text-mes-primary">' +
            esc(singleResult.title) +
            "</strong>" +
            '<p class="mt-2">' +
            esc(singleResult.summary) +
            "</p>" +
            imgHtml +
            "</div></div>";
          return;
        }
      }

      setNewsPageLayoutMode(true);
      el.innerHTML =
        '<div id="results" class="scroll-mt-52"></div>' +
        '<div class="mt-2 grid gap-6 sm:grid-cols-2" data-reveal-stagger>' +
        results
          .map(function (x) {
            var anchor = resultAnchorAt(x);
            var idAttr = anchor
              ? ' id="' + esc(anchor) + '" class="' + resultCardClass + '"'
              : ' class="' + resultCardClass + '"';
            var imgSrc = x.image ? mediaSrc(x.image) : "";
            var imgHtml = imgSrc
              ? buildLightboxImageButton(
                  imgSrc,
                  x.title || "",
                  "mt-3 max-h-36 w-full rounded-lg border border-slate-200 object-cover",
                  "mt-3 block w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-mes-accent focus-visible:ring-offset-2"
                )
              : "";
            return (
              "<div" +
              idAttr +
              " data-reveal>" +
              '<strong class="font-display text-lg text-mes-primary">' +
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

    var subEvents = getPageSub("");
    if (isSectionOnlySub("news", subEvents, ctx)) {
      var singleEvent = findEventBySub(subEvents);
      if (singleEvent) {
        setInnerPageHeader("news", {
          title: singleEvent.title || "Events",
          hideLead: true,
        });
        el.innerHTML =
          '<div class="mt-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal>' +
          '<h2 class="font-display text-xl font-bold text-mes-primary">' +
          esc(singleEvent.title) +
          "</h2>" +
          '<p class="mt-3 text-slate-600">' +
          esc(singleEvent.summary) +
          "</p>" +
          eventImageHtml(singleEvent) +
          "</div>";
        return;
      }
    }

    setNewsPageLayoutMode(false);
    el.innerHTML =
      '<div id="events" class="scroll-mt-52"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(n.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-3" data-reveal-stagger>' +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Events</h2><ul class="mt-4">' +
      sortCmsList(n.events || [])
        .map(function (x) {
          var anchor = eventAnchorAt(x);
          return itemRowWithId(x, anchor);
        })
        .join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Circulars</h2><ul class="mt-4">' +
      sortCmsList(n.circulars || []).map(itemRow).join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Notices</h2><ul class="mt-4">' +
      sortCmsList(n.notices || []).map(itemRow).join("") +
      "</ul></div></div>";
  }

  function renderGalleryPage() {
    var el = document.getElementById("page-gallery");
    if (!el) return;
    var ctx = getPageCtx("gallery");

    function buildGalleryPhotoGrid(items) {
      var sortedItems = sortCmsList(items || []);
      var len = sortedItems.length;
      return (
        '<div class="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
        sortedItems
          .map(function (it, idx) {
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
        "</div>"
      );
    }

    if (ctx === "activity") {
      var act = C.activity || { intro: "", items: [] };
      setGalleryPageLayoutMode(true, act.intro);
      el.innerHTML =
        '<div id="activity-2026" class="scroll-mt-40"></div>' +
        '<div class="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
        sortCmsList(act.items || [])
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
    var sub = getPageSub("");

    if (isSectionOnlySub("gallery", sub, ctx)) {
      if (sub === "photo") {
        setInnerPageHeader("gallery", { title: "Photo Gallery", hideLead: true });
        el.innerHTML = buildGalleryPhotoGrid(g.items || []);
        return;
      }
      if (sub === "video") {
        setInnerPageHeader("gallery", { title: "Video Gallery", hideLead: true });
        el.innerHTML =
          '<p id="video" class="mt-2 scroll-mt-40 text-lg text-slate-600" data-reveal>' +
          esc(g.videoNote || "Video gallery can be added here when ready.") +
          "</p>";
        return;
      }
    }

    setGalleryPageLayoutMode(false);
    el.innerHTML =
      '<div id="student-life" class="scroll-mt-40"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(g.intro) +
      "</p>" +
      buildGalleryPhotoGrid(g.items || []).replace('class="mt-2 grid', 'class="mt-10 grid') +
      '<p id="video" class="mt-10 scroll-mt-40 text-sm text-slate-500" data-reveal>' +
      esc(g.videoNote || "Video gallery can be added here when ready.") +
      "</p>";
  }

  function renderAlumniPage() {
    var el = document.getElementById("page-alumni");
    if (!el || !C.alumni) return;
    var a = C.alumni;
    var stories = sortCmsList(a.stories || [])
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
          '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-msg">Message / Success Story</label><textarea id="alumni-msg" name="message" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
          '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-mes-primary px-8 py-3 font-semibold text-white transition hover:bg-mes-primaryDark">Submit registration</button>' +
          formDeliveryNoteHtml() +
          "</div>" +
          "</form>"
        : web3FormsSetupNoticeHtml()) +
      "</section></div>";
  }

  function renderAdmissionsPage() {
    var el = document.getElementById("page-admissions");
    if (!el || !C.admissions) return;
    var a = C.admissions;
    var inquiryOnly = getPageSub("") === "inquiry";

    setAdmissionsLayoutMode(inquiryOnly);

    if (inquiryOnly) {
      el.innerHTML = buildAdmissionsInquiryHtml();
      return;
    }

    el.innerHTML =
      '<section id="overview" class="scroll-mt-52" data-reveal>' +
      (a.sessionLabel && String(a.sessionLabel).trim()
        ? '<p class="mb-4 inline-flex rounded-full border border-mes-accent/40 bg-mes-accent/15 px-4 py-1.5 text-sm font-semibold text-mes-primary">Admissions · ' +
          esc(String(a.sessionLabel).trim()) +
          "</p>"
        : "") +
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
      buildAdmissionsInquiryHtml(true);
  }

  function renderContactPage() {
    var el = document.getElementById("page-contact");
    if (!el) return;
    var cfg = window.SITE_CONFIG || {};
    var co = C.contact || {};
    el.innerHTML =
      '<div class="grid gap-12 lg:grid-cols-2">' +
      '<div data-reveal>' +
      '<p class="text-lg text-slate-600">' +
      esc(cfg.address) +
      "</p>" +
      '<p class="mt-4 text-slate-600"><strong>Hours:</strong> ' +
      esc(co.hours) +
      "</p>" +
      '<p class="mt-4"><a class="font-semibold text-mes-primary hover:underline" href="tel:' +
      esc(
        typeof window.contactPhoneTelHref === "function"
          ? window.contactPhoneTelHref(cfg.contactPhone)
          : (cfg.contactPhone || "").replace(/\s/g, "")
      ) +
      '">' +
      esc(
        typeof window.formatContactPhoneDisplay === "function"
          ? window.formatContactPhoneDisplay(cfg.contactPhone)
          : cfg.contactPhone
      ) +
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
          '<div><button type="submit" class="rounded-full bg-mes-primary px-8 py-3 font-semibold text-white hover:bg-mes-primaryDark">Send message</button>' +
          formDeliveryNoteHtml() +
          "</div>" +
          "</form>"
        : '<div class="mt-6">' + web3FormsSetupNoticeHtml() + "</div>") +
      "</div></div>" +
      buildWebsiteMaintainerCardHtml(cfg);
  }

  function buildWebsiteMaintainerCardHtml(cfg) {
    var m = cfg && cfg.websiteMaintainer;
    if (!m || m.enabled === false) return "";
    var photo = (m.photo || "").trim();
    var photoHtml = photo
      ? '<img src="' +
        esc(mediaSrc(photo)) +
        '" alt="" class="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-mes-primary/15 shadow-sm" loading="lazy"/>'
      : "";
    var classYear = (m.classYear || "").trim();
    var badge = classYear ? "Class of " + classYear + " · Alumni" : "Alumni";
    var phone = (m.phone || "").trim();
    var phoneTel =
      typeof window.contactPhoneTelHref === "function"
        ? window.contactPhoneTelHref(phone)
        : phone.replace(/\D/g, "");
    var phoneDisplay =
      typeof window.formatContactPhoneDisplay === "function"
        ? window.formatContactPhoneDisplay(phone)
        : phone;
    var linkedIn = (m.linkedIn || "").trim();
    return (
      '<section class="mt-8 max-w-xl scroll-mt-52" data-reveal aria-labelledby="website-maintainer-heading">' +
      '<div class="rounded-xl border border-slate-200/90 bg-gradient-to-br from-mes-light/90 via-white to-amber-50/40 p-4 shadow-sm sm:p-5">' +
      '<h2 id="website-maintainer-heading" class="font-display text-base font-bold text-mes-primary sm:text-lg">' +
      esc(m.role || "Website support") +
      "</h2>" +
      (m.highlight
        ? '<p class="mt-1.5 text-xs font-medium leading-snug text-mes-primary/90 sm:text-sm">' +
          esc(m.highlight) +
          "</p>"
        : "") +
      '<div class="mt-4 flex gap-4 sm:items-start">' +
      photoHtml +
      '<div class="min-w-0 flex-1">' +
      '<p class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-bold text-mes-primary sm:text-base">' +
      '<span class="font-display">' +
      esc(m.name || "") +
      "</span>" +
      (linkedIn
        ? '<span class="font-normal text-slate-400" aria-hidden="true">|</span>' +
          '<a href="' +
          esc(linkedIn) +
          '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-0.5 font-sans text-sm font-semibold text-mes-primary hover:text-mes-accent hover:underline"><span aria-hidden="true">🔗</span> LinkedIn</a>'
        : "") +
      "</p>" +
      '<p class="mt-1 inline-flex rounded-full border border-mes-accent/35 bg-mes-accent/10 px-2 py-0.5 text-[11px] font-semibold text-mes-primary">' +
      esc(badge) +
      "</p>" +
      (m.note
        ? '<p class="mt-2 text-xs leading-relaxed text-slate-600">' + esc(m.note) + "</p>"
        : "") +
      (phone
        ? '<p class="mt-2 text-xs"><a href="tel:' +
          esc(phoneTel) +
          '" class="font-semibold text-mes-primary hover:text-mes-accent hover:underline">' +
          esc(phoneDisplay) +
          "</a></p>"
        : "") +
      "</div></div></div></section>"
    );
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
    var navLinks =
      typeof window.resolveNavLinks === "function"
        ? window.resolveNavLinks(cfg)
        : cfg.navLinks || [];
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

  function sidebarNavHref(href) {
    if (typeof window.stripHashAppendSubParam === "function") {
      return window.stripHashAppendSubParam(href);
    }
    return href || "";
  }

  function linkMatchesCurrentLocation(href) {
    var normalized = sidebarNavHref(href);
    var a = document.createElement("a");
    a.href = normalized;
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
    var curSub = getPageSub("");
    var linkSub = (linkParams.get("sub") || "").toLowerCase();
    if (linkSub) {
      return curSub === linkSub;
    }
    if (!curSub) return true;
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
              var href = sidebarNavHref(l.href);
              return (
                '<li class="min-w-0"><a href="' +
                esc(href) +
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
    renderSiteNewsTicker();
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
  window.getSortedQuickAnnouncements = function () {
    return sortedQuickAnnouncements((C && C.quickAnnouncements) || []);
  };
  window.sortCmsList = sortCmsList;
  window.announcementCustomHref = announcementCustomHref;
  window.announcementBodyText = announcementBodyText;
})();
