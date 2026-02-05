
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch Stats (Counts)
    // Pending
    const { count: pendingCount } = await supabaseAdmin
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Approved (Today) - events happening today
    const { count: approvedTodayCount } = await supabaseAdmin
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('start_date', today);

    // Total Requests (Today) - submitted today
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    const { count: totalRequestsToday } = await supabaseAdmin
      .from('booking_requests')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString());

    // Rejected (Total) - maybe just count pending is enough?
    // Let's get generic stats.

    // Total Halls
    const { count: totalHalls } = await supabaseAdmin
      .from('halls')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch Today's Events
    const { data: todayEvents, error: eventsError } = await supabaseAdmin
      .from('booking_requests')
      .select(`
        id,
        event_name,
        start_date,
        end_date,
        start_time,
        end_time,
        status,
        users:users!booking_requests_requester_id_fkey (
          username,
          role,
          club_name
        ),
        booking_request_halls (
          halls (
            name
          )
        )
      `)
      .eq('start_date', today)
      .eq('status', 'approved')
      .order('start_time', { ascending: true });

    if (eventsError) throw eventsError;

    // 3. Fetch Recent Requests (Limit 5)
    const { data: recentRequests, error: recentError } = await supabaseAdmin
      .from('booking_requests')
      .select(`
        id,
        event_name,
        start_date,
        end_date,
        status,
        created_at,
        users:users!booking_requests_requester_id_fkey (
          username,
          role,
          club_name
        ),
        booking_request_halls (
          halls (
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalRequests: totalRequestsToday || 0,
          pendingRequests: pendingCount || 0,
          approvedRequests: approvedTodayCount || 0,
          totalHalls: totalHalls || 0,
          usersByRole: {}
        },
        todayEvents: todayEvents || [],
        recentRequests: recentRequests || []
      }
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
