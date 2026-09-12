/**
 * Highlights + Quick Announcements CMS — normalize poster images before save/publish.
 * Decap can store image widgets as objects; plain path strings keep the editor stable.
 */
(function () {
  "use strict";

  function imagePath(val) {
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
          .set("posterImage", imagePath(item.get("posterImage")))
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

  function normalizeQuickAnnouncementsEntry(entry) {
    if (!entry || typeof entry.get !== "function") return entry;
    if (entry.get("slug") !== "quickAnnouncements") return entry;

    var items = entry.getIn(["data", "items"]);
    if (!items || typeof items.map !== "function") return entry;

    var next = items
      .map(function (item) {
        if (!item || typeof item.set !== "function") return item;
        var title = item.get("title");
        if (!title || !String(title).trim()) return null;

        var href = item.get("href");
        return item
          .set("image", imagePath(item.get("image")))
          .set("href", href != null && String(href).trim() ? String(href).trim() : "news.html?ctx=events");
      })
      .filter(Boolean);

    return entry.setIn(["data", "items"], next);
  }

  function normalizeEntry(entry) {
    if (!entry) return entry;
    var slug = entry.get("slug");
    if (slug === "highlight") return normalizeHighlightEntry(entry);
    if (slug === "quickAnnouncements") return normalizeQuickAnnouncementsEntry(entry);
    return entry;
  }

  function register() {
    if (!window.CMS || typeof CMS.registerEventListener !== "function") return false;
    if (window.__sitePosterCmsFix) return true;
    window.__sitePosterCmsFix = true;

    function handle(opts) {
      if (!opts || !opts.entry) return opts.entry;
      return normalizeEntry(opts.entry);
    }

    CMS.registerEventListener({ name: "preSave", handler: handle });
    CMS.registerEventListener({ name: "prePublish", handler: handle });
    return true;
  }

  if (!register()) {
    window.setTimeout(register, 300);
    window.setTimeout(register, 1200);
  }
})();
