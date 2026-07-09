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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Sort-only timestamp; strips CMS date fields from public content. */
function stampListForSort(items, previousItems, keyField) {
  if (!Array.isArray(items)) return items;
  keyField = keyField || "title";
  var prevDates = {};
  (previousItems || []).forEach(function (p) {
    if (!p || typeof p !== "object") return;
    var key = String(p[keyField] || p.title || "").trim();
    if (key && p.datetime) prevDates[key] = p.datetime;
  });
  var today = todayIsoDate();
  return items
    .map(function (item, idx) {
      if (!item || typeof item !== "object") return item;
      var out = Object.assign({}, item);
      delete out.date;
      delete out.displayDate;
      var key = String(out[keyField] || out.title || "").trim();
      var datetime = String(out.datetime || "").trim();
      if (!datetime) datetime = prevDates[key] || today;
      out.datetime = datetime;
      out._cmsIdx = idx;
      return out;
    })
    .sort(function (a, b) {
      var byDate = String(b.datetime || "").localeCompare(String(a.datetime || ""));
      if (byDate !== 0) return byDate;
      return (b._cmsIdx || 0) - (a._cmsIdx || 0);
    })
    .map(function (item) {
      if (!item || typeof item !== "object") return item;
      var out = Object.assign({}, item);
      delete out._cmsIdx;
      return out;
    });
}

function normalizeImageField(val) {
  if (val == null) return "";
  if (typeof val === "object") return String(val.url || val.path || val.src || "").trim();
  if (typeof val === "string") return val.trim();
  return "";
}

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
    case "recognitions.json":
      site.news.recognitions = data;
      break;
    case "activity.json":
      site.activity = data;
      break;
    case "gallery.json":
      site.gallery = data;
      break;
    case "highlight.json":
      site.highlights = data;
      break;
    case "quickAnnouncements.json":
      if (data.items) site.quickAnnouncements = data.items;
      break;
    case "latestUpdates.json":
      site.home = site.home || {};
      if (data.items) site.home.quickNews = data.items;
      break;
    case "circulars.json":
      if (data.items) site.news.circulars = data.items;
      break;
    case "notices.json":
      if (data.items) site.news.notices = data.items;
      break;
    case "alumniSpotlight.json":
      site.home = site.home || {};
      site.home.alumniSpotlight = normalizeAlumniSpotlight(data);
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
function normalizeSiteForEmit(site, previous) {
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
    site.home.quickNews.reverse();
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
  if (Array.isArray(site.quickAnnouncements)) {
    var prevAnn =
      previous && Array.isArray(previous.quickAnnouncements) ? previous.quickAnnouncements : [];
    site.quickAnnouncements = stampListForSort(site.quickAnnouncements, prevAnn).map(function (a) {
      if (!a || typeof a !== "object") return a;
      var img = normalizeImageField(a.image);
      return Object.assign({}, a, { image: img || "" });
    });
  }
  if (site.news) {
    var prevNews = (previous && previous.news) || {};
    if (Array.isArray(site.news.events)) {
      site.news.events = stampListForSort(site.news.events, prevNews.events).map(function (e) {
        if (!e || typeof e !== "object") return e;
        return Object.assign({}, e, { image: normalizeImageField(e.image) || e.image || "" });
      });
    }
    if (Array.isArray(site.news.circulars)) {
      site.news.circulars = stampListForSort(site.news.circulars, prevNews.circulars);
    }
    if (Array.isArray(site.news.notices)) {
      site.news.notices = stampListForSort(site.news.notices, prevNews.notices);
    }
    if (Array.isArray(site.news.results)) {
      site.news.results = stampListForSort(site.news.results, prevNews.results).map(function (r) {
        if (!r || typeof r !== "object") return r;
        return Object.assign({}, r, { image: normalizeImageField(r.image) || r.image || "" });
      });
    }
    if (site.news.recognitions && Array.isArray(site.news.recognitions.items)) {
      var prevRecItems =
        (prevNews.recognitions && prevNews.recognitions.items) || [];
      site.news.recognitions.items = stampListForSort(
        site.news.recognitions.items.map(function (it) {
          return Object.assign({}, it, { title: it.name || it.title || "recognition" });
        }),
        prevRecItems.map(function (it) {
          return Object.assign({}, it, { title: it.name || it.title || "recognition" });
        }),
        "title"
      ).map(function (it) {
        if (!it || typeof it !== "object") return it;
        return Object.assign({}, it, { image: normalizeImageField(it.image) || it.image || "" });
      });
    }
  }
  if (site.activity && Array.isArray(site.activity.items)) {
    var prevAct = (previous && previous.activity && previous.activity.items) || [];
    site.activity.items = stampListForSort(site.activity.items, prevAct);
  }
  if (site.gallery && Array.isArray(site.gallery.items)) {
    var prevGal = (previous && previous.gallery && previous.gallery.items) || [];
    site.gallery.items = stampListForSort(site.gallery.items, prevGal);
  }
  if (site.highlights && Array.isArray(site.highlights.items)) {
    var prevHi = (previous && previous.highlights && previous.highlights.items) || [];
    site.highlights.items = stampListForSort(
      site.highlights.items.map(function (it) {
        return Object.assign({}, it, { title: it.headline || it.studentName || "highlight" });
      }),
      prevHi.map(function (it) {
        return Object.assign({}, it, { title: it.headline || it.studentName || "highlight" });
      }),
      "title"
    );
  }
  if (site.alumni && Array.isArray(site.alumni.stories)) {
    var prevStories = (previous && previous.alumni && previous.alumni.stories) || [];
    site.alumni.stories = stampListForSort(
      site.alumni.stories.map(function (s) {
        return Object.assign({}, s, { title: s.name || "story" });
      }),
      prevStories.map(function (s) {
        return Object.assign({}, s, { title: s.name || "story" });
      }),
      "title"
    );
  }
  return site;
}

