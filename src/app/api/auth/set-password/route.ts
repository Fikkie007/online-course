import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { verifyRecaptcha } from '@/lib/utils/recaptcha';
import { getCurrentUser } from '@/lib/auth';

const setPasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
  recaptchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log('[Set Password] Request received');

  try {
    const user = await getCurrentUser();

    console.log('[Set Password] Current user:', user ? { id: user.id, email: user.email } : null);

    if (!user || !user.email) {
      console.log('[Set Password] No user found - unauthorized');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { password, recaptchaToken } = setPasswordSchema.parse(body);

    console.log('[Set Password] Password validated, length:', password.length);

    // Verify reCAPTCHA (skip if not configured)
    if (recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        console.log('[Set Password] reCAPTCHA failed');
        return NextResponse.json(
          { success: false, error: 'Verifikasi reCAPTCHA gagal' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('[Set Password] Password hashed, length:', passwordHash.length);

    // First try to find user by ID
    let { data: existingUser, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, password_hash')
      .eq('id', user.id)
      .single();

    // If not found by ID, try by email (fallback for mismatched IDs)
    if (fetchError || !existingUser) {
      console.log('[Set Password] User not found by ID, trying email lookup...');
      const { data: userByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('id, email, password_hash')
        .eq('email', user.email)
        .single();

      if (emailError || !userByEmail) {
        console.log('[Set Password] User not found by email either, creating new profile...');

        // User doesn't exist, create a new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            password_hash: passwordHash,
            role: 'student',
            is_active: true,
          });

        if (insertError) {
          console.error('[Set Password] Failed to create profile:', insertError);
          return NextResponse.json(
            { success: false, error: `Gagal membuat profil: ${insertError.message}` },
            { status: 500 }
          );
        }

        console.log('[Set Password] New profile created with password');
        return NextResponse.json({
          success: true,
          message: 'Password berhasil disimpan',
        });
      }

      existingUser = userByEmail;
      console.log('[Set Password] Found user by email, ID:', existingUser.id);
    }

    // Update profile with password
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', existingUser.id)
      .select();

    console.log('[Set Password] Update result:', {
      data: updateData,
      error: updateError
    });

    if (updateError) {
      console.error('[Set Password] Failed to update:', updateError);
      return NextResponse.json(
        { success: false, error: `Gagal menyimpan password: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updateData || updateData.length === 0) {
      console.error('[Set Password] No rows updated');
      return NextResponse.json(
        { success: false, error: 'Gagal menyimpan password - user tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[Set Password] Password updated successfully for user:', existingUser.email);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil disimpan',
    });
  } catch (error) {
    console.error('[Set Password] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: `Terjadi kesalahan server: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}