/**
 * GitHub OAuth — step 2: exchange code, then postMessage back to Decap (same protocol as Netlify auth).
 */
function parseCookie(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function htmlPage(baseUrl, outcome, payload) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authorizing…</title>
</head>
<body>
<script>
(function () {
  var base = ${JSON.stringify(baseUrl)};
  var outcome = ${JSON.stringify(outcome)};
  var payload = ${JSON.stringify(payload)};
  window.opener.postMessage("authorizing:github", "*");
  function receiveMessage(e) {
    if (e.data === "authorizing:github" && e.origin === base) {
      window.removeEventListener("message", receiveMessage, false);
      window.opener.postMessage(
        "authorization:github:" + outcome + ":" + JSON.stringify(payload),
        e.origin
      );
      window.close();
    }
  }
  window.addEventListener("message", receiveMessage, false);
})();
</script>
</body>
</html>`;
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
  const err = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");
  if (err) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(
      htmlPage(baseUrl, "error", {
        message: errDesc || err || "OAuth error",
      })
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookies = parseCookie(req.headers.cookie || "");
  if (!code || !state || state !== cookies.oauth_state) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(
      htmlPage(baseUrl, "error", {
        message: "Invalid or missing OAuth state. Try logging in again.",
      })
    );
  }

  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(
      htmlPage(baseUrl, "error", {
        message: "Server missing OAUTH_GITHUB_CLIENT_ID or OAUTH_GITHUB_CLIENT_SECRET",
      })
    );
  }

  const redirectUri = `${baseUrl}/callback`;

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (tokenJson.error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(
      htmlPage(baseUrl, "error", {
        message: tokenJson.error_description || tokenJson.error,
      })
    );
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(
      htmlPage(baseUrl, "error", { message: "No access_token from GitHub" })
    );
  }

  res.setHeader(
    "Set-Cookie",
    "oauth_state=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
  );
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.statusCode = 200;
  res.end(
    htmlPage(baseUrl, "success", {
      token: accessToken,
      provider: "github",
    })
  );
}
