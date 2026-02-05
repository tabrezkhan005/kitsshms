
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('start_date');
    const endDateParam = searchParams.get('end_date');

    // 1. Fetch Halls
    const { data: halls, error: hallsError } = await supabaseAdmin
      .from('halls')
      .select('*')
      .eq('is_active', true);

    if (hallsError) throw hallsError;

    // Case 1: Single Date Detailed View
    if (dateParam) {
      const selectedDate = dateParam; // YYYY-MM-DD

      // Fetch Approved Requests for this date
      const { data: requests, error: reqError } = await supabaseAdmin
        .from('booking_requests')
        .select(`
          *,
          users!requester_id (username, role, club_name),
          booking_request_halls (hall_id)
        `)
        .or(`status.eq.approved,status.eq.pending`)
        .lte('start_date', selectedDate)
        .gte('end_date', selectedDate);

      // Fetch Direct Bookings for this date
      const { data: direct, error: subError } = await supabaseAdmin
        .from('direct_bookings')
        .select(`
          *,
          users!booked_by (username, role, club_name)
        `)
        .lte('start_date', selectedDate)
        .gte('end_date', selectedDate);

      if (reqError) throw reqError;
      if (subError) throw subError;

      // Map bookings to halls
      const hallAvailability = halls.map(hall => {
        // Check direct bookings first (admin override)
        const directBooking = direct?.find(b => b.hall_id === hall.id);
        if (directBooking) {
          return {
            id: hall.id,
            name: hall.name,
            capacity: hall.capacity,
            status: 'booked',
            booking: {
              event_name: directBooking.event_name || 'Direct Booking',
              requester_name: directBooking.users?.username || 'Admin',
              requester_role: 'admin',
              reason_for_booking: directBooking.purpose,
              start_time: directBooking.start_time,
              end_time: directBooking.end_time,
              expected_attendees: directBooking.attendees_count
            }
          };
        }

        // Check requests
        const requestBooking = requests?.find(r =>
          r.booking_request_halls.some((h: any) => h.hall_id === hall.id)
        );

        if (requestBooking) {
          return {
            id: hall.id,
            name: hall.name,
            capacity: hall.capacity,
            status: requestBooking.status === 'approved' ? 'booked' : 'pending',
            booking: {
              event_name: requestBooking.event_name,
              requester_name: requestBooking.users?.username || 'User',
              requester_role: requestBooking.users?.role || 'user',
              reason_for_booking: requestBooking.reason_for_booking,
              start_time: requestBooking.start_time,
              end_time: requestBooking.end_time,
              expected_attendees: requestBooking.expected_attendees
            }
          };
        }

        // Available
        return {
          id: hall.id,
          name: hall.name,
          capacity: hall.capacity,
          status: 'available'
        };
      });

      return NextResponse.json({ success: true, data: hallAvailability });
    }

    // Case 2: Range View (Month Overview)
    if (startDateParam && endDateParam) {
      // TODO: Implement summary for range if needed by frontend
      // For now, returning empty object or simple map
      return NextResponse.json({ success: true, data: {} });
    }

    return NextResponse.json({ success: false, message: 'Invalid parameters' }, { status: 400 });

  } catch (error) {
    console.error('Availability API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
