import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Prisma, no Node-only modules.
// Used by middleware to verify JWT and enforce route guards.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Admin-only section — non-admins are bounced to /dashboard
      if (path.startsWith("/dashboard/admin")) {
        if (!isLoggedIn) return false;
        if (auth?.user?.role !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // All other dashboard routes require authentication
      if (path.startsWith("/dashboard")) {
        return isLoggedIn;
      }

      // Redirect already-authenticated users away from /login
      if (isLoggedIn && path === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [], // Credentials provider added in auth.ts
};
