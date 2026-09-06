const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GSC_API = "https://www.googleapis.com/webmasters/v3";
const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/") return home(request, env);
      if (url.pathname === "/health") return health(request, env);
      if (url.pathname === "/auth/google") return startGoogleOAuth(request, env);
      if (url.pathname === "/oauth/callback") return googleOAuthCallback(request, env);
      return json({ ok: false, error: "Not found" }, 404);
    } catch (error) {
      console.error("HS SEO Intelligence worker error", error);
      return json({
        ok: false,
        error: "Unexpected worker error",
        detail: error instanceof Error ? error.message : String(error),
      }, 500);
    }
  },
};

function home(request, env) {
  const origin = new URL(request.url).origin;
  const configured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const redirectUri = getRedirectUri(request, env);

  return html(`<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>HS SEO Intelligence — Fase 0</title>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;max-width:780px;margin:48px auto;padding:0 20px;line-height:1.55;color:#171717}
    .box{border:1px solid #ddd;border-radius:14px;padding:22px;margin:18px 0}
    .ok{color:#087a37}.bad{color:#b42318}code{background:#f3f3f3;padding:2px 6px;border-radius:6px;word-break:break-all}
    a.button{display:inline-block;padding:12px 18px;border-radius:10px;background:#171717;color:white;text-decoration:none;font-weight:650}
  </style>
</head>
<body>
  <h1>HS SEO Intelligence</h1>
  <p>Fase 0 — prova de ligação real à Google Search Console API.</p>
  <div class="box">
    <p><strong>OAuth secrets:</strong> <span class="${configured ? "ok" : "bad"}">${configured ? "configurados" : "em falta"}</span></p>
    <p><strong>Redirect URI a autorizar no Google:</strong><br><code>${escapeHtml(redirectUri)}</code></p>
    <p><strong>Propriedade preferida:</strong> <code>${escapeHtml(env.GSC_SITE_URL || "automática: happysoaring.com")}</code></p>
  </div>
  ${configured ? `<a class="button" href="${origin}/auth/google">Ligar Google Search Console</a>` : "<p>Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET antes de iniciar OAuth.</p>"}
  <p><small>Este teste não cria D1 nem guarda tokens. O access token é usado apenas durante o callback para provar acesso real aos dados.</small></p>
</body>
</html>`);
}

function health(request, env) {
  return json({
    ok: true,
    service: "HS SEO Intelligence",
    phase: 0,
    oauthConfigured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    redirectUri: getRedirectUri(request, env),
    targetProperty: env.GSC_SITE_URL || null,
  });
}

async function startGoogleOAuth(request, env) {
  requireOAuthConfig(env);

  const state = crypto.randomUUID();
  const auth = new URL(GOOGLE_AUTH_URL);
  auth.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  auth.searchParams.set("redirect_uri", getRedirectUri(request, env));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", GSC_SCOPE);
  auth.searchParams.set("state", state);
  auth.searchParams.set("include_granted_scopes", "true");

  return new Response(null, {
    status: 302,
    headers: {
      Location: auth.toString(),
      "Set-Cookie": `hsseo_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store",
    },
  });
}

async function googleOAuthCallback(request, env) {
  requireOAuthConfig(env);

  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return json({ ok: false, stage: "oauth_authorization", error: oauthError }, 400);
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const cookieState = readCookie(request, "hsseo_oauth_state");

  if (!code) return json({ ok: false, stage: "oauth_callback", error: "Missing authorization code" }, 400);
  if (!returnedState || !cookieState || returnedState !== cookieState) {
    return json({ ok: false, stage: "oauth_callback", error: "Invalid OAuth state" }, 400);
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: getRedirectUri(request, env),
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    return json({
      ok: false,
      stage: "token_exchange",
      status: tokenResponse.status,
      error: tokenData.error || "Token exchange failed",
      errorDescription: tokenData.error_description || null,
    }, 502);
  }

  const accessToken = tokenData.access_token;
  const sitesResponse = await gscFetch(`${GSC_API}/sites`, accessToken);
  if (!sitesResponse.ok) {
    return json({ ok: false, stage: "gsc_sites", status: sitesResponse.status, error: sitesResponse.data }, 502);
  }

  const entries = Array.isArray(sitesResponse.data.siteEntry) ? sitesResponse.data.siteEntry : [];
  const selected = chooseHappySoaringProperty(entries, env.GSC_SITE_URL);

  if (!selected) {
    return json({
      ok: false,
      stage: "property_selection",
      error: "OAuth succeeded, but no accessible Happy Soaring Search Console property was found.",
      accessibleProperties: entries.map(({ siteUrl, permissionLevel }) => ({ siteUrl, permissionLevel })),
    }, 404);
  }

  const { startDate, endDate } = defaultGscPeriod();
  const queryUrl = `${GSC_API}/sites/${encodeURIComponent(selected.siteUrl)}/searchAnalytics/query`;
  const queryResponse = await gscFetch(queryUrl, accessToken, {
    method: "POST",
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ["query", "page"],
      rowLimit: 100,
      dataState: "final",
    }),
  });

  if (!queryResponse.ok) {
    return json({
      ok: false,
      stage: "search_analytics",
      property: selected,
      period: { startDate, endDate },
      status: queryResponse.status,
      error: queryResponse.data,
    }, 502);
  }

  const rows = (queryResponse.data.rows || []).map((row) => ({
    query: row.keys?.[0] || "",
    page: row.keys?.[1] || "",
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  return json({
    ok: true,
    milestone: "Cloudflare Worker → Google OAuth → Search Console API → real data",
    source: "GSC",
    property: selected,
    period: { startDate, endDate },
    accessibleProperties: entries.map(({ siteUrl, permissionLevel }) => ({ siteUrl, permissionLevel })),
    rowCount: rows.length,
    rows,
    note: "No Google access token or refresh token is stored by this Phase 0 test.",
  }, 200, {
    "Set-Cookie": "hsseo_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  });
}

async function gscFetch(url, accessToken, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}

function chooseHappySoaringProperty(entries, configuredProperty) {
  if (configuredProperty) {
    return entries.find((entry) => entry.siteUrl === configuredProperty) || null;
  }

  return entries.find((entry) => String(entry.siteUrl || "").toLowerCase().includes("happysoaring.com")) || null;
}

function defaultGscPeriod() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getRedirectUri(request, env) {
  if (env.GOOGLE_REDIRECT_URI) return env.GOOGLE_REDIRECT_URI;
  return `${new URL(request.url).origin}/oauth/callback`;
}

function requireOAuthConfig(env) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured as Cloudflare Worker secrets.");
  }
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
