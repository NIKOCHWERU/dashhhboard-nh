import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/gdrive/auth/callback`;

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar",
      access_type: "offline",
      prompt: "consent"
    }).toString();

  return NextResponse.redirect(googleAuthUrl);
}
