/**
 * Gallery: local file picker + Decap MEDIA_INSERT so thumbnails appear.
 * v20260711l
 */
(function () {
  "use strict";

  var VERSION = "20260711l";
  var UPLOAD_GAP_MS =
    (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.UPLOAD_GAP_MS) || 2000;
  var PICKER_MARK = "data-site-gallery-picker";
  var INPUT_MARK = "data-site-gallery-input";
  var started = false;
  var lastOpenPayload = null;

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

  function isGalleryMediaField(field) {
    if (!field || !field.get) return false;
    var n = field.get("name");
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
    return payload.field.get("name") === "videos" ? "videoBatches" : "photoBatches";
  }

  function mediaKeyFromPayload(payload) {
    if (!payload || !payload.field) return "images";
    return payload.field.get("name") === "videos" ? "videos" : "images";
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
    return domIndex >= 0 ? domIndex : 0;
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

  function finishUpload(batches, idx, batchField, mediaKey, merged, titleHint) {
    batches[idx][mediaKey] = merged.slice();
    if (titleHint) batches[idx].title = titleHint;
    setBatches(batchField, batches);

    var store = getStore();
    if (!store) return;

    if (lastOpenPayload && lastOpenPayload.controlID) {
      store.dispatch({
        type: "MEDIA_INSERT",
        payload: { mediaPath: merged.slice() },
      });
    }
    store.dispatch({ type: "MEDIA_LIBRARY_CLOSE" });
  }

  function applyFiles(files, payload, anchorEl) {
    if (!files || !files.length || !getStore()) return;

    var activePayload = payload || lastOpenPayload || makePayload("images");
    var batchField = fieldNameFromPayload(activePayload);
    var mediaKey = mediaKeyFromPayload(activePayload);
    var currentPaths = toPathList(activePayload.value);
    var batches = getBatches(batchField);
    var titleHint = albumTitleNear(anchorEl);
    var domIndex = batchIndexFromElement(anchorEl);
    var idx = findBatchIndex(batches, mediaKey, currentPaths, titleHint, domIndex);

    if (!batches[idx]) {
      batches[idx] = { title: titleHint || "", images: [], videos: [] };
    }
    if (!batches[idx].images) batches[idx].images = [];
    if (!batches[idx].videos) batches[idx].videos = [];

    var merged = mediaPaths(batches[idx][mediaKey]).slice();
    var queue = Array.from(files);
    var field = activePayload.field;
    var i = 0;

    function next() {
      if (i >= queue.length) {
        finishUpload(batches, idx, batchField, mediaKey, merged, titleHint);
        return;
      }
      var file = queue[i++];
      var path = persistFileLikeUpload(file, field);
      if (path && merged.indexOf(path) < 0) merged.push(path);
      window.setTimeout(next, UPLOAD_GAP_MS);
    }

    next();
  }

  function makePayload(mediaKey, value) {
    return {
      field: {
        get: function (k) {
          return k === "name" ? mediaKey : "";
        },
      },
      value: value || [],
    };
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
    var accept =
      payload && payload.field && payload.field.get("name") === "videos" ? "video/*" : "image/*";
    var input = createGalleryInput(accept);
    document.body.appendChild(input);
    input.addEventListener("change", function () {
      if (input.files && input.files.length) {
        applyFiles(input.files, payload || lastOpenPayload, anchorEl);
      }
      input.remove();
    });
    input.click();
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
        window.setTimeout(function () {
          openUploadPicker(lastOpenPayload, null);
        }, 0);
        return;
      }
      return orig(action);
    };
  }

  function isChooseLabel(text) {
    text = (text || "").replace(/\s+/g, " ").trim().toLowerCase();
    return (
      /^choose\s+(an?\s+)?images?/.test(text) ||
      /^choose\s+(a?\s+)?files?/.test(text)
    );
  }

  function injectPickers() {
    if (!isGalleryRoute() || !getStore()) return;

    document.querySelectorAll("button, a, label, [role='button']").forEach(function (btn) {
      if (!isChooseLabel(btn.textContent)) return;
      if (btn.closest('[class*="MediaLibrary"]') || btn.closest('[role="dialog"]')) return;
      if (btn.closest("#site-gallery-top-picker")) return;
      if (btn.closest("[" + PICKER_MARK + "]")) return;
      if (btn.getAttribute(PICKER_MARK)) return;

      var host = btn.parentElement;
      if (!host) return;
      var existing = host.querySelector("[" + PICKER_MARK + "]");
      if (existing) {
        btn.style.setProperty("display", "none", "important");
        btn.setAttribute(PICKER_MARK, "1");
        return;
      }

      btn.style.setProperty("display", "none", "important");
      btn.setAttribute(PICKER_MARK, "1");

      var wrap = document.createElement("div");
      wrap.setAttribute(PICKER_MARK, "1");
      wrap.style.cssText = "margin:.5rem 0;";

      var label = document.createElement("label");
      label.style.cssText =
        "display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;";
      label.textContent = btn.textContent.replace(/\s+/g, " ").trim() || "Choose images";

      var input = createGalleryInput(
        (host.textContent || "").toLowerCase().indexOf("video") >= 0 ? "video/*" : "image/*"
      );
      input.style.cssText = "display:none;";
      input.addEventListener("change", function () {
        if (!input.files || !input.files.length) return;
        var mediaKey = input.accept.indexOf("video") >= 0 ? "videos" : "images";
        applyFiles(input.files, makePayload(mediaKey), wrap);
        input.value = "";
      });

      label.appendChild(input);
      wrap.appendChild(label);
      host.insertBefore(wrap, btn);
    });
  }

  function killMediaModal() {
    if (!isGalleryRoute()) return;
    document.querySelectorAll('[class*="MediaLibrary"], [role="dialog"]').forEach(function (modal) {
      var txt = modal.textContent || "";
      if (txt.indexOf("Choose selected") < 0 && txt.indexOf("Upload") < 0) return;
      modal.style.setProperty("display", "none", "important");
      var store = getStore();
      if (store) store.dispatch({ type: "MEDIA_LIBRARY_CLOSE" });
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
      '<strong style="color:#0f766e;">Pick files from your computer</strong> ' +
      '<span style="color:#334155;">(v' +
      VERSION +
      ")</span>" +
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;">' +
      '<label style="display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;">Choose photos<input type="file" id="site-gallery-top-photos" multiple accept="image/*" ' +
      INPUT_MARK +
      '="1" style="display:none;"></label>' +
      '<label style="display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;">Choose videos<input type="file" id="site-gallery-top-videos" multiple accept="video/*" ' +
      INPUT_MARK +
      '="1" style="display:none;"></label>' +
      "</div>" +
      '<p style="margin:8px 0 0;color:#475569;font-size:13px;">Add upload + and Title first, then pick files for that album.</p>';

    root.insertBefore(box, root.firstChild);

    document.getElementById("site-gallery-top-photos").addEventListener("change", function (e) {
      if (!e.target.files || !e.target.files.length) return;
      applyFiles(e.target.files, makePayload("images"), box);
      e.target.value = "";
    });

    document.getElementById("site-gallery-top-videos").addEventListener("change", function (e) {
      if (!e.target.files || !e.target.files.length) return;
      applyFiles(e.target.files, makePayload("videos"), box);
      e.target.value = "";
    });
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-picker-css")) return;
    var s = document.createElement("style");
    s.id = "site-gallery-picker-css";
    s.textContent =
      'body[data-site-gallery="1"] [class*="MediaLibrary"]{display:none!important;visibility:hidden!important;}';
    document.head.appendChild(s);
  }

  function markReady() {
    window.__SITE_GALLERY_V = VERSION;
    document.body.setAttribute("data-site-gallery-ready", VERSION);
  }

  function start() {
    if (!getStore()) {
      window.setTimeout(start, 300);
      return;
    }
    markReady();
    document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
    injectStyles();
    patchStore();
    injectTopBanner();
    injectPickers();
    killMediaModal();
    if (!started) {
      started = true;
      window.setInterval(function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        injectTopBanner();
        injectPickers();
        killMediaModal();
      }, 400);
      window.addEventListener("hashchange", function () {
        injectTopBanner();
        injectPickers();
      });
      new MutationObserver(function () {
        injectTopBanner();
        injectPickers();
        killMediaModal();
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.SiteGalleryLocalFiles = { start: start, version: VERSION };
})();
