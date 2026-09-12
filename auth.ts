import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

const googleClientId = (process.env.GOOGLE_CLIENT_ID ?? "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? "").trim();
const authSecret = (process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "").trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret || undefined,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified
            ? new Date()
            : null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token, user }) {
      const userId = token?.sub ?? user?.id;

      if (session.user && userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name ?? session.user.name;
          session.user.email = dbUser.email ?? session.user.email;
          session.user.image = dbUser.image ?? session.user.image;
        }
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }

      return token;
    },
  },
  trustHost: true,
});
