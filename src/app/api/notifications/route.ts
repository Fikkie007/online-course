import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  type: z.enum(['in_app', 'email', 'whatsapp']).default('in_app'),
});

// GET - List notifications (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // If admin, get all notifications, otherwise get user's notifications
    const isAdm = await isAdmin();

    let query = supabase
      .from('notifications')
      .select(`
        *,
        user:profiles!notifications_user_id_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!isAdm) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdm = await isAdmin();
    if (!isAdm) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = sendNotificationSchema.parse(body);

    const supabase = createAdminClient();

    let notificationsToCreate = [];

    if (validatedData.userId && validatedData.userId !== 'all') {
      // Send to specific user
      notificationsToCreate.push({
        user_id: validatedData.userId,
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        is_read: false,
      });
    } else {
      // Send to all users
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id');

      if (usersError) {
        return NextResponse.json({ error: usersError.message }, { status: 500 });
      }

      notificationsToCreate = allUsers?.map((u) => ({
        user_id: u.id,
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        is_read: false,
      })) || [];
    }

    if (notificationsToCreate.length === 0) {
      return NextResponse.json({ error: 'No users to notify' }, { status: 400 });
    }

    // Insert notifications
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsToCreate)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Send email/WhatsApp if type is email or whatsapp
    // This would integrate with Resend/Fonnte

    return NextResponse.json({
      success: true,
      data: { count: data?.length || 0 },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}