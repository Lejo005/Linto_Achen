import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { createServer as createViteServer } from "vite";

function loadLocalEnv() {
  const envFile = ".env.local";
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadLocalEnv();

const port = Number(process.env.PORT || 3000);
const redirectUri = process.env.CANVA_REDIRECT_URI || `http://127.0.0.1:${port}/oauth/callback`;
const scopes = "design:meta:read design:content:read asset:read profile:read";
const sessions = new Map();

function cookies(request) {
  return Object.fromEntries((request.headers.cookie || "").split(";").map((part) => part.trim().split("=")).filter(([key]) => key));
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

function sessionFor(request, response) {
  const existing = cookies(request).canva_session;
  if (existing && sessions.has(existing)) return sessions.get(existing);
  const id = randomBytes(32).toString("base64url");
  const session = { id, connected: false };
  sessions.set(id, session);
  response.setHeader("Set-Cookie", `canva_session=${id}; HttpOnly; SameSite=Lax; Path=/`);
  return session;
}

function credentialsReady() {
  return Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
}

async function canvaFetch(session, path) {
  const response = await fetch(`https://api.canva.com/rest/v1${path}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Canva request failed.");
  return data;
}

const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/canva/status") {
    const session = sessionFor(request, response);
    return sendJson(response, 200, { configured: credentialsReady(), connected: session.connected });
  }

  if (url.pathname === "/api/canva/connect") {
    if (!credentialsReady()) return sendJson(response, 503, { error: "Add Canva credentials to .env.local before connecting." });
    const session = sessionFor(request, response);
    session.verifier = randomBytes(96).toString("base64url");
    session.state = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(session.verifier).digest("base64url");
    const authorize = new URL("https://www.canva.com/api/oauth/authorize");
    authorize.search = new URLSearchParams({
      code_challenge: challenge,
      code_challenge_method: "S256",
      scope: scopes,
      response_type: "code",
      client_id: process.env.CANVA_CLIENT_ID,
      state: session.state,
      redirect_uri: redirectUri,
    });
    response.writeHead(302, { Location: authorize.toString() });
    return response.end();
  }

  if (url.pathname === "/oauth/callback") {
    const session = sessionFor(request, response);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || state !== session.state || !session.verifier) {
      response.writeHead(302, { Location: "/?canva=invalid-state" });
      return response.end();
    }
    try {
      const basic = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64");
      const tokenResponse = await fetch("https://api.canva.com/rest/v1/oauth/token", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code_verifier: session.verifier, code, redirect_uri: redirectUri }),
      });
      const token = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(token.message || "Token exchange failed.");
      session.accessToken = token.access_token;
      session.refreshToken = token.refresh_token;
      session.expiresAt = Date.now() + token.expires_in * 1000;
      session.connected = true;
      delete session.state;
      delete session.verifier;
      response.writeHead(302, { Location: "/?canva=connected" });
    } catch {
      response.writeHead(302, { Location: "/?canva=connection-failed" });
    }
    return response.end();
  }

  if (url.pathname === "/api/canva/designs") {
    const session = sessionFor(request, response);
    if (!session.connected) return sendJson(response, 401, { error: "Connect Canva first." });
    try {
      const designs = await canvaFetch(session, "/designs?limit=6&sort_by=modified_descending");
      return sendJson(response, 200, { items: designs.items || [] });
    } catch (error) {
      return sendJson(response, 502, { error: error.message });
    }
  }

  if (url.pathname === "/api/canva/disconnect" && request.method === "POST") {
    const session = sessionFor(request, response);
    delete session.accessToken;
    delete session.refreshToken;
    delete session.expiresAt;
    session.connected = false;
    return sendJson(response, 200, { connected: false });
  }

  vite.middlewares(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Pulpit is running at http://127.0.0.1:${port}`);
});
