/**

 * Decap CMS — Gallery Photo items: multi-select from Media → one list row per image.

 * Load after decap-cms.js, before CMS.init().

 */

(function () {

  "use strict";



  var GALLERY_FILE = "content/cms/gallery.json";



  var ITEMS_FIELD_META = {

    name: "items",

    label: "Photo items",

    widget: "list",

    summary: "{{fields.title}}",

    label_singular: "photo",

    fields: [

      { name: "title", label: "Title (optional)", widget: "string", required: false },

      { name: "category", label: "Category (optional)", widget: "string", required: false },

      {

        name: "image",

        label: "Photo",

        widget: "image",

        choose_url: false,

        media_library: {

          allow_multiple: true,

          config: { multiple: true },

        },

      },

    ],

  };



  function boot() {

    if (!window.CMS) return;

    registerPreSave();

    waitForStore(watchGalleryMultiMedia);

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

    if (window.Immutable && window.Immutable.fromJS) return window.Immutable.fromJS(val);

    return val;

  }



  function normalizeItems(val) {

    var v = toJs(val);

    if (!Array.isArray(v)) return [];

    return v

      .map(function (row) {

        if (!row || typeof row !== "object") return null;

        return {

          title: String(row.title || "").trim(),

          category: String(row.category || "").trim(),

          image: row.image,

        };

      })

      .filter(Boolean);

  }



  function pathsFromValue(val) {

    if (!val) return [];

    if (typeof val === "string") return val.trim() ? [val.trim()] : [];

    if (!Array.isArray(val)) return [];

    return val

      .map(function (row) {

        if (typeof row === "string") return row.trim();

        if (row && typeof row === "object") return String(row.image || row.url || row.path || "").trim();

        return "";

      })

      .filter(Boolean);

  }



  function blankItem() {

    return { title: "", category: "", image: "" };

  }



  function cloneItem(item) {

    return {

      title: String((item && item.title) || "").trim(),

      category: String((item && item.category) || "").trim(),

      image: item && item.image,

    };

  }



  /** Split any item whose image is an array into separate rows (one photo each). */

  function expandMultiImagesInItems(items) {

    var out = [];

    var changed = false;



    (items || []).forEach(function (item) {

      var paths = pathsFromValue(item && item.image);

      if (paths.length > 1) {

        changed = true;

        paths.forEach(function (path) {

          out.push({ title: item.title || "", category: item.category || "", image: path });

        });

        return;

      }

      if (Array.isArray(item && item.image)) {

        changed = true;

        out.push({ title: item.title || "", category: item.category || "", image: paths[0] || "" });

        return;

      }

      out.push(cloneItem(item));

    });



    return { items: out, changed: changed };

  }



  function getCmsStore() {

    if (!window.CMS) return null;

    if (typeof CMS.getStore === "function") return CMS.getStore();

    if (CMS.store) return CMS.store;

    return null;

  }



  function dispatchItems(items) {

    var store = getCmsStore();

    if (!store || typeof store.dispatch !== "function") return false;

    store.dispatch({

      type: "DRAFT_CHANGE_FIELD",

      payload: {

        field: fromJs(ITEMS_FIELD_META),

        value: fromJs(items),

        metadata: {},

        entries: [],

      },

    });

    return true;

  }



  function itemsSignature(items) {

    return JSON.stringify(

      (items || []).map(function (it) {

        return {

          title: it.title || "",

          category: it.category || "",

          image: pathsFromValue(it.image).join("|"),

        };

      })

    );

  }



  /** After multi-select in Media, Decap may only keep the first path on the current row. */

  function mergeMultiPathsIntoItems(items, paths) {

    paths = pathsFromValue(paths);

    if (paths.length <= 1) return null;



    items = (items || []).map(cloneItem);

    var last = items.length ? items[items.length - 1] : null;

    var lastPath = last ? pathsFromValue(last.image)[0] : "";



    if (last && (lastPath === paths[0] || !lastPath)) {

      items.pop();

    }



    paths.forEach(function (path) {

      items.push({ title: "", category: "", image: path });

    });



    return items;

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



        var items = normalizeItems(data.get("items"));

        var expanded = expandMultiImagesInItems(items);

        if (!expanded.changed) return;



        if (data.merge && typeof data.merge === "function") {

          return entry.set("data", data.merge({ items: fromJs(expanded.items) }));

        }

      },

    });

  }



  function watchGalleryMultiMedia() {

    var store = getCmsStore();

    if (!store || typeof store.subscribe !== "function") return;



    var busy = false;

    var lastSig = "";

    var mlWasVisible = false;

    var mlPeakPaths = [];



    store.subscribe(function () {

      if (busy || !isGalleryEditor()) return;



      var state = store.getState();

      var draft = state && state.entryDraft;

      var entry = draft && draft.get && draft.get("entry");

      if (!isGalleryEntry(entry)) return;



      var data = entry.get("data");

      if (!data) return;



      var items = normalizeItems(data.get("items"));

      var sig = itemsSignature(items);

      var ml = state.mediaLibrary;

      var mlVisible = !!(ml && ml.get && ml.get("isVisible"));



      if (mlVisible) {

        var selected = pathsFromValue(ml.get("value"));

        if (selected.length) mlPeakPaths = selected.slice();

      }



      if (mlWasVisible && !mlVisible) {

        var pathsToApply = mlPeakPaths.slice();

        if (pathsToApply.length <= 1 && ml.get) {

          var cid = ml.get("controlID");

          if (cid) pathsToApply = pathsFromValue(ml.getIn(["controlMedia", cid]));

        }

        mlPeakPaths = [];



        if (pathsToApply.length > 1) {

          var merged = mergeMultiPathsIntoItems(items, pathsToApply);

          if (merged) {

            busy = true;

            dispatchItems(merged);

            lastSig = itemsSignature(merged);

            busy = false;

            return;

          }

        }

      }



      mlWasVisible = mlVisible;



      if (sig === lastSig) return;



      var expanded = expandMultiImagesInItems(items);

      if (expanded.changed) {

        busy = true;

        dispatchItems(expanded.items);

        lastSig = itemsSignature(expanded.items);

        busy = false;

        return;

      }



      lastSig = sig;

    });

  }



  boot();

})();


