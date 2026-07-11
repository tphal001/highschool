/**
 * Decap CMS — Gallery: Ctrl+click multi-select in Media, Choose selected adds rows.
 * Normal click = Decap's built-in single select (Choose selected works as usual).
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var PICK_KEY = "siteGalleryMediaPick";
  var PENDING_PATHS_KEY = "siteGalleryPendingPaths";
  var ITEMS_BACKUP_KEY = "siteGalleryItemsBackup";
  var PUBLIC_FOLDER = "/images";
  var multiSelected = Object.create(null);

  function boot() {
    if (!window.CMS) return;
    registerPreSave();
    injectStyles();
    replaceChooseImageLabels();
    markChooseMediaButtons();
    hideInsertFromUrl();
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", onRouteChange);
    waitForStore(function () {
      patchStore();
      onRouteChange();
      window.setInterval(tick, 300);
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
    var nodes = document.querySelectorAll("[class*='MediaLibrary'], [role='dialog']");
    for (var i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i].querySelector("img")) return nodes[i];
    }
    if (isMediaHash()) return document.querySelector("main");
    return null;
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

  function shouldUseGalleryMulti() {
    if (!isMediaSurface()) return false;
    return isPickSessionActive() || !!getGalleryDraftEntry();
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

  function registerPreSave() {
    if (!CMS.registerEventListener) return;
    CMS.registerEventListener({
      name: "preSave",
      handler: function () {},
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

  function replaceChooseImageLabels() {
    var pairs = [
      ["Choose an image", "Choose Media"],
      ["Choose images", "Choose Media"],
      ["Choose image", "Choose Media"],
    ];
    document.querySelectorAll("button, a, span, label, p").forEach(function (el) {
      pairs.forEach(function (pair) {
        if ((el.textContent || "").trim() === pair[0]) el.textContent = pair[1];
      });
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        var text = node.textContent;
        var next = text;
        pairs.forEach(function (pair) {
          if (next.indexOf(pair[0]) >= 0) next = next.split(pair[0]).join(pair[1]);
        });
        if (next !== text) node.textContent = next;
      }
    });
  }

  function hideInsertFromUrl() {
    var hide = ["Insert from URL", "Replace with URL"];
    document.querySelectorAll("button, a").forEach(function (el) {
      var t = (el.textContent || "").trim();
      if (hide.indexOf(t) >= 0) el.style.setProperty("display", "none", "important");
    });
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-media-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-media-css";
    style.textContent =
      ".site-gallery-multi-selected{outline:4px solid #047857!important;outline-offset:-3px!important;}" +
      "button.site-choose-media-btn{color:transparent!important;}" +
      "button.site-choose-media-btn *{visibility:hidden!important;}" +
      "button.site-choose-media-btn::after{content:'Choose Media';visibility:visible;color:#1666b8;font-size:0.8125rem;}";
    document.head.appendChild(style);
  }

  function markChooseMediaButtons() {
    document.querySelectorAll("button").forEach(function (btn) {
      var t = (btn.textContent || "").trim();
      if (t === "Choose an image" || t === "Choose images" || t === "Choose image") {
        btn.classList.add("site-choose-media-btn");
      }
    });
  }

  function showToast(msg) {
    var el = document.getElementById("site-gallery-media-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-gallery-media-toast";
      el.style.cssText =
        "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:2147483646;padding:0.65rem 1rem;border-radius:0.5rem;background:#0f172a;color:#fff;font-size:0.8125rem;font-weight:600;max-width:92vw;text-align:center;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      el.style.display = "none";
    }, 7000);
  }

  function publicPathFromFile(file) {
    if (!file) return "";
    var path = file.path || "";
    if (path.indexOf("/") === 0) return path;
    if (path.indexOf("images/") === 0) return "/" + path;
    return PUBLIC_FOLDER + "/" + String(path).replace(/^\/+/, "");
  }

  function cardFromTarget(target) {
    var root = getMediaRoot();
    if (!root || !target || !target.closest) return null;
    if (!root.contains(target)) return null;

    var img = target.closest("img");
    if (!img) return null;

    var card = img.parentElement;
    var walk = img.parentElement;
    while (walk && walk !== root) {
      if (walk.getElementsByTagName("img").length === 1) card = walk;
      walk = walk.parentElement;
    }

    var name = "";
    var children = card.querySelectorAll("span, p, label, div, button, input");
    for (var i = 0; i < children.length; i++) {
      var t = (children[i].textContent || "").trim();
      if (t && t.length < 80 && /\.(jpe?g|png|gif|webp|svg)$/i.test(t)) {
        name = t;
        break;
      }
    }

    var path = name ? PUBLIC_FOLDER + "/" + name : "";
    if (!path && img.src) {
      var parts = img.src.split("/");
      path = PUBLIC_FOLDER + "/" + parts[parts.length - 1].split("?")[0];
    }

    var key = name || path;
    return { card: card, path: path, key: key, file: { path: path.replace(/^\//, "images/"), name: name } };
  }

  function clearMultiSelection() {
    Object.keys(multiSelected).forEach(function (key) {
      var el = multiSelected[key].card;
      if (el && el.classList) el.classList.remove("site-gallery-multi-selected");
    });
    multiSelected = Object.create(null);
    syncChooseSelectedButton();
  }

  function toggleMultiSelection(hit) {
    if (multiSelected[hit.key]) {
      hit.card.classList.remove("site-gallery-multi-selected");
      delete multiSelected[hit.key];
    } else {
      multiSelected[hit.key] = hit;
      hit.card.classList.add("site-gallery-multi-selected");
    }
    syncChooseSelectedButton();
  }

  function getMultiPaths() {
    return Object.keys(multiSelected).map(function (k) {
      return multiSelected[k].path;
    });
  }

  function findChooseSelectedButton() {
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();
      if (t === "choose selected" || t.indexOf("choose selected") >= 0) return buttons[i];
    }
    return null;
  }

  function syncChooseSelectedButton() {
    var btn = findChooseSelectedButton();
    if (!btn) return;
    var count = Object.keys(multiSelected).length;
    if (count > 0) {
      btn.disabled = false;
      btn.removeAttribute("disabled");
    }
  }

  function startPickSession() {
    sessionStorage.setItem(PICK_KEY, "1");
    backupGalleryItems();
    clearMultiSelection();
  }

  function isChooseSelectedButton(node) {
    if (!node) return false;
    var t = (node.textContent || "").trim().toLowerCase();
    return t === "choose selected" || t.indexOf("choose selected") >= 0;
  }

  function onDocumentClick(e) {
    if (!shouldUseGalleryMulti()) {
      if (isGalleryHash() || getGalleryDraftEntry()) {
        var node = e.target.closest ? e.target.closest("button, a, span, label") : null;
        if (!node) return;
        var text = (node.textContent || "").trim().toLowerCase();
        if (
          text.indexOf("choose media") >= 0 ||
          text.indexOf("choose an image") >= 0 ||
          text.indexOf("choose image") >= 0
        ) {
          startPickSession();
        }
      }
      return;
    }

    var hit = cardFromTarget(e.target);
    if (hit && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleMultiSelection(hit);
      return;
    }

    if (isChooseSelectedButton(e.target.closest ? e.target.closest("button") : null)) {
      var paths = getMultiPaths();
      if (!paths.length) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      if (appendPhotosViaStore(paths)) {
        sessionStorage.removeItem(PICK_KEY);
        clearMultiSelection();
        showToast(paths.length + " photos added to Gallery.");
        closeMediaModal();
      } else {
        sessionStorage.setItem(PENDING_PATHS_KEY, JSON.stringify(paths));
        showToast(paths.length + " photos queued…");
        closeMediaModal();
        window.setTimeout(applyPendingPaths, 600);
      }
    }
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
        if (getGalleryDraftEntry() && action.payload && action.payload.forImage !== false) {
          clearMultiSelection();
          startPickSession();
        }
      }
      var result = orig(action);
      if (action && action.type === "MEDIA_LIBRARY_CLOSE") {
        sessionStorage.removeItem(PICK_KEY);
        clearMultiSelection();
      }
      return result;
    };
  }

  function watchDom() {
    if (watchDom._on) return;
    watchDom._on = true;
    var obs = new MutationObserver(function () {
      replaceChooseImageLabels();
      markChooseMediaButtons();
      hideInsertFromUrl();
      syncChooseSelectedButton();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function onRouteChange() {
    replaceChooseImageLabels();
    if (isGalleryHash()) applyPendingPaths();
  }

  function tick() {
    replaceChooseImageLabels();
    markChooseMediaButtons();
    hideInsertFromUrl();
    syncChooseSelectedButton();
    if (isGalleryHash() && sessionStorage.getItem(PENDING_PATHS_KEY)) applyPendingPaths();
  }

  boot();
})();
