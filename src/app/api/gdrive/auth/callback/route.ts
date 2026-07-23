import { NextResponse } from "next/server";
import { storeRefreshToken } from "@/lib/googleDrive";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/gdrive/auth/callback`;

  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/narasumber-hukum?gdrive_connected=no_code`);
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || "Failed to exchange authorization code");
    }

    if (data.refresh_token) {
      await storeRefreshToken(data.refresh_token);
      return NextResponse.redirect(`${origin}/narasumber-hukum?gdrive_connected=success`);
    } else {
      // If no new refresh token returned, they might have approved before.
      // But since we specify prompt=consent, it should return a refresh token.
      return NextResponse.redirect(`${origin}/narasumber-hukum?gdrive_connected=no_refresh_token`);
    }
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${origin}/narasumber-hukum?gdrive_connected=error&message=${encodeURIComponent(error.message)}`
    );
  }
}
