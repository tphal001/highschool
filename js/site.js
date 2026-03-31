/* site.js — forms use native POST (see render.js). No fetch. Redeploy after edits. */
(function () {
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

  /** Only block placeholder forms (action "#"). Real forms POST to Web3Forms (see render.js). */
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

  function initPage() {
    if (typeof window.renderPageContent === "function") {
      window.renderPageContent();
    }
    initHeaderScroll();
    initReveal();
    initForms();
  }

  window.initHeaderScroll = initHeaderScroll;
  window.initReveal = initReveal;
  window.initPage = initPage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }
})();
