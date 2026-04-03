/**
 * Shared helpers: parse window.SITE_CONTENT from legacy js/content.js (for bootstrap).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
export const paths = {
  root,
  contentJs: path.join(root, "js", "content.js"),
  defaultsJson: path.join(root, "content", "defaults.json"),
  cmsDir: path.join(root, "content", "cms"),
};

export function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

export function parseSiteContentFromContentJs() {
  const raw = fs.readFileSync(paths.contentJs, "utf8");
  const stripped = stripComments(raw);
  const m = stripped.match(/window\.SITE_CONTENT\s*=\s*(\{[\s\S]*\})\s*;/);
  if (!m) throw new Error("Could not parse window.SITE_CONTENT from js/content.js");
  try {
    return Function('"use strict"; return (' + m[1] + ")")();
  } catch (e) {
    throw new Error("Eval of SITE_CONTENT failed: " + e.message);
  }
}

export function ensureFlashNews(obj) {
  if (!obj.flashNews) {
    obj.flashNews = {
      enabled: true,
      imageUrl: "assets/flash-news-placeholder.svg",
      imageAlt: "Flash news",
    };
  }
  return obj;
}
