/**
 * Resolves nav links: merges CMS-driven submenus for Events and Results.
 * Requires window.SITE_CONFIG and window.SITE_CONTENT (load after content.js).
 */
(function () {
  function slugAnchor(prefix, title, index) {
    var s = String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (s) return prefix + s;
    return prefix + String(index);
  }

  function itemAnchorId(item, prefix, index) {
    var id = item && item.anchorId != null ? String(item.anchorId).trim() : "";
    if (id) return id;
    return slugAnchor(prefix, item && item.title, index);
  }

  function resolveDynamicNavChildren(type, content) {
    var C = content || (typeof window !== "undefined" ? window.SITE_CONTENT : {}) || {};
    var news = C.news || {};
    if (type === "events") {
      return (news.events || [])
        .filter(function (e) {
          return e && e.showInNav !== false;
        })
        .map(function (e, i) {
          var anchor = itemAnchorId(e, "evt-", i);
          return {
            label: e.title || "Event",
            href: "news.html?ctx=events#" + anchor,
          };
        });
    }
    if (type === "results") {
      return (news.results || [])
        .filter(function (r) {
          return r && r.showInNav !== false;
        })
        .map(function (r, i) {
          var anchor = itemAnchorId(r, "res-", i);
          return {
            label: r.title || "Result",
            href: "news.html?ctx=results#" + anchor,
          };
        });
    }
    return [];
  }

  function resolveNavLinks(cfg) {
    cfg = cfg || (typeof window !== "undefined" ? window.SITE_CONFIG : {}) || {};
    var base = cfg.navLinks || [];
    var C = typeof window !== "undefined" ? window.SITE_CONTENT : {};
    return base.map(function (item) {
      if (!item) return item;
      var copy = Object.assign({}, item);
      if (item.dynamicChildren === "events" || item.dynamicChildren === "results") {
        copy.children = resolveDynamicNavChildren(item.dynamicChildren, C);
      } else if (item.children) {
        copy.children = item.children.slice();
      }
      return copy;
    });
  }

  window.resolveNavLinks = resolveNavLinks;
  window.newsItemAnchorId = itemAnchorId;
})();
