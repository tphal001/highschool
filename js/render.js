(function () {
  var C = typeof window.SITE_CONTENT !== "undefined" ? window.SITE_CONTENT : {};

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatINR(n) {
    if (n == null || n === "") return "";
    var num = typeof n === "number" ? n : parseFloat(String(n).replace(/[^\d.]/g, ""), 10);
    if (isNaN(num)) return "";
    return "₹" + Math.round(num).toLocaleString("en-IN");
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

  function cardFromData(a) {
    return (
      "<announcement-card " +
      'datetime="' +
      esc(a.datetime) +
      '" ' +
      'date="' +
      esc(a.date) +
      '" ' +
      'title="' +
      esc(a.title) +
      '" ' +
      'excerpt="' +
      esc(a.excerpt) +
      '" ' +
      'href="' +
      esc(a.href || "news.html?ctx=events") +
      '"></announcement-card>'
    );
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
        '<div class="grid gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-8">' +
        '<div class="min-w-0 lg:col-span-7">' +
        '<div id="hero-slider" class="relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">' +
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
        "</div>" +
        '<div class="mt-5" data-reveal>' +
        '<p class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">' +
        esc(he.badge) +
        "</p>" +
        '<h1 class="mt-2 font-display text-2xl font-bold leading-tight text-mes-primary sm:text-3xl md:text-4xl">' +
        headlineHtml() +
        "</h1>" +
        '<p class="mt-3 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">' +
        esc(he.subtext) +
        "</p>" +
        "</div></div>" +
        '<aside class="min-w-0 lg:col-span-5">' +
        '<a href="' +
        esc(fundHref) +
        '" class="group block h-full rounded-lg focus:outline-none focus:ring-2 focus:ring-mes-primary/40 focus:ring-offset-2" aria-label="Open full fund appeal">' +
        '<div class="flex h-full min-h-0 flex-col rounded-lg border border-mes-primary/10 bg-mes-light p-4 shadow-sm transition group-hover:border-mes-primary/30 group-hover:shadow-md">' +
        '<div class="border-b border-slate-200 pb-3">' +
        '<h2 class="relative inline-block pb-2 font-display text-lg font-bold text-slate-900 after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-14 after:bg-mes-red">' +
        esc(fr.sectionTitle || "Fund raising appeal") +
        "</h2>" +
        '<div class="mt-2 h-px w-full bg-slate-200" aria-hidden="true"></div>' +
        "</div>" +
        '<h3 class="mt-4 text-sm font-bold leading-snug text-mes-primary">' +
        esc(fr.title || "") +
        "</h3>" +
        '<div class="relative mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">' +
        '<img src="' +
        esc(fr.image || he.image) +
        '" alt="" class="aspect-[16/10] w-full object-cover" loading="lazy"/>' +
        (fr.amount
          ? '<div class="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow">' +
            esc(fr.amount) +
            "</div>"
          : "") +
        "</div>" +
        '<div class="mt-3 flex items-center gap-2 text-xs text-slate-600">' +
        '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">' +
        esc(crest) +
        "</span>" +
        "<span>" +
        esc(fr.footerLine || "") +
        '</span></div><p class="mt-3 text-xs font-semibold text-mes-accent group-hover:underline">View full appeal →</p>' +
        '<p class="mt-3 text-xs leading-relaxed text-amber-950">' +
        "Every contribution, large or small, helps us move closer to our goal. Thank you for believing in our students and our mission." +
        "</p></div></a></aside></div></div>";
    }

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
          var liClass = i === 2 ? ' class="sm:col-span-2 lg:col-span-1"' : "";
          return "<li data-reveal" + liClass + ">" + cardFromData(a) + "</li>";
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
        '<div class="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 shadow-xl" data-reveal>' +
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
        '<blockquote data-reveal class="group rounded-2xl border border-slate-200/90 bg-mes-light/80 p-8 sm:p-10">' +
        '<p class="text-lg leading-relaxed text-slate-700 sm:text-xl">“' +
        esc(st.quote) +
        '”</p>' +
        '<footer class="mt-8 flex items-center gap-5">' +
        '<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mes-primary to-mes-primaryDark text-lg font-bold text-mes-accent">' +
        esc(st.initials) +
        "</div>" +
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
        '<div data-reveal class="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-mes-primary via-mes-primaryDark to-slate-900 p-10 text-white sm:p-12">' +
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
      "Governance details can be published here when available." +
      "</p></section>" +
      '<section id="principal" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Leadership</h2>' +
      '<div class="mt-8 flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-8 md:flex-row md:items-start">' +
      '<img src="' +
      esc(a.principal.photo) +
      '" alt="' +
      esc(a.principal.name) +
      '" class="mx-auto h-48 w-48 shrink-0 rounded-2xl object-cover md:mx-0" loading="lazy"/>' +
      "<div>" +
      '<h3 class="font-display text-xl font-bold text-mes-primary">' +
      esc(a.principal.name) +
      "</h3>" +
      '<p class="text-mes-accent">' +
      esc(a.principal.title) +
      "</p>" +
      '<div class="mt-4 space-y-3 text-lg leading-relaxed text-slate-600">' +
      a.principal.message
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("") +
      "</div></div></div></section>" +
      '<section id="staff" class="mt-16 scroll-mt-52" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">Staff</h2>' +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      "Faculty and staff listings can be added when ready." +
      "</p></section>" +
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
    function itemRow(x) {
      return (
        '<li class="border-b border-slate-100 py-4 last:border-0">' +
        '<time class="text-xs font-semibold uppercase tracking-wide text-mes-primary">' +
        esc(x.displayDate) +
        '</time><h3 class="mt-1 font-display text-lg font-semibold text-mes-primary">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p></li>"
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
        '<time class="text-xs font-semibold uppercase tracking-wide text-mes-primary">' +
        esc(x.displayDate) +
        '</time><h3 class="mt-1 font-display text-lg font-semibold text-mes-primary">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p></li>"
      );
    }
    var evtAnchors = ["evt-silver", "evt-ashwarohan", "evt-virangana"];
    el.innerHTML =
      '<div id="events" class="scroll-mt-52"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(n.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-3" data-reveal-stagger>' +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Events</h2><ul class="mt-4">' +
      n.events
        .map(function (x, i) {
          return itemRowWithId(x, evtAnchors[i] || "");
        })
        .join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Circulars</h2><ul class="mt-4">' +
      n.circulars.map(itemRow).join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-mes-primary">Notices</h2><ul class="mt-4">' +
      n.notices.map(itemRow).join("") +
      "</ul></div></div>" +
      '<div class="mt-12 grid gap-6 sm:grid-cols-2">' +
      '<div id="res-ssc" class="scroll-mt-52 rounded-xl border border-slate-200 bg-mes-light/50 p-5 text-sm text-slate-700">' +
      '<strong class="font-display text-mes-primary">SSC Result – March 2024</strong>' +
      '<p class="mt-2">Official result links and notices will be published here when available.</p></div>' +
      '<div id="res-hsc" class="scroll-mt-52 rounded-xl border border-slate-200 bg-mes-light/50 p-5 text-sm text-slate-700">' +
      '<strong class="font-display text-mes-primary">HSC Result – March 2024</strong>' +
      '<p class="mt-2">Official result links and notices will be published here when available.</p></div>' +
      "</div>";
  }

  function renderGalleryPage() {
    var el = document.getElementById("page-gallery");
    if (!el || !C.gallery) return;
    var g = C.gallery;
    el.innerHTML =
      '<div id="student-life" class="scroll-mt-40"></div>' +
      '<div id="activity-2026" class="scroll-mt-40"></div>' +
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(g.intro) +
      "</p>" +
      '<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
      g.items
        .map(function (it, idx) {
          var len = g.items.length;
          var figId = "";
          if (idx === 0) figId = ' id="photo"';
          else if (len >= 3 && idx === len - 2) figId = ' id="marathi-1"';
          else if (len >= 2 && idx === len - 1 && idx > 0) figId = ' id="marathi-2"';
          return (
            "<figure" +
            figId +
            ' data-reveal class="group scroll-mt-32 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">' +
            '<div class="aspect-[4/3] overflow-hidden">' +
            '<img src="' +
            esc(it.image) +
            '" alt="' +
            esc(it.title) +
            '" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/>' +
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
      '<p id="video" class="mt-10 scroll-mt-40 text-sm text-slate-500" data-reveal>Video gallery can be added here when ready.</p>';
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

    var locs = a.globalPresence.locations
      .map(function (l) {
        return (
          '<li class="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">' +
          '<span class="font-medium text-mes-primary">' +
          esc(l.city) +
          '</span><span class="text-slate-500">' +
          esc(l.region) +
          "</span></li>"
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
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-mes-primary">' +
      esc(a.globalPresence.title) +
      "</h2>" +
      '<p class="mt-2 text-slate-600">' +
      esc(a.globalPresence.subtitle) +
      "</p>" +
      '<div class="mt-8 grid gap-10 lg:grid-cols-2">' +
      '<div class="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 aspect-video">' +
      '<iframe title="Map" class="h-full w-full border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' +
      esc(a.mapEmbedUrl) +
      '"></iframe></div>' +
      "<div><ul>" +
      locs +
      "</ul></div></div></section>" +
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
    return (
      '<div class="mt-10">' +
      innerSidebarSectionHeading(sectionTitle) +
      '<a href="' +
      esc(href) +
      '" class="group mt-4 block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-mes-primary/30 hover:shadow-md">' +
      '<div class="p-4">' +
      '<h3 class="text-sm font-bold leading-snug text-slate-900 group-hover:text-mes-primary">' +
      esc(title) +
      "</h3>" +
      '<div class="relative mt-3 overflow-hidden rounded-md border border-slate-100">' +
      '<img src="' +
      esc(img) +
      '" alt="" class="aspect-[4/3] w-full object-cover" loading="lazy"/>' +
      (goalBadge
        ? '<div class="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-slate-900 shadow">' +
          esc(goalBadge) +
          "</div>"
        : "") +
      "</div>" +
      '<div class="mt-3 flex items-center gap-2 text-xs text-slate-600">' +
      '<span class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">' +
      esc(crest) +
      "</span>" +
      "<span>" +
      esc(footer) +
      "</span></div>" +
      '<p class="mt-2 text-xs font-semibold text-mes-accent group-hover:underline">View full appeal →</p>' +
      "</div></a></div>"
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

    return (
      '<div class="mt-10 space-y-6">' +
      '<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">' +
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
      '<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">' +
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
      navHtml =
        '<nav aria-label="Related information">' +
        innerSidebarSectionHeading("Related information") +
        '<ul class="mt-4 space-y-3">' +
        links
          .map(function (l) {
            return (
              '<li><a href="' +
              esc(l.href) +
              '" class="text-base font-semibold text-mes-primary transition hover:text-mes-accent hover:underline">' +
              esc(l.label) +
              "</a></li>"
            );
          })
          .join("") +
        "</ul></nav>";
    }
    var teaser = page === "fund-appeal" ? "" : buildFundraisingTeaserCardHtml();
    var fundExtra =
      page === "fund-appeal" && C.fundAppeal ? buildFundAppealProgressAsideHtml(C.fundAppeal) : "";
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
