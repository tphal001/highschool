/**
 * Decap CMS: allow selecting multiple files in Media and upload them one after another.
 * The default GitHub media library only handles a single file per pick.
 */
(function () {
  "use strict";

  var UPLOAD_GAP_MS = 1800;

  function patchInput(input) {
    if (input.getAttribute("data-bulk-patched")) return;
    input.setAttribute("data-bulk-patched", "1");
    input.setAttribute("multiple", "");

    input.addEventListener(
      "change",
      function (e) {
        var target = e.target;
        var pending = target._bulkPending;
        if (pending && pending.length) return;

        var files = target.files ? Array.from(target.files) : [];
        if (files.length <= 1) return;

        e.stopImmediatePropagation();
        e.preventDefault();

        target._bulkPending = files.slice(1);
        dispatchSingle(target, files[0]);
        scheduleNext(target);
      },
      true
    );
  }

  function dispatchSingle(input, file) {
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function scheduleNext(input) {
    window.setTimeout(function () {
      var pending = input._bulkPending;
      if (!pending || !pending.length) {
        delete input._bulkPending;
        input.value = "";
        return;
      }
      dispatchSingle(input, pending.shift());
      scheduleNext(input);
    }, UPLOAD_GAP_MS);
  }

  function scan(root) {
    root.querySelectorAll('input[type="file"]').forEach(patchInput);
  }

  function init() {
    scan(document);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType !== 1) return;
          if (node.matches && node.matches('input[type="file"]')) patchInput(node);
          else scan(node);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
