/**
 * Merges content/defaults.json with content/cms/*.json and writes js/content.js.
 * Staff CMS may only update selective sections (see admin/config.yml).
 */
import fs from "fs";
import path from "path";
import {
  paths,
  parseSiteContentFromContentJs,
  ensureFlashNews,
} from "./parse-content.mjs";

function readJsonFile(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

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

/** Apply one CMS file onto the merged site object. */
function applyCmsFile(site, filename, data) {
  site.about = site.about || {};
  site.news = site.news || {};

  switch (filename) {
    case "management.json":
      if (data.mission) site.about.mission = data.mission;
      if (data.vision) site.about.vision = data.vision;
      break;
    case "board.json":
      site.about.board = data;
      break;
    case "principal.json":
      site.about.principal = data;
      break;
    case "staff.json":
      site.about.staff = data;
      break;
    case "admissions.json":
      site.admissions = data;
      break;
    case "events.json":
      if (data.events) site.news.events = data.events;
      break;
    case "results.json":
      if (data.items) site.news.results = data.items;
      break;
    case "activity.json":
      site.activity = data;
      break;
    case "gallery.json":
      site.gallery = data;
      break;
    case "highlight.json":
      site.highlightNews = data;
      break;
    case "quickAnnouncements.json":
      if (data.items) site.quickAnnouncements = data.items;
      break;
    case "latestUpdates.json":
      site.home = site.home || {};
      if (data.items) site.home.quickNews = data.items;
      break;
    default:
      break;
  }
}

function mergeCms(defaults) {
  const site = JSON.parse(JSON.stringify(defaults));
  const cmsDir = paths.cmsDir;
  if (!fs.existsSync(cmsDir)) return site;

  const files = fs.readdirSync(cmsDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const fp = path.join(cmsDir, file);
    try {
      applyCmsFile(site, file, readJsonFile(fp));
    } catch (e) {
      throw new Error("Invalid JSON in " + fp + ": " + e.message);
    }
  }
  return site;
}

function emitContentJs(obj) {
  const json = JSON.stringify(obj, null, 2);
  const out =
    "/**\n * AUTO-GENERATED — do not edit. Staff updates: /admin/ (selective sections only)\n */\n" +
    "window.SITE_CONTENT = " +
    json +
    ";\n";
  fs.writeFileSync(paths.contentJs, out, "utf8");
  console.log("Wrote js/content.js (" + (out.length / 1024).toFixed(1) + " KB)");
}

/** Decap list widgets often save objects; render expects string arrays. */
function normalizeSiteForEmit(site) {
  function mapStrList(arr, key) {
    if (!Array.isArray(arr)) return arr;
    return arr.map(function (x) {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") return x[key] || x.line || x.item || x.step || x.p || "";
      return "";
    });
  }

  if (site.home && site.home.hero && Array.isArray(site.home.hero.slides)) {
    site.home.hero.slides = site.home.hero.slides
      .map(function (s) {
        if (typeof s === "string") return s;
        if (s && typeof s === "object") return s.slide || s.url || "";
        return "";
      })
      .filter(Boolean);
  }
  if (site.home && Array.isArray(site.home.quickNews)) {
    site.home.quickNews = mapStrList(site.home.quickNews, "text").filter(Boolean);
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
  if (site.about && site.about.principal && Array.isArray(site.about.principal.message)) {
    site.about.principal.message = mapStrList(site.about.principal.message, "p");
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
