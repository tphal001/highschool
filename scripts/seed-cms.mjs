/**
 * Writes content/cms/*.json from content/defaults.json for Decap CMS.
 * Only the selective staff-editable sections (see admin/config.yml).
 * Run: npm run seed
 */
import fs from "fs";
import path from "path";
import {
  paths,
  parseSiteContentFromContentJs,
  ensureFlashNews,
} from "./parse-content.mjs";

const CMS_SEEDS = [
  {
    file: "management.json",
    data: (d) => ({
      mission: d.about.mission,
      vision: d.about.vision,
    }),
  },
  {
    file: "board.json",
    data: (d) => d.about.board || { intro: "", members: [] },
  },
  {
    file: "principal.json",
    data: (d) => d.about.principal,
  },
  {
    file: "staff.json",
    data: (d) => d.about.staff || { intro: "", members: [] },
  },
  {
    file: "admissions.json",
    data: (d) => d.admissions,
  },
  {
    file: "events.json",
    data: (d) => ({ events: d.news.events }),
  },
  {
    file: "results.json",
    data: (d) => ({ items: d.news.results || [] }),
  },
  {
    file: "activity.json",
    data: (d) => d.activity || { intro: "", items: [] },
  },
  {
    file: "gallery.json",
    data: (d) => d.gallery,
  },
  {
    file: "highlight.json",
    data: (d) => {
      if (d.highlights) return d.highlights;
      if (d.highlightNews) {
        var hn = d.highlightNews;
        return {
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
              linkUrl: hn.linkUrl || hn.linkHref || "",
              linkUrlLabel: hn.linkUrlLabel || "Open link",
              cacheBust: hn.cacheBust || "",
            },
          ],
        };
      }
      return { showModalOnOpen: true, oncePerSession: true, cacheBust: "v1", items: [] };
    },
  },
  {
    file: "quickAnnouncements.json",
    data: (d) => ({ items: d.quickAnnouncements || [] }),
  },
  {
    file: "latestUpdates.json",
    data: (d) => ({
      items: (d.home && d.home.quickNews) || [],
    }),
  },
  {
    file: "circulars.json",
    data: (d) => ({ items: (d.news && d.news.circulars) || [] }),
  },
  {
    file: "notices.json",
    data: (d) => ({ items: (d.news && d.news.notices) || [] }),
  },
  {
    file: "alumniSpotlight.json",
    data: (d) => (d.home && d.home.alumniSpotlight) || {},
  },
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

for (const seed of CMS_SEEDS) {
  const fp = path.join(paths.cmsDir, seed.file);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(seed.data(d), null, 2), "utf8");
    console.log("Created", path.relative(paths.root, fp));
  } else {
    console.log("Skip (exists):", path.relative(paths.root, fp));
  }
}

console.log("Done. Staff CMS sections are under content/cms/ — edit at /admin/");
