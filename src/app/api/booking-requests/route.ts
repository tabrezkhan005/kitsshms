import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Create a new booking request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requester_id,
      event_name,
      event_description,
      start_date,
      end_date,
      start_time,
      end_time,
      expected_attendees,
      reason_for_booking,
      hall_ids
    } = body;

    // Validate required fields
    if (!requester_id || !event_name || !start_date || !end_date || !start_time || !end_time || !reason_for_booking || !hall_ids || !Array.isArray(hall_ids)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists and get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, role, club_name')
      .eq('id', requester_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if halls exist
    const { data: halls, error: hallsError } = await supabase
      .from('halls')
      .select('id, name')
      .in('id', hall_ids);

    if (hallsError || !halls || halls.length !== hall_ids.length) {
      return NextResponse.json(
        { success: false, message: 'One or more halls not found' },
        { status: 404 }
      );
    }

    // Check for conflicting bookings for the same halls and dates
    const { data: conflicts, error: conflictError } = await supabase
      .from('booking_requests')
      .select(`
        id,
        status,
        start_date,
        end_date,
        booking_request_halls!inner(hall_id)
      `)
      .in('booking_request_halls.hall_id', hall_ids)
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`)
      .neq('status', 'rejected');

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return NextResponse.json(
        { success: false, message: 'Error checking booking conflicts' },
        { status: 500 }
      );
    }

    // Filter conflicts based on user role
    let blockingConflicts = [];
    if (conflicts && conflicts.length > 0) {
      // For faculty users, only approved bookings are blocking conflicts
      if (user.role === 'faculty') {
        blockingConflicts = conflicts.filter(conflict => conflict.status === 'approved');
      } else {
        // For other users (clubs), both approved and pending bookings are blocking
        blockingConflicts = conflicts.filter(conflict => conflict.status === 'approved' || conflict.status === 'pending');
      }
    }

    if (blockingConflicts.length > 0) {
      return NextResponse.json(
        { success: false, message: 'One or more halls are already booked for the selected dates' },
        { status: 409 }
      );
    }

    // Create the booking request
    const { data: bookingRequest, error: bookingError } = await supabase
      .from('booking_requests')
      .insert({
        requester_id,
        event_name,
        event_description,
        start_date,
        end_date,
        start_time,
        end_time,
        expected_attendees,
        reason_for_booking,
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking request:', bookingError);
      return NextResponse.json(
        { success: false, message: 'Error creating booking request' },
        { status: 500 }
      );
    }

    // Create hall associations
    const hallAssociations = hall_ids.map((hall_id: string) => ({
      booking_request_id: bookingRequest.id,
      hall_id
    }));

    const { error: hallAssocError } = await supabase
      .from('booking_request_halls')
      .insert(hallAssociations);

    if (hallAssocError) {
      console.error('Error creating hall associations:', hallAssocError);
      return NextResponse.json(
        { success: false, message: 'Error associating halls with booking request' },
        { status: 500 }
      );
    }

    // Send email notification to admin and confirmation to requester
    try {
      const { sendAdminBookingNotification, sendBookingConfirmationEmail } = await import('@/lib/email');

      const hallNames = halls.map(hall => hall.name).join(', ');
      const requesterName = user.club_name || user.username;

      // Notify Admin
      await sendAdminBookingNotification({
        event_name,
        requester_name: requesterName,
        requester_email: user.email,
        requester_role: user.role,
        hall_names: hallNames,
        start_date,
        end_date,
        start_time,
        end_time,
        reason_for_booking,
        expected_attendees,
        club_name: user.club_name
      });

      // Confirm to Requester
      await sendBookingConfirmationEmail({
        event_name,
        requester_name: requesterName,
        requester_email: user.email,
        requester_role: user.role,
        hall_names: hallNames,
        start_date,
        end_date,
        start_time,
        end_time,
        reason_for_booking
      });

    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    // Create notification for the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: requester_id,
        title: 'Booking Request Submitted',
        message: `Your booking request for "${event_name}" has been submitted and is pending approval.`,
        type: 'info',
        related_booking_request_id: bookingRequest.id
      });

    return NextResponse.json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        id: bookingRequest.id,
        status: bookingRequest.status
      }
    });

  } catch (error) {
    console.error('Error in POST /api/booking-requests:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Fetch booking requests (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requester_id = searchParams.get('requester_id');
    const requester_role = searchParams.get('requester_role');
    const status = searchParams.get('status');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    let query = supabase
      .from('booking_requests')
      .select(`
        *,
        users!booking_requests_requester_id_fkey(id, email, username, role, club_name),
        booking_request_halls(
          hall_id,
          halls(id, name, capacity)
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (requester_id) {
      query = query.eq('requester_id', requester_id);
    }
    if (requester_role) {
      query = query.eq('users.role', requester_role);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (start_date) {
      query = query.gte('start_date', start_date);
    }
    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    const { data: bookingRequests, error } = await query;

    if (error) {
      console.error('Error fetching booking requests:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching booking requests' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookingRequests
    });

  } catch (error) {
    console.error('Error in GET /api/booking-requests:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a booking request
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const requesterId = searchParams.get('requester_id');

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'Request ID is required' },
        { status: 400 }
      );
    }

    if (!requesterId) {
      return NextResponse.json(
        { success: false, message: 'Requester ID is required' },
        { status: 400 }
      );
    }

    // First, check if the booking request exists and belongs to the requester
    const { data: bookingRequest, error: fetchError } = await supabase
      .from('booking_requests')
      .select('id, requester_id, status, event_name')
      .eq('id', requestId)
      .eq('requester_id', requesterId)
      .single();

    if (fetchError || !bookingRequest) {
      return NextResponse.json(
        { success: false, message: 'Booking request not found or access denied' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending requests
    if (bookingRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Only pending requests can be deleted' },
        { status: 403 }
      );
    }

    // Delete hall associations first (due to foreign key constraints)
    const { error: hallAssocError } = await supabase
      .from('booking_request_halls')
      .delete()
      .eq('booking_request_id', requestId);

    if (hallAssocError) {
      console.error('Error deleting hall associations:', hallAssocError);
      return NextResponse.json(
        { success: false, message: 'Error deleting hall associations' },
        { status: 500 }
      );
    }

    // Delete the booking request
    const { error: deleteError } = await supabase
      .from('booking_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) {
      console.error('Error deleting booking request:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Error deleting booking request' },
        { status: 500 }
      );
    }

    // Create notification for the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: requesterId,
        title: 'Booking Request Deleted',
        message: `Your booking request for "${bookingRequest.event_name}" has been successfully deleted.`,
        type: 'info'
      });

    return NextResponse.json({
      success: true,
      message: 'Booking request deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/booking-requests:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
