/**
 * Decap CMS — Gallery: on Publish, split multi-image rows into separate photos.
 * Does not modify the editor while you work (avoids wiping Photo items).
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";

  function boot() {
    if (!window.CMS || !CMS.registerEventListener) return;
    registerPreSave();
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

  function pathsFromImage(val) {
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

  function expandItems(items) {
    var out = [];
    var changed = false;

    (items || []).forEach(function (item) {
      if (!item || typeof item !== "object") return;
      var paths = pathsFromImage(item.image);
      if (paths.length > 1) {
        changed = true;
        paths.forEach(function (path) {
          out.push({
            title: String(item.title || "").trim(),
            category: String(item.category || "").trim(),
            image: path,
          });
        });
        return;
      }
      out.push({
        title: String(item.title || "").trim(),
        category: String(item.category || "").trim(),
        image: paths.length === 1 ? paths[0] : item.image || "",
      });
    });

    return { items: out, changed: changed };
  }

  function registerPreSave() {
    CMS.registerEventListener({
      name: "preSave",
      handler: function (args) {
        var entry = args && args.entry;
        if (!isGalleryEntry(entry)) return;

        var data = entry.get("data");
        if (!data) return;

        var raw = toJs(data.get("items"));
        if (!Array.isArray(raw)) return;

        var result = expandItems(raw);
        if (!result.changed) return;

        if (data.merge && typeof data.merge === "function") {
          return entry.set("data", data.merge({ items: fromJs(result.items) }));
        }
      },
    });
  }

  boot();
})();
