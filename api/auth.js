/**
 * GitHub OAuth — step 1: redirect to GitHub (Decap opens /auth?provider=github&…).
 */
import crypto from "crypto";

function randomState() {
  return crypto.randomBytes(16).toString("hex");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end();
  }

  const host = req.headers.host || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${proto}://${host}`;

  const url = new URL(req.url, baseUrl);
  const provider = url.searchParams.get("provider") || "github";
  if (provider !== "github") {
    res.statusCode = 400;
    return res.end("Unsupported provider");
  }

  const scope = url.searchParams.get("scope") || "repo";

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    return res.end("Missing OAUTH_GITHUB_CLIENT_ID on the server");
  }

  const state = randomState();
  const redirectUri = `${baseUrl}/callback`;

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const secure = proto === "https";
  const cookie = `oauth_state=${state}; Path=/; HttpOnly; Max-Age=600${secure ? "; Secure" : ""}; SameSite=Lax`;

  res.setHeader("Set-Cookie", cookie);
  res.writeHead(302, { Location: authorizeUrl.toString() });
  res.end();
}
