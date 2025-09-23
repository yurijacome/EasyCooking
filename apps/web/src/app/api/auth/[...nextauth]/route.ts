import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === 'google') {
        try {
          // Call backend to create or login user
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
            }),
          });

          if (!response.ok) {
            console.error('Failed to create/login user:', await response.text());
            return false;
          }

          const data = await response.json();
          // User created successfully
          return true;
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      return true;
    },
  },
})

export { handler as GET, handler as POST }