/**
 * Shared helpers: parse window.SITE_CONTENT from legacy js/content.js (for bootstrap).
 */
import fs from "fs";
import path from "path";
import vm from "node:vm";
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
  // Block comments only. Do NOT strip `// …` — that matches inside `https://` URLs and corrupts strings.
  return s.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * After `window.SITE_CONTENT =`, extract the top-level `{ ... }` using brace depth,
 * ignoring `{` `}` inside single- and double-quoted strings (with basic escapes).
 * Greedy regex `(\{[\s\S]*\})` is wrong when nested objects/strings contain `}`.
 */
export function extractSiteContentObjectLiteral(source) {
  const marker = "window.SITE_CONTENT";
  const idx = source.indexOf(marker);
  if (idx === -1) throw new Error("Could not find window.SITE_CONTENT in js/content.js");
  const eq = source.indexOf("=", idx + marker.length);
  if (eq === -1) throw new Error("Could not find = after window.SITE_CONTENT");
  const start = source.indexOf("{", eq);
  if (start === -1) throw new Error("Could not find opening { for SITE_CONTENT");

  let depth = 0;
  let inDouble = false;
  let inSingle = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (inDouble) {
      if (c === "\\" && i + 1 < source.length) {
        i++;
        continue;
      }
      if (c === '"') inDouble = false;
      continue;
    }
    if (inSingle) {
      if (c === "\\" && i + 1 < source.length) {
        i++;
        continue;
      }
      if (c === "'") inSingle = false;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced braces in SITE_CONTENT object literal");
}

function parseObjectLiteralJs(expr) {
  const sandbox = { __out: null };
  vm.createContext(sandbox);
  vm.runInNewContext("__out = (" + expr + ")", sandbox);
  return sandbox.__out;
}

export function parseSiteContentFromContentJs() {
  const raw = fs.readFileSync(paths.contentJs, "utf8");
  const stripped = stripComments(raw);
  const literal = extractSiteContentObjectLiteral(stripped);
  try {
    const trimmed = literal.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      return parseObjectLiteralJs(literal);
    }
  } catch (e) {
    throw new Error("Parse of SITE_CONTENT failed: " + e.message);
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
