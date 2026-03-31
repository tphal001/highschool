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

  function initForms() {
    document.addEventListener(
      "submit",
      function (e) {
        var form = e.target;
        if (form.tagName !== "FORM") return;
        var action = form.getAttribute("action") || "";

        if (action === "#" || action === "" || action == null) {
          e.preventDefault();
          return;
        }

        if (
          action.indexOf("https://formsubmit.co/") !== 0 ||
          action.indexOf("/ajax/") !== -1
        ) {
          return;
        }

        e.preventDefault();

        if (window.location.protocol === "file:") {
          alert(
            "Forms cannot send when you open the site as a file (address starts with file://).\n\n" +
              "Do this instead:\n" +
              "1. Open a terminal in your project folder.\n" +
              "2. Run: npx --yes serve .\n" +
              "3. In the browser, open the http://localhost link it prints.\n\n" +
              "Then use Submit / Send message again."
          );
          return;
        }

        var cfg = typeof window.SITE_CONFIG !== "undefined" ? window.SITE_CONFIG : {};
        var email = (cfg.formSubmissionEmail || cfg.contactEmail || "").trim();
        if (!email) {
          alert("Form email is not configured in js/site-config.js.");
          return;
        }

        var ajaxUrl = "https://formsubmit.co/ajax/" + encodeURIComponent(email);
        var fd = new FormData(form);
        fd.delete("_next");

        fetch(ajaxUrl, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        })
          .then(function (res) {
            if (res.ok) return res.json().catch(function () {
              return {};
            });
            throw new Error("Bad response");
          })
          .then(function (data) {
            if (data && data.success === false) {
              throw new Error(data.message || "Submission rejected");
            }
            var thanks = (cfg.formThankYouUrl || "").trim();
            window.location.href = thanks || "thank-you.html";
          })
          .catch(function () {
            alert(
              "Could not send the form. Check your internet connection, confirm the form email on FormSubmit.co, and try again. " +
              "If the problem continues, serve the site over http://localhost (npx serve .) or deploy to HTTPS."
            );
          });
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
