import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getCurrentOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = typeof forwardedProto === "string" ? forwardedProto.split(",")[0] : req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
}

function buildOAuthRedirectUrl(req: Request) {
  const oauthPortalUrl = ENV.oAuthServerUrl;
  const appId = ENV.appId;

  if (!oauthPortalUrl || !appId) {
    throw new Error("OAuth portal URL and app ID must be configured in environment variables.");
  }

  const redirectUri = `${getCurrentOrigin(req)}/api/oauth/callback`;
  const state = Buffer.from(redirectUri).toString("base64");
  const authUrl = new URL(`${oauthPortalUrl.replace(/\/$/, "")}/app-auth`);
  authUrl.searchParams.set("appId", appId);
  authUrl.searchParams.set("redirectUri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("type", "signIn");

  return authUrl.toString();
}

async function handleOAuthCallback(req: Request, res: Response) {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/start", (req: Request, res: Response) => {
    try {
      const authUrl = buildOAuthRedirectUrl(req);
      res.redirect(302, authUrl);
    } catch (error) {
      console.error("[OAuth] Start failed", error);
      res.status(500).json({ error: "OAuth start failed" });
    }
  });

  app.get("/api/oauth/callback", handleOAuthCallback);
  app.get("/auth/azure/callback", handleOAuthCallback);
}
