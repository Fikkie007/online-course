import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const supabase = createAdminClient();

        // Find user by email
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user || !user.password_hash) {
          return null;
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
          return null;
        }

        // Check if user is active
        if (!user.is_active) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          image: user.avatar_url,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Initial sign in from Credentials
      if (user) {
        token.id = user.id;
        token.role = user.role;
        return token;
      }

      // OAuth login (Google)
      if (account && profile) {
        const supabase = createAdminClient();

        // Check if profile exists by Google sub
        let { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.sub!)
          .single();

        // If not found by sub, try by email (for users who might have different IDs)
        if (fetchError?.code === 'PGRST116') {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', profile.email!)
            .single();

          if (profileByEmail) {
            existingProfile = profileByEmail;
            fetchError = null;
          }
        }

        if (!existingProfile || fetchError?.code === 'PGRST116') {
          // No profile exists, create new one with Google's sub as ID
          const { error: insertError } = await supabase.from('profiles').insert({
            id: profile.sub!,
            email: profile.email!,
            full_name: profile.name,
            avatar_url: profile.picture,
            role: 'student',
            is_active: true,
          });

          if (insertError) {
            console.error('[Auth] Failed to create profile');
          }

          token.id = profile.sub!;
          token.role = 'student';
        } else {
          // Profile exists, update info
          await supabase
            .from('profiles')
            .update({
              full_name: profile.name,
              avatar_url: profile.picture,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id);

          token.id = existingProfile.id;
          token.role = existingProfile.role || 'student';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day - reduced from default 30 days for security
  },
  secret: process.env.NEXTAUTH_SECRET!,
});