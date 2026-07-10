/**
 * Decap CMS — Gallery: inject checkboxes in Media + Choose selected adds photo rows.
 * Decap's default media library has no checkboxes; use this from Gallery → Add photo + → Choose an image.
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var ROW_GAP_MS = 1000;
  var PUBLIC_FOLDER = "/images";

  function boot() {
    if (!window.CMS) return;
    registerPreSave();
    injectMediaCheckboxStyles();
    watchMediaLibrary();
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
    if (!CMS.registerEventListener) return;
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

  function injectMediaCheckboxStyles() {
    if (document.getElementById("site-gallery-media-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-media-css";
    style.textContent =
      ".site-media-check-wrap{position:absolute;top:6px;left:6px;z-index:6;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:4px;background:rgba(255,255,255,0.95);box-shadow:0 1px 3px rgba(0,0,0,0.25);}" +
      ".site-media-check{width:16px;height:16px;cursor:pointer;margin:0;}" +
      "[class*='MediaLibraryCard'],[class*='MediaCard'],[class*='media-library'] li{position:relative!important;}";
    document.head.appendChild(style);
  }

  function findMediaRoot() {
    return (
      document.querySelector("[class*='MediaLibrary']") ||
      document.querySelector("[class*='media-library']") ||
      document.body
    );
  }

  function pathFromCard(card) {
    if (!card) return "";
    var name = "";
    var nameEl = card.querySelector(
      "[class*='fileName'], [class*='FileName'], [class*='cardTitle'], figcaption, p, span"
    );
    if (nameEl) name = (nameEl.textContent || "").trim();
    if (!name) {
      var img = card.querySelector("img");
      if (img && img.src) {
        var parts = img.src.split("/");
        name = parts[parts.length - 1].split("?")[0];
      }
    }
    if (!name) return "";
    if (name.indexOf("/") === 0) return name;
    if (name.indexOf("images/") === 0) return "/" + name;
    return PUBLIC_FOLDER + "/" + name.replace(/^\/+/, "");
  }

  function collectMediaCards(root) {
    var cards = [];
    var seen = {};
    function add(el) {
      if (!el || seen[el]) return;
      if (!el.querySelector("img")) return;
      seen[el] = true;
      cards.push(el);
    }

    root.querySelectorAll(
      "[class*='MediaLibraryCard'], [class*='MediaCard'], [class*='media-library'] li, [class*='MediaLibrary'] li"
    ).forEach(add);

    if (!cards.length) {
      root.querySelectorAll("[class*='MediaLibrary'] img, [class*='media-library'] img").forEach(function (img) {
        add(img.closest("li, article, figure, div"));
      });
    }
    return cards;
  }

  function injectCheckboxes(root) {
    if (!isGalleryEditor()) return;
    if (!root) return;

    collectMediaCards(root).forEach(function (card) {
      if (card.querySelector(".site-media-check-wrap")) return;

      var wrap = document.createElement("div");
      wrap.className = "site-media-check-wrap";
      wrap.title = "Select for gallery";

      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "site-media-check";
      cb.addEventListener("click", function (e) {
        e.stopPropagation();
      });

      wrap.appendChild(cb);
      card.style.position = "relative";
      card.insertBefore(wrap, card.firstChild);
    });
  }

  function getCheckedPaths() {
    var paths = [];
    var seen = {};
    document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
      var card = cb.closest("li, article, figure, [class*='Card'], [class*='card']");
      var path = pathFromCard(card);
      if (path && !seen[path]) {
        seen[path] = true;
        paths.push(path);
      }
    });
    return paths;
  }

  function findItemsListRoot() {
    var lists = document.querySelectorAll(".nc-listWidget, [class*='ListControl']");
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i];
      var top = list.querySelector(".nc-listWidget-topBar, [class*='ListTopBar'], h2, h3, label");
      if (/photo items/i.test((top && top.textContent) || "")) return list;
    }
    return null;
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();
      if (t === "add" || /add photo items/i.test(t) || t.indexOf("add ") === 0) {
        buttons[i].click();
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
      for (var j = inputs.length - 1; j >= 0; j--) {
        if (setReactInputValue(inputs[j], path)) return true;
      }
    }

    if (attempt < 5) {
      window.setTimeout(function () {
        setItemImagePath(listRoot, path, attempt + 1);
      }, 350);
    }
    return false;
  }

  function appendPhotosToItems(paths, onDone) {
    paths = paths.filter(function (p) {
      return String(p || "").trim();
    });
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
      }, 450);
    }

    next();
  }

  function closeMediaLibrary() {
    var buttons = document.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();
      if (t === "close" || t === "×" || t === "x") {
        buttons[i].click();
        return;
      }
    }
  }

  function showGalleryToast(msg) {
    var el = document.getElementById("site-gallery-media-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "site-gallery-media-toast";
      el.style.cssText =
        "position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);z-index:99999;padding:0.65rem 1rem;border-radius:0.5rem;background:#0f172a;color:#fff;font-size:0.8125rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.2);max-width:90vw;text-align:center;";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    window.clearTimeout(showGalleryToast._t);
    showGalleryToast._t = window.setTimeout(function () {
      el.style.display = "none";
    }, 5000);
  }

  function watchMediaLibrary() {
    document.addEventListener(
      "click",
      function (e) {
        if (!isGalleryEditor()) return;
        var btn = e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;
        if ((btn.textContent || "").trim().toLowerCase() !== "choose selected") return;

        var paths = getCheckedPaths();
        if (!paths.length) return;

        e.preventDefault();
        e.stopImmediatePropagation();

        showGalleryToast("Adding " + paths.length + " photo(s) to gallery…");
        appendPhotosToItems(paths, function (count) {
          document.querySelectorAll(".site-media-check:checked").forEach(function (cb) {
            cb.checked = false;
          });
          closeMediaLibrary();
          showGalleryToast(
            count
              ? count + " photo(s) added — check Photo items count, then Publish."
              : "Could not add photos. Try Add photo + again."
          );
        });
      },
      true
    );

    new MutationObserver(function () {
      if (isGalleryEditor()) injectCheckboxes(findMediaRoot());
    }).observe(document.body, { childList: true, subtree: true });

    injectCheckboxes(findMediaRoot());
    window.setInterval(function () {
      if (isGalleryEditor()) injectCheckboxes(findMediaRoot());
    }, 1200);
  }

  boot();
})();
