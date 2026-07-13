/**
 * Gallery: local file picker + thumbnails in the images panel.
 * v20260711o — block externalLibrary.show(), keep MEDIA_LIBRARY_OPEN for controlID.
 */
(function () {
  "use strict";

  var VERSION = "20260711o";
  var UPLOAD_GAP_MS =
    (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.UPLOAD_GAP_MS) || 2000;
  var INPUT_MARK = "data-site-gallery-input";
  var started = false;
  var lastOpenPayload = null;
  var pickerBusy = false;
  var lastPickerAnchor = null;

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

  function toPathList(val) {
    var raw = toJs(val);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String);
    return [String(raw)];
  }

  function cloneData(val) {
    return JSON.parse(JSON.stringify(val));
  }

  function isGalleryRoute() {
    return (window.location.hash || "").toLowerCase().indexOf("entries/gallery") >= 0;
  }

  function fieldName(field) {
    if (!field) return "";
    return field.get ? field.get("name") : field.name || "";
  }

  function isGalleryMediaField(field) {
    var n = fieldName(field);
    return n === "images" || n === "videos";
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

  function getBatches(fieldName) {
    var store = getStore();
    if (!store) return [];
    var entry = store.getState().entryDraft && store.getState().entryDraft.get("entry");
    if (!entry) return [];
    var raw = entry.getIn(["data", fieldName]);
    return Array.isArray(toJs(raw)) ? cloneData(toJs(raw)) : [];
  }

  function setBatches(fieldName, batches) {
    var store = getStore();
    if (!store) return;
    var field = getGalleryField(store.getState(), fieldName);
    if (!field) return;
    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: { field: field, value: fromJs(cloneData(batches)), metadata: {}, entries: [] },
    });
  }

  function setBatchImagesDirect(batchField, idx, mediaKey, paths, titleHint) {
    var store = getStore();
    if (!store) return;
    var state = store.getState();
    var field = getGalleryField(state, batchField);
    if (!field) return;
    var list = state.entryDraft.getIn(["entry", "data", batchField]);
    if (list && list.setIn) {
      while (list.size <= idx) {
        list = list.push(fromJs({ title: "", images: [], videos: [] }));
      }
      var newList = list.setIn([idx, mediaKey], fromJs(paths.slice()));
      if (titleHint) newList = newList.setIn([idx, "title"], titleHint);
      store.dispatch({
        type: "DRAFT_CHANGE_FIELD",
        payload: { field: field, value: newList, metadata: {}, entries: [] },
      });
      return;
    }
    var batches = getBatches(batchField);
    while (batches.length <= idx) {
      batches.push({ title: "", images: [], videos: [] });
    }
    batches[idx][mediaKey] = paths.slice();
    if (titleHint) batches[idx].title = titleHint;
    setBatches(batchField, batches);
  }

  function publicPath(name) {
    return "/images/" + String(name || "").replace(/^\/+/, "").replace(/^images\//, "");
  }

  function mediaPaths(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map(function (item) {
        if (typeof item === "string") return item;
        if (item && item.image) return item.image;
        if (item && item.video) return item.video;
        return "";
      })
      .filter(Boolean);
  }

  function persistFileLikeUpload(file, field) {
    var store = getStore();
    if (!store) return null;
    var path = "images/" + file.name;
    var url = URL.createObjectURL(file);
    store.dispatch({
      type: "ADD_ASSET",
      payload: { path: path, file: file, url: url, field: field },
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

  function fieldNameFromPayload(payload) {
    if (!payload || !payload.field) return "photoBatches";
    return fieldName(payload.field) === "videos" ? "videoBatches" : "photoBatches";
  }

  function mediaKeyFromPayload(payload) {
    if (!payload || !payload.field) return "images";
    return fieldName(payload.field) === "videos" ? "videos" : "images";
  }

  function batchIndexFromElement(el) {
    if (!el || !el.closest) return -1;
    var item = el.closest('[class*="listControlItem"], [class*="ListItem"]');
    if (!item) return -1;
    var listRoot = item.closest('[class*="ListControl"], [class*="listWidget"], .nc-listWidget');
    if (!listRoot) return -1;
    var items = listRoot.querySelectorAll('[class*="listControlItem"], [class*="ListItem"]');
    for (var i = 0; i < items.length; i++) {
      if (items[i] === item) return i;
    }
    return -1;
  }

  function findBatchIndex(batches, mediaKey, currentPaths, titleHint, domIndex) {
    var sortedCurrent = currentPaths.slice().sort().join("|");
    if (sortedCurrent) {
      for (var k = 0; k < batches.length; k++) {
        var sortedBatch = mediaPaths(batches[k][mediaKey]).slice().sort().join("|");
        if (sortedBatch === sortedCurrent) return k;
      }
    }
    if (domIndex >= 0 && domIndex < batches.length) return domIndex;
    if (titleHint) {
      for (var i = 0; i < batches.length; i++) {
        if ((batches[i].title || "").trim() === titleHint) return i;
      }
    }
    if (!sortedCurrent && domIndex >= 0) return domIndex;
    for (var j = 0; j < batches.length; j++) {
      if ((batches[j].title || "").trim() && mediaPaths(batches[j][mediaKey]).length === 0) return j;
    }
    return batches.length > 0 ? 0 : 0;
  }

  function albumTitleNear(el) {
    var walk = el && el.parentElement;
    var n = 0;
    while (walk && walk !== document.body && n < 40) {
      var labels = walk.querySelectorAll("label, [class*='Label']");
      for (var l = 0; l < labels.length; l++) {
        if ((labels[l].textContent || "").toLowerCase().indexOf("title") < 0) continue;
        var inp =
          labels[l].parentElement &&
          labels[l].parentElement.querySelector('input[type="text"]');
        if (inp && inp.value) return inp.value.trim();
      }
      var inputs = walk.querySelectorAll('input[type="text"]');
      if (inputs.length === 1 && inputs[0].value) return inputs[0].value.trim();
      walk = walk.parentElement;
      n++;
    }
    return "";
  }

  function hasOpenControl() {
    var store = getStore();
    if (!store || !lastOpenPayload || !lastOpenPayload.controlID) return false;
    var ml = store.getState().mediaLibrary;
    return ml && ml.get("controlID") === lastOpenPayload.controlID;
  }

  function finishUpload(batchField, idx, mediaKey, merged, newPaths, titleHint) {
    var store = getStore();
    if (!store) return;

    if (hasOpenControl() && newPaths.length) {
      store.dispatch({
        type: "MEDIA_INSERT",
        payload: { mediaPath: newPaths.slice() },
      });
    } else {
      setBatchImagesDirect(batchField, idx, mediaKey, merged, titleHint);
    }
    store.dispatch({ type: "MEDIA_LIBRARY_CLOSE" });
    lastOpenPayload = null;
  }

  function applyFiles(files, payload, anchorEl) {
    if (!files || !files.length || !getStore()) return;

    var activePayload = payload || lastOpenPayload;
    if (!activePayload || !activePayload.field) return;

    var batchField = fieldNameFromPayload(activePayload);
    var mediaKey = mediaKeyFromPayload(activePayload);
    var currentPaths = toPathList(activePayload.value);
    var batches = getBatches(batchField);
    var titleHint = albumTitleNear(anchorEl || lastPickerAnchor);
    var domIndex = batchIndexFromElement(anchorEl || lastPickerAnchor);
    var idx = findBatchIndex(batches, mediaKey, currentPaths, titleHint, domIndex);

    if (!batches[idx]) {
      batches[idx] = { title: titleHint || "", images: [], videos: [] };
    }

    var merged = mediaPaths(batches[idx][mediaKey]).slice();
    var newPaths = [];
    var queue = Array.from(files);
    var field = activePayload.field;
    var i = 0;

    function next() {
      if (i >= queue.length) {
        finishUpload(batchField, idx, mediaKey, merged, newPaths, titleHint);
        return;
      }
      var file = queue[i++];
      var path = persistFileLikeUpload(file, field);
      if (path && merged.indexOf(path) < 0) {
        merged.push(path);
        newPaths.push(path);
      }
      window.setTimeout(next, UPLOAD_GAP_MS);
    }

    next();
  }

  function createGalleryInput(accept) {
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = accept;
    input.setAttribute(INPUT_MARK, "1");
    input.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;";
    return input;
  }

  function openUploadPicker(payload, anchorEl) {
    if (pickerBusy || !payload) return;
    pickerBusy = true;
    lastPickerAnchor = anchorEl || null;
    window.__galleryPickerOpenedAt = Date.now();

    var accept = fieldName(payload.field) === "videos" ? "video/*" : "image/*";
    var input = createGalleryInput(accept);
    document.body.appendChild(input);
    input.addEventListener("change", function () {
      pickerBusy = false;
      if (input.files && input.files.length) {
        applyFiles(input.files, payload, anchorEl);
      }
      input.remove();
    });
    input.addEventListener("cancel", function () {
      pickerBusy = false;
      input.remove();
    });
    window.setTimeout(function () {
      pickerBusy = false;
    }, 1500);
    input.click();
  }

  /** Decap calls externalLibrary.show() BEFORE MEDIA_LIBRARY_OPEN — block it on Gallery. */
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
    var origHide = ext.hide ? ext.hide.bind(ext) : null;

    ext.show = function (opts) {
      if (isGalleryRoute() && opts && opts.id) {
        return;
      }
      return origShow(opts);
    };

    if (origHide) {
      ext.hide = function () {
        if (isGalleryRoute()) return;
        return origHide();
      };
    }

    return true;
  }

  function patchStore() {
    var store = getStore();
    if (!store || store.__siteGalleryStorePatch) return;
    store.__siteGalleryStorePatch = true;
    var orig = store.dispatch.bind(store);

    store.dispatch = function (action) {
      if (
        action &&
        action.type === "MEDIA_LIBRARY_OPEN" &&
        isGalleryRoute() &&
        action.payload &&
        isGalleryMediaField(action.payload.field)
      ) {
        lastOpenPayload = action.payload;
        orig(action);
        orig({ type: "MEDIA_LIBRARY_CLOSE" });
        openUploadPicker(lastOpenPayload, lastPickerAnchor);
        return;
      }
      return orig(action);
    };
  }

  function isChooseClickTarget(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[class*="MediaLibrary"]') || el.closest('[role="dialog"]')) return false;
    if (el.closest("#site-gallery-top-picker")) return false;
    var hit = el.closest("button, a, label, [role='button']");
    if (!hit) return false;
    var text = (hit.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return (
      /^choose\s+(an?\s+)?images?/.test(text) ||
      /^choose\s+(a?\s+)?files?/.test(text)
    );
  }

  function hookChooseClicks() {
    if (document.__siteGalleryClickHook) return;
    document.__siteGalleryClickHook = true;
    document.addEventListener(
      "click",
      function (e) {
        if (!isGalleryRoute()) return;
        if (!isChooseClickTarget(e.target)) return;
        lastPickerAnchor = e.target.closest('[class*="listControlItem"], [class*="ListItem"]') || e.target;
      },
      true
    );
  }

  function killMediaModal() {
    if (!isGalleryRoute()) return;
    document.querySelectorAll('[class*="MediaLibrary"], [role="dialog"]').forEach(function (modal) {
      var txt = modal.textContent || "";
      if (txt.indexOf("Choose selected") < 0 && txt.indexOf("Upload") < 0) return;
      modal.style.setProperty("display", "none", "important");
      modal.style.setProperty("visibility", "hidden", "important");
      modal.style.setProperty("pointer-events", "none", "important");
    });
  }

  function injectTopBanner() {
    if (!isGalleryRoute() || !getStore()) return;
    if (document.getElementById("site-gallery-top-picker")) return;

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
      '<strong style="color:#0f766e;">Gallery uploads (v' +
      VERSION +
      ")</strong>" +
      '<p style="margin:8px 0 0;color:#475569;font-size:13px;">Add upload + → Title → click <strong>Choose images</strong> on that row. Your computer file picker opens (not Decap Media).</p>';

    root.insertBefore(box, root.firstChild);
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-picker-css")) return;
    var s = document.createElement("style");
    s.id = "site-gallery-picker-css";
    s.textContent =
      'body[data-site-gallery="1"] [class*="MediaLibrary"],' +
      'body[data-site-gallery="1"] [class*="mediaLibrary"],' +
      'body[data-site-gallery="1"] [role="dialog"]{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}';
    document.head.appendChild(s);
  }

  function markReady() {
    window.__SITE_GALLERY_V = VERSION;
    document.body.setAttribute("data-site-gallery-ready", VERSION);
  }

  function start() {
    hookChooseClicks();
    if (!getStore()) {
      window.setTimeout(start, 200);
      return;
    }
    patchExternalLibrary();
    markReady();
    document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
    injectStyles();
    patchStore();
    injectTopBanner();
    killMediaModal();
    if (!started) {
      started = true;
      window.setInterval(function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        patchExternalLibrary();
        injectTopBanner();
        killMediaModal();
      }, 300);
      window.addEventListener("hashchange", function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        injectTopBanner();
        killMediaModal();
      });
      new MutationObserver(function () {
        killMediaModal();
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.SiteGalleryLocalFiles = { start: start, version: VERSION };
  hookChooseClicks();
})();
