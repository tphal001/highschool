/**
 * Decap CMS — Gallery: checkbox multi-select in Media modal + add each photo as a list row.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var PICK_KEY = "siteGalleryMediaPick";
  var PENDING_PATHS_KEY = "siteGalleryPendingPaths";
  var ITEMS_BACKUP_KEY = "siteGalleryItemsBackup";
  var PUBLIC_FOLDER = "/images";

  function boot() {
    if (!window.CMS) return;
    var oldBar = document.getElementById("site-gallery-media-bar");
    if (oldBar) oldBar.remove();
    registerPreSave();
    injectStyles();
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", onRouteChange);
    waitForStore(function () {
      patchStore();
      onRouteChange();
      window.setInterval(tick, 500);
      watchDom();
    });
  }

  function waitForStore(fn, n) {
    n = n || 0;
    if (getStore()) {
      fn();
      return;
    }
    if (n > 80) return;
    window.setTimeout(function () {
      waitForStore(fn, n + 1);
    }, 200);
  }

  function getStore() {
    if (!window.CMS) return null;
    if (typeof CMS.getStore === "function") return CMS.getStore();
    if (CMS.store) return CMS.store;
    return null;
  }

  function isGalleryHash() {
    return /\/collections\/staff_content\/entries\/gallery/i.test(window.location.hash || "");
  }

  function isMediaHash() {
    var h = window.location.hash || "";
    return h === "#/media" || h.indexOf("#/media/") === 0;
  }

  function getMediaRoot() {
    return (
      document.querySelector("[class*='MediaLibraryModal']") ||
      document.querySelector("[class*='MediaLibrary']") ||
      document.querySelector("[role='dialog']") ||
      (isMediaHash() ? document.querySelector("main") : null)
    );
  }

  function isMediaSurface() {
    if (isMediaHash()) return true;
    return !!getMediaRoot();
  }

  function isGalleryEntry(entry) {
    if (!entry || !entry.get) return false;
    return entry.get("file") === GALLERY_FILE || entry.get("slug") === "gallery";
  }

  function getGalleryDraftEntry() {
    var store = getStore();
    if (!store) return null;
    var draft = store.getState().entryDraft;
    var entry = draft && draft.get && draft.get("entry");
    return isGalleryEntry(entry) ? entry : null;
  }

  function isPickSessionActive() {
    return sessionStorage.getItem(PICK_KEY) === "1";
  }

  function shouldEnhanceMediaUi() {
    if (!isMediaSurface()) return false;
    if (isPickSessionActive() || sessionStorage.getItem(PENDING_PATHS_KEY)) return true;
    if (getGalleryDraftEntry()) return true;
    return false;
  }

  function toJs(val) {
    if (!val) return val;
    return val.toJS ? val.toJS() : val;
  }

  function fromJs(val) {
    if (window.Immutable && window.Immutable.fromJS) return window.Immutable.fromJS(val);
    return val;
  }

  function normalizeItems(val) {
    var v = toJs(val);
    if (!Array.isArray(v)) return [];
    return v
      .map(function (row) {
        if (!row || typeof row !== "object") return null;
        return {
          title: String(row.title || "").trim(),
          category: String(row.category || "").trim(),
          image: String(row.image || "").trim(),
        };
      })
      .filter(function (row) {
        return row && row.image;
      });
  }

  function backupGalleryItems() {
    var entry = getGalleryDraftEntry();
    if (!entry) return;
    sessionStorage.setItem(ITEMS_BACKUP_KEY, JSON.stringify(normalizeItems(entry.getIn(["data", "items"]))));
  }

  function getCurrentItems() {
    var entry = getGalleryDraftEntry();
    if (entry) return normalizeItems(entry.getIn(["data", "items"]));
    try {
      var raw = sessionStorage.getItem(ITEMS_BACKUP_KEY);
      return raw ? normalizeItems(JSON.parse(raw)) : [];
    } catch (e) {
      return [];
    }
  }

  function pathsFromImage(val) {
    if (!val) return [];
    if (typeof val === "string") return val.trim() ? [val.trim()] : [];
    if (!Array.isArray(val)) return [];
    return val
      .map(function (row) {
        if (typeof row === "string") return row.trim();
        if (row && typeof row === "object") return String(row.image || row.url || "").trim();
        return "";
      })
      .filter(Boolean);
  }

  function expandItems(items) {
    var out = [];
    var changed = false;
    (items || []).forEach(function (item) {
      var paths = pathsFromImage(item && item.image);
      if (paths.length > 1) {
        changed = true;
        paths.forEach(function (path) {
          out.push({ title: item.title || "", category: item.category || "", image: path });
        });
        return;
      }
      out.push({
        title: item.title || "",
        category: item.category || "",
        image: paths.length === 1 ? paths[0] : (item && item.image) || "",
      });
    });
    return { items: out, changed: changed };
  }

  function registerPreSave() {
    if (!CMS.registerEventListener) return;
    CMS.registerEventListener({
      name: "preSave",
      handler: function (args) {
        var entry = args && args.entry;
        if (!isGalleryEntry(entry)) return;
        var data = entry.get("data");
        if (!data) return;
        var result = expandItems(toJs(data.get("items")));
        if (!result.changed) return;
        if (data.merge) return entry.set("data", data.merge({ items: fromJs(result.items) }));
      },
    });
  }

  function getGalleryItemsField(state) {
    try {
      var collection = state.collections.get("staff_content");
      var files = collection && collection.get("files");
      if (!files || !files.find) return null;
      var galleryFile = files.find(function (f) {
        return f.get("name") === "gallery";
      });
      if (!galleryFile) return null;
      return galleryFile.get("fields").find(function (f) {
        return f.get("name") === "items";
      });
    } catch (e) {
      return null;
    }
  }

  function appendPhotosViaStore(paths) {
    var store = getStore();
    if (!store) return false;
    var state = store.getState();
    var entry = getGalleryDraftEntry();
    if (!entry) return false;

    var items = getCurrentItems();
    var seen = {};
    items.forEach(function (it) {
      seen[it.image] = true;
    });

    var added = [];
    paths.forEach(function (p) {
      p = String(p || "").trim();
      if (p && !seen[p]) {
        seen[p] = true;
        added.push({ title: "", category: "", image: p });
      }
    });
    if (!added.length) return true;

    items = added.concat(items);

    var field = getGalleryItemsField(state);
    if (!field) return false;

    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: {
        field: field,
        value: fromJs(items),
        metadata: {},
        entries: [],
      },
    });

    sessionStorage.setItem(ITEMS_BACKUP_KEY, JSON.stringify(items));
    return true;
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-media-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-media-css";
    style.textContent =
      ".site-media-check-wrap{position:absolute!important;top:8px!important;left:8px!important;z-index:100002!important;width:28px!important;height:28px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:6px!important;background:#0e7490!important;border:3px solid #fff!important;box-shadow:0 2px 6px rgba(0,0,0,0.45)!important;pointer-events:auto!important;}" +
      ".site-media-check{width:20px!important;height:20px!important;cursor:pointer!important;margin:0!important;accent-color:#fff!important;}" +
      ".site-media-card-target{position:relative!important;overflow:visible!important;}";
    document.head.appendChild(style);
  }

  function showToast(msg) {
    var el = document.getElementById("site-gallery-media-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-gallery-media-toast";
      el.style.cssText =
        "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:100001;padding:0.65rem 1rem;border-radius:0.5rem;background:#0f172a;color:#fff;font-size:0.8125rem;font-weight:600;max-width:92vw;text-align:center;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      el.style.display = "none";
    }, 7000);
  }

  function publicPath(name, url) {
    name = String(name || "").trim();
    if (!name && url) {
      var parts = String(url).split("/");
      name = parts[parts.length - 1].split("?")[0];
    }
    if (!name) return "";
    if (name.indexOf("/") === 0) return name;
    if (name.indexOf("images/") === 0) return "/" + name;
    if (name.indexOf("media/") === 0) return "/" + name;
    return PUBLIC_FOLDER + "/" + name.replace(/^\/+/, "");
  }

  function filenameFromCard(card, img) {
    if (!card) return "";
    var input = card.querySelector("input");
    if (input && input.value && /\.(jpe?g|png|gif|webp|svg)$/i.test(input.value)) {
      return input.value.trim();
    }
    var children = card.querySelectorAll("span, p, label, div, button");
    for (var i = 0; i < children.length; i++) {
      var t = (children[i].textContent || "").trim();
      if (t && t.length < 80 && /\.(jpe?g|png|gif|webp|svg)$/i.test(t) && children[i] !== card) {
        return t;
      }
    }
    return publicPath("", img && img.src);
  }

  function isMediaThumb(img) {
    if (!img || !img.src || img.src.indexOf("data:") === 0) return false;
    // Lazy-loaded thumbs often report 0×0 until decoded — still inject checkboxes.
    var w = img.width || img.naturalWidth || 0;
    var h = img.height || img.naturalHeight || 0;
    if (w === 0 || h === 0) return true;
    return w >= 32 && h >= 32;
  }

  function smallestCardForImage(img, root) {
    var best = img.parentElement;
    var el = img.parentElement;
    while (el && el !== root) {
      var imgs = el.getElementsByTagName("img");
      if (imgs.length === 1 && imgs[0] === img) {
        best = el;
        el = el.parentElement;
        continue;
      }
      break;
    }
    return best || img.parentElement;
  }

  function collectMediaCards() {
    var cards = [];
    var seenImg = [];
    var root = getMediaRoot() || document.body;

    root.querySelectorAll("img").forEach(function (img) {
      if (!isMediaThumb(img)) return;
      if (seenImg.indexOf(img) >= 0) return;
      seenImg.push(img);

      var host = smallestCardForImage(img, root);
      if (!host) return;

      var outer = host;
      var walk = host;
      while (walk && walk !== root) {
        var oneImg = walk.getElementsByTagName("img");
        if (oneImg.length === 1 && oneImg[0] === img) outer = walk;
        else if (oneImg.length > 1) break;
        walk = walk.parentElement;
      }

      var path = filenameFromCard(outer, img);
      if (!path) path = publicPath("", img.src);
      if (!path) return;

      host.classList.add("site-media-card-target");
      host.setAttribute("data-site-media-path", path);
      cards.push({ host: host, path: path, img: img });
    });

    return cards;
  }

  function injectCheckboxes() {
    if (!shouldEnhanceMediaUi()) return;
    collectMediaCards().forEach(function (item) {
      var host = item.host;
      if (host.getAttribute("data-site-gallery-check") === item.path) return;
      if (host.querySelector(".site-media-check-wrap")) host.querySelector(".site-media-check-wrap").remove();

      var wrap = document.createElement("div");
      wrap.className = "site-media-check-wrap";
      wrap.title = "Select for gallery";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "site-media-check";
      cb.setAttribute("data-path", item.path);
      cb.setAttribute("aria-label", "Select " + item.path);
      cb.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      cb.addEventListener("mousedown", function (e) {
        e.stopPropagation();
      });

      wrap.appendChild(cb);
      host.appendChild(wrap);
      host.setAttribute("data-site-gallery-check", item.path);
    });

    var root = getMediaRoot() || document.body;
    root.querySelectorAll("img").forEach(function (img) {
      if (img.complete || img.getAttribute("data-site-gallery-load")) return;
      img.setAttribute("data-site-gallery-load", "1");
      img.addEventListener(
        "load",
        function () {
          injectCheckboxes();
        },
        { once: true }
      );
    });
  }

  function startPickSession() {
    sessionStorage.setItem(PICK_KEY, "1");
    backupGalleryItems();
    window.setTimeout(injectCheckboxes, 100);
    window.setTimeout(injectCheckboxes, 600);
  }

  function isChooseSelectedButton(node) {
    if (!node) return false;
    var text = (node.textContent || "").trim().toLowerCase();
    if (text === "choose selected" || text.indexOf("choose selected") >= 0) return true;
    var label = (node.getAttribute("aria-label") || "").trim().toLowerCase();
    return label.indexOf("choose selected") >= 0;
  }

  function onDocumentClick(e) {
    var node = e.target.closest ? e.target.closest("button, a, span, label") : null;
    if (!node) return;
    var text = (node.textContent || "").trim().toLowerCase();

    if (isGalleryHash() || getGalleryDraftEntry()) {
      if (
        text.indexOf("choose media") >= 0 ||
        text.indexOf("choose an image") >= 0 ||
        text.indexOf("choose image") >= 0 ||
        text.indexOf("insert from media") >= 0
      ) {
        startPickSession();
        return;
      }
    }

    if (!shouldEnhanceMediaUi()) return;

    if (isChooseSelectedButton(node)) {
      var paths = getTickedPaths();
      if (!paths.length) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      addTickedToGallery();
    }
  }

  function getTickedPaths() {
    var paths = [];
    var seen = {};
    document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
      var p = cb.getAttribute("data-path") || "";
      if (!p) {
        var card = cb.closest("[data-site-media-path]");
        p = card && card.getAttribute("data-site-media-path");
      }
      p = String(p || "").trim();
      if (p && !seen[p]) {
        seen[p] = true;
        paths.push(p);
      }
    });
    return paths;
  }

  function closeMediaModal() {
    var buttons = document.querySelectorAll("[class*='MediaLibrary'] button, [role='dialog'] button");
    for (var i = 0; i < buttons.length; i++) {
      var label = (buttons[i].getAttribute("aria-label") || buttons[i].textContent || "").toLowerCase();
      if (label.indexOf("close") >= 0 || label === "×" || label === "x") {
        buttons[i].click();
        return;
      }
    }
  }

  function addTickedToGallery() {
    var paths = getTickedPaths();
    if (!paths.length) {
      showToast("Tick at least one photo (teal checkbox on top-left of each image).");
      return;
    }

    if (appendPhotosViaStore(paths)) {
      sessionStorage.removeItem(PICK_KEY);
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
        cb.checked = false;
      });
      showToast(paths.length + " photo(s) added to Gallery.");
      closeMediaModal();
      return;
    }

    sessionStorage.setItem(PENDING_PATHS_KEY, JSON.stringify(paths));
    sessionStorage.removeItem(PICK_KEY);
    showToast(paths.length + " photo(s) queued — returning to Gallery…");
    closeMediaModal();
    window.setTimeout(applyPendingPaths, 600);
  }

  function applyPendingPaths() {
    var raw = sessionStorage.getItem(PENDING_PATHS_KEY);
    if (!raw) return;

    var paths;
    try {
      paths = JSON.parse(raw);
    } catch (e) {
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      return;
    }
    if (!paths || !paths.length) {
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      return;
    }

    if (appendPhotosViaStore(paths)) {
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      showToast(paths.length + " photo(s) added to Gallery.");
    }
  }

  function patchStore() {
    var store = getStore();
    if (!store || store.__siteGalleryPatched) return;
    store.__siteGalleryPatched = true;
    var orig = store.dispatch.bind(store);

    store.dispatch = function (action) {
      if (action && action.type === "MEDIA_LIBRARY_OPEN") {
        var payload = action.payload || {};
        if (getGalleryDraftEntry() && payload.forImage !== false) {
          startPickSession();
        }
      }

      var result = orig(action);

      if (action && action.type === "MEDIA_INSERT" && (isPickSessionActive() || getGalleryDraftEntry())) {
        window.setTimeout(function () {
          var payload = action.payload || {};
          var paths = pathsFromImage(payload.mediaPath);
          if (paths.length > 1) appendPhotosViaStore(paths);
        }, 300);
      }

      if (action && action.type === "MEDIA_LIBRARY_CLOSE") {
        sessionStorage.removeItem(PICK_KEY);
      }

      return result;
    };
  }

  function watchDom() {
    if (watchDom._on) return;
    watchDom._on = true;
    var obs = new MutationObserver(function () {
      if (shouldEnhanceMediaUi()) injectCheckboxes();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function onRouteChange() {
    if (isMediaHash() && getGalleryDraftEntry()) startPickSession();
    if (shouldEnhanceMediaUi()) injectCheckboxes();
    if (isGalleryHash()) applyPendingPaths();
  }

  function tick() {
    if (shouldEnhanceMediaUi()) injectCheckboxes();
    if (isGalleryHash() && sessionStorage.getItem(PENDING_PATHS_KEY)) {
      applyPendingPaths();
    }
  }

  boot();
})();
