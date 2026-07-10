/**
 * Decap CMS: allow selecting multiple files in Media and upload them one after another.
 * Gallery lists: each extra file opens a new list row when possible.
 */
(function () {
  "use strict";

  var UPLOAD_GAP_MS = 1800;

  function findListRoot(input) {
    return input && input.closest ? input.closest(".nc-listWidget") : null;
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var t = (btn.textContent || "").trim().toLowerCase();
      if (t === "add" || t.indexOf("add ") === 0) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  function latestFileInput(listRoot) {
    if (!listRoot) return null;
    var inputs = listRoot.querySelectorAll('input[type="file"]');
    return inputs.length ? inputs[inputs.length - 1] : null;
  }

  function patchInput(input) {
    if (!input || input.getAttribute("data-bulk-patched")) return;
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
        target._bulkListRoot = findListRoot(target);
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
        delete input._bulkListRoot;
        input.value = "";
        return;
      }

      var listRoot = input._bulkListRoot || findListRoot(input);
      if (listRoot && pending.length) {
        clickListAdd(listRoot);
        window.setTimeout(function () {
          var nextInput = latestFileInput(listRoot);
          if (nextInput) {
            patchInput(nextInput);
            nextInput._bulkPending = pending;
            nextInput._bulkListRoot = listRoot;
            dispatchSingle(nextInput, pending.shift());
            scheduleNext(nextInput);
          } else {
            dispatchSingle(input, pending.shift());
            scheduleNext(input);
          }
        }, 600);
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

  window.SiteCmsBulkUpload = {
    patchInput: patchInput,
    UPLOAD_GAP_MS: UPLOAD_GAP_MS,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
