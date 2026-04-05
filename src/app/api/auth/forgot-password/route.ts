import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyRecaptcha } from '@/lib/utils/recaptcha';
import { sendEmail } from '@/lib/resend';
import { passwordResetEmailTemplate } from '@/lib/resend/templates';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
  recaptchaToken: z.string().optional(),
});

// Token expires in 1 hour
const TOKEN_EXPIRY_MINUTES = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, recaptchaToken } = forgotPasswordSchema.parse(body);

    console.log('[Forgot Password] Request for email:', email);

    // Verify reCAPTCHA (skip if not configured)
    if (recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
      if (!isValidRecaptcha) {
        console.log('[Forgot Password] reCAPTCHA failed');
        return NextResponse.json(
          { success: false, error: 'Verifikasi reCAPTCHA gagal' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Find user by email
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, password_hash')
      .eq('email', email)
      .single();

    // Don't reveal if email exists or not (security best practice)
    if (error || !user) {
      console.log('[Forgot Password] User not found:', error?.message);
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim.',
      });
    }

    // Check if user has password (not Google-only user)
    if (!user.password_hash) {
      console.log('[Forgot Password] User has no password (Google user)');
      return NextResponse.json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim.',
      });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Delete any existing tokens for this user
    const { error: deleteError } = await supabase
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.log('[Forgot Password] Delete old tokens error:', deleteError.message);
    }

    // Insert new token
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[Forgot Password] Failed to create reset token:', insertError);
      return NextResponse.json(
        { success: false, error: 'Gagal membuat token reset. Pastikan tabel password_reset_tokens sudah dibuat.' },
        { status: 500 }
      );
    }

    console.log('[Forgot Password] Token created successfully');

    // Send email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    console.log('[Forgot Password] Reset URL:', resetUrl);

    const emailHtml = passwordResetEmailTemplate({
      name: user.full_name || '',
      resetUrl,
      expiresInMinutes: TOKEN_EXPIRY_MINUTES,
    });

    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset Password - Online Course',
      html: emailHtml,
    });

    console.log('[Forgot Password] Email result:', emailResult);

    if (!emailResult.success) {
      console.error('[Forgot Password] Failed to send email:', emailResult.error);
      // For debugging, return the error (remove in production)
      return NextResponse.json({
        success: false,
        error: `Gagal mengirim email: ${JSON.stringify(emailResult.error)}`,
        debug: process.env.NODE_ENV === 'development',
      });
    }

    console.log('[Forgot Password] Email sent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Link reset password telah dikirim ke email Anda.',
    });
  } catch (error) {
    console.error('[Forgot Password] Error:', error);

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