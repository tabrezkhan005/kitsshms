import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const is_read = searchParams.get('is_read');
    const limit = searchParams.get('limit') || '50';

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Apply filters
    if (is_read !== null) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, notification_ids } = body;

    if (!user_id || !notification_ids || !Array.isArray(notification_ids)) {
      return NextResponse.json(
        { success: false, message: 'User ID and notification IDs array are required' },
        { status: 400 }
      );
    }

    const { data: updatedNotifications, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .in('id', notification_ids)
      .select();

    if (error) {
      console.error('Error updating notifications:', error);
      return NextResponse.json(
        { success: false, message: 'Error updating notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
      data: updatedNotifications
    });

  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
