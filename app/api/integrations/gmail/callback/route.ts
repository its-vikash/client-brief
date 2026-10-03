// ── Gmail OAuth2 Callback ─────────────────────────────────────────────────────
// Google redirects here after the user grants Gmail access.
// We exchange the auth code for tokens and store them in an HTTP-only cookie.

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  // User denied access
  if (error || !code) {
    return NextResponse.redirect(
      new URL("/dashboard/integrations/gmail?error=access_denied", req.url)
    );
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI!;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.access_token) {
      console.error("[gmail-callback] Token exchange failed:", tokens.error ?? "unknown");
      return NextResponse.redirect(
        new URL("/dashboard/integrations/gmail?error=token_exchange_failed", req.url)
      );
    }

    // Store access token in HTTP-only cookie (expires when token expires, max 1h)
    // For refresh_token persistence, upgrade to a database-backed session (Supabase).
    const expiresIn    = tokens.expires_in ?? 3600;
    const cookieValue  = encodeURIComponent(JSON.stringify({
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at:    Date.now() + expiresIn * 1000,
    }));

    const response = NextResponse.redirect(
      new URL("/dashboard/integrations/gmail?connected=true", req.url)
    );

    // HTTP-only, Secure in production, SameSite=Lax
    response.cookies.set("gmail_token", cookieValue, {
      httpOnly:  true,
      secure:    process.env.NODE_ENV === "production",
      sameSite:  "lax",
      maxAge:    expiresIn,
      path:      "/",
    });

    return response;

  } catch (err) {
    console.error("[gmail-callback] Unexpected error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/integrations/gmail?error=unexpected", req.url)
    );
  }
}
