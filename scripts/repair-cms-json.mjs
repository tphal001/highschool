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

function repairFile(fp) {
  var raw = fs.readFileSync(fp, "utf8");
  var parsed = JSON.parse(raw);
  var clean = unwrapCmsPayload(parsed);
  if (JSON.stringify(parsed) === JSON.stringify(clean)) {
    return false;
  }
  fs.writeFileSync(fp, JSON.stringify(clean, null, 2) + "\n", "utf8");
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
