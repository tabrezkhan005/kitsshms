import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Fetch all booking requests for the club user
    const { data: bookingRequests, error: requestsError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('requester_id', 'a3072456-c8c8-4f81-8bdb-b584119d533f'); // Club user ID

    if (requestsError) {
      console.error('Error fetching booking requests:', requestsError);
      return NextResponse.json({ error: 'Failed to fetch booking requests' }, { status: 500 });
    }

    // Calculate analytics
    const totalRequests = bookingRequests?.length || 0;
    const approvedRequests = bookingRequests?.filter(req => req.status === 'approved').length || 0;
    const pendingRequests = bookingRequests?.filter(req => req.status === 'pending').length || 0;

    // Fetch upcoming events (approved requests in the future)
    const now = new Date();
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('requester_id', 'a3072456-c8c8-4f81-8bdb-b584119d533f') // Club user ID
      .eq('status', 'approved')
      .gte('start_date', now.toISOString().split('T')[0]);

    if (eventsError) {
      console.error('Error fetching upcoming events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch upcoming events' }, { status: 500 });
    }

    const analyticsData = {
      totalRequests,
      approvedRequests,
      pendingRequests,
      upcomingEvents: upcomingEvents?.length || 0
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error in club analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
