/**
 * Highlights CMS — normalize poster images before save (avoids Decap publish UI crash).
 */
(function () {
  "use strict";

  function posterPath(val) {
    if (val == null || val === "") return "";
    if (typeof val === "string") return val.trim();
    if (val.toJS) val = val.toJS();
    if (typeof val === "object") {
      return String(val.path || val.url || val.src || val.image || "").trim();
    }
    return "";
  }

  function normalizeHighlightEntry(entry) {
    if (!entry || typeof entry.get !== "function") return entry;
    if (entry.get("slug") !== "highlight") return entry;

    var items = entry.getIn(["data", "items"]);
    if (!items || typeof items.map !== "function") return entry;

    var next = items
      .map(function (item) {
        if (!item || typeof item.set !== "function") return item;
        var headline = item.get("headline");
        if (!headline || !String(headline).trim()) return null;

        return item
          .set("posterImage", posterPath(item.get("posterImage")))
          .set("linkUrl", item.get("linkUrl") != null ? String(item.get("linkUrl")).trim() : "")
          .set("linkLabel", item.get("linkLabel") || "View")
          .set("linkUrlLabel", item.get("linkUrlLabel") || "Open link")
          .set("badge", item.get("badge") || "Highlights")
          .set("enabled", item.get("enabled") !== false)
          .set("showOnHome", item.get("showOnHome") !== false);
      })
      .filter(Boolean);

    return entry.setIn(["data", "items"], next);
  }

  function register() {
    if (!window.CMS || typeof CMS.registerEventListener !== "function") return false;
    if (window.__siteHighlightCmsFix) return true;
    window.__siteHighlightCmsFix = true;

    CMS.registerEventListener({
      name: "preSave",
      handler: function (opts) {
        if (!opts || !opts.entry) return opts.entry;
        return normalizeHighlightEntry(opts.entry);
      },
    });
    return true;
  }

  if (!register()) {
    window.setTimeout(register, 300);
    window.setTimeout(register, 1200);
  }
})();
