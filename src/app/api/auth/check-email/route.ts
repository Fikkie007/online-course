import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, email, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Email not registered
      return NextResponse.json({
        success: true,
        exists: false,
        hasPassword: false,
      });
    }

    // Email exists, check if has password
    return NextResponse.json({
      success: true,
      exists: true,
      hasPassword: !!user.password_hash,
    });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}