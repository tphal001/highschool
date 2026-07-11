/**
 * Gallery: "Choose images" uses the same upload path as Media → Upload.
 * v20260711i
 */
(function () {
  "use strict";

  var VERSION = "20260711i";
  var UPLOAD_GAP_MS =
    (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.UPLOAD_GAP_MS) || 2000;
  var PICKER_MARK = "data-site-gallery-picker";
  var started = false;
  var lastOpenPayload = null;
  var clickHooked = false;

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
    return Array.isArray(toJs(raw)) ? toJs(raw) : [];
  }

  function setBatches(fieldName, batches) {
    var store = getStore();
    if (!store) return;
    var field = getGalleryField(store.getState(), fieldName);
    if (!field) return;
    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: { field: field, value: fromJs(batches), metadata: {}, entries: [] },
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

  /** Same actions Decap runs when you click Media → Upload */
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

  function findBatchIndex(batches, mediaKey, currentPaths, titleHint) {
    if (titleHint) {
      for (var i = 0; i < batches.length; i++) {
        if ((batches[i].title || "").trim() === titleHint) return i;
      }
    }
    var sortedCurrent = currentPaths.slice().sort().join("|");
    for (var j = 0; j < batches.length; j++) {
      var sortedBatch = mediaPaths(batches[j][mediaKey]).slice().sort().join("|");
      if (sortedBatch === sortedCurrent) return j;
    }
    return 0;
  }

  function albumTitleNear(el) {
    var walk = el && el.parentElement;
    var n = 0;
    while (walk && walk !== document.body && n < 35) {
      var inputs = walk.querySelectorAll('input[type="text"]');
      for (var i = 0; i < inputs.length; i++) {
        var v = (inputs[i].value || "").trim();
        if (v) return v;
      }
      walk = walk.parentElement;
      n++;
    }
    return "";
  }

  function applyFiles(files, payload, titleHint) {
    if (!files || !files.length || !getStore()) return;
    var batchField = fieldNameFromPayload(payload);
    var mediaKey = mediaKeyFromPayload(payload);
    var currentPaths = toPathList(payload && payload.value);
    var batches = getBatches(batchField);
    var idx = findBatchIndex(batches, mediaKey, currentPaths, titleHint);
    if (!batches[idx]) batches[idx] = { title: titleHint || "", images: [], videos: [] };
    var merged = mediaPaths(batches[idx][mediaKey]).slice();
    var queue = Array.from(files);
    var field = payload && payload.field;
    var i = 0;

    function next() {
      if (i >= queue.length) {
        batches[idx][mediaKey] = merged;
        if (titleHint) batches[idx].title = titleHint;
        setBatches(batchField, batches);
        if (lastOpenPayload && lastOpenPayload.controlID) {
          getStore().dispatch({
            type: "MEDIA_INSERT",
            payload: { mediaPath: merged.slice() },
          });
          getStore().dispatch({ type: "MEDIA_LIBRARY_CLOSE" });
        }
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

  /** Identical to Media library Upload: hidden input[type=file] with multiple */
  function openUploadPicker(payload, anchorEl) {
    var accept =
      payload && payload.field && payload.field.get("name") === "videos" ? "video/*" : "image/*";
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = accept;
    input.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;";
    document.body.appendChild(input);
    if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
      window.SiteCmsBulkUpload.patchInput(input);
    }
    input.addEventListener("change", function () {
      applyFiles(input.files, payload || lastOpenPayload, albumTitleNear(anchorEl));
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
        window.setTimeout(function () {
          openUploadPicker(lastOpenPayload, null);
        }, 0);
        return orig({ type: "MEDIA_LIBRARY_CLOSE" });
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

  function isChooseClickTarget(el) {
    if (!el || !el.closest) return false;
    if (el.closest('[class*="MediaLibrary"]') || el.closest('[role="dialog"]')) return false;
    if (el.closest("#site-gallery-top-picker")) return false;
    if (el.closest("[" + PICKER_MARK + "]")) return false;
    var hit = el.closest("button, a, label, [role='button']");
    if (!hit) return false;
    return isChooseLabel(hit.textContent);
  }

  function interceptClicks() {
    if (clickHooked) return;
    clickHooked = true;
    document.addEventListener(
      "click",
      function (e) {
        if (!isGalleryRoute()) return;
        if (!isChooseClickTarget(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        var hit = e.target.closest("button, a, label, [role='button']");
        var isVideo =
          (hit &&
            (hit.closest("[class*='video']") ||
              (hit.textContent || "").toLowerCase().indexOf("file") >= 0)) ||
          false;
        openUploadPicker(makePayload(isVideo ? "videos" : "images"), hit);
        return false;
      },
      true
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

      var input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      var ctx = (host.textContent || "").toLowerCase();
      input.accept = ctx.indexOf("video") >= 0 ? "video/*" : "image/*";
      input.style.cssText = "display:none;";
      if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
        window.SiteCmsBulkUpload.patchInput(input);
      }
      input.addEventListener("change", function () {
        var mediaKey = input.accept.indexOf("video") >= 0 ? "videos" : "images";
        applyFiles(input.files, makePayload(mediaKey), albumTitleNear(wrap));
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
      getStore() && getStore().dispatch({ type: "MEDIA_LIBRARY_CLOSE" });
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
      '<span style="color:#334155;">(same as Media → Upload, v' +
      VERSION +
      ")</span>" +
      '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:10px;">' +
      '<label style="display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;">Choose photos<input type="file" id="site-gallery-top-photos" multiple accept="image/*" style="display:none;"></label>' +
      '<label style="display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;">Choose videos<input type="file" id="site-gallery-top-videos" multiple accept="video/*" style="display:none;"></label>' +
      "</div>" +
      '<p style="margin:8px 0 0;color:#475569;font-size:13px;">Add upload + and Title first. Then use these buttons — not the grey Choose images button.</p>';

    root.insertBefore(box, root.firstChild);

    var photoInput = document.getElementById("site-gallery-top-photos");
    var videoInput = document.getElementById("site-gallery-top-videos");
    if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
      window.SiteCmsBulkUpload.patchInput(photoInput);
      window.SiteCmsBulkUpload.patchInput(videoInput);
    }

    photoInput.addEventListener("change", function (e) {
      var batches = getBatches("photoBatches");
      var title = batches[0] && batches[0].title ? batches[0].title : albumTitleNear(box);
      applyFiles(e.target.files, makePayload("images", batches[0] && batches[0].images), title);
      e.target.value = "";
    });

    videoInput.addEventListener("change", function (e) {
      var batches = getBatches("videoBatches");
      var title = batches[0] && batches[0].title ? batches[0].title : albumTitleNear(box);
      applyFiles(e.target.files, makePayload("videos", batches[0] && batches[0].videos), title);
      e.target.value = "";
    });
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-picker-css")) return;
    var s = document.createElement("style");
    s.id = "site-gallery-picker-css";
    s.textContent =
      'body[data-site-gallery="1"] [class*="MediaLibrary"]{display:none!important;}';
    document.head.appendChild(s);
  }

  function markReady() {
    window.__SITE_GALLERY_V = VERSION;
    document.body.setAttribute("data-site-gallery-ready", VERSION);
  }

  function start() {
    interceptClicks();
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
      }, 500);
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
  interceptClicks();
})();
