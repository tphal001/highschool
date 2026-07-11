/**
 * Gallery: clicking "Choose images" opens local multi-file picker (like Media → Upload).
 */
(function () {
  "use strict";

  var MARK = "data-site-choose-bound";
  var UPLOAD_GAP_MS = 2000;
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

  function isInsideMediaModal(el) {
    if (!el || !el.closest) return false;
    return !!(
      el.closest('[class*="MediaLibrary"]') ||
      el.closest('[class*="media-library"]') ||
      el.closest('[role="dialog"]')
    );
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
    var entry = store.getState().entryDraft && store.getState().entryDraft.get("entry");
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

  function ancestorText(node, maxUp) {
    var parts = [];
    var walk = node;
    var n = 0;
    while (walk && walk !== document.body && n < (maxUp || 20)) {
      parts.push((walk.textContent || "").toLowerCase());
      walk = walk.parentElement;
      n++;
    }
    return parts.join(" ");
  }

  function fieldContext(btn) {
    var text = ancestorText(btn, 25);
    var isVideo =
      text.indexOf("upload videos") >= 0 ||
      text.indexOf("videos from your computer") >= 0 ||
      (text.indexOf("choose files") >= 0 && text.indexOf("upload images") < 0);
    return {
      fieldName: isVideo ? "videoBatches" : "photoBatches",
      mediaKey: isVideo ? "videos" : "images",
      accept: isVideo ? "video/*" : "image/*",
    };
  }

  function albumTitle(btn) {
    var walk = btn.parentElement;
    var n = 0;
    while (walk && walk !== document.body && n < 30) {
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

  function isChooseButton(el) {
    if (!el) return false;
    var node = el.closest ? el.closest("button, a") : el;
    if (!node) return false;
    var t = (node.textContent || "").trim().toLowerCase();
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
    input.style.cssText = "position:fixed;left:-9999px;width:1px;height:1px;opacity:0;";
    document.body.appendChild(input);
    input.addEventListener("change", function () {
      applyFilesToField(input.files, btn);
      input.remove();
    });
    input.click();
  }

  function hijackButton(btn) {
    if (!btn || btn.getAttribute(MARK)) return;
    if (!isGalleryRoute() || isInsideMediaModal(btn) || !isChooseButton(btn)) return;

    btn.setAttribute(MARK, "1");

    function blockAndPick(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openLocalPicker(btn);
      return false;
    }

    btn.addEventListener("click", blockAndPick, true);
    btn.addEventListener("mousedown", blockAndPick, true);
    btn.addEventListener("pointerdown", blockAndPick, true);
  }

  function scan() {
    if (!isGalleryRoute() || !getStore()) return;
    document.querySelectorAll("button, a").forEach(function (el) {
      if (isChooseButton(el)) hijackButton(el.closest("button, a") || el);
    });
  }

  function start() {
    if (started) {
      scan();
      return;
    }
    started = true;
    scan();
    window.setInterval(scan, 500);
    window.addEventListener("hashchange", scan);
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  window.SiteGalleryLocalFiles = { start: start, scan: scan };
})();
