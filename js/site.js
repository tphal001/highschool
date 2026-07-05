/* site.js — forms use native POST. No fetch. */
(function () {
  /** Merge flash news from SITE_CONTENT into SITE_CONFIG for the Home modal */
  if (typeof window.SITE_CONTENT !== "undefined" && window.SITE_CONTENT.flashNews) {
    window.SITE_CONFIG = window.SITE_CONFIG || {};
    window.SITE_CONFIG.vimpNews = Object.assign(
      {},
      window.SITE_CONFIG.vimpNews || {},
      window.SITE_CONTENT.flashNews
    );
  }
  function initHeaderScroll() {
    var header = document.getElementById("site-header");
    function onScroll() {
      if (!header) return;
      if (window.scrollY > 48) {
        header.classList.add("shadow-[0_8px_30px_rgb(0,0,0,0.12)]");
      } else {
        header.classList.remove("shadow-[0_8px_30px_rgb(0,0,0,0.12)]");
      }
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /** Hamburger drawer + backdrop; desktop nav stays at lg+ (see components.js). */
  function initMobileNav() {
    var panel = document.getElementById("site-nav-mobile-panel");
    var toggle = document.getElementById("site-nav-mobile-toggle");
    var closeBtn = document.getElementById("site-nav-mobile-close");
    var backdrop = panel && panel.querySelector("[data-site-nav-backdrop]");
    if (!panel || !toggle) return;

    var mq = window.matchMedia("(min-width: 1024px)");

    function isVimpModalOpen() {
      var m = document.getElementById("vimp-news-modal");
      var h = document.getElementById("highlight-news-modal");
      var g = document.getElementById("gallery-lightbox");
      return (
        (m && !m.classList.contains("hidden")) ||
        (h && !h.classList.contains("hidden")) ||
        (g && !g.classList.contains("hidden"))
      );
    }

    function bodyScrollLock(on) {
      if (on) {
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
      } else if (!isVimpModalOpen()) {
        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("overflow-hidden");
      }
    }

    function openNav() {
      panel.classList.remove("hidden");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      bodyScrollLock(true);
    }

    function closeNav() {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      bodyScrollLock(false);
    }

    function onToggleClick() {
      if (panel.classList.contains("hidden")) {
        openNav();
      } else {
        closeNav();
      }
    }

    toggle.addEventListener("click", onToggleClick);
    if (closeBtn) closeBtn.addEventListener("click", closeNav);
    if (backdrop) backdrop.addEventListener("click", closeNav);

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape" || panel.classList.contains("hidden")) return;
        closeNav();
      },
      true
    );

    panel.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || !panel.contains(a)) return;
      if (a.getAttribute("href") === "#" && !a.classList.contains("js-nav-home-vimp")) return;
      closeNav();
    });

    function onResize() {
      if (mq.matches && !panel.classList.contains("hidden")) closeNav();
    }
    window.addEventListener("resize", onResize, { passive: true });
  }

  /**
   * Home hero: padding-top = fixed header height + same gap as hero grid row-gap
   * (see render.js: gap-4 / lg:gap-y-5) so the white strip under the menu matches
   * the strip between the fund appeal card and the news card.
   */
  function initHomeHeroTopPadding() {
    var hero = document.getElementById("home-hero");
    var header = document.getElementById("site-header");
    if (!hero || !header) return;

    function rootRem() {
      return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    }

    /** Matches Tailwind gap-y: gap-4 → 1rem, lg:gap-y-5 → 1.25rem */
    function heroStripRem() {
      return window.matchMedia("(min-width: 1024px)").matches ? 1.25 : 1;
    }

    function apply() {
      hero.style.paddingTop = header.offsetHeight + rootRem() * heroStripRem() + "px";
    }

    apply();
    window.addEventListener("resize", apply, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      var ro = new ResizeObserver(function () {
        apply();
      });
      ro.observe(header);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        apply();
      });
    }
  }

  function initReveal() {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var nodes = document.querySelectorAll("[data-reveal]");
    if (reduceMotion) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var staggerRoot = document.querySelectorAll("[data-reveal-stagger]");
    staggerRoot.forEach(function (root) {
      var children = root.querySelectorAll("[data-reveal]");
      children.forEach(function (el, i) {
        el.style.transitionDelay = i * 75 + "ms";
      });
    });
    nodes.forEach(function (el) {
      if (!el.closest("[data-reveal-stagger]")) {
        el.style.transitionDelay = "0ms";
      }
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  /** Only block placeholder forms (action "#"). Real forms POST to Web3Forms. */
  function initForms() {
    document.addEventListener(
      "submit",
      function (e) {
        var form = e.target;
        if (form.tagName !== "FORM") return;
        var action = form.getAttribute("action") || "";
        if (action === "#" || action === "" || action == null) {
          e.preventDefault();
        }
      },
      true
    );
  }

  function initCopyPageUrl() {
    document.querySelectorAll(".js-copy-page-url").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var url = btn.getAttribute("data-url") || "";
        if (!url && typeof window !== "undefined") url = window.location.href;
        if (!navigator.clipboard || !navigator.clipboard.writeText) return;
        navigator.clipboard.writeText(url).then(function () {
          var prev = btn.getAttribute("aria-label") || "Copy link";
          btn.setAttribute("aria-label", "Copied");
          setTimeout(function () {
            btn.setAttribute("aria-label", prev);
          }, 2000);
        });
      });
    });
  }

  function initHighlightNewsModal() {
    var C = typeof window.SITE_CONTENT !== "undefined" ? window.SITE_CONTENT : {};
    var hn = C.highlightNews;
    if (!hn || !hn.enabled || !hn.showModalOnOpen) return;

    var storageKey =
      "dg-hs-highlight-" + String(hn.cacheBust || hn.headline || "default").trim();
    if (hn.oncePerSession !== false) {
      try {
        if (sessionStorage.getItem(storageKey) === "1") return;
      } catch (e) {}
    }

    var modal = document.getElementById("highlight-news-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "highlight-news-modal";
      modal.className =
        "fixed inset-0 z-[100] hidden items-center justify-center p-4 sm:p-6 lg:p-10";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "highlight-news-title");
      modal.innerHTML =
        '<div class="highlight-backdrop absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/92 to-black/95 backdrop-blur-md" data-highlight-dismiss aria-hidden="true"></div>' +
        '<div class="relative z-10 flex w-full max-w-5xl items-center justify-center" style="perspective:1200px">' +
        '<div class="highlight-poster-card relative w-full max-h-[min(92vh,880px)] overflow-hidden rounded-2xl bg-gradient-to-br from-mes-nav via-mes-navDeep to-slate-950 p-[3px] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.75)] ring-1 ring-mes-goldLine/30 sm:rounded-3xl">' +
        '<div class="relative max-h-[inherit] overflow-hidden rounded-[0.85rem] sm:rounded-[1.25rem]">' +
        '<button type="button" class="absolute right-2 top-2 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/55 text-2xl font-light text-white backdrop-blur-sm transition hover:bg-black/75 sm:right-3 sm:top-3" data-highlight-dismiss aria-label="Close">×</button>' +
        '<div class="grid max-h-[inherit] overflow-y-auto lg:grid-cols-12 lg:overflow-hidden">' +
        '<div id="highlight-modal-media" class="relative lg:col-span-5"></div>' +
        '<div class="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:col-span-7 lg:py-12">' +
        '<p id="highlight-modal-badge" class="text-xs font-bold uppercase tracking-[0.2em] text-mes-goldLine"></p>' +
        '<h2 id="highlight-news-title" class="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl"></h2>' +
        '<p id="highlight-modal-student" class="mt-2 font-display text-lg font-semibold text-mes-goldLine sm:text-xl"></p>' +
        '<p id="highlight-modal-body" class="mt-4 text-sm leading-relaxed text-white/90 sm:text-base"></p>' +
        '<a id="highlight-modal-link" class="mt-6 hidden inline-flex w-fit items-center gap-2 rounded-full bg-mes-accent px-5 py-2.5 text-sm font-semibold text-mes-primary shadow-lg transition hover:bg-mes-accentLight"></a>' +
        "</div></div></div></div></div>";
      document.body.appendChild(modal);
    }

    var imgUrl = (hn.posterImage || "").trim();
    if (imgUrl && imgUrl.indexOf("http") !== 0 && imgUrl.charAt(0) !== "/") {
      if (imgUrl.indexOf("images/") === 0) imgUrl = "/" + imgUrl;
    }
    var bust = (hn.cacheBust || "").trim();
    if (imgUrl && bust) {
      imgUrl += (imgUrl.indexOf("?") >= 0 ? "&" : "?") + "cb=" + encodeURIComponent(bust);
    }

    var mediaEl = document.getElementById("highlight-modal-media");
    if (mediaEl) {
      mediaEl.innerHTML = imgUrl
        ? '<img src="' +
          imgUrl.replace(/"/g, "&quot;") +
          '" alt="" class="h-full min-h-[12rem] w-full object-cover object-top lg:min-h-full lg:max-h-[min(92vh,880px)]"/>'
        : "";
    }

    var badgeEl = document.getElementById("highlight-modal-badge");
    if (badgeEl) badgeEl.textContent = hn.badge || "Highlight";
    var titleEl = document.getElementById("highlight-news-title");
    if (titleEl) titleEl.textContent = hn.headline || "School highlight";
    var studentEl = document.getElementById("highlight-modal-student");
    if (studentEl) {
      var sn = (hn.studentName || "").trim();
      studentEl.textContent = sn;
      studentEl.classList.toggle("hidden", !sn);
    }
    var bodyEl = document.getElementById("highlight-modal-body");
    if (bodyEl) bodyEl.textContent = hn.accomplishment || "";
    var linkEl = document.getElementById("highlight-modal-link");
    if (linkEl) {
      var lh = (hn.linkHref || "").trim();
      var ll = (hn.linkLabel || "").trim();
      if (lh && ll) {
        linkEl.href = lh;
        linkEl.textContent = ll + " →";
        linkEl.classList.remove("hidden");
      } else {
        linkEl.classList.add("hidden");
      }
    }

    var open = false;
    var closeTimer = null;
    function setOpen(shouldOpen) {
      open = shouldOpen;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (shouldOpen) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        modal.classList.remove("highlight-open");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            modal.classList.add("highlight-open");
          });
        });
        if (hn.oncePerSession !== false) {
          try {
            sessionStorage.setItem(storageKey, "1");
          } catch (e) {}
        }
      } else {
        modal.classList.remove("highlight-open");
        closeTimer = setTimeout(function () {
          closeTimer = null;
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          document.body.classList.remove("overflow-hidden");
          document.documentElement.classList.remove("overflow-hidden");
        }, 280);
      }
    }

    modal.querySelectorAll("[data-highlight-dismiss]").forEach(function (el) {
      el.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
      },
      true
    );

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        setOpen(true);
      });
    });
  }

  function initGalleryLightbox() {
    var modal = document.getElementById("gallery-lightbox");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "gallery-lightbox";
      modal.className =
        "fixed inset-0 hidden items-center justify-center p-4 sm:p-8";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "Photo viewer");
      modal.innerHTML =
        '<div class="gallery-lightbox-backdrop absolute inset-0 bg-black/90 backdrop-blur-sm" data-lightbox-dismiss aria-hidden="true"></div>' +
        '<div class="gallery-lightbox-panel relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-6xl flex-col">' +
        '<button type="button" class="absolute -top-2 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/60 text-2xl font-light text-white transition hover:bg-black/80 sm:-right-2 sm:top-0" data-lightbox-dismiss aria-label="Close">×</button>' +
        '<figure class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-black/40 shadow-2xl ring-1 ring-white/10">' +
        '<div class="flex min-h-0 flex-1 items-center justify-center p-2 sm:p-4">' +
        '<img id="gallery-lightbox-img" src="" alt="" class="max-h-[min(78vh,820px)] w-auto max-w-full object-contain"/>' +
        "</div>" +
        '<figcaption id="gallery-lightbox-caption" class="shrink-0 border-t border-white/10 px-4 py-3 text-center text-sm text-white/90"></figcaption>' +
        "</figure></div>";
      document.body.appendChild(modal);
    }

    var imgEl = document.getElementById("gallery-lightbox-img");
    var capEl = document.getElementById("gallery-lightbox-caption");
    var lbOpen = false;
    var lbTimer = null;

    function setLightboxOpen(on, src, alt, caption) {
      lbOpen = on;
      if (lbTimer) {
        clearTimeout(lbTimer);
        lbTimer = null;
      }
      if (on) {
        if (imgEl) {
          imgEl.src = src || "";
          imgEl.alt = alt || "";
        }
        if (capEl) {
          capEl.textContent = caption || alt || "";
          capEl.classList.toggle("hidden", !(caption || alt));
        }
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        modal.classList.remove("gallery-lightbox-open");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            modal.classList.add("gallery-lightbox-open");
          });
        });
      } else {
        modal.classList.remove("gallery-lightbox-open");
        lbTimer = setTimeout(function () {
          lbTimer = null;
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          document.body.classList.remove("overflow-hidden");
          document.documentElement.classList.remove("overflow-hidden");
          if (imgEl) imgEl.src = "";
        }, 250);
      }
    }

    document.addEventListener("click", function (e) {
      var btn = e.target.closest && e.target.closest(".js-gallery-lightbox");
      if (!btn) return;
      e.preventDefault();
      var src = btn.getAttribute("data-lightbox-src") || "";
      var alt = btn.getAttribute("data-lightbox-alt") || "";
      var caption = btn.getAttribute("data-lightbox-caption") || "";
      if (src) setLightboxOpen(true, src, alt, caption);
    });

    modal.querySelectorAll("[data-lightbox-dismiss]").forEach(function (el) {
      el.addEventListener("click", function () {
        setLightboxOpen(false);
      });
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape" || !lbOpen) return;
        setLightboxOpen(false);
      },
      true
    );
  }

  function initVimpNewsModal() {
    var C = typeof window.SITE_CONTENT !== "undefined" ? window.SITE_CONTENT : {};
    if (C.highlightNews && C.highlightNews.enabled && C.highlightNews.showModalOnOpen) return;
    var cfg = typeof window.SITE_CONFIG !== "undefined" ? window.SITE_CONFIG : {};
    var vn = cfg.vimpNews;
    if (!vn || !vn.enabled) return;

    var homeBase =
      ((cfg.homePageHref || "index.html").trim().split("#")[0] || "index.html");
    var flashHash = "#flash-news";

    var modal = document.getElementById("vimp-news-modal");
    var img = document.getElementById("vimp-news-img");

    var open = false;
    var closeTimer = null;
    function setOpen(shouldOpen) {
      if (!modal) return;
      open = shouldOpen;
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      if (shouldOpen) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
        modal.classList.remove("vimp-open");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            modal.classList.add("vimp-open");
          });
        });
      } else {
        modal.classList.remove("vimp-open");
        closeTimer = setTimeout(function () {
          closeTimer = null;
          modal.classList.add("hidden");
          modal.classList.remove("flex");
          document.body.classList.remove("overflow-hidden");
          document.documentElement.classList.remove("overflow-hidden");
        }, 280);
      }
    }

    /**
     * Capture phase + always preventDefault: same-page href="index.html" often triggers a full reload
     * on first click; that prevented the modal from opening until a second click.
     * From other pages we go to index.html#flash-news and open after load (no modal on plain index load).
     */
    document.addEventListener(
      "click",
      function (e) {
        var a = e.target.closest && e.target.closest("a.js-nav-home-vimp");
        if (!a) return;
        e.preventDefault();
        if (document.body.getAttribute("data-page") === "home") {
          setOpen(true);
        } else {
          window.location.href = homeBase + flashHash;
        }
      },
      true
    );

    if (!modal || !img) return;

    var url = (vn.imageUrl || "").trim();
    if (url) {
      var bust = (vn.cacheBust || "").trim();
      if (bust) {
        var sep = url.indexOf("?") >= 0 ? "&" : "?";
        url = url + sep + "cb=" + encodeURIComponent(bust);
      }
      img.src = url;
      img.alt = (vn.imageAlt || "Flash news").trim() || "Flash news";
    }

    modal.querySelectorAll("[data-vimp-dismiss]").forEach(function (el) {
      el.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Escape" || !open) return;
        setOpen(false);
      },
      true
    );

    if (location.hash === flashHash) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      } else {
        window.location.hash = "";
      }
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          setOpen(true);
        });
      });
    }
  }

  function initHeroSlider() {
    var img = document.getElementById("hero-slide-img");
    var prev = document.getElementById("hero-prev");
    var next = document.getElementById("hero-next");
    var dotsRoot = document.getElementById("hero-dots");
    var sliderEl = document.getElementById("hero-slider");
    if (!img || !prev || !next || !dotsRoot) return;
    var C = window.SITE_CONTENT || {};
    var h = C.home && C.home.hero;
    var slides = (h && h.slides && h.slides.length && h.slides) || [];
    if (!slides.length && h && h.image) slides = [h.image];
    if (slides.length <= 1) {
      dotsRoot.innerHTML = "";
      prev.setAttribute("aria-hidden", "true");
      next.setAttribute("aria-hidden", "true");
      prev.classList.add("pointer-events-none", "opacity-30");
      next.classList.add("pointer-events-none", "opacity-30");
      return;
    }
    var i = 0;
    var INTERVAL_MS = 5000;
    var timerId = null;
    var prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function stopAuto() {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function startAuto() {
      if (prefersReducedMotion) return;
      stopAuto();
      timerId = setInterval(function () {
        i = (i + 1) % slides.length;
        update();
      }, INTERVAL_MS);
    }

    function onManualNav() {
      if (!prefersReducedMotion) startAuto();
    }

    function renderDots() {
      dotsRoot.innerHTML = slides
        .map(function (_, j) {
          return (
            '<button type="button" class="h-2 w-2 rounded-full transition ' +
            (j === i ? "bg-mes-accentLight" : "bg-white/50") +
            '" data-idx="' +
            j +
            '" aria-label="Slide ' +
            (j + 1) +
            '"></button>'
          );
        })
        .join("");
      dotsRoot.querySelectorAll("button").forEach(function (btn) {
        btn.addEventListener("click", function () {
          i = parseInt(btn.getAttribute("data-idx") || "0", 10);
          update();
          onManualNav();
        });
      });
    }
    function update() {
      img.src = slides[i];
      renderDots();
    }
    prev.addEventListener("click", function () {
      i = (i - 1 + slides.length) % slides.length;
      update();
      onManualNav();
    });
    next.addEventListener("click", function () {
      i = (i + 1) % slides.length;
      update();
      onManualNav();
    });
    renderDots();
    startAuto();

    if (sliderEl) {
      sliderEl.addEventListener("mouseenter", stopAuto);
      sliderEl.addEventListener("mouseleave", startAuto);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stopAuto();
      } else {
        startAuto();
      }
    });
  }

  function initSiteAtmosphere() {
    document.body.classList.add("site-body");

    if (!document.getElementById("site-atmosphere")) {
      var wrap = document.createElement("div");
      wrap.id = "site-atmosphere";
      wrap.setAttribute("aria-hidden", "true");
      wrap.innerHTML =
        '<div class="site-atmosphere__dual"></div>' +
        '<div class="site-atmosphere__dual-stripe"></div>' +
        '<div class="site-atmosphere__mesh"></div>' +
        '<div class="site-atmosphere__grid"></div>' +
        '<div class="site-atmosphere__orb site-atmosphere__orb--1"></div>' +
        '<div class="site-atmosphere__orb site-atmosphere__orb--2"></div>' +
        '<div class="site-atmosphere__orb site-atmosphere__orb--3"></div>';
      document.body.insertBefore(wrap, document.body.firstChild);
    }

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    var orbs = document.querySelectorAll(".site-atmosphere__orb");
    if (!orbs.length) return;

    document.addEventListener(
      "mousemove",
      function (e) {
        var x = (e.clientX / window.innerWidth - 0.5) * 24;
        var y = (e.clientY / window.innerHeight - 0.5) * 24;
        for (var i = 0; i < orbs.length; i++) {
          var f = (i + 1) * 0.45;
          orbs[i].style.transform = "translate(" + x * f + "px," + y * f + "px)";
        }
      },
      { passive: true }
    );
  }

  function initPage() {
    initSiteAtmosphere();
    if (typeof window.renderPageContent === "function") {
      window.renderPageContent();
    }
    initHomeHeroTopPadding();
    initHeroSlider();
    initHighlightNewsModal();
    initVimpNewsModal();
    initGalleryLightbox();
    initMobileNav();
    initCopyPageUrl();
    initHeaderScroll();
    initReveal();
    initForms();
  }

  window.initHomeHeroTopPadding = initHomeHeroTopPadding;
  window.initMobileNav = initMobileNav;
  window.initHeaderScroll = initHeaderScroll;
  window.initReveal = initReveal;
  window.initHeroSlider = initHeroSlider;
  window.initPage = initPage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})();
