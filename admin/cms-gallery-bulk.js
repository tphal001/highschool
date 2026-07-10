/**
 * Decap CMS — Gallery: add photos from Media into Photo items (native image field).
 * Load after decap-cms.js, before CMS.init().
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var TRIGGER_FIELD = "galleryBulkTrigger";
  var ROW_GAP_MS = 1200;

  var ITEMS_FIELD_META = {
    name: "items",
    label: "Photo items",
    widget: "list",
    fields: [
      { name: "title", label: "Title (optional)", widget: "string", required: false },
      { name: "category", label: "Category (optional)", widget: "string", required: false },
      { name: "image", label: "Photo", widget: "image" },
    ],
  };

  var TRIGGER_FIELD_META = {
    name: TRIGGER_FIELD,
    label: "Add photos from Media",
    widget: "image",
  };

  function boot() {
    if (!window.CMS) return;
    registerPreSave();
    waitForStore(watchGalleryMediaTrigger);
    window.SiteGalleryBulk = { appendPhotosToItems: appendPhotosToItems };
  }

  function waitForStore(fn) {
    if (getCmsStore()) {
      fn();
      return;
    }
    window.setTimeout(function () {
      waitForStore(fn);
    }, 150);
  }

  function isGalleryEditor() {
    return /\/collections\/staff_content\/entries\/gallery/i.test(window.location.hash || "");
  }

  function isGalleryEntry(entry) {
    if (!entry || !entry.get) return false;
    return entry.get("file") === GALLERY_FILE || entry.get("slug") === "gallery";
  }

  function toJs(val) {
    if (!val) return val;
    return val.toJS ? val.toJS() : val;
  }

  function fromJs(val) {
    if (window.Immutable && window.Immutable.fromJS) {
      return window.Immutable.fromJS(val);
    }
    return val;
  }

  function normalizeItems(val) {
    var v = toJs(val);
    if (!Array.isArray(v)) return [];
    return v.filter(function (row) {
      return row && typeof row === "object" && String(row.image || "").trim();
    });
  }

  function normalizeBulkValue(val) {
    var v = toJs(val);
    if (!v) return [];
    if (!Array.isArray(v)) {
      if (typeof v === "string" && v.trim()) return [{ image: v.trim() }];
      return [];
    }
    return v
      .map(function (row) {
        if (typeof row === "string") return { image: row.trim() };
        if (row && typeof row === "object") return { image: String(row.image || "").trim() };
        return { image: "" };
      })
      .filter(function (row) {
        return row.image;
      });
  }

  function pathsFromMediaValue(val) {
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

  function mergeBulkIntoItems(data) {
    var plain = toJs(data) || {};
    var bulk = normalizeBulkValue(plain.bulkImages);
    var items = normalizeItems(plain.items);
    bulk.forEach(function (row) {
      items.push({ title: "", category: "", image: row.image });
    });
    return { items: items, bulkImages: [] };
  }

  function getCmsStore() {
    if (!window.CMS) return null;
    if (typeof CMS.getStore === "function") return CMS.getStore();
    if (CMS.store) return CMS.store;
    return null;
  }

  function dispatchField(fieldMeta, value) {
    var store = getCmsStore();
    if (!store || typeof store.dispatch !== "function") return false;
    store.dispatch({
      type: "DRAFT_CHANGE_FIELD",
      payload: {
        field: fromJs(fieldMeta),
        value: value === null || value === "" ? null : fromJs(value),
        metadata: {},
        entries: [],
      },
    });
    return true;
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

        var bulk = normalizeBulkValue(data.get("bulkImages"));
        if (!bulk.length) return;

        var merged = mergeBulkIntoItems(data);
        if (data.merge && typeof data.merge === "function") {
          return entry.set(
            "data",
            data.merge({
              items: fromJs(merged.items),
              bulkImages: fromJs(merged.bulkImages),
            })
          );
        }
      },
    });
  }

  function findItemsListRoot() {
    var lists = document.querySelectorAll(".nc-listWidget, [class*='ListControl']");
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i];
      var top = list.querySelector(".nc-listWidget-topBar, [class*='ListTopBar'], h2, h3, label");
      var text = (top && top.textContent) || "";
      if (/photo items/i.test(text)) return list;
    }
    return null;
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var t = (btn.textContent || "").trim().toLowerCase();
      if (t === "add" || /add photo items/i.test(t) || t.indexOf("add ") === 0) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function setReactInputValue(input, value) {
    if (!input) return false;
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (setter && setter.set) setter.set.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function latestListItem(listRoot) {
    var items = listRoot.querySelectorAll(
      ".nc-listWidget-nestedItem, [class*='NestedObjectContainer'], [class*='ListItem']"
    );
    return items.length ? items[items.length - 1] : null;
  }

  function setItemImagePath(listRoot, path, attempt) {
    attempt = attempt || 0;
    var item = latestListItem(listRoot);
    if (!item) return false;

    var scopes = [item];
    var imageWidget = item.querySelector('[class*="imageWidget"], [class*="ImageWidget"]');
    if (imageWidget) scopes.unshift(imageWidget);

    for (var s = 0; s < scopes.length; s++) {
      var inputs = scopes[s].querySelectorAll('input[type="text"], input[type="url"]');
      for (var i = inputs.length - 1; i >= 0; i--) {
        if (setReactInputValue(inputs[i], path)) return true;
      }
    }

    if (attempt < 4) {
      window.setTimeout(function () {
        setItemImagePath(listRoot, path, attempt + 1);
      }, 400);
    }
    return false;
  }

  function appendPhotosToItems(paths, onDone) {
    paths = (paths || [])
      .map(function (p) {
        return String(p || "").trim();
      })
      .filter(Boolean);

    if (!paths.length) {
      if (onDone) onDone(0);
      return;
    }

    var listRoot = findItemsListRoot();
    if (!listRoot) {
      if (onDone) onDone(0);
      return;
    }

    var queue = paths.slice();
    var added = 0;

    function next() {
      if (!queue.length) {
        if (onDone) onDone(added);
        return;
      }

      var path = queue.shift();
      if (!clickListAdd(listRoot)) {
        if (onDone) onDone(added);
        return;
      }

      window.setTimeout(function () {
        if (setItemImagePath(listRoot, path)) added += 1;
        window.setTimeout(next, ROW_GAP_MS);
      }, 500);
    }

    next();
  }

  function watchGalleryMediaTrigger() {
    var store = getCmsStore();
    if (!store || typeof store.subscribe !== "function") return;

    var lastSignature = "";
    var busy = false;

    store.subscribe(function () {
      if (busy || !isGalleryEditor()) return;

      var state = store.getState();
      var draft = state && state.entryDraft;
      var entry = draft && draft.get && draft.get("entry");
      if (!isGalleryEntry(entry)) return;

      var data = entry.get("data");
      if (!data) return;

      var triggerVal = data.get(TRIGGER_FIELD);
      var paths = pathsFromMediaValue(triggerVal);
      var signature = paths.slice().sort().join("|");

      if (!signature || signature === lastSignature) return;

      lastSignature = signature;
      busy = true;

      appendPhotosToItems(paths, function () {
        dispatchField(TRIGGER_FIELD_META, null);
        lastSignature = "";
        busy = false;
      });
    });
  }

  boot();
})();
