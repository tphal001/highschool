/**
 * Gallery: "Choose images" opens local multi-file picker (same as Decap Media → Upload).
 */
(function () {
  "use strict";

  var MARK = "data-site-choose-bound";
  var UPLOAD_GAP_MS = 2000;

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
      var files = collection && collection.get("files");
      var galleryFile = files && files.find(function (f) {
        return f.get("name") === "gallery";
      });
      return galleryFile && galleryFile.get("fields").find(function (f) {
        return f.get("name") === name;
      });
    } catch (e) {
      return null;
    }
  }

  function getBatches(fieldName) {
    var store = getStore();
    if (!store) return [];
    var draft = store.getState().entryDraft;
    var entry = draft && draft.get("entry");
    if (!entry) return [];
    return Array.isArray(toJs(entry.getIn(["data", fieldName]))) ? toJs(entry.getIn(["data", fieldName])) : [];
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

  function fieldContext(btn) {
    var block = btn.closest("div");
    var text = ((block && block.textContent) || "").toLowerCase();
    var isVideo = text.indexOf("video") >= 0 && text.indexOf("from your computer") >= 0 && text.indexOf("image") < 0;
    if (!isVideo && text.indexOf("videos from your computer") >= 0) isVideo = true;
    if (!isVideo && text.indexOf("images from your computer") >= 0) isVideo = false;
    return {
      fieldName: isVideo ? "videoBatches" : "photoBatches",
      mediaKey: isVideo ? "videos" : "images",
      accept: isVideo ? "video/*" : "image/*",
    };
  }

  function albumTitle(btn) {
    var root = btn.closest(".nc-listWidget-item") || btn.closest('[class*="ListItem"]') || btn.parentElement;
    while (root && root !== document.body) {
      var input = root.querySelector('input[type="text"]');
      if (input && input.value && input.value.trim()) return input.value.trim();
      root = root.parentElement;
    }
    return "";
  }

  function batchIndex(batches, title) {
    if (title) {
      for (var i = 0; i < batches.length; i++) {
        if ((batches[i].title || "").trim() === title) return i;
      }
    }
    return 0;
  }

  function applyFilesToField(files, btn) {
    if (!files || !files.length) return;
    var ctx = fieldContext(btn);
    var title = albumTitle(btn);
    var batches = getBatches(ctx.fieldName);
    var idx = batchIndex(batches, title);
    if (!batches[idx]) batches[idx] = { title: title || "", images: [], videos: [] };
    var current = mediaPaths(batches[idx][ctx.mediaKey]);

    var queue = Array.from(files);
    var i = 0;

    function next() {
      if (i >= queue.length) {
        batches[idx][ctx.mediaKey] = current;
        if (title) batches[idx].title = title;
        setBatches(ctx.fieldName, batches);
        return;
      }
      var file = queue[i++];
      addAsset(file);
      var path = publicPath(file.name);
      if (current.indexOf(path) < 0) current.push(path);
      window.setTimeout(next, UPLOAD_GAP_MS);
    }

    next();
  }

  function isChooseButton(btn) {
    if (!btn || btn.tagName !== "BUTTON") return false;
    var t = (btn.textContent || "").trim().toLowerCase();
    return (
      t === "choose images" ||
      t === "choose image" ||
      t === "choose files" ||
      t === "choose file" ||
      t.indexOf("choose images") === 0 ||
      t.indexOf("choose files") === 0
    );
  }

  function openLocalPicker(btn) {
    var ctx = fieldContext(btn);
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = ctx.accept;
    input.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0;";
    document.body.appendChild(input);
    input.addEventListener(
      "change",
      function () {
        applyFilesToField(input.files, btn);
        input.remove();
      },
      { once: true }
    );
    input.click();
  }

  function onClick(e) {
    if (!isGalleryRoute() || !getStore()) return;
    var btn = e.target.closest && e.target.closest("button");
    if (!btn || !isChooseButton(btn)) return;

    var parentText = ((btn.closest("div") && btn.closest("div").textContent) || "").toLowerCase();
    if (parentText.indexOf("from your computer") < 0 && parentText.indexOf("images") < 0 && parentText.indexOf("videos") < 0) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();
    openLocalPicker(btn);
  }

  function bindButtons() {
    if (!isGalleryRoute()) return;
    document.querySelectorAll("button").forEach(function (btn) {
      if (!isChooseButton(btn) || btn.getAttribute(MARK)) return;
      var area = btn.closest("div");
      if (!area || (area.textContent || "").toLowerCase().indexOf("from your computer") < 0) return;
      btn.setAttribute(MARK, "1");
    });
  }

  function boot() {
    document.addEventListener("click", onClick, true);
    bindButtons();
    window.addEventListener("hashchange", bindButtons);
    new MutationObserver(bindButtons).observe(document.body, { childList: true, subtree: true });
  }

  function waitForCms() {
    if (window.CMS && CMS.init) {
      if (!window.__siteGalleryChooseReady) {
        window.__siteGalleryChooseReady = true;
        var init = CMS.init;
        CMS.init = function () {
          var out = init.apply(this, arguments);
          window.setTimeout(boot, 400);
          return out;
        };
      }
      if (getStore()) boot();
      else window.setTimeout(waitForCms, 250);
      return;
    }
    window.setTimeout(waitForCms, 200);
  }

  waitForCms();
})();
