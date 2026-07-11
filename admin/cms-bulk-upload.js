/**
 * Decap CMS — multi-file select on any file input (one upload at a time, auto-adds list rows).
 */
(function () {
  "use strict";

  var UPLOAD_GAP_MS = 2000;

  function findListRoot(input) {
    if (!input || !input.closest) return null;
    var lists = [];
    var node = input.parentElement;
    while (node) {
      if (
        node.classList &&
        (node.classList.contains("nc-listWidget") || String(node.className).indexOf("ListControl") >= 0)
      ) {
        lists.push(node);
      }
      node = node.parentElement;
    }
    return lists.length ? lists[0] : null;
  }

  function clickListAdd(listRoot) {
    if (!listRoot) return false;
    var buttons = listRoot.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var t = (buttons[i].textContent || "").trim().toLowerCase();
      if (t === "add" || t.indexOf("add ") === 0 || t.indexOf("add+") >= 0) {
        buttons[i].click();
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

  function dispatchSingle(input, file) {
    var dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function patchInput(input) {
    if (!input || input.getAttribute("data-bulk-patched")) return;
    input.setAttribute("data-bulk-patched", "1");
    input.setAttribute("multiple", "multiple");

    input.addEventListener(
      "change",
      function (e) {
        var target = e.target;
        if (target._bulkBusy) return;

        var files = target.files ? Array.from(target.files) : [];
        if (files.length <= 1) return;

        e.stopImmediatePropagation();
        e.preventDefault();

        target._bulkBusy = true;
        target._bulkQueue = files.slice(1);
        target._bulkListRoot = findListRoot(target);
        dispatchSingle(target, files[0]);
        scheduleNext(target);
      },
      true
    );
  }

  function scheduleNext(input) {
    window.setTimeout(function () {
      var queue = input._bulkQueue;
      var listRoot = input._bulkListRoot || findListRoot(input);

      if (!queue || !queue.length) {
        input._bulkBusy = false;
        delete input._bulkQueue;
        delete input._bulkListRoot;
        input.value = "";
        return;
      }

      if (listRoot) {
        clickListAdd(listRoot);
        window.setTimeout(function () {
          var nextInput = latestFileInput(listRoot);
          if (nextInput) {
            patchInput(nextInput);
            nextInput._bulkBusy = true;
            nextInput._bulkQueue = queue;
            nextInput._bulkListRoot = listRoot;
            dispatchSingle(nextInput, queue.shift());
            scheduleNext(nextInput);
          } else {
            dispatchSingle(input, queue.shift());
            scheduleNext(input);
          }
        }, 700);
        return;
      }

      dispatchSingle(input, queue.shift());
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

  window.SiteCmsBulkUpload = { patchInput: patchInput, UPLOAD_GAP_MS: UPLOAD_GAP_MS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
