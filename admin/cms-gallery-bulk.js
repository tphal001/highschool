/**

 * Decap CMS — Gallery bulk picker: multi-select from Media, no raw paths in UI.

 * Must load after decap-cms.js (uses createClass, h, CMS.registerWidget).

 */

(function () {

  "use strict";



  var GALLERY_FILE = "content/cms/gallery.json";



  function boot() {

    if (!window.CMS || !window.createClass || !window.h) return;



    registerGalleryBulkWidget();

    registerPreSave();

    injectGalleryAdminStyles();

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



  function mergeBulkIntoItems(data) {

    var plain = toJs(data) || {};

    var bulk = normalizeBulkValue(plain.bulkImages);

    var items = Array.isArray(plain.items) ? plain.items.slice() : [];

    if (!bulk.length) return { items: items, bulkImages: [] };



    bulk.forEach(function (row) {

      items.push({ title: "", category: "", image: row.image });

    });

    return { items: items, bulkImages: [] };

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



        var merged = mergeBulkIntoItems(data);

        var hasBulk = normalizeBulkValue(toJs(data).bulkImages).length > 0;

        if (!hasBulk) return;



        if (data.merge && typeof data.merge === "function") {

          return entry.merge({

            data: data.merge({

              items: fromJsList(merged.items),

              bulkImages: fromJsList(merged.bulkImages),

            }),

          });

        }



        if (entry.merge && typeof entry.merge === "function") {

          return entry.merge({

            data: Object.assign({}, toJs(data), merged),

          });

        }

      },

    });

  }



  function makeAsset(file) {

    var safeName = String(file.name || "photo")

      .replace(/\s+/g, "-")

      .replace(/[^a-zA-Z0-9._-]/g, "_");

    var path = "images/" + safeName;

    var AssetProxy = window.AssetProxy;

    if (AssetProxy) {

      return new AssetProxy({ path: path, file: file });

    }

    return { path: path, file: file };

  }



  function publicPathFromAsset(asset, file) {

    var path = asset && asset.path ? String(asset.path) : "";

    if (!path && file && file.name) {

      path = "images/" + file.name;

    }

    path = path.replace(/^\/+/, "");

    if (path.indexOf("images/") === 0) return "/" + path;

    return "/images/" + path.replace(/^images\//, "");

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

        this.setImages(current);

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

          self.setState({ uploading: false, status: collected.length ? collected.length + " photo(s) added." : "" });

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

            idx += 1;

            window.setTimeout(next, 120);

            return;

          }



          collected.push(publicPathFromAsset(makeAsset(file), file));

          idx += 1;

          window.setTimeout(next, 120);

        }



        next();

      },



      componentDidUpdate: function (prevProps) {

        var val = this.props.value;

        var prev = prevProps.value;

        if (val === prev) return;

        if (isNormalizedBulkValue(val)) return;



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



        var merged = this.normalize(prev).slice();

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

            "Add many photos at once — upload from your computer or pick several from Media (Ctrl/Shift+click). They move into the gallery when you publish."

          ),

          h(

            "div",

            { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" } },

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

              ? h("span", { style: { fontSize: "0.8125rem", color: "#0f172a", fontWeight: 600 } }, value.length + " selected")

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

            : h("p", { style: { margin: 0, fontSize: "0.75rem", color: "#94a3b8" } }, "No photos queued yet.")

        );

      },

    });



    var GalleryBulkPreview = createClass({

      displayName: "GalleryBulkPreview",

      render: function () {

        var count = normalizeBulkValue(this.props.value).length;

        return h("p", { style: { margin: 0 } }, count ? count + " photo(s) queued for gallery" : "No bulk photos");

      },

    });



    CMS.registerWidget("galleryBulkPicker", GalleryBulkPicker, GalleryBulkPreview);

  }



  function injectGalleryAdminStyles() {

    if (document.getElementById("site-gallery-admin-css")) return;

    var style = document.createElement("style");

    style.id = "site-gallery-admin-css";

    style.textContent =

      "/* Hide raw image paths in gallery CMS lists */" +

      ".nc-listWidget [class*='ImageWidget'] input[type='text']," +

      ".nc-listWidget [class*='imageWidget'] input[type='text']," +

      "[class*='ImageWidget'] [class*='url']," +

      "[data-testid='image-widget-url'] { display: none !important; }";

    document.head.appendChild(style);

  }



  boot();

})();


