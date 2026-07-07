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
    if (id) return id.toLowerCase();
    return slugAnchor(prefix, item && item.title, index);
  }

  function findNewsItemBySub(items, sub, prefix) {
    sub = String(sub || "")
      .trim()
      .toLowerCase();
    if (!sub) return null;
    var list = items || [];
    for (var i = 0; i < list.length; i++) {
      if (itemAnchorId(list[i], prefix, i) === sub) return list[i];
    }
    return null;
  }

  function resolveDynamicNavChildren(type, content) {
    var C = content || (typeof window !== "undefined" ? window.SITE_CONTENT : {}) || {};
    var news = C.news || {};
    if (type === "events") {
      var events = news.events || [];
      return events
        .map(function (e, i) {
          if (!e || e.showInNav === false) return null;
          var anchor = itemAnchorId(e, "evt-", i);
          return {
            label: e.title || "Event",
            href: "news.html?ctx=events#" + anchor,
          };
        })
        .filter(Boolean);
    }
    if (type === "results") {
      var results = news.results || [];
      return results
        .map(function (r, i) {
          if (!r || r.showInNav === false) return null;
          var anchor = itemAnchorId(r, "res-", i);
          return {
            label: r.title || "Result",
            href: "news.html?ctx=results#" + anchor,
          };
        })
        .filter(Boolean);
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
        var dynamic = resolveDynamicNavChildren(item.dynamicChildren, C);
        var staticKids = item.children ? item.children.slice() : [];
        copy.children = staticKids.concat(dynamic);
      } else if (item.children) {
        copy.children = item.children.slice();
      }
      return copy;
    });
  }

  window.resolveNavLinks = resolveNavLinks;
  window.newsItemAnchorId = itemAnchorId;
  window.findNewsItemBySub = findNewsItemBySub;
})();
