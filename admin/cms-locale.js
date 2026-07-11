/**
 * Decap CMS — staff-facing labels (English overrides).
 */
(function () {
  "use strict";
  if (!window.CMS || !CMS.registerLocale) return;

  CMS.registerLocale("en", {
    editor: {
      editorWidgets: {
        image: {
          choose: "Choose media",
          chooseMultiple: "Choose media",
          chooseDifferent: "Choose different media",
        },
      },
    },
  });
})();
