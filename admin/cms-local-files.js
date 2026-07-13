/**
 * Gallery albums: per-row local multi-file upload (no Decap Media picker).
 * v20260711p
 */
(function () {
  "use strict";

  var VERSION = "20260711p";
  var UPLOAD_GAP_MS =
    (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.UPLOAD_GAP_MS) || 2000;
  var INPUT_MARK = "data-site-gallery-input";
  var UPLOADER_MARK = "data-site-album-uploader";
  var started = false;

  function getStore() {
    if (!window.CMS) return null;
    if (typeof CMS.getStore === "function") return CMS.getStore();
    return CMS.store || null;
  }

  function fromJs(val) {
    if (window.Immutable && window.Immutable.fromJS) return window.Immutable.fromJS(val);
    return val;
  }

  function toJs(val) {
    if (!val) return val;
    return val.toJS ? val.toJS() : val;
  }

  function isGalleryRoute() {
    return (window.location.hash || "").toLowerCase().indexOf("entries/gallery") >= 0;
  }

  function getGalleryField(state, name) {
    try {
      var collection = state.collections.get("staff_content");
      var galleryFile = collection.get("files").find(function (f) {
        return f.get("name") === "gallery";
      });
      return galleryFile.get("fields").find(function (f) {
        return f.get("name") === name;
      });
    } catch (e) {
      return null;
    }
  }

  function getBatchPaths(batchField, idx, mediaKey) {
    var store = getStore();
    if (!store) return [];
    var entry = store.getState().entryDraft && store.getState().entryDraft.get("entry");
    if (!entry) return [];
    var raw = entry.getIn(["data", batchField, idx, mediaKey]);
    raw = toJs(raw);
    if (!raw) return [];
    return Array.isArray(raw) ? raw.map(String) : [String(raw)];
  }

  function setBatchMedia(batchField, idx, mediaKey, paths) {
    var store = getStore();
    if (!store) return;
    var state = store.getState();
    var field = getGalleryField(state, batchField);
    if (!field) return;
    var list = state.entryDraft.getIn(["entry", "data", batchField]);
    if (!list || !list.setIn) return;

    while (list.size <= idx) {
      list = list.push(fromJs({ title: "", images: [], videos: [] }));
    }
    var newList = list.setIn([idx, mediaKey], fromJs(paths.slice()));
    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: { field: field, value: newList, metadata: {}, entries: [] },
    });
  }

  function publicPath(name) {
    return "/images/" + String(name || "").replace(/^\/+/, "").replace(/^images\//, "");
  }

  function persistFile(file) {
    var store = getStore();
    if (!store) return null;
    var path = "images/" + file.name;
    var url = URL.createObjectURL(file);
    store.dispatch({
      type: "ADD_ASSET",
      payload: { path: path, file: file, url: url },
    });
    store.dispatch({
      type: "ADD_DRAFT_ENTRY_MEDIA_FILE",
      payload: {
        id: path + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        name: file.name,
        path: path,
        file: file,
        displayURL: url,
        draft: true,
        size: file.size,
        url: url,
      },
    });
    return publicPath(file.name);
  }

  function uploadFiles(files, batchField, idx, mediaKey, onDone) {
    if (!files || !files.length) return;
    var merged = getBatchPaths(batchField, idx, mediaKey).slice();
    var queue = Array.from(files);
    var i = 0;

    function next() {
      if (i >= queue.length) {
        setBatchMedia(batchField, idx, mediaKey, merged);
        if (onDone) onDone(merged);
        return;
      }
      var path = persistFile(queue[i++]);
      if (path && merged.indexOf(path) < 0) merged.push(path);
      window.setTimeout(next, UPLOAD_GAP_MS);
    }

    next();
  }

  function renderThumbs(container, paths) {
    var box = container.querySelector("[data-site-album-thumbs]");
    if (!box) return;
    if (!paths.length) {
      box.innerHTML = '<span style="color:#64748b;font-size:13px;">No images yet.</span>';
      return;
    }
    box.innerHTML = paths
      .map(function (p) {
        var src = p.indexOf("http") === 0 ? p : p;
        return (
          '<img src="' +
          src +
          '" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:4px;border:1px solid #cbd5e1;">'
        );
      })
      .join("");
  }

  function hideDecapChooser(listItem) {
    listItem.querySelectorAll("button, a, label, [role='button']").forEach(function (el) {
      var t = (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!/^choose\s+(an?\s+)?images?/.test(t) && !/^choose\s+(a?\s+)?files?/.test(t)) return;
      var block = el.parentElement;
      if (block) block.style.setProperty("display", "none", "important");
    });
  }

  function injectUploader(listItem, batchField, idx, mediaKey, accept, labelText) {
    if (listItem.getAttribute(UPLOADER_MARK)) return;
    listItem.setAttribute(UPLOADER_MARK, "1");
    hideDecapChooser(listItem);

    var wrap = document.createElement("div");
    wrap.style.cssText = "margin:.5rem 0 1rem;padding:.75rem;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;";
    wrap.innerHTML =
      '<label style="display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;">' +
      labelText +
      '<input type="file" multiple accept="' +
      accept +
      '" ' +
      INPUT_MARK +
      '="1" style="display:none;"></label>' +
      '<div data-site-album-thumbs style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;"></div>';

    var imagesLabel = null;
    listItem.querySelectorAll("label, [class*='Label']").forEach(function (lbl) {
      if (imagesLabel) return;
      var txt = (lbl.textContent || "").toLowerCase();
      if (mediaKey === "images" && txt.indexOf("images from your computer") >= 0) imagesLabel = lbl;
      if (mediaKey === "videos" && txt.indexOf("videos from your computer") >= 0) imagesLabel = lbl;
    });

    if (imagesLabel && imagesLabel.parentElement) {
      imagesLabel.parentElement.appendChild(wrap);
    } else {
      listItem.appendChild(wrap);
    }

    var input = wrap.querySelector('input[type="file"]');
    input.addEventListener("change", function () {
      if (!input.files || !input.files.length) return;
      uploadFiles(input.files, batchField, idx, mediaKey, function (paths) {
        renderThumbs(wrap, paths);
      });
      input.value = "";
    });

    renderThumbs(wrap, getBatchPaths(batchField, idx, mediaKey));
  }

  function listItemsForField(labelMatch, batchField, mediaKey, accept, buttonLabel) {
    document.querySelectorAll('[class*="listControlItem"]').forEach(function (listItem) {
      var hit = false;
      listItem.querySelectorAll("label, [class*='Label']").forEach(function (lbl) {
        if (hit) return;
        if ((lbl.textContent || "").toLowerCase().indexOf(labelMatch) >= 0) hit = true;
      });
      if (!hit) return;

      var listRoot = listItem.closest('[class*="ListControl"]');
      if (!listRoot) return;
      var items = listRoot.querySelectorAll('[class*="listControlItem"]');
      var idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i] === listItem) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return;
      injectUploader(listItem, batchField, idx, mediaKey, accept, buttonLabel);
    });
  }

  function refreshThumbs() {
    if (!isGalleryRoute()) return;
    document.querySelectorAll("[" + UPLOADER_MARK + "]").forEach(function (listItem) {
      var wrap = listItem.querySelector("[data-site-album-thumbs]");
      if (!wrap || !wrap.parentElement) return;
      var parent = wrap.parentElement;
      var isVideo = !!parent.querySelector('input[accept*="video"]');
      var batchField = isVideo ? "videoBatches" : "photoBatches";
      var mediaKey = isVideo ? "videos" : "images";
      var listRoot = listItem.closest('[class*="ListControl"]');
      if (!listRoot) return;
      var items = listRoot.querySelectorAll('[class*="listControlItem"]');
      var idx = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i] === listItem) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return;
      renderThumbs(parent, getBatchPaths(batchField, idx, mediaKey));
    });
  }

  function injectAlbumUploaders() {
    if (!isGalleryRoute() || !getStore()) return;
    listItemsForField(
      "images from your computer",
      "photoBatches",
      "images",
      "image/*",
      "Pick photos from your computer"
    );
    listItemsForField(
      "videos from your computer",
      "videoBatches",
      "videos",
      "video/*",
      "Pick videos from your computer"
    );
    refreshThumbs();
  }

  function patchExternalLibrary() {
    var store = getStore();
    if (!store) return false;
    var ml = store.getState().mediaLibrary;
    if (!ml) return false;
    var ext = ml.get("externalLibrary");
    if (!ext || typeof ext.show !== "function") return false;
    if (ext.__siteGalleryShowPatch) return true;

    ext.__siteGalleryShowPatch = true;
    var origShow = ext.show.bind(ext);
    ext.show = function (opts) {
      if (isGalleryRoute() && opts && opts.id) return;
      return origShow(opts);
    };
    return true;
  }

  function patchStoreOpen() {
    var store = getStore();
    if (!store || store.__siteGalleryOpenPatch) return;
    store.__siteGalleryOpenPatch = true;
    var orig = store.dispatch.bind(store);
    store.dispatch = function (action) {
      if (action && action.type === "MEDIA_LIBRARY_OPEN" && isGalleryRoute()) {
        var field = action.payload && action.payload.field;
        var n = field && (field.get ? field.get("name") : field.name);
        if (n === "images" || n === "videos") {
          orig(action);
          orig({ type: "MEDIA_LIBRARY_CLOSE" });
          return;
        }
      }
      return orig(action);
    };
  }

  function killMediaModal() {
    if (!isGalleryRoute()) return;
    document.querySelectorAll('[class*="MediaLibrary"], [role="dialog"]').forEach(function (modal) {
      var txt = modal.textContent || "";
      if (txt.indexOf("Choose selected") < 0 && txt.indexOf("Upload") < 0) return;
      modal.style.setProperty("display", "none", "important");
    });
  }

  function injectTopBanner() {
    if (!isGalleryRoute() || !getStore()) return;
    var existing = document.getElementById("site-gallery-top-picker");
    if (existing) {
      existing.querySelector("[data-site-version]") &&
        (existing.querySelector("[data-site-version]").textContent = "v" + VERSION);
      return;
    }

    var root =
      document.querySelector('[class*="EditorContainer"]') ||
      document.querySelector("main") ||
      document.getElementById("nc-root") ||
      document.body;

    var box = document.createElement("div");
    box.id = "site-gallery-top-picker";
    box.style.cssText =
      "margin:12px 16px;padding:14px 16px;background:#ecfdf5;border:2px solid #0d9488;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;";
    box.innerHTML =
      '<strong style="color:#0f766e;">Gallery uploads</strong> ' +
      '<span data-site-version style="color:#334155;">v' +
      VERSION +
      "</span>" +
      '<p style="margin:8px 0 0;color:#475569;font-size:13px;">Add upload + → enter Title → use the blue <strong>Pick photos from your computer</strong> button inside that album row.</p>';

    root.insertBefore(box, root.firstChild);
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-picker-css")) return;
    var s = document.createElement("style");
    s.id = "site-gallery-picker-css";
    s.textContent =
      'body[data-site-gallery="1"] [class*="MediaLibrary"],' +
      'body[data-site-gallery="1"] [role="dialog"]{display:none!important;visibility:hidden!important;pointer-events:none!important;}';
    document.head.appendChild(s);
  }

  function markReady() {
    window.__SITE_GALLERY_V = VERSION;
    document.body.setAttribute("data-site-gallery-ready", VERSION);
  }

  function start() {
    if (!getStore()) {
      window.setTimeout(start, 200);
      return;
    }
    patchExternalLibrary();
    patchStoreOpen();
    markReady();
    document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
    injectStyles();
    injectTopBanner();
    injectAlbumUploaders();
    killMediaModal();

    if (!started) {
      started = true;
      getStore().subscribe(function () {
        refreshThumbs();
      });
      window.setInterval(function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        patchExternalLibrary();
        injectTopBanner();
        injectAlbumUploaders();
        killMediaModal();
      }, 400);
      window.addEventListener("hashchange", function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        injectTopBanner();
        injectAlbumUploaders();
      });
      new MutationObserver(function () {
        injectAlbumUploaders();
        killMediaModal();
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.SiteGalleryLocalFiles = { start: start, version: VERSION };
})();