/** Alumni spotlight: list of stories in CMS order (new entries append at end). */
function normalizeAlumniSpotlight(spot) {
  if (!spot || typeof spot !== "object") {
    return { sectionTitle: "Alumni spotlight", sectionSubtitle: "", stories: [], stats: [], linkLabel: "", linkHref: "alumni.html" };
  }
  var out = Object.assign({}, spot);
  if (Array.isArray(out.stories) && out.stories.length) {
    delete out.story;
    return out;
  }
  if (out.story && typeof out.story === "object") {
    out.stories = [out.story];
  } else if (!Array.isArray(out.stories)) {
    out.stories = [];
  }
  delete out.story;
  return out;
}

/** Single highlightNews → highlights.items; drop legacy key. */
function normalizeHighlights(site) {
  if (site.highlights && Array.isArray(site.highlights.items)) {
    delete site.highlightNews;
    return site;
  }
  if (site.highlightNews && typeof site.highlightNews === "object") {
    var hn = site.highlightNews;
    site.highlights = {
      showModalOnOpen: hn.showModalOnOpen !== false,
      oncePerSession: hn.oncePerSession !== false,
      cacheBust: hn.cacheBust || "v1",
      items: [
        {
          enabled: hn.enabled !== false,
          showOnHome: hn.showOnHome !== false,
          badge: hn.badge || "Highlights",
          headline: hn.headline || "",
          studentName: hn.studentName || "",
          accomplishment: hn.accomplishment || "",
          posterImage: hn.posterImage || "",
          linkLabel: hn.linkLabel || "View",
          cacheBust: hn.cacheBust || "",
        },
      ],
    };
  } else if (!site.highlights) {
    site.highlights = {
      showModalOnOpen: true,
      oncePerSession: true,
      cacheBust: "v1",
      items: [],
    };
  }
  delete site.highlightNews;
  return site;
}

const defaults = readDefaults();
var previousContent = null;
try {
  if (fs.existsSync(paths.contentJs)) {
    previousContent = parseSiteContentFromContentJs();
  }
} catch (e) {}
const merged = normalizeSiteForEmit(
  normalizeHighlights(mergeCms(defaults)),
  previousContent
);
if (merged.home && merged.home.alumniSpotlight) {
  merged.home.alumniSpotlight = normalizeAlumniSpotlight(merged.home.alumniSpotlight);
}
emitContentJs(merged);
