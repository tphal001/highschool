/**
 * Decap CMS — Gallery: merge bulkImages into items on save; optional multi-upload bar.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var UPLOAD_GAP_MS = 1800;

  function isGalleryEntry(entry) {
    if (!entry || !entry.get) return false;
    return entry.get("file") === GALLERY_FILE || entry.get("slug") === "gallery";
  }

  function toJs(val) {
    if (!val) return val;
    return val.toJS ? val.toJS() : val;
  }

  function fromJsList(arr) {
    if (window.Immutable && window.Immutable.fromJS) {
      return window.Immutable.fromJS(arr);
    }
    return arr;
  }

  function mergeBulkIntoItems(data) {
    var plain = toJs(data) || {};
    var bulk = plain.bulkImages || [];
    var items = Array.isArray(plain.items) ? plain.items.slice() : [];
    if (!bulk.length) return { items: items, bulkImages: [] };

    bulk.forEach(function (row) {
      var img =
        typeof row === "string"
          ? row
          : row && typeof row === "object"
            ? row.image || ""
            : "";
      img = String(img || "").trim();
      if (img) items.push({ title: "", category: "", image: img });
    });
    return { items: items, bulkImages: [] };
  }

  function registerPreSave() {
    if (!window.CMS || !CMS.registerEventListener) return;

    CMS.registerEventListener({
      name: "preSave",
      handler: function (args) {
        var entry = args && args.entry;
        if (!isGalleryEntry(entry)) return;
        var data = entry.get("data");
        if (!data) return;

        var merged = mergeBulkIntoItems(data);
        var hasBulk = (toJs(data).bulkImages || []).length > 0;
        if (!hasBulk) return;

        if (data.merge && typeof data.merge === "function") {
          return entry.merge({
            data: data.merge({
              items: fromJsList(merged.items),
              bulkImages: fromJsList(merged.bulkImages),
            }),
          });
        }

        if (entry.merge && typeof entry.merge === "function") {
          return entry.merge({
            data: Object.assign({}, toJs(data), merged),
          });
        }
      },
    });
  }

  function findListWidgetForBulkImages() {
    var lists = document.querySelectorAll(".nc-listWidget");
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i];
      var label = list.querySelector(".nc-listWidget-topBar, [class*='ListTopBar']");
      var text = (label && label.textContent) || "";
      if (/bulk add photos/i.test(text)) return list;
    }
    return document.querySelector(".nc-listWidget");
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var t = (btn.textContent || "").trim().toLowerCase();
      if (t === "add" || t.indexOf("add ") === 0) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function latestFileInput(listRoot) {
    if (!listRoot) return null;
    var inputs = listRoot.querySelectorAll('input[type="file"]');
    return inputs.length ? inputs[inputs.length - 1] : null;
  }

  function dispatchSingle(input, file) {
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function uploadFilesToList(listRoot, files, onDone) {
    if (!listRoot || !files.length) {
      if (onDone) onDone();
      return;
    }

    var queue = files.slice();
    var input = latestFileInput(listRoot);

    function next() {
      if (!queue.length) {
        if (onDone) onDone();
        return;
      }
      if (!input) {
        clickListAdd(listRoot);
        window.setTimeout(function () {
          input = latestFileInput(listRoot);
          if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
            window.SiteCmsBulkUpload.patchInput(input);
          }
          if (!input) {
            if (onDone) onDone();
            return;
          }
          dispatchSingle(input, queue.shift());
          window.setTimeout(next, UPLOAD_GAP_MS);
        }, 600);
        return;
      }

      dispatchSingle(input, queue.shift());
      if (queue.length) {
        clickListAdd(listRoot);
        window.setTimeout(function () {
          input = latestFileInput(listRoot);
          if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
            window.SiteCmsBulkUpload.patchInput(input);
          }
          window.setTimeout(next, UPLOAD_GAP_MS);
        }, 600);
      } else {
        window.setTimeout(next, UPLOAD_GAP_MS);
      }
    }

    if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput && input) {
      window.SiteCmsBulkUpload.patchInput(input);
    }
    next();
  }

  function injectBulkBar() {
    if (!/\/collections\/staff_content\/entries\/gallery/i.test(window.location.hash || "")) {
      return;
    }
    if (document.getElementById("site-gallery-bulk-bar")) return;

    var listRoot = findListWidgetForBulkImages();
    if (!listRoot || !listRoot.parentNode) return;

    var bar = document.createElement("div");
    bar.id = "site-gallery-bulk-bar";
    bar.style.cssText =
      "margin:0 0 1rem;padding:0.75rem 1rem;border:1px solid #cbd5e1;border-radius:0.5rem;background:#f8fafc;";
    bar.innerHTML =
      '<p style="margin:0 0 0.5rem;font-size:0.875rem;font-weight:600;color:#0f172a;">Upload multiple gallery photos</p>' +
      '<p style="margin:0 0 0.5rem;font-size:0.8125rem;color:#475569;">Choose many images at once — each file is added as a new row in <strong>Bulk add photos</strong> below.</p>' +
      '<label style="display:inline-flex;cursor:pointer;align-items:center;gap:0.5rem;font-size:0.8125rem;font-weight:600;color:#0e7490;">' +
      '<input type="file" id="site-gallery-bulk-input" multiple accept="image/*" style="max-width:100%;" />' +
      "</label>";

    listRoot.parentNode.insertBefore(bar, listRoot);

    var input = document.getElementById("site-gallery-bulk-input");
    input.addEventListener("change", function () {
      var files = input.files ? Array.from(input.files) : [];
      input.value = "";
      if (!files.length) return;
      uploadFilesToList(findListWidgetForBulkImages(), files);
    });
  }

  function watchEditor() {
    injectBulkBar();
    new MutationObserver(function () {
      injectBulkBar();
    }).observe(document.body, { childList: true, subtree: true });
  }

  registerPreSave();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watchEditor);
  } else {
    watchEditor();
  }
})();
