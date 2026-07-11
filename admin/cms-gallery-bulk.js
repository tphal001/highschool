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
    replaceImageWidgetLabels();
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("hashchange", onRouteChange);
    window.addEventListener("scroll", repositionCheckboxOverlays, true);
    window.addEventListener("resize", repositionCheckboxOverlays);
    waitForStore(function () {
      patchStore();
      onRouteChange();
      window.setInterval(tick, 400);
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
    var map = {
      "Choose an image": "Choose media",
      "Choose images": "Choose media",
      "Choose different image": "Choose different media",
    };
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var trimmed = node.textContent.trim();
      if (map[trimmed]) node.textContent = node.textContent.replace(trimmed, map[trimmed]);
    }
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-media-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-media-css";
    style.textContent =
      ".site-media-check-wrap{position:fixed;z-index:2147483000;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#0e7490;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);pointer-events:auto;cursor:pointer;}" +
      ".site-media-check{width:22px;height:22px;cursor:pointer;margin:0;accent-color:#fff;pointer-events:auto;}" +
      ".site-media-check-wrap.is-checked{background:#047857;}";
    document.head.appendChild(style);
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

  function isMediaThumb(img, root) {
    if (!img || !img.src || img.src.indexOf("data:") === 0) return false;
    if (!root || !root.contains(img)) return false;
    if (img.closest(".site-media-check-wrap")) return false;
    var rect = img.getBoundingClientRect();
    if (rect.width >= 40 && rect.height >= 40) return true;
    if (rect.width === 0 && rect.height === 0 && /\.(jpe?g|png|gif|webp|svg)/i.test(img.src)) return true;
    return false;
  }

  function imgKey(img) {
    return img.src + "|" + Math.round(img.getBoundingClientRect().top) + "|" + Math.round(img.getBoundingClientRect().left);
  }

  function collectMediaThumbs() {
    var items = [];
    var seen = {};
    var root = getMediaRoot();
    if (!root) return items;

    root.querySelectorAll("img").forEach(function (img) {
      if (!isMediaThumb(img, root)) return;
      var key = imgKey(img);
      if (seen[key]) return;
      seen[key] = true;

      var card = img;
      var walk = img.parentElement;
      while (walk && walk !== root) {
        if (walk.querySelectorAll("img").length === 1) card = walk;
        walk = walk.parentElement;
      }

      var path = filenameFromCard(card, img);
      if (!path) path = publicPath("", img.src);
      if (!path) return;

      items.push({ img: img, path: path });
    });

    return items;
  }

  function repositionCheckboxOverlays() {
    document.querySelectorAll(".site-media-check-wrap[data-for-img]").forEach(function (wrap) {
      var img = wrap._linkedImg;
      if (!img || !img.isConnected) {
        wrap.remove();
        return;
      }
      var rect = img.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) {
        wrap.style.display = "none";
        return;
      }
      wrap.style.display = "flex";
      wrap.style.top = rect.top + 6 + "px";
      wrap.style.left = rect.left + 6 + "px";
    });
  }

  function stopCardClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function injectCheckboxes() {
    if (!shouldEnhanceMediaUi()) {
      document.querySelectorAll(".site-media-check-wrap[data-for-img]").forEach(function (el) {
        el.remove();
      });
      return;
    }

    var existing = {};
    document.querySelectorAll(".site-media-check-wrap[data-for-img]").forEach(function (wrap) {
      if (wrap._imgKey) existing[wrap._imgKey] = wrap;
    });

    collectMediaThumbs().forEach(function (item) {
      var key = imgKey(item.img);
      if (existing[key]) {
        existing[key]._linkedImg = item.img;
        repositionCheckboxOverlays();
        return;
      }

      var wrap = document.createElement("div");
      wrap.className = "site-media-check-wrap";
      wrap.setAttribute("data-for-img", "1");
      wrap._imgKey = key;
      wrap._linkedImg = item.img;
      wrap.title = "Select for gallery";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "site-media-check";
      cb.setAttribute("data-path", item.path);
      cb.setAttribute("aria-label", "Select " + item.path);

      ["pointerdown", "mousedown", "click", "mouseup"].forEach(function (evt) {
        wrap.addEventListener(evt, stopCardClick, true);
        cb.addEventListener(evt, function (e) {
          e.stopPropagation();
        }, true);
      });

      cb.addEventListener("change", function () {
        wrap.classList.toggle("is-checked", cb.checked);
      });

      wrap.appendChild(cb);
      document.body.appendChild(wrap);
      repositionCheckboxOverlays();
    });

    var root = getMediaRoot() || document.body;
    root.querySelectorAll("img").forEach(function (img) {
      if (img.getAttribute("data-site-gallery-load")) return;
      img.setAttribute("data-site-gallery-load", "1");
      img.addEventListener("load", injectCheckboxes, { once: true });
    });

    repositionCheckboxOverlays();
  }

  function startPickSession() {
    sessionStorage.setItem(PICK_KEY, "1");
    backupGalleryItems();
    window.setTimeout(injectCheckboxes, 50);
    window.setTimeout(injectCheckboxes, 300);
    window.setTimeout(injectCheckboxes, 1000);
  }

  function isChooseSelectedButton(node) {
    if (!node) return false;
    var text = (node.textContent || "").trim().toLowerCase();
    if (text === "choose selected" || text.indexOf("choose selected") >= 0) return true;
    var label = (node.getAttribute("aria-label") || "").trim().toLowerCase();
    return label.indexOf("choose selected") >= 0;
  }

  function onDocumentClick(e) {
    if (e.target.closest && e.target.closest(".site-media-check-wrap")) return;

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
      var p = String(cb.getAttribute("data-path") || "").trim();
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
      showToast("Tick at least one photo using the teal checkboxes on the images.");
      return;
    }

    if (appendPhotosViaStore(paths)) {
      sessionStorage.removeItem(PICK_KEY);
      sessionStorage.removeItem(PENDING_PATHS_KEY);
      document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
        cb.checked = false;
        var wrap = cb.closest(".site-media-check-wrap");
        if (wrap) wrap.classList.remove("is-checked");
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
        document.querySelectorAll(".site-media-check-wrap[data-for-img]").forEach(function (el) {
          el.remove();
        });
      }

      return result;
    };
  }

  function watchDom() {
    if (watchDom._on) return;
    watchDom._on = true;
    var obs = new MutationObserver(function () {
      replaceImageWidgetLabels();
      if (shouldEnhanceMediaUi()) injectCheckboxes();
      else {
        document.querySelectorAll(".site-media-check-wrap[data-for-img]").forEach(function (el) {
          el.remove();
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function onRouteChange() {
    if (isMediaHash() && getGalleryDraftEntry()) startPickSession();
    if (shouldEnhanceMediaUi()) injectCheckboxes();
    if (isGalleryHash()) applyPendingPaths();
  }

  function tick() {
    replaceImageWidgetLabels();
    if (shouldEnhanceMediaUi()) {
      injectCheckboxes();
      repositionCheckboxOverlays();
    }
    if (isGalleryHash() && sessionStorage.getItem(PENDING_PATHS_KEY)) {
      applyPendingPaths();
    }
  }

  boot();
})();
