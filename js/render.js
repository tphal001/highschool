(function () {
  var C = typeof window.SITE_CONTENT !== "undefined" ? window.SITE_CONTENT : {};

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
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

  function web3formsEnabled() {
    var k = (window.SITE_CONFIG && window.SITE_CONFIG.web3formsAccessKey || "").trim();
    if (!k) return false;
    if (/YOUR_|PLACEHOLDER|CHANGE_ME|^xxx/i.test(k)) return false;
    return true;
  }

  /**
   * Form action URL. Prefer Web3Forms (works reliably on Vercel); else FormSubmit.co.
   */
  function formActionUrl() {
    var cfg = window.SITE_CONFIG || {};
    if (web3formsEnabled()) {
      return "https://api.web3forms.com/submit";
    }
    var email = (cfg.formSubmissionEmail || cfg.contactEmail || "").trim();
    if (!email) return "#";
    return "https://formsubmit.co/" + email;
  }

  function formPostExtras(subjectLine) {
    var cfg = window.SITE_CONFIG || {};
    var next = thankYouRedirectUrl();

    if (web3formsEnabled()) {
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

    var out =
      '<input type="hidden" name="_subject" value="' +
      esc(subjectLine) +
      '" />';
    if (next) {
      out += '<input type="hidden" name="_next" value="' + esc(next) + '" />';
    }
    out +=
      '<input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off" aria-hidden="true" />';
    return out;
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
      esc(a.href || "news.html") +
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
          '<span class="text-school-gold">' +
          esc(accent) +
          "</span>" +
          esc(line.slice(i + accent.length))
        );
      }
      hero.innerHTML =
        '<div class="absolute inset-0 bg-gradient-to-br from-school-navy/90 via-school-navy/80 to-school-slate/90"></div>' +
        '<div class="absolute inset-0 bg-cover bg-center bg-no-repeat" style="background-image:url(' +
        JSON.stringify(he.image) +
        ')" role="img" aria-label="' +
        esc(he.imageAlt || "") +
        '"></div>' +
        '<div class="absolute inset-0 bg-gradient-to-t from-school-navy via-school-navy/50 to-transparent"></div>' +
        '<div class="absolute inset-0 opacity-25" style="background-image:url(\'data:image/svg+xml,%3Csvg width=\\\'60\\\' height=\\\'60\\\' viewBox=\\\'0 0 60 60\\\' xmlns=\\\'http://www.w3.org/2000/svg\\\'%3E%3Cg fill=\\\'%23ffffff\\\' fill-opacity=\\\'0.06\\\'%3E%3Cpath d=\\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\\'/%3E%3C/g%3E%3C/svg%3E\')"></div>' +
        '<div class="relative mx-auto flex min-h-[calc(90vh-5rem)] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-32">' +
        '<p class="mb-6 inline-flex max-w-fit items-center rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-amber-200/90 opacity-0 animate-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100 sm:text-sm" style="animation-delay:80ms">' +
        esc(he.badge) +
        "</p>" +
        '<h1 class="font-display max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-white opacity-0 animate-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100 sm:text-5xl md:text-6xl lg:text-7xl" style="animation-delay:160ms">' +
        headlineHtml() +
        "</h1>" +
        '<p class="mt-8 max-w-2xl text-lg leading-relaxed text-slate-200 opacity-0 animate-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100 sm:text-xl" style="animation-delay:280ms">' +
        esc(he.subtext) +
        "</p>" +
        '<div class="mt-12 flex flex-col flex-wrap gap-4 sm:flex-row sm:items-center sm:gap-4 opacity-0 animate-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100" style="animation-delay:400ms">' +
        '<a href="' +
        esc(he.primaryCta.href) +
        '" class="inline-flex items-center justify-center rounded-full bg-school-gold px-8 py-4 text-base font-semibold text-school-navy shadow-xl shadow-amber-900/25 transition duration-500 ease-premium hover:-translate-y-1 hover:bg-amber-400">' +
        esc(he.primaryCta.label) +
        "</a>" +
        '<a href="' +
        esc(he.secondaryCta.href) +
        '" class="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition duration-500 hover:-translate-y-1 hover:bg-white/20">' +
        esc(he.secondaryCta.label) +
        "</a>" +
        '<a href="' +
        esc(he.tertiaryCta.href) +
        '" class="inline-flex items-center justify-center text-sm font-semibold text-amber-200/90 underline decoration-amber-400/50 underline-offset-4 transition hover:text-white sm:ml-2">' +
        esc(he.tertiaryCta.label) +
        " →</a>" +
        "</div>" +
        "</div>" +
        '<div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-school-cream via-school-cream/80 to-transparent sm:h-40" aria-hidden="true"></div>';
    }

    var leg = document.getElementById("home-legacy");
    if (leg && h.legacy) {
      var l = h.legacy;
      leg.innerHTML =
        '<div class="absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-800 to-amber-950 bg-[length:200%_100%] animate-gradient-shift motion-reduce:animate-none"></div>' +
        '<div class="relative mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 px-5 py-8 text-center sm:flex-row sm:gap-10 sm:px-8 sm:py-10 lg:px-10" data-reveal>' +
        '<span class="font-display shrink-0 rounded-full border border-amber-400/50 bg-amber-950/50 px-5 py-2 text-sm font-bold tracking-wide text-amber-100 shadow-lg shadow-black/20 sm:text-base">' +
        esc(l.badge) +
        "</span>" +
        '<p class="max-w-2xl text-sm font-medium leading-relaxed text-amber-50 sm:text-base md:text-lg"><span class="font-semibold text-amber-100">' +
        esc(l.title) +
        "</span> — " +
        esc(l.line) +
        "</p>" +
        '<a href="' +
        esc(l.linkHref) +
        '" class="shrink-0 text-sm font-semibold text-amber-100 underline decoration-amber-400/60 underline-offset-[6px] transition duration-300 hover:-translate-y-0.5 hover:text-white">' +
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
        '<h2 class="font-display text-3xl font-bold tracking-tight text-school-navy sm:text-4xl">' +
        esc(b.title) +
        "</h2>" +
        '<p class="mt-2 text-lg font-medium text-amber-800">' +
        esc(b.subtitle) +
        "</p>" +
        b.paragraphs
          .map(function (p) {
            return '<p class="mt-4 text-lg leading-relaxed text-slate-600">' + esc(p) + "</p>";
          })
          .join("") +
        '<a href="' +
        esc(b.linkHref) +
        '" class="mt-8 inline-flex font-semibold text-school-navy underline decoration-amber-400/60 decoration-2 underline-offset-4 hover:text-amber-900">' +
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
            '</dt><dd class="mt-2 font-display text-3xl font-bold text-school-gold">' +
            esc(s.value) +
            "</dd></div>"
          );
        })
        .join("");
      als.innerHTML =
        '<div class="mx-auto max-w-3xl text-center" data-reveal>' +
        '<h2 class="font-display text-3xl font-bold tracking-tight text-school-navy sm:text-4xl">' +
        esc(al.sectionTitle) +
        "</h2>" +
        '<p class="mt-5 text-lg leading-relaxed text-slate-600">' +
        esc(al.sectionSubtitle) +
        "</p>" +
        "</div>" +
        '<div class="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16" data-reveal-stagger>' +
        '<blockquote data-reveal class="group rounded-2xl border border-slate-200/90 bg-school-cream/80 p-8 sm:p-10">' +
        '<p class="text-lg leading-relaxed text-slate-700 sm:text-xl">“' +
        esc(st.quote) +
        '”</p>' +
        '<footer class="mt-8 flex items-center gap-5">' +
        '<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-school-navy to-slate-700 text-lg font-bold text-school-gold">' +
        esc(st.initials) +
        "</div>" +
        "<div>" +
        '<cite class="not-italic text-lg font-semibold text-school-navy">' +
        esc(st.name) +
        "</cite>" +
        '<p class="mt-1 text-sm text-slate-600">' +
        esc(st.role) +
        "</p>" +
        "</div>" +
        "</footer>" +
        "</blockquote>" +
        '<div data-reveal class="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-school-navy via-school-slate to-slate-900 p-10 text-white sm:p-12">' +
        '<h3 class="font-display text-xl font-bold text-white">Network at a glance</h3>' +
        '<dl class="mt-8 grid grid-cols-2 gap-8">' +
        statsHtml +
        "</dl>" +
        '<a href="' +
        esc(al.linkHref) +
        '" class="mt-10 inline-flex w-full items-center justify-center rounded-full bg-school-gold py-4 text-base font-semibold text-school-navy transition hover:bg-amber-400 sm:w-auto sm:px-10">' +
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
      '<section id="history" class="scroll-mt-28" data-reveal>' +
      '<h2 class="font-display text-3xl font-bold text-school-navy">Our history</h2>' +
      '<p class="mt-2 text-lg text-amber-800">Since <strong>' +
      esc(String(a.history.sinceYear)) +
      "</strong> — more than 50 years of excellence.</p>" +
      '<div class="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">' +
      a.history.paragraphs.map(function (p) {
        return "<p>" + esc(p) + "</p>";
      }).join("") +
      "</div></section>" +
      '<section id="mission" class="mt-16 scroll-mt-28 grid gap-10 md:grid-cols-2" data-reveal>' +
      "<div>" +
      '<h2 class="font-display text-2xl font-bold text-school-navy">' +
      esc(a.mission.title) +
      "</h2>" +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc(a.mission.text) +
      "</p></div>" +
      "<div>" +
      '<h2 class="font-display text-2xl font-bold text-school-navy">' +
      esc(a.vision.title) +
      "</h2>" +
      '<p class="mt-4 text-lg leading-relaxed text-slate-600">' +
      esc(a.vision.text) +
      "</p></div></section>" +
      '<section id="principal" class="mt-16 scroll-mt-28" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Leadership</h2>' +
      '<div class="mt-8 flex flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-8 md:flex-row md:items-start">' +
      '<img src="' +
      esc(a.principal.photo) +
      '" alt="' +
      esc(a.principal.name) +
      '" class="mx-auto h-48 w-48 shrink-0 rounded-2xl object-cover md:mx-0" loading="lazy"/>' +
      "<div>" +
      '<h3 class="font-display text-xl font-bold text-school-navy">' +
      esc(a.principal.name) +
      "</h3>" +
      '<p class="text-amber-800">' +
      esc(a.principal.title) +
      "</p>" +
      '<div class="mt-4 space-y-3 text-lg leading-relaxed text-slate-600">' +
      a.principal.message
        .map(function (p) {
          return "<p>" + esc(p) + "</p>";
        })
        .join("") +
      "</div></div></div></section>";
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
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-school-navy">Programs offered</h2><div class="mt-6 grid gap-6 md:grid-cols-3">' +
      a.programs
        .map(function (p) {
          return (
            '<div class="rounded-xl border border-slate-200 bg-school-cream/50 p-6"><h3 class="font-semibold text-school-navy">' +
            esc(p.title) +
            '</h3><p class="mt-2 text-slate-600">' +
            esc(p.text) +
            "</p></div>"
          );
        })
        .join("") +
      "</div></section>" +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-school-navy">Curriculum</h2><ul class="mt-4 list-inside list-disc space-y-2 text-lg text-slate-600">' +
      a.curriculum
        .map(function (c) {
          return "<li>" + esc(c) + "</li>";
        })
        .join("") +
      "</ul></section>" +
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-school-navy">Facilities</h2><ul class="mt-4 grid gap-3 sm:grid-cols-2">' +
      a.facilities
        .map(function (f) {
          return (
            '<li class="flex items-center gap-2 text-slate-700"><span class="text-school-gold">✓</span> ' +
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
        '<time class="text-xs font-semibold uppercase tracking-wide text-amber-800">' +
        esc(x.displayDate) +
        '</time><h3 class="mt-1 font-display text-lg font-semibold text-school-navy">' +
        esc(x.title) +
        '</h3><p class="mt-1 text-slate-600">' +
        esc(x.summary) +
        "</p></li>"
      );
    }
    el.innerHTML =
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(n.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-3" data-reveal-stagger>' +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-school-navy">Events</h2><ul class="mt-4">' +
      n.events.map(itemRow).join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-school-navy">Circulars</h2><ul class="mt-4">' +
      n.circulars.map(itemRow).join("") +
      "</ul></div>" +
      '<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-reveal><h2 class="font-display text-xl font-bold text-school-navy">Notices</h2><ul class="mt-4">' +
      n.notices.map(itemRow).join("") +
      "</ul></div></div>";
  }

  function renderGalleryPage() {
    var el = document.getElementById("page-gallery");
    if (!el || !C.gallery) return;
    var g = C.gallery;
    el.innerHTML =
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(g.intro) +
      "</p>" +
      '<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>' +
      g.items
        .map(function (it) {
          return (
            '<figure data-reveal class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">' +
            '<div class="aspect-[4/3] overflow-hidden">' +
            '<img src="' +
            esc(it.image) +
            '" alt="' +
            esc(it.title) +
            '" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy"/>' +
            "</div>" +
            '<figcaption class="p-4"><span class="text-xs font-semibold uppercase tracking-wide text-amber-800">' +
            esc(it.category) +
            '</span><h3 class="font-display font-semibold text-school-navy">' +
            esc(it.title) +
            "</h3></figcaption></figure>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="mt-10 text-sm text-slate-500" data-reveal>Add video embeds in <code class="rounded bg-slate-100 px-1">content.js</code> or this page when ready.</p>';
  }

  function renderAlumniPage() {
    var el = document.getElementById("page-alumni");
    if (!el || !C.alumni) return;
    var a = C.alumni;
    var stories = a.stories
      .map(function (s) {
        return (
          '<blockquote class="rounded-2xl border border-slate-200 bg-school-cream/80 p-8">' +
          '<p class="text-lg text-slate-700">“' +
          esc(s.quote) +
          '”</p><footer class="mt-6 flex items-center gap-4">' +
          '<div class="flex h-14 w-14 items-center justify-center rounded-full bg-school-navy text-school-gold font-bold">' +
          esc(s.initials) +
          "</div><div>" +
          '<cite class="not-italic font-semibold text-school-navy">' +
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
          '<span class="font-medium text-school-navy">' +
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
      '<section data-reveal><h2 class="font-display text-2xl font-bold text-school-navy">Success stories</h2><div class="mt-6 space-y-6">' +
      stories +
      "</div></section>" +
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">' +
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
      '<section data-reveal class="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-8">' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Alumni registration</h2>' +
      '<p class="mt-2 text-slate-600">' +
      esc(a.registrationBlurb) +
      "</p>" +
      '<form class="alumni-form mt-6 grid gap-4 sm:grid-cols-2" action="' +
      esc(formActionUrl()) +
      '" method="POST">' +
      formPostExtras("Dr. Gadagkar High School — Alumni registration") +
      '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-name">Full name</label><input id="alumni-name" name="name" type="text" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium text-slate-700" for="alumni-year">Class year</label><input id="alumni-year" name="classYear" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium text-slate-700" for="alumni-city">City</label><input id="alumni-city" name="city" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium text-slate-700" for="alumni-email">Email</label><input id="alumni-email" name="email" type="email" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium text-slate-700" for="alumni-phone">Phone</label><input id="alumni-phone" name="phone" type="tel" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-profession">Profession / organisation</label><input id="alumni-profession" name="profession" type="text" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div class="sm:col-span-2"><label class="block text-sm font-medium text-slate-700" for="alumni-msg">Message</label><textarea id="alumni-msg" name="message" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
      '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-school-navy px-8 py-3 font-semibold text-white transition hover:bg-slate-800">Submit registration</button> <span class="ml-2 text-sm text-slate-500">Delivered to the school office email.</span></div>' +
      "</form></section></div>";
  }

  function renderAdmissionsPage() {
    var el = document.getElementById("page-admissions");
    if (!el || !C.admissions) return;
    var a = C.admissions;
    el.innerHTML =
      '<p class="text-xl text-slate-600" data-reveal>' +
      esc(a.intro) +
      "</p>" +
      '<div class="mt-12 grid gap-10 lg:grid-cols-2">' +
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Admission process</h2><ol class="mt-6 list-decimal space-y-3 pl-5 text-lg text-slate-700">' +
      a.process
        .map(function (p) {
          return "<li>" + esc(p) + "</li>";
        })
        .join("") +
      "</ol></section>" +
      '<section data-reveal class="rounded-2xl border border-slate-200 bg-white p-8">' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Requirements</h2><ul class="mt-6 list-inside list-disc space-y-2 text-lg text-slate-700">' +
      a.requirements
        .map(function (r) {
          return "<li>" + esc(r) + "</li>";
        })
        .join("") +
      "</ul></section></div>" +
      '<section class="mt-12 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-8" data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Inquiry form</h2>' +
      '<form class="inquiry-form mt-6 grid gap-4 sm:grid-cols-2" action="' +
      esc(formActionUrl()) +
      '" method="POST">' +
      formPostExtras("Dr. Gadagkar High School — Admissions inquiry") +
      '<div><label class="block text-sm font-medium" for="in-name">Student name</label><input id="in-name" name="studentName" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="in-grade">Grade seeking</label><input id="in-grade" name="grade" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="in-parent">Parent / guardian</label><input id="in-parent" name="parentName" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="in-phone">Phone</label><input id="in-phone" name="phone" type="tel" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div class="sm:col-span-2"><label class="block text-sm font-medium" for="in-email">Email</label><input id="in-email" name="email" type="email" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div class="sm:col-span-2"><label class="block text-sm font-medium" for="in-msg">Message</label><textarea id="in-msg" name="message" rows="3" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
      '<div class="sm:col-span-2"><button type="submit" class="rounded-full bg-school-gold px-8 py-3 font-semibold text-school-navy hover:bg-amber-400">Submit inquiry</button></div>' +
      "</form></section>";
  }

  function renderContactPage() {
    var el = document.getElementById("page-contact");
    if (!el) return;
    var cfg = window.SITE_CONFIG || {};
    var co = C.contact || {};
    el.innerHTML =
      '<div class="grid gap-12 lg:grid-cols-2">' +
      '<div data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Visit & reach us</h2>' +
      '<p class="mt-4 text-lg text-slate-600">' +
      esc(cfg.address) +
      "</p>" +
      '<p class="mt-4 text-slate-600"><strong>Hours:</strong> ' +
      esc(co.hours) +
      "</p>" +
      '<p class="mt-4"><a class="font-semibold text-school-navy hover:underline" href="tel:' +
      esc((cfg.contactPhone || "").replace(/\s/g, "")) +
      '">' +
      esc(cfg.contactPhone) +
      "</a></p>" +
      '<p class="mt-2"><a class="font-semibold text-school-navy hover:underline" href="mailto:' +
      esc(cfg.contactEmail) +
      '">' +
      esc(cfg.contactEmail) +
      "</a></p>" +
      '<div class="mt-8 aspect-video overflow-hidden rounded-xl border border-slate-200">' +
      '<iframe title="School location" class="h-full w-full border-0" loading="lazy" src="' +
      esc(co.mapEmbed) +
      '"></iframe></div></div>' +
      '<div data-reveal>' +
      '<h2 class="font-display text-2xl font-bold text-school-navy">Send a message</h2>' +
      '<form id="contact-form" class="contact-form mt-6 grid gap-4" action="' +
      esc(formActionUrl()) +
      '" method="POST">' +
      formPostExtras("Dr. Gadagkar High School — Website contact") +
      '<div><label class="block text-sm font-medium" for="cf-name">Name</label><input id="cf-name" name="name" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="cf-email">Email</label><input id="cf-email" name="email" type="email" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="cf-subject">Subject</label><input id="cf-subject" name="subject" class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"/></div>' +
      '<div><label class="block text-sm font-medium" for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="4" required class="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5"></textarea></div>' +
      '<div><button type="submit" class="rounded-full bg-school-navy px-8 py-3 font-semibold text-white hover:bg-slate-800">Send message</button></div>' +
      "</form></div></div>";
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
  }

  window.renderPageContent = runPageRenderer;
  window.renderHomePage = renderHomePage;
})();
