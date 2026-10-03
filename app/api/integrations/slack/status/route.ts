import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const token   = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_DEFAULT_CHANNEL;

  const configured = !!(
    token &&
    token.startsWith("xoxb-") &&
    !token.includes("your-token")
  );

  return NextResponse.json({
    configured,
    channel: channel ?? null,
    // Never return the token itself
  });
}
