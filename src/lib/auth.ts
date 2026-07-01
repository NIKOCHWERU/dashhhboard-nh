import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import fs from "fs";
import path from "path";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ account, user }) {
      if (account && account.provider === "google") {
        if (!account.refresh_token) {
          try {
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: user.id,
                provider: "google",
                refresh_token: { not: null }
              }
            });
            if (existingAccount?.refresh_token) {
              account.refresh_token = existingAccount.refresh_token;
            }
          } catch (e) {
            console.error("Error restoring Google refresh token on signIn:", e);
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // 1. Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at; // Expires at in seconds
        token.sub = user.id;
        return token;
      }

      // 2. Return previous token if the access token has not expired yet
      // Refresh 1 minute before expiry
      if (Date.now() < (token.expiresAt as number) * 1000 - 60000) {
        return token;
      }

      // 3. Access token has expired, try to update it
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken as string,
          }),
          method: "POST",
        });

        const tokens = await response.json();

        if (!response.ok) throw tokens;

        return {
          ...token,
          accessToken: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          // Fall back to old refresh token if Google doesn't return a new one
          refreshToken: tokens.refresh_token ?? token.refreshToken,
        };
      } catch (error) {
        console.error("Error refreshing access token", error);
        return { ...token, error: "RefreshAccessTokenError" };
      }
    },
    async session({ session, token }) {
      if (token && session.user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.email = dbUser.email;
            session.user.image = dbUser.image;

            (session.user as any).id = dbUser.id;
            (session.user as any).role = dbUser.role;
            (session.user as any).canCreateAgenda = dbUser.canCreateAgenda;
            (session.user as any).canManageHRM = dbUser.canManageHRM;
            (session.user as any).canManageRetainer = dbUser.canManageRetainer;
            (session.user as any).canManagePerorangan = dbUser.canManagePerorangan;
            (session.user as any).canAccessPekerjaan = dbUser.canAccessPekerjaan;
            (session.user as any).canAccessDokumentasi = dbUser.canAccessDokumentasi;
            (session.user as any).canAccessPengumuman = dbUser.canAccessPengumuman;
            (session.user as any).canAccessArsip = dbUser.canAccessArsip;
            (session.user as any).canAccessTenagaKerja = dbUser.canAccessTenagaKerja;
            (session.user as any).canManageLegal = dbUser.canManageLegal;
          }
        } catch (error) {
          console.error("Error in session callback:", error);
        }

        (session as any).accessToken = token.accessToken;
        (session as any).error = token.error;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.image && user.image.startsWith("http")) {
        try {
          // Instead of downloading locally, use the direct high-res Google profile photo URL.
          // This avoids write permission issues on the VPS and Next.js production static assets caching issues.
          // Support various google usercontent formats (e.g. =s96-c, =s96, or path-based /s96-c/)
          const hdImageUrl = user.image
            .replace(/=s\d+(-c)?/, "=s400-c")
            .replace(/\/s\d+-c\//, "/s400-c/");

          if (hdImageUrl !== user.image) {
            await prisma.user.update({
              where: { id: user.id },
              data: { image: hdImageUrl },
            });
            console.log(`Successfully updated user avatar to high-res Google URL: ${hdImageUrl}`);
          }
        } catch (error) {
          console.error("Failed to update user avatar to HD URL:", error);
        }
      }
    },
  },
};
