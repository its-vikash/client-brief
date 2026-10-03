import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const configured = !!(
    clientId && clientSecret &&
    !clientId.includes("your-client-id") &&
    !clientSecret.includes("your-client-secret")
  );

  // Check if the user has a token cookie from a previous OAuth flow
  const tokenCookie   = req.cookies.get("gmail_token")?.value;
  let tokenValid      = false;
  let tokenExpiresAt: number | null = null;

  if (tokenCookie) {
    try {
      const parsed   = JSON.parse(decodeURIComponent(tokenCookie));
      tokenExpiresAt = parsed.expires_at ?? null;
      tokenValid     = !!(parsed.access_token && parsed.expires_at > Date.now());
    } catch { /* invalid cookie */ }
  }

  return NextResponse.json({ configured, tokenValid, tokenExpiresAt });
}
