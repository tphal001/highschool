/**
 * One-time (or repeat-safe): writes content/cms/*.json from content/defaults.json
 * so Decap CMS has files to edit. Run: npm run seed
 */
import fs from "fs";
import path from "path";
import {
  paths,
  parseSiteContentFromContentJs,
  ensureFlashNews,
} from "./parse-content.mjs";

const CMS_KEYS = [
  "news",
  "gallery",
  "home",
  "alumni",
  "fundAppeal",
  "about",
  "academics",
  "admissions",
  "contact",
];

function readDefaults() {
  if (fs.existsSync(paths.defaultsJson)) {
    return ensureFlashNews(JSON.parse(fs.readFileSync(paths.defaultsJson, "utf8")));
  }
  let obj = parseSiteContentFromContentJs();
  obj = ensureFlashNews(obj);
  fs.mkdirSync(path.dirname(paths.defaultsJson), { recursive: true });
  fs.writeFileSync(paths.defaultsJson, JSON.stringify(obj, null, 2), "utf8");
  console.log("Created content/defaults.json");
  return obj;
}

const d = readDefaults();
fs.mkdirSync(paths.cmsDir, { recursive: true });

for (const key of CMS_KEYS) {
  const fp = path.join(paths.cmsDir, key + ".json");
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(d[key], null, 2), "utf8");
    console.log("Created", path.relative(paths.root, fp));
  } else {
    console.log("Skip (exists):", path.relative(paths.root, fp));
  }
}
const flashPath = path.join(paths.cmsDir, "flash.json");
if (!fs.existsSync(flashPath)) {
  fs.writeFileSync(flashPath, JSON.stringify(d.flashNews || {}, null, 2), "utf8");
  console.log("Created", path.relative(paths.root, flashPath));
} else {
  console.log("Skip (exists):", path.relative(paths.root, flashPath));
}
console.log("Done. Commit content/cms/*.json then edit at /admin/");
