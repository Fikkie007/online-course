import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { verifyRecaptcha } from '@/lib/utils/recaptcha';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token diperlukan'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  recaptchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password, recaptchaToken } = resetPasswordSchema.parse(body);

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        return NextResponse.json(
          { success: false, error: 'Verifikasi reCAPTCHA gagal' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Find valid token
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { success: false, error: 'Token tidak valid atau sudah kadaluarsa' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password_hash: passwordHash })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate password' },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    // Delete all other tokens for this user
    await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', resetToken.user_id)
      .neq('id', resetToken.id);

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// Verify token endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Token diperlukan' },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: resetToken, error } = await supabase
    .from('password_reset_tokens')
    .select('id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !resetToken) {
    return NextResponse.json({ success: false, valid: false });
  }

  const isValid = !resetToken.used_at && new Date(resetToken.expires_at) > new Date();

  return NextResponse.json({ success: true, valid: isValid });
}