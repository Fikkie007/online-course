import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashPassword } from '@/lib/auth/password';
import { verifyRecaptcha } from '@/lib/utils/recaptcha';

// Password strength regex: min 8 chars, uppercase, lowercase, number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(passwordRegex, 'Password harus mengandung huruf besar, huruf kecil, dan angka'),
  fullName: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  recaptchaToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, recaptchaToken } = registerSchema.parse(body);

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

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate unique ID for credentials user
    const userId = `cred_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create profile
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName || null,
      role: 'student',
      is_active: true,
    });

    if (insertError) {
      console.error('Failed to create profile:', insertError);
      return NextResponse.json(
        { success: false, error: 'Gagal membuat akun' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Akun berhasil dibuat',
    });
  } catch (error) {
    console.error('Registration error:', error);

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