/**
 * Decap CMS — multi_upload: one input, select many files from computer.
 */
(function () {
  "use strict";

  if (!window.React || !window.CMS || !CMS.registerWidget) return;

  var h = window.React.createElement;
  var Component = window.React.Component;

  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.slice();
    if (value.toJS) return value.toJS();
    return [];
  }

  function publicPath(path) {
    path = String(path || "").replace(/^\/+/, "");
    if (path.indexOf("images/") === 0) return "/" + path;
    return "/images/" + path;
  }

  function itemKey(mediaType) {
    return mediaType === "video" ? "video" : "image";
  }

  function normalizeItems(value, mediaType) {
    var key = itemKey(mediaType);
    return toArray(value)
      .map(function (row) {
        if (!row) return null;
        if (typeof row === "string") {
          var o = {};
          o[key] = publicPath(row);
          return o;
        }
        if (row[key]) return row;
        return null;
      })
      .filter(Boolean);
  }

  function makeAsset(file) {
    var path = "images/" + file.name;
    return {
      file: file,
      path: path,
      url: URL.createObjectURL(file),
      toString: function () {
        return path;
      },
    };
  }

  class MultiUploadControl extends Component {
    constructor(props) {
      super(props);
      this.state = { busy: false };
      this.handleChange = this.handleChange.bind(this);
      this.handleClear = this.handleClear.bind(this);
    }

    handleClear() {
      this.props.onChange([]);
    }

    handleChange(e) {
      var self = this;
      var files = Array.from((e.target && e.target.files) || []);
      if (!files.length || this.state.busy) return;

      var field = this.props.field;
      var mediaType = field.get ? field.get("media_type") : "image";
      var items = normalizeItems(this.props.value, mediaType);
      var next = items.slice();
      var i = 0;

      this.setState({ busy: true });

      function step() {
        if (i >= files.length) {
          self.setState({ busy: false });
          e.target.value = "";
          self.props.onChange(next);
          return;
        }
        var file = files[i++];
        var asset = makeAsset(file);
        if (self.props.onAddAsset) self.props.onAddAsset(asset);
        var row = {};
        row[itemKey(mediaType)] = publicPath(asset.path);
        next.push(row);
        window.setTimeout(step, 350);
      }

      step();
    }

    render() {
      var field = this.props.field;
      var mediaType = field.get ? field.get("media_type") : "image";
      var accept = mediaType === "video" ? "video/*" : "image/*";
      var label =
        mediaType === "video" ? "Videos from your computer" : "Images from your computer";
      var items = normalizeItems(this.props.value, mediaType);
      var key = itemKey(mediaType);

      return h(
        "div",
        { className: this.props.classNameWrapper },
        h("label", { style: { display: "block", marginBottom: "0.5rem", fontWeight: 700 } }, label),
        h("input", {
          type: "file",
          multiple: true,
          accept: accept,
          disabled: this.state.busy,
          onChange: this.handleChange,
          style: { width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "6px" },
        }),
        this.state.busy
          ? h("p", { style: { marginTop: "0.5rem", color: "#0f766e", fontWeight: 600 } }, "Adding files…")
          : null,
        items.length
          ? h(
              "div",
              { style: { marginTop: "0.75rem" } },
              h(
                "p",
                { style: { margin: "0 0 0.35rem", fontSize: "0.875rem" } },
                items.length + " file(s) selected — click Publish to save to /images/ and Media."
              ),
              h(
                "ul",
                {
                  style: {
                    margin: 0,
                    paddingLeft: "1.1rem",
                    fontSize: "0.8125rem",
                    color: "#334155",
                    maxHeight: "120px",
                    overflowY: "auto",
                  },
                },
                items.map(function (it, idx) {
                  return h("li", { key: String(idx) }, it[key] || "");
                })
              ),
              h(
                "button",
                {
                  type: "button",
                  onClick: this.handleClear,
                  style: {
                    marginTop: "0.5rem",
                    padding: "0.35rem 0.75rem",
                    border: "1px solid #fca5a5",
                    background: "#fef2f2",
                    borderRadius: "6px",
                    cursor: "pointer",
                  },
                },
                "Clear all"
              )
            )
          : h(
              "p",
              { style: { marginTop: "0.5rem", fontSize: "0.8125rem", color: "#64748b" } },
              "Pick one or many files from your computer (Ctrl+click), then Publish."
            )
      );
    }
  }

  CMS.registerWidget("multi_upload", MultiUploadControl);
})();
