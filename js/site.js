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
      return m && !m.classList.contains("hidden");
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

  function initVimpNewsModal() {
    var cfg = typeof window.SITE_CONFIG !== "undefined" ? window.SITE_CONFIG : {};
    var vn = cfg.vimpNews;
    if (!vn || !vn.enabled) return;

    var homeBase =
      ((cfg.homePageHref || "index.html").trim().split("#")[0] || "index.html");
    var flashHash = "#flash-news";

    var modal = document.getElementById("vimp-news-modal");
    var img = document.getElementById("vimp-news-img");

    var open = false;
    function setOpen(shouldOpen) {
      if (!modal) return;
      open = shouldOpen;
      if (shouldOpen) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.classList.add("overflow-hidden");
        document.documentElement.classList.add("overflow-hidden");
      } else {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.classList.remove("overflow-hidden");
        document.documentElement.classList.remove("overflow-hidden");
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

  function initPage() {
    if (typeof window.renderPageContent === "function") {
      window.renderPageContent();
    }
    initHomeHeroTopPadding();
    initHeroSlider();
    initVimpNewsModal();
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
