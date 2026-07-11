/**
 * Decap CMS — Gallery: Ctrl+click multi-select in Media + Choose selected adds photo rows.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var PICK_KEY = "siteGalleryMediaPick";
  var PENDING_PATHS_KEY = "siteGalleryPendingPaths";
  var ITEMS_BACKUP_KEY = "siteGalleryItemsBackup";
  var PUBLIC_FOLDER = "/images";
  var selected = Object.create(null);

  function boot() {
    if (!window.CMS) return;
    registerPreSave();
    injectStyles();
    replaceImageWidgetLabels();
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", onRouteChange);
    waitForStore(function () {
      patchStore();
      onRouteChange();
      window.setInterval(tick, 250);
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

  function replaceImageWidgetLabels() {
    document.querySelectorAll("button, a, span, label, p").forEach(function (el) {
      if (el.children.length > 0) return;
      var t = (el.textContent || "").trim();
      if (t === "Choose an image" || t === "Choose images" || t === "Choose image") {
        el.textContent = "Choose media";
      } else if (t === "Choose different image") {
        el.textContent = "Choose different media";
      }
    });

    var pairs = [
      ["Choose an image", "Choose media"],
      ["Choose images", "Choose media"],
      ["Choose image", "Choose media"],
    ];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var text = node.textContent;
      if (!text) continue;
      var next = text;
      pairs.forEach(function (pair) {
        if (next.indexOf(pair[0]) >= 0) next = next.split(pair[0]).join(pair[1]);
      });
      if (next !== text) node.textContent = next;
    }
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-media-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-media-css";
    style.textContent =
      ".site-gallery-selected{outline:4px solid #047857!important;outline-offset:-3px;box-shadow:0 0 0 2px #fff inset!important;}" +
      ".site-gallery-hint{position:fixed;bottom:3.5rem;left:50%;transform:translateX(-50%);z-index:2147483000;padding:0.5rem 0.85rem;border-radius:0.5rem;background:#0f172a;color:#fff;font-size:0.75rem;font-weight:600;max-width:94vw;text-align:center;pointer-events:none;}";
    document.head.appendChild(style);
  }

  function showHint() {
    if (!shouldEnhanceMediaUi()) {
      var old = document.getElementById("site-gallery-hint");
      if (old) old.remove();
      return;
    }
    var el = document.getElementById("site-gallery-hint");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-gallery-hint";
      el.className = "site-gallery-hint";
      document.body.appendChild(el);
    }
    el.textContent = "Hold Ctrl (or Cmd on Mac), click photos to select several, then Choose selected.";
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

  function cardFromTarget(target) {
    var root = getMediaRoot();
    if (!root) return null;
    var img = target.closest ? target.closest("img") : null;
    if (!img || !root.contains(img)) return null;

    var card = img.parentElement;
    var walk = img.parentElement;
    while (walk && walk !== root) {
      if (walk.getElementsByTagName("img").length === 1) card = walk;
      walk = walk.parentElement;
    }

    var path = filenameFromCard(card, img);
    if (!path) path = publicPath("", img.src);
    if (!path) return null;

    return { card: card, path: path, img: img };
  }

  function clearSelection() {
    Object.keys(selected).forEach(function (path) {
      var el = selected[path];
      if (el && el.classList) el.classList.remove("site-gallery-selected");
    });
    selected = Object.create(null);
  }

  function setSingleSelection(hit) {
    clearSelection();
    selected[hit.path] = hit.card;
    hit.card.classList.add("site-gallery-selected");
  }

  function toggleSelection(hit) {
    if (selected[hit.path]) {
      hit.card.classList.remove("site-gallery-selected");
      delete selected[hit.path];
      return;
    }
    selected[hit.path] = hit.card;
    hit.card.classList.add("site-gallery-selected");
  }

  function getSelectedPaths() {
    return Object.keys(selected).filter(Boolean);
  }

  function startPickSession() {
    sessionStorage.setItem(PICK_KEY, "1");
    backupGalleryItems();
    showHint();
  }

  function isChooseSelectedButton(node) {
    if (!node) return false;
    var text = (node.textContent || "").trim().toLowerCase();
    if (text === "choose selected" || text.indexOf("choose selected") >= 0) return true;
    var label = (node.getAttribute("aria-label") || "").trim().toLowerCase();
    return label.indexOf("choose selected") >= 0;
  }

  function onDocumentClick(e) {
    if (shouldEnhanceMediaUi()) {
      var hit = cardFromTarget(e.target);
      if (hit && !isChooseSelectedButton(e.target.closest && e.target.closest("button"))) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopImmediatePropagation();
          toggleSelection(hit);
          return;
        }
        e.preventDefault();
        e.stopImmediatePropagation();
        setSingleSelection(hit);
        return;
      }
    }

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
      var paths = getSelectedPaths();
      if (!paths.length) {
        showToast("Select photos first (Ctrl+click each one), then Choose selected.");
        return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      addSelectedToGallery();
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

  function addSelectedToGallery() {
    var paths = getSelectedPaths();
    if (!paths.length) {
      showToast("Select photos first (Ctrl+click each one), then Choose selected.");
      return;
    }

    if (appendPhotosViaStore(paths)) {
      sessionStorage.removeItem(PICK_KEY);
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      clearSelection();
      showToast(paths.length + " photo(s) added to Gallery.");
      closeMediaModal();
      var hint = document.getElementById("site-gallery-hint");
      if (hint) hint.remove();
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
          clearSelection();
          startPickSession();
        }
      }

      var result = orig(action);

      if (action && action.type === "MEDIA_LIBRARY_CLOSE") {
        sessionStorage.removeItem(PICK_KEY);
        clearSelection();
        var hint = document.getElementById("site-gallery-hint");
        if (hint) hint.remove();
      }

      return result;
    };
  }

  function watchDom() {
    if (watchDom._on) return;
    watchDom._on = true;
    var obs = new MutationObserver(function () {
      replaceImageWidgetLabels();
      showHint();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function onRouteChange() {
    if (isMediaHash() && getGalleryDraftEntry()) startPickSession();
    replaceImageWidgetLabels();
    showHint();
    if (isGalleryHash()) applyPendingPaths();
  }

  function tick() {
    replaceImageWidgetLabels();
    showHint();
    if (isGalleryHash() && sessionStorage.getItem(PENDING_PATHS_KEY)) {
      applyPendingPaths();
    }
  }

  boot();
})();
