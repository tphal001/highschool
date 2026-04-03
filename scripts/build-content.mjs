/**
 * Merges content/defaults.json with content/cms/*.json and writes js/content.js.
 * Bootstraps defaults from js/content.js if content/defaults.json is missing.
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
  if (!fs.existsSync(paths.defaultsJson)) {
    console.warn("content/defaults.json missing — bootstrapping from js/content.js");
    let obj = parseSiteContentFromContentJs();
    obj = ensureFlashNews(obj);
    fs.mkdirSync(path.dirname(paths.defaultsJson), { recursive: true });
    fs.writeFileSync(paths.defaultsJson, JSON.stringify(obj, null, 2), "utf8");
    console.log("Created content/defaults.json");
    return obj;
  }
  return ensureFlashNews(JSON.parse(fs.readFileSync(paths.defaultsJson, "utf8")));
}

function mergeCms(defaults) {
  const site = JSON.parse(JSON.stringify(defaults));
  const cmsDir = paths.cmsDir;
  if (!fs.existsSync(cmsDir)) return site;

  for (const key of CMS_KEYS) {
    const fp = path.join(cmsDir, key + ".json");
    if (fs.existsSync(fp)) {
      try {
        site[key] = JSON.parse(fs.readFileSync(fp, "utf8"));
      } catch (e) {
        throw new Error("Invalid JSON in " + fp + ": " + e.message);
      }
    }
  }
  const flashPath = path.join(cmsDir, "flash.json");
  if (fs.existsSync(flashPath)) {
    site.flashNews = JSON.parse(fs.readFileSync(flashPath, "utf8"));
  }
  return site;
}

function emitContentJs(obj) {
  const json = JSON.stringify(obj, null, 2);
  const out =
    "/**\n * AUTO-GENERATED — do not edit. Update content in the CMS at /admin/\n */\n" +
    "window.SITE_CONTENT = " +
    json +
    ";\n";
  fs.writeFileSync(paths.contentJs, out, "utf8");
  console.log("Wrote js/content.js (" + (out.length / 1024).toFixed(1) + " KB)");
}

/** Decap list widgets often save objects; render expects string arrays. */
function normalizeSiteForEmit(site) {
  if (site.home && site.home.hero && Array.isArray(site.home.hero.slides)) {
    site.home.hero.slides = site.home.hero.slides.map(function (s) {
      if (typeof s === "string") return s;
      if (s && typeof s === "object") return s.slide || s.url || "";
      return "";
    }).filter(Boolean);
  }
  function mapStrList(arr, key) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(function (x) {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") return x[key] || x.line || x.item || x.step || x.p || "";
      return "";
    });
  }
  if (site.home && site.home.aboutPreview && Array.isArray(site.home.aboutPreview.paragraphs)) {
    site.home.aboutPreview.paragraphs = mapStrList(site.home.aboutPreview.paragraphs, "p");
  }
  if (site.fundAppeal) {
    if (Array.isArray(site.fundAppeal.paragraphs)) {
      site.fundAppeal.paragraphs = mapStrList(site.fundAppeal.paragraphs, "p");
    }
    if (site.fundAppeal.paymentOptions && Array.isArray(site.fundAppeal.paymentOptions.netBankingLines)) {
      site.fundAppeal.paymentOptions.netBankingLines = mapStrList(
        site.fundAppeal.paymentOptions.netBankingLines,
        "line"
      );
    }
  }
  if (site.about) {
    if (site.about.history && Array.isArray(site.about.history.paragraphs)) {
      site.about.history.paragraphs = mapStrList(site.about.history.paragraphs, "p");
    }
    if (site.about.principal && Array.isArray(site.about.principal.message)) {
      site.about.principal.message = mapStrList(site.about.principal.message, "p");
    }
  }
  if (site.academics) {
    if (Array.isArray(site.academics.curriculum)) {
      site.academics.curriculum = mapStrList(site.academics.curriculum, "line");
    }
    if (Array.isArray(site.academics.facilities)) {
      site.academics.facilities = mapStrList(site.academics.facilities, "line");
    }
  }
  if (site.admissions) {
    if (Array.isArray(site.admissions.process)) {
      site.admissions.process = mapStrList(site.admissions.process, "step");
    }
    if (Array.isArray(site.admissions.requirements)) {
      site.admissions.requirements = mapStrList(site.admissions.requirements, "item");
    }
  }
  return site;
}

const defaults = readDefaults();
const merged = normalizeSiteForEmit(mergeCms(defaults));
emitContentJs(merged);
