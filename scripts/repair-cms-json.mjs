/**
 * Repair content/cms/*.json when Decap saved its internal entry blob instead of plain data.
 * Run: node scripts/repair-cms-json.mjs
 */
import fs from "fs";
import path from "path";
import { paths } from "./parse-content.mjs";

export function unwrapCmsPayload(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

  var looksLikeDecapBlob =
    obj.data &&
    typeof obj.data === "object" &&
    (Object.prototype.hasOwnProperty.call(obj, "raw") ||
      Object.prototype.hasOwnProperty.call(obj, "partial") ||
      Object.prototype.hasOwnProperty.call(obj, "mediaFiles") ||
      (obj.slug && obj.collection));

  if (looksLikeDecapBlob) return obj.data;

  if (typeof obj.raw === "string") {
    var trimmed = obj.raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        /* keep original */
      }
    }
  }

  return obj;
}

function normalizeImageField(val) {
  if (val == null) return "";
  if (typeof val === "object") return String(val.url || val.path || val.src || val.image || "").trim();
  if (typeof val === "string") return val.trim();
  return "";
}

function normalizeHighlightCmsFile(data) {
  if (!data || typeof data !== "object") return data;
  var out = Object.assign({}, data);
  if (!Array.isArray(out.items)) return out;
  out.items = out.items
    .map(function (it) {
      if (!it || typeof it !== "object") return null;
      var headline = String(it.headline || "").trim();
      if (!headline) return null;
      return Object.assign({}, it, {
        posterImage: normalizeImageField(it.posterImage),
        linkUrl: it.linkUrl != null ? String(it.linkUrl).trim() : "",
        linkLabel: it.linkLabel || "View",
        linkUrlLabel: it.linkUrlLabel || "Open link",
        badge: it.badge || "Highlights",
      });
    })
    .filter(Boolean);
  return out;
}

function normalizeQuickAnnouncementsCmsFile(data) {
  if (!data || typeof data !== "object") return data;
  var out = Object.assign({}, data);
  if (!Array.isArray(out.items)) return out;
  out.items = out.items
    .map(function (it) {
      if (!it || typeof it !== "object") return null;
      var title = String(it.title || "").trim();
      if (!title) return null;
      return Object.assign({}, it, {
        image: normalizeImageField(it.image),
        href: it.href != null && String(it.href).trim() ? String(it.href).trim() : "news.html?ctx=events",
      });
    })
    .filter(Boolean);
  return out;
}

function normalizeCmsPayload(filename, data) {
  if (filename === "highlight.json") return normalizeHighlightCmsFile(data);
  if (filename === "quickAnnouncements.json") return normalizeQuickAnnouncementsCmsFile(data);
  return data;
}

function repairFile(fp) {
  var filename = path.basename(fp);
  var raw = fs.readFileSync(fp, "utf8");
  var parsed = JSON.parse(raw);
  var clean = normalizeCmsPayload(filename, unwrapCmsPayload(parsed));
  var next = JSON.stringify(clean, null, 2) + "\n";
  if (next === raw || next === raw.trim() + "\n") {
    return false;
  }
  fs.writeFileSync(fp, next, "utf8");
  return true;
}

var cmsDir = paths.cmsDir;
if (!fs.existsSync(cmsDir)) {
  console.error("Missing " + cmsDir);
  process.exit(1);
}

var fixed = 0;
fs.readdirSync(cmsDir)
  .filter(function (f) {
    return f.endsWith(".json");
  })
  .forEach(function (f) {
    var fp = path.join(cmsDir, f);
    if (repairFile(fp)) {
      console.log("Repaired " + f);
      fixed++;
    }
  });

console.log(fixed ? "Done — repaired " + fixed + " file(s)." : "All CMS JSON files already clean.");
