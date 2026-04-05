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
        console.log('[Auth JWT] Credentials user:', { id: user.id, role: user.role });
        token.id = user.id;
        token.role = user.role;
        return token;
      }

      // OAuth login (Google)
      if (account && profile) {
        console.log('[Auth JWT] Google OAuth login:', {
          sub: profile.sub,
          email: profile.email,
          name: profile.name
        });

        const supabase = createAdminClient();

        // Check if profile exists by Google sub
        let { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.sub!)
          .single();

        // If not found by sub, try by email (for users who might have different IDs)
        if (fetchError?.code === 'PGRST116') {
          console.log('[Auth JWT] Profile not found by sub, checking by email...');
          const { data: profileByEmail, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', profile.email!)
            .single();

          if (profileByEmail) {
            existingProfile = profileByEmail;
            fetchError = null;
            console.log('[Auth JWT] Found profile by email, ID:', profileByEmail.id);
          }
        }

        if (!existingProfile || fetchError?.code === 'PGRST116') {
          // No profile exists, create new one with Google's sub as ID
          console.log('[Auth JWT] Creating new profile with Google sub:', profile.sub);

          const { error: insertError } = await supabase.from('profiles').insert({
            id: profile.sub!,
            email: profile.email!,
            full_name: profile.name,
            avatar_url: profile.picture,
            role: 'student',
            is_active: true,
          });

          if (insertError) {
            console.error('[Auth JWT] Failed to create profile:', insertError);
          } else {
            console.log('[Auth JWT] Profile created successfully');
          }

          token.id = profile.sub!;
          token.role = 'student';
        } else {
          // Profile exists, update info
          console.log('[Auth JWT] Updating existing profile:', existingProfile.id);

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
        console.log('[Auth Session] Session created:', { id: token.id, role: token.role });
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
  },
  secret: process.env.NEXTAUTH_SECRET!,
});