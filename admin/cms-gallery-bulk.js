/**
 * Decap CMS — Gallery: checkbox multi-select in Media + add each photo as a list row.
 * Flow: Gallery → Add photo + → Choose an image → tick photos in Media → Add ticked photos to Gallery.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var GALLERY_HASH = "#/collections/staff_content/entries/gallery";
  var PICK_KEY = "siteGalleryMediaPick";
  var PENDING_PATHS_KEY = "siteGalleryPendingPaths";
  var ITEMS_BACKUP_KEY = "siteGalleryItemsBackup";
  var PUBLIC_FOLDER = "/images";

  function boot() {
    if (!window.CMS) return;
    registerPreSave();
    injectStyles();
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", onRouteChange);
    waitForStore(function () {
      patchStore();
      onRouteChange();
      window.setInterval(tick, 800);
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

  function isMediaSurface() {
    if (isMediaHash()) return true;
    return !!document.querySelector(
      "[class*='MediaLibrary'], [class*='media-library'], [class*='MediaLibraryCard']"
    );
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
    return isMediaSurface() && (isPickSessionActive() || !!sessionStorage.getItem(PENDING_PATHS_KEY));
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
      "#site-gallery-media-bar{position:sticky;top:0;z-index:9999;display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;padding:0.65rem 1rem;background:#ecfeff;border-bottom:2px solid #0e7490;font-size:0.875rem;color:#0f172a;}" +
      "#site-gallery-media-bar button{padding:0.45rem 0.9rem;border-radius:0.375rem;border:none;background:#0e7490;color:#fff;font-weight:600;cursor:pointer;}" +
      "#site-gallery-media-bar button:hover{background:#0f766e;}" +
      ".site-media-check-wrap{position:absolute;top:6px;left:6px;z-index:6;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#fff;border:2px solid #0e7490;box-shadow:0 1px 4px rgba(0,0,0,0.25);}" +
      ".site-media-check{width:18px;height:18px;cursor:pointer;margin:0;accent-color:#0e7490;}" +
      ".site-media-card-target{position:relative!important;}";
    document.head.appendChild(style);
  }

  function showToast(msg) {
    var el = document.getElementById("site-gallery-media-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-gallery-media-toast";
      el.style.cssText =
        "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:99999;padding:0.65rem 1rem;border-radius:0.5rem;background:#0f172a;color:#fff;font-size:0.8125rem;font-weight:600;max-width:92vw;text-align:center;";
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

  function collectMediaCards() {
    var cards = [];
    var seen = {};
    var root =
      document.querySelector("main") ||
      document.querySelector("[class*='MediaLibrary']") ||
      document.body;

    function add(el, path) {
      if (!el || seen[el]) return;
      var img = el.querySelector("img");
      if (!img) return;
      seen[el] = true;
      el.classList.add("site-media-card-target");
      if (!el.getAttribute("data-site-media-path")) el.setAttribute("data-site-media-path", path || "");
      cards.push(el);
    }

    root.querySelectorAll("[class*='MediaLibraryCard'], article, li").forEach(function (el) {
      var img = el.querySelector("img");
      if (!img) return;
      var text = (el.textContent || "").trim();
      var path = publicPath(text.split("\n")[0], img.src);
      if (!/\.(jpe?g|png|gif|webp|svg|bmp|tiff?)$/i.test(path) && img.src) {
        path = publicPath("", img.src);
      }
      if (path) add(el, path);
    });

    if (!cards.length) {
      root.querySelectorAll("img").forEach(function (img) {
        var parent = img.closest("article, li, figure, div");
        if (!parent || parent === root) return;
        var path = publicPath("", img.src);
        if (path) add(parent, path);
      });
    }

    return cards;
  }

  function injectCheckboxes() {
    if (!shouldEnhanceMediaUi()) return;
    collectMediaCards().forEach(function (card) {
      if (card.querySelector(".site-media-check-wrap")) return;
      var path =
        card.getAttribute("data-site-media-path") ||
        publicPath("", card.querySelector("img") && card.querySelector("img").src);
      var wrap = document.createElement("div");
      wrap.className = "site-media-check-wrap";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "site-media-check";
      cb.setAttribute("data-path", path);
      cb.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      wrap.appendChild(cb);
      card.insertBefore(wrap, card.firstChild);
    });
  }

  function injectGalleryBar() {
    if (!shouldEnhanceMediaUi()) return;
    if (document.getElementById("site-gallery-media-bar")) return;

    var bar = document.createElement("div");
    bar.id = "site-gallery-media-bar";
    bar.innerHTML =
      '<strong>Gallery:</strong> <span>Tick photos (checkbox top-left), then add them all at once.</span>' +
      '<button type="button" id="site-gallery-media-add">Add ticked photos to Gallery</button>' +
      '<button type="button" id="site-gallery-media-back" style="background:#475569;">Back to Gallery</button>';

    var anchor = document.querySelector("main") || document.body;
    anchor.insertBefore(bar, anchor.firstChild);

    document.getElementById("site-gallery-media-add").addEventListener("click", addTickedToGallery);
    document.getElementById("site-gallery-media-back").addEventListener("click", function () {
      sessionStorage.removeItem(PICK_KEY);
      window.location.hash = GALLERY_HASH;
    });
  }

  function removeGalleryBar() {
    var bar = document.getElementById("site-gallery-media-bar");
    if (bar) bar.remove();
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

  function addTickedToGallery() {
    var paths = getTickedPaths();
    if (!paths.length) {
      showToast("Tick at least one photo first (checkbox on top-left of each image).");
      return;
    }

    if (appendPhotosViaStore(paths)) {
      sessionStorage.removeItem(PICK_KEY);
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
        cb.checked = false;
      });
      showToast(paths.length + " photo(s) added. Returning to Gallery…");
      window.setTimeout(function () {
        window.location.hash = GALLERY_HASH;
      }, 700);
      return;
    }

    sessionStorage.setItem(PENDING_PATHS_KEY, JSON.stringify(paths));
    sessionStorage.removeItem(PICK_KEY);
    showToast(paths.length + " photo(s) queued. Opening Gallery…");
    window.setTimeout(function () {
      window.location.hash = GALLERY_HASH;
    }, 400);
  }

  function applyPendingPaths() {
    var raw = sessionStorage.getItem(PENDING_PATHS_KEY);
    if (!raw || !isGalleryHash()) return;

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

  function startPickSession() {
    sessionStorage.setItem(PICK_KEY, "1");
    backupGalleryItems();
  }

  function onDocumentClick(e) {
    var node = e.target.closest ? e.target.closest("button, a, span, label, div") : null;
    if (!node) return;
    var text = (node.textContent || "").trim().toLowerCase();

    if (isGalleryHash()) {
      if (
        text.indexOf("choose an image") >= 0 ||
        text.indexOf("choose image") >= 0 ||
        text.indexOf("insert from media") >= 0
      ) {
        startPickSession();
        return;
      }
      if (text.indexOf("add photo") >= 0 || text === "add" || text.indexOf("add ") === 0) {
        backupGalleryItems();
      }
    }

    if (!shouldEnhanceMediaUi() && !isPickSessionActive()) return;

    if (text === "choose selected" || text.indexOf("choose selected") >= 0) {
      var paths = getTickedPaths();
      if (!paths.length) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      addTickedToGallery();
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
        var field = payload.field;
        if (field && field.get && field.get("name") === "image" && isGalleryHash()) {
          startPickSession();
        }
      }

      var result = orig(action);

      if (action && action.type === "MEDIA_INSERT" && (isPickSessionActive() || isGalleryHash())) {
        window.setTimeout(function () {
          var payload = action.payload || {};
          var paths = pathsFromImage(payload.mediaPath);
          if (paths.length > 1) appendPhotosViaStore(paths);
        }, 300);
      }

      return result;
    };
  }

  function onRouteChange() {
    if (isMediaHash() && getGalleryDraftEntry()) startPickSession();

    if (!shouldEnhanceMediaUi()) removeGalleryBar();
    if (shouldEnhanceMediaUi()) {
      injectGalleryBar();
      injectCheckboxes();
    }
    if (isGalleryHash()) {
      waitForStore(function () {
        window.setTimeout(applyPendingPaths, 400);
      });
    }
  }

  function tick() {
    if (shouldEnhanceMediaUi()) {
      injectGalleryBar();
      injectCheckboxes();
    }
    if (isGalleryHash() && sessionStorage.getItem(PENDING_PATHS_KEY)) {
      applyPendingPaths();
    }
  }

  boot();
})();
