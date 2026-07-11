/**
 * Gallery: block Decap Media modal; use local multi-file picker instead.
 */
(function () {
  "use strict";

  var UPLOAD_GAP_MS = 2000;
  var PICKER_MARK = "data-site-gallery-picker";
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

  function addAsset(file) {
    var store = getStore();
    if (!store) return;
    store.dispatch({
      type: "ADD_ASSET",
      payload: {
        path: "images/" + file.name,
        fileObj: file,
        url: URL.createObjectURL(file),
        name: file.name,
      },
    });
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
    if (!files || !files.length) return;
    var batchField = fieldNameFromPayload(payload);
    var mediaKey = mediaKeyFromPayload(payload);
    var currentPaths = toPathList(payload && payload.value);
    var batches = getBatches(batchField);
    var idx = findBatchIndex(batches, mediaKey, currentPaths, titleHint);
    if (!batches[idx]) batches[idx] = { title: titleHint || "", images: [], videos: [] };
    var merged = mediaPaths(batches[idx][mediaKey]).slice();
    var queue = Array.from(files);
    var i = 0;

    function next() {
      if (i >= queue.length) {
        batches[idx][mediaKey] = merged;
        if (titleHint) batches[idx].title = titleHint;
        setBatches(batchField, batches);
        return;
      }
      var file = queue[i++];
      addAsset(file);
      var path = publicPath(file.name);
      if (merged.indexOf(path) < 0) merged.push(path);
      window.setTimeout(next, UPLOAD_GAP_MS);
    }

    next();
  }

  function openLocalPicker(payload, anchorEl) {
    var accept = payload && payload.field && payload.field.get("name") === "videos" ? "video/*" : "image/*";
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = accept;
    input.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;";
    document.body.appendChild(input);
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
          openLocalPicker(lastOpenPayload, null);
        }, 0);
        return orig({ type: "MEDIA_LIBRARY_CLOSE" });
      }
      return orig(action);
    };
  }

  function isChooseLabel(text) {
    text = (text || "").trim().toLowerCase();
    return (
      text === "choose images" ||
      text === "choose image" ||
      text === "choose files" ||
      text === "choose file"
    );
  }

  function injectPickers() {
    if (!isGalleryRoute() || !getStore()) return;

    document.querySelectorAll("button").forEach(function (btn) {
      if (!isChooseLabel(btn.textContent)) return;
      if (btn.closest('[class*="MediaLibrary"]') || btn.closest('[role="dialog"]')) return;

      var host = btn.parentElement;
      if (!host || host.querySelector("[" + PICKER_MARK + "]")) return;

      btn.style.setProperty("display", "none", "important");

      var wrap = document.createElement("div");
      wrap.setAttribute(PICKER_MARK, "1");
      wrap.style.cssText = "margin:.5rem 0;";

      var label = document.createElement("label");
      label.style.cssText =
        "display:inline-block;padding:.55rem 1rem;border-radius:4px;background:#3b4c9a;color:#fff;font-weight:600;cursor:pointer;";
      label.textContent = btn.textContent.trim() || "Choose images";

      var input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept =
        (host.textContent || "").toLowerCase().indexOf("video") >= 0 ? "video/*" : "image/*";
      input.style.cssText = "display:none;";
      input.addEventListener("change", function () {
        var payload = {
          field: {
            get: function (k) {
              return k === "name"
                ? input.accept.indexOf("video") >= 0
                  ? "videos"
                  : "images"
                : "";
            },
          },
          value: [],
        };
        applyFiles(input.files, payload, albumTitleNear(wrap));
        input.value = "";
      });

      label.appendChild(input);
      wrap.appendChild(label);
      host.insertBefore(wrap, btn);
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

  function start() {
    if (!getStore()) {
      window.setTimeout(start, 300);
      return;
    }
    document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
    injectStyles();
    patchStore();
    injectPickers();
    if (!started) {
      started = true;
      window.setInterval(function () {
        document.body.setAttribute("data-site-gallery", isGalleryRoute() ? "1" : "0");
        injectPickers();
      }, 600);
      window.addEventListener("hashchange", injectPickers);
      new MutationObserver(injectPickers).observe(document.body, { childList: true, subtree: true });
    }
  }

  window.SiteGalleryLocalFiles = { start: start };
})();
