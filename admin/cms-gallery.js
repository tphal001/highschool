/**
 * Decap CMS — Gallery: Upload Images / Upload Videos with title + multi-file from computer.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var PANEL_ID = "site-gallery-cms-panel";
  var UPLOAD_GAP_MS = 1800;

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
    return /\/collections\/staff_content\/entries\/gallery/i.test(window.location.hash || "");
  }

  function getGalleryDraftEntry() {
    var store = getStore();
    if (!store) return null;
    var draft = store.getState().entryDraft;
    var entry = draft && draft.get && draft.get("entry");
    if (!entry || !entry.get) return null;
    if (entry.get("file") === GALLERY_FILE || entry.get("slug") === "gallery") return entry;
    return null;
  }

  function getGalleryField(state, name) {
    try {
      var collection = state.collections.get("staff_content");
      var files = collection && collection.get("files");
      if (!files || !files.find) return null;
      var galleryFile = files.find(function (f) {
        return f.get("name") === "gallery";
      });
      if (!galleryFile) return null;
      return galleryFile.get("fields").find(function (f) {
        return f.get("name") === name;
      });
    } catch (e) {
      return null;
    }
  }

  function getBatches(fieldName) {
    var entry = getGalleryDraftEntry();
    if (!entry) return [];
    var raw = entry.getIn(["data", fieldName]);
    return Array.isArray(toJs(raw)) ? toJs(raw) : [];
  }

  function setBatches(fieldName, batches) {
    var store = getStore();
    if (!store) return false;
    var field = getGalleryField(store.getState(), fieldName);
    if (!field) return false;
    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: {
        field: field,
        value: fromJs(batches),
        metadata: {},
        entries: [],
      },
    });
    return true;
  }

  function prependBatch(fieldName, title) {
    var batches = getBatches(fieldName);
    var batch = { title: title };
    if (fieldName === "photoBatches") batch.images = [];
    else batch.videos = [];
    batches.unshift(batch);
    return setBatches(fieldName, batches);
  }

  function injectStyles() {
    if (document.getElementById("site-gallery-cms-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-cms-css";
    style.textContent =
      "#" +
      PANEL_ID +
      "{margin:0 0 1.5rem;padding:1.25rem;border:2px solid #0d9488;border-radius:12px;background:#f0fdfa;}" +
      "#" +
      PANEL_ID +
      " .sg-tabs{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1rem;}" +
      "#" +
      PANEL_ID +
      " .sg-tab{flex:1;min-width:140px;padding:.75rem 1rem;border:2px solid #99f6e4;border-radius:8px;background:#fff;font-weight:700;cursor:pointer;}" +
      "#" +
      PANEL_ID +
      " .sg-tab.is-active{background:#0d9488;border-color:#0d9488;color:#fff;}" +
      "#" +
      PANEL_ID +
      " .sg-field{margin-bottom:.85rem;}" +
      "#" +
      PANEL_ID +
      " .sg-field label{display:block;margin-bottom:.35rem;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#134e4a;}" +
      "#" +
      PANEL_ID +
      " .sg-field input[type=text],#" +
      PANEL_ID +
      " .sg-field input[type=file]{width:100%;padding:.55rem .65rem;border:1px solid #99f6e4;border-radius:6px;background:#fff;}" +
      "#" +
      PANEL_ID +
      " .sg-add{margin-top:.5rem;padding:.7rem 1.25rem;border:0;border-radius:8px;background:#0f766e;color:#fff;font-weight:700;cursor:pointer;}" +
      "#" +
      PANEL_ID +
      " .sg-add:disabled{opacity:.55;cursor:not-allowed;}" +
      "#" +
      PANEL_ID +
      " .sg-hint{margin-top:.65rem;font-size:.8125rem;color:#115e59;}" +
      "#" +
      PANEL_ID +
      " .sg-status{margin-top:.65rem;font-size:.8125rem;font-weight:600;color:#0f766e;}";
    document.head.appendChild(style);
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();
      if (t === "add" || t.indexOf("add ") === 0) {
        buttons[i].click();
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

  function patchFileInput(input) {
    if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {
      window.SiteCmsBulkUpload.patchInput(input);
    }
  }

  function dispatchSingleFile(input, file) {
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findBatchListRoots(fieldName) {
    var labels =
      fieldName === "photoBatches"
        ? ["image albums", "photos"]
        : ["video albums", "videos"];
    var roots = [];
    document.querySelectorAll(".nc-listWidget, [class*='ListControl']").forEach(function (el) {
      var text = (el.textContent || "").toLowerCase();
      if (labels.some(function (l) {
        return text.indexOf(l) >= 0;
      })) {
        roots.push(el);
      }
    });
    return roots;
  }

  function findInnerListForBatch(batchTitle, mediaLabel) {
    var lists = document.querySelectorAll(".nc-listWidget, [class*='ListControl']");
    var i;
    for (i = 0; i < lists.length; i++) {
      var list = lists[i];
      var txt = (list.textContent || "").toLowerCase();
      if (txt.indexOf(batchTitle.toLowerCase()) < 0) continue;
      if (txt.indexOf(mediaLabel) < 0) continue;
      var nested = list.querySelectorAll(".nc-listWidget, [class*='ListControl']");
      if (nested.length) return nested[nested.length - 1];
    }
    return null;
  }

  function uploadFilesToBatch(fieldName, title, files, onDone) {
    var gap =
      window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.UPLOAD_GAP_MS
        ? window.SiteCmsBulkUpload.UPLOAD_GAP_MS
        : UPLOAD_GAP_MS;
    var mediaLabel = fieldName === "photoBatches" ? "photos" : "videos";
    var queue = Array.from(files);
    var attempt = 0;

    function tryUpload() {
      if (!queue.length) {
        if (onDone) onDone(true);
        return;
      }
      var inner = findInnerListForBatch(title, mediaLabel);
      if (!inner && attempt < 30) {
        attempt++;
        window.setTimeout(tryUpload, 400);
        return;
      }
      if (!inner) {
        if (onDone) onDone(false);
        return;
      }
      attempt = 0;
      clickListAdd(inner);
      window.setTimeout(function () {
        var input = latestFileInput(inner);
        if (!input) {
          window.setTimeout(tryUpload, 400);
          return;
        }
        patchFileInput(input);
        dispatchSingleFile(input, queue.shift());
        window.setTimeout(tryUpload, gap);
      }, 650);
    }

    window.setTimeout(tryUpload, 900);
  }

  function setStatus(msg) {
    var el = document.getElementById("site-gallery-cms-status");
    if (el) el.textContent = msg || "";
  }

  function mountPanel() {
    if (!isGalleryRoute() || !getGalleryDraftEntry()) {
      document.body.classList.remove("site-gallery-cms-active");
      var old = document.getElementById(PANEL_ID);
      if (old) old.remove();
      return;
    }

    document.body.classList.add("site-gallery-cms-active");
    var host =
      document.querySelector("[class*='EditorControlPane']") ||
      document.querySelector("[class*='ScrollContainer']") ||
      document.querySelector("main");
    if (!host) return;

    var panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = PANEL_ID;
      host.insertBefore(panel, host.firstChild);
      panel.innerHTML =
        '<div class="sg-tabs">' +
        '<button type="button" class="sg-tab is-active" data-mode="images">Upload Images</button>' +
        '<button type="button" class="sg-tab" data-mode="videos">Upload Videos</button>' +
        "</div>" +
        '<div class="sg-field"><label for="site-gallery-cms-title">Title</label>' +
        '<input id="site-gallery-cms-title" type="text" placeholder="e.g. Annual day 2026" /></div>' +
        '<div class="sg-field"><label for="site-gallery-cms-files">Files from your computer</label>' +
        '<input id="site-gallery-cms-files" type="file" multiple accept="image/*" /></div>' +
        '<button type="button" class="sg-add" id="site-gallery-cms-add">Add</button>' +
        '<p class="sg-hint">Select one or many files, then click <strong>Add</strong>. Files are saved to Media and <code>/images/</code> when you publish.</p>' +
        '<p class="sg-status" id="site-gallery-cms-status"></p>';

      panel.addEventListener("click", function (e) {
        var tab = e.target.closest && e.target.closest(".sg-tab");
        if (tab) {
          panel.querySelectorAll(".sg-tab").forEach(function (t) {
            t.classList.remove("is-active");
          });
          tab.classList.add("is-active");
          var mode = tab.getAttribute("data-mode");
          var fileInput = document.getElementById("site-gallery-cms-files");
          if (fileInput) fileInput.accept = mode === "videos" ? "video/*" : "image/*";
          setStatus("");
        }
      });

      document.getElementById("site-gallery-cms-add").addEventListener("click", onAddClick);
    }
  }

  function getActiveMode(panel) {
    var active = panel.querySelector(".sg-tab.is-active");
    return active ? active.getAttribute("data-mode") : "images";
  }

  function onAddClick() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    var mode = getActiveMode(panel);
    var fieldName = mode === "videos" ? "videoBatches" : "photoBatches";
    var titleEl = document.getElementById("site-gallery-cms-title");
    var filesEl = document.getElementById("site-gallery-cms-files");
    var addBtn = document.getElementById("site-gallery-cms-add");
    var title = (titleEl && titleEl.value ? titleEl.value : "").trim();
    var files = filesEl && filesEl.files ? Array.from(filesEl.files) : [];

    if (!title) {
      setStatus("Please enter a title.");
      return;
    }
    if (!files.length) {
      setStatus("Please choose at least one file from your computer.");
      return;
    }

    if (addBtn) addBtn.disabled = true;
    setStatus("Adding " + files.length + " file(s)…");

    if (!prependBatch(fieldName, title)) {
      setStatus("Could not update gallery. Try refreshing the page.");
      if (addBtn) addBtn.disabled = false;
      return;
    }

    uploadFilesToBatch(fieldName, title, files, function (ok) {
      if (addBtn) addBtn.disabled = false;
      if (filesEl) filesEl.value = "";
      if (titleEl) titleEl.value = "";
      if (ok) {
        setStatus(
          files.length +
            " file(s) added under \"" +
            title +
            "\". Click Publish to save to the website."
        );
      } else {
        setStatus("Album created, but some uploads may need a retry. Check the album below, then Publish.");
      }
    });
  }

  function tick() {
    mountPanel();
  }

  function boot() {
    if (!window.CMS) return;
    injectStyles();
    tick();
    window.setInterval(tick, 800);
    window.addEventListener("hashchange", tick);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
