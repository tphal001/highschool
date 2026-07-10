/**
 * Decap CMS — Gallery bulk picker: multi-select from Media, merge into items on save.
 * Load after decap-cms.js (uses createClass, h, CMS.registerWidget).
 */
(function () {
  "use strict";

  var GALLERY_FILE = "content/cms/gallery.json";
  var FLUSH_DELAY_MS = 80;

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

  var BULK_FIELD_META = {
    name: "bulkImages",
    label: "Bulk add photos",
    widget: "galleryBulkPicker",
  };

  function boot() {
    if (!window.CMS || !window.createClass || !window.h) return;
    registerGalleryBulkWidget();
    registerPreSave();
    injectGalleryAdminStyles();
    window.SiteGalleryBulk = { flushBulkToItems: flushBulkToItems };
  }

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
        if (row && typeof row === "object") {
          return { image: String(row.image || row.url || "").trim() };
        }
        return { image: "" };
      })
      .filter(function (row) {
        return row.image;
      });
  }

  function isNormalizedBulkValue(val) {
    var v = toJs(val);
    if (!Array.isArray(v)) return false;
    if (!v.length) return true;
    return v.every(function (row) {
      return row && typeof row === "object" && typeof row.image === "string";
    });
  }

  function normalizeItems(val) {
    var v = toJs(val);
    if (!Array.isArray(v)) return [];
    return v.filter(function (row) {
      return row && typeof row === "object" && String(row.image || "").trim();
    });
  }

  function mergeBulkIntoItems(data) {
    var plain = toJs(data) || {};
    var bulk = normalizeBulkValue(plain.bulkImages);
    var items = normalizeItems(plain.items);
    if (!bulk.length) return { items: items, bulkImages: [] };

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
        field: fromJsList(fieldMeta),
        value: fromJsList(value),
        metadata: {},
        entries: [],
      },
    });
    return true;
  }

  function flushBulkToItems() {
    var store = getCmsStore();
    if (!store || typeof store.getState !== "function") return false;

    var state = store.getState();
    var draft = state && state.entryDraft;
    var entry = draft && draft.get && draft.get("entry");
    if (!isGalleryEntry(entry)) return false;

    var data = entry.get("data");
    if (!data) return false;

    var merged = mergeBulkIntoItems(data);
    var bulk = normalizeBulkValue(toJs(data).bulkImages);
    if (!bulk.length) return false;

    var okItems = dispatchField(ITEMS_FIELD_META, merged.items);
    var okBulk = dispatchField(BULK_FIELD_META, []);
    return okItems || okBulk;
  }

  function applyMergedEntry(entry) {
    var data = entry.get("data");
    if (!data) return entry;

    var merged = mergeBulkIntoItems(data);
    var bulk = normalizeBulkValue(toJs(data).bulkImages);
    if (!bulk.length) return entry;

    if (data.merge && typeof data.merge === "function") {
      return entry.set(
        "data",
        data.merge({
          items: fromJsList(merged.items),
          bulkImages: fromJsList(merged.bulkImages),
        })
      );
    }

    var plain = toJs(data) || {};
    return entry.set("data", fromJsList(Object.assign({}, plain, merged)));
  }

  function registerPreSave() {
    if (!CMS.registerEventListener) return;

    CMS.registerEventListener({
      name: "preSave",
      handler: function (args) {
        var entry = args && args.entry;
        if (!isGalleryEntry(entry)) return;
        return applyMergedEntry(entry);
      },
    });
  }

  function makeAsset(file) {
    var safeName = String(file.name || "photo")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    var path = "images/" + safeName;
    var AssetProxy = window.AssetProxy;
    if (AssetProxy) return new AssetProxy({ path: path, file: file });
    return { path: path, file: file };
  }

  function publicPathFromAsset(asset, file) {
    var path = asset && asset.path ? String(asset.path) : "";
    if (!path && file && file.name) path = "images/" + file.name;
    path = path.replace(/^\/+/, "");
    if (path.indexOf("images/") === 0) return "/" + path;
    return "/images/" + path.replace(/^images\//, "");
  }

  function scheduleFlushToItems() {
    window.setTimeout(flushBulkToItems, FLUSH_DELAY_MS);
  }

  function registerGalleryBulkWidget() {
    var h = window.h;
    var createClass = window.createClass;

    var GalleryBulkPicker = createClass({
      displayName: "GalleryBulkPicker",

      getInitialState: function () {
        return { uploading: false, status: "" };
      },

      normalize: function (val) {
        return normalizeBulkValue(val);
      },

      setImages: function (rows) {
        this.props.onChange(rows);
        if (rows && rows.length) scheduleFlushToItems();
      },

      appendPaths: function (paths) {
        var current = this.normalize(this.props.value);
        var seen = {};
        current.forEach(function (row) {
          seen[row.image] = true;
        });
        paths.forEach(function (p) {
          p = String(p || "").trim();
          if (p && !seen[p]) {
            seen[p] = true;
            current.push({ image: p });
          }
        });
        this.setImages(current);
      },

      removeAt: function (index) {
        var current = this.normalize(this.props.value);
        var removed = current[index];
        current.splice(index, 1);
        this.props.onChange(current);
        if (removed && this.props.onRemoveAsset) {
          this.props.onRemoveAsset(removed.image);
        }
      },

      openMediaLibrary: function () {
        var props = this.props;
        if (!props.onOpenMediaLibrary) {
          this.setState({ status: "Media library is not available. Refresh the page and try again." });
          return;
        }

        var cfg = props.field.getIn ? props.field.getIn(["media_library", "config"]) : null;
        if (cfg && cfg.toJS) cfg = cfg.toJS();
        if (!cfg || typeof cfg !== "object") cfg = {};
        if (!cfg.multiple) cfg.multiple = true;

        props.onOpenMediaLibrary({
          controlID: props.forID,
          allowMultiple: true,
          forImage: true,
          field: props.field,
          value: "",
          config: cfg,
        });
      },

      handleFileChange: function (e) {
        var files = e.target.files ? Array.from(e.target.files) : [];
        e.target.value = "";
        if (!files.length) return;
        this.uploadFiles(files);
      },

      uploadFiles: function (files) {
        var self = this;
        var onAddAsset = this.props.onAddAsset;
        var collected = [];
        var idx = 0;

        this.setState({ uploading: true, status: "Uploading 0/" + files.length + "…" });

        function finish() {
          if (collected.length) self.appendPaths(collected);
          self.setState({
            uploading: false,
            status: collected.length
              ? collected.length + " photo(s) added — check Photo items below."
              : "",
          });
        }

        function next() {
          if (idx >= files.length) {
            finish();
            return;
          }
          var file = files[idx];
          var n = idx + 1;
          self.setState({ status: "Uploading " + n + "/" + files.length + "…" });

          if (onAddAsset) {
            var asset = makeAsset(file);
            onAddAsset(asset);
            collected.push(publicPathFromAsset(asset, file));
          } else {
            collected.push(publicPathFromAsset(makeAsset(file), file));
          }

          idx += 1;
          window.setTimeout(next, 120);
        }

        next();
      },

      componentDidUpdate: function (prevProps) {
        var val = this.props.value;
        var prev = prevProps.value;
        if (val === prev) return;

        var prevNorm = this.normalize(prev);
        var valNorm = this.normalize(val);

        // Decap media library clears the control after insert — do not wipe staged photos.
        if (!valNorm.length && prevNorm.length) return;

        if (isNormalizedBulkValue(val)) {
          if (valNorm.length) scheduleFlushToItems();
          return;
        }

        var incoming = [];
        if (typeof val === "string") {
          incoming = [val];
        } else if (Array.isArray(val)) {
          incoming = val.map(function (row) {
            if (typeof row === "string") return row;
            if (row && typeof row === "object") return row.image || row.url || "";
            return "";
          });
        }

        incoming = incoming.filter(Boolean);
        if (!incoming.length) return;

        var merged = prevNorm.slice();
        var seen = {};
        merged.forEach(function (row) {
          seen[row.image] = true;
        });
        incoming.forEach(function (p) {
          p = String(p).trim();
          if (p && !seen[p]) {
            seen[p] = true;
            merged.push({ image: p });
          }
        });
        this.setImages(merged);
      },

      renderThumb: function (item, index) {
        var getAsset = this.props.getAsset;
        var src = item.image;
        if (getAsset) {
          var asset = getAsset(item.image, this.props.field);
          if (asset && asset.toString) src = asset.toString();
        }
        var self = this;
        return h(
          "div",
          {
            key: index,
            style: {
              position: "relative",
              width: "72px",
              height: "72px",
              borderRadius: "6px",
              overflow: "hidden",
              border: "1px solid #cbd5e1",
              background: "#f1f5f9",
            },
          },
          src
            ? h("img", {
                src: src,
                alt: "",
                style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
              })
            : h("span", { style: { fontSize: "10px", padding: "4px", color: "#64748b" } }, "Photo"),
          h(
            "button",
            {
              type: "button",
              title: "Remove",
              onClick: function () {
                self.removeAt(index);
              },
              style: {
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "20px",
                height: "20px",
                border: "none",
                borderRadius: "999px",
                background: "rgba(15,23,42,0.75)",
                color: "#fff",
                fontSize: "12px",
                lineHeight: "20px",
                cursor: "pointer",
                padding: 0,
              },
            },
            "×"
          )
        );
      },

      render: function () {
        var value = this.normalize(this.props.value);
        var self = this;
        var busy = this.state.uploading;

        return h(
          "div",
          { className: this.props.classNameWrapper, id: this.props.forID },
          h(
            "p",
            { style: { margin: "0 0 0.5rem", fontSize: "0.8125rem", color: "#475569" } },
            "Add many photos at once — upload from your computer or pick several from Media (Ctrl/Shift+click). New photos appear in Photo items below."
          ),
          h(
            "div",
            {
              style: {
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                alignItems: "center",
                marginBottom: "0.75rem",
              },
            },
            h(
              "button",
              {
                type: "button",
                disabled: busy,
                onClick: this.openMediaLibrary,
                style: {
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  borderRadius: "0.375rem",
                  border: "1px solid #0e7490",
                  background: "#ecfeff",
                  color: "#0e7490",
                  cursor: busy ? "wait" : "pointer",
                },
              },
              "Choose from Media"
            ),
            h(
              "label",
              {
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: "#0f172a",
                  cursor: busy ? "wait" : "pointer",
                },
              },
              h("input", {
                type: "file",
                multiple: true,
                accept: "image/*",
                disabled: busy,
                style: { maxWidth: "11rem" },
                onChange: this.handleFileChange,
              }),
              "Upload multiple"
            ),
            value.length
              ? h(
                  "span",
                  { style: { fontSize: "0.8125rem", color: "#0f172a", fontWeight: 600 } },
                  value.length + " queued"
                )
              : null
          ),
          this.state.status
            ? h("p", { style: { margin: "0 0 0.5rem", fontSize: "0.75rem", color: "#64748b" } }, this.state.status)
            : null,
          value.length
            ? h(
                "div",
                { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem" } },
                value.map(function (item, i) {
                  return self.renderThumb(item, i);
                })
              )
            : h("p", { style: { margin: 0, fontSize: "0.75rem", color: "#94a3b8" } }, "No photos queued — use the buttons above.")
        );
      },
    });

    var GalleryBulkPreview = createClass({
      displayName: "GalleryBulkPreview",
      render: function () {
        var count = normalizeBulkValue(this.props.value).length;
        return h("p", { style: { margin: 0 } }, count ? count + " photo(s) queued" : "No bulk photos queued");
      },
    });

    CMS.registerWidget("galleryBulkPicker", GalleryBulkPicker, GalleryBulkPreview);
  }

  function injectGalleryAdminStyles() {
    if (document.getElementById("site-gallery-admin-css")) return;
    var style = document.createElement("style");
    style.id = "site-gallery-admin-css";
    style.textContent =
      ".nc-listWidget [class*='ImageWidget'] input[type='text']," +
      ".nc-listWidget [class*='imageWidget'] input[type='text']," +
      "[class*='ImageWidget'] [class*='url']," +
      "[data-testid='image-widget-url'] { display: none !important; }";
    document.head.appendChild(style);
  }

  boot();
})();
