/**

 * Decap CMS — Gallery: bulk add photos directly into Photo items list.

 * Load after decap-cms.js.

 */

(function () {

  "use strict";



  var GALLERY_FILE = "content/cms/gallery.json";

  var ROW_GAP_MS = 1200;



  function boot() {

    if (!window.CMS || !window.createClass || !window.h) return;

    registerGalleryBulkToolbarWidget();

    registerPreSave();

    watchGalleryEditor();

    window.SiteGalleryBulk = { appendPhotosToItems: appendPhotosToItems };

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



  function mergeBulkIntoItems(data) {

    var plain = toJs(data) || {};

    var bulk = normalizeBulkValue(plain.bulkImages);

    var items = normalizeItems(plain.items);

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



  function uploadFilesToItems(files, onStatus, onDone) {

    var listRoot = findItemsListRoot();

    if (!listRoot || !files.length) {

      if (onDone) onDone(0);

      return;

    }



    var queue = files.slice();

    var added = 0;



    function latestFileInput() {

      var item = latestListItem(listRoot);

      if (!item) return null;

      var inputs = item.querySelectorAll('input[type="file"]');

      return inputs.length ? inputs[inputs.length - 1] : null;

    }



    function dispatchSingle(input, file) {

      var dt = new DataTransfer();

      dt.items.add(file);

      input.files = dt.files;

      input.dispatchEvent(new Event("change", { bubbles: true }));

    }



    function next() {

      if (!queue.length) {

        if (onDone) onDone(added);

        return;

      }



      if (!clickListAdd(listRoot)) {

        if (onDone) onDone(added);

        return;

      }



      var file = queue.shift();

      var remaining = queue.length;

      if (onStatus) onStatus("Uploading… " + (files.length - remaining) + "/" + files.length);



      window.setTimeout(function () {

        var input = latestFileInput();

        if (window.SiteCmsBulkUpload && window.SiteCmsBulkUpload.patchInput) {

          window.SiteCmsBulkUpload.patchInput(input);

        }

        if (input) {

          dispatchSingle(input, file);

          added += 1;

        }

        window.setTimeout(next, ROW_GAP_MS);

      }, 500);

    }



    next();

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



  function registerGalleryBulkToolbarWidget() {

    var h = window.h;

    var createClass = window.createClass;



    var GalleryBulkToolbar = createClass({

      displayName: "GalleryBulkToolbar",



      getInitialState: function () {

        return { status: "", busy: false };

      },



      clearTrigger: function () {

        this.props.onChange("");

      },



      openMediaLibrary: function () {

        var props = this.props;

        if (!props.onOpenMediaLibrary) {

          this.setState({ status: "Media library unavailable — refresh and try again." });

          return;

        }



        var cfg = props.field.getIn ? props.field.getIn(["media_library", "config"]) : null;

        if (cfg && cfg.toJS) cfg = cfg.toJS();

        if (!cfg || typeof cfg !== "object") cfg = {};

        cfg.multiple = true;



        props.onOpenMediaLibrary({

          controlID: props.forID,

          allowMultiple: true,

          forImage: true,

          field: props.field,

          value: "",

          config: cfg,

        });

      },



      handleFiles: function (e) {

        var files = e.target.files ? Array.from(e.target.files) : [];

        e.target.value = "";

        if (!files.length) return;



        var self = this;

        self.setState({ busy: true, status: "Adding " + files.length + " photo(s) to Photo items…" });



        uploadFilesToItems(

          files,

          function (msg) {

            self.setState({ status: msg });

          },

          function (count) {

            self.setState({

              busy: false,

              status: count

                ? count + " photo(s) added — check Photo items count below, then Publish."

                : "Could not add photos. Expand Photo items and try again.",

            });

          }

        );

      },



      componentDidUpdate: function (prevProps) {

        var val = this.props.value;

        if (val === prevProps.value) return;



        var paths = pathsFromMediaValue(val);

        this.clearTrigger();



        if (!paths.length) return;



        var self = this;

        self.setState({ busy: true, status: "Adding " + paths.length + " photo(s) to Photo items…" });



        appendPhotosToItems(paths, function (count) {

          self.setState({

            busy: false,

            status: count

              ? count + " photo(s) added from Media — check Photo items count below, then Publish."

              : "Could not add photos from Media. Try Upload multiple instead.",

          });

        });

      },



      render: function () {

        var busy = this.state.busy;

        return h(

          "div",

          { className: this.props.classNameWrapper, id: this.props.forID },

          h(

            "p",

            { style: { margin: "0 0 0.5rem", fontSize: "0.8125rem", color: "#475569", fontWeight: 600 } },

            "Add multiple photos"

          ),

          h(

            "p",

            { style: { margin: "0 0 0.75rem", fontSize: "0.8125rem", color: "#475569" } },

            "Photos are added straight into Photo items below. Check the count increases before you Publish."

          ),

          h(

            "div",

            { style: { display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" } },

            h(

              "button",

              {

                type: "button",

                disabled: busy,

                onClick: this.openMediaLibrary,

                style: {

                  padding: "0.45rem 0.85rem",

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

                  padding: "0.45rem 0.85rem",

                  fontSize: "0.8125rem",

                  fontWeight: 600,

                  borderRadius: "0.375rem",

                  border: "1px solid #cbd5e1",

                  background: "#fff",

                  cursor: busy ? "wait" : "pointer",

                },

              },

              h("input", {

                type: "file",

                multiple: true,

                accept: "image/*",

                disabled: busy,

                onChange: this.handleFiles,

              }),

              "Upload multiple"

            )

          ),

          this.state.status

            ? h(

                "p",

                {

                  style: {

                    margin: "0.75rem 0 0",

                    fontSize: "0.8125rem",

                    color: "#0f172a",

                    fontWeight: 600,

                    padding: "0.5rem 0.75rem",

                    background: "#f0fdf4",

                    border: "1px solid #86efac",

                    borderRadius: "0.375rem",

                  },

                },

                this.state.status

              )

            : null

        );

      },

    });



    CMS.registerWidget("galleryBulkToolbar", GalleryBulkToolbar);

  }



  function watchGalleryEditor() {

    function tick() {

      if (!isGalleryEditor()) return;

      var list = findItemsListRoot();

      if (list && !list.getAttribute("data-gallery-items-watched")) {

        list.setAttribute("data-gallery-items-watched", "1");

      }

    }

    tick();

    new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });

  }



  boot();

})();


