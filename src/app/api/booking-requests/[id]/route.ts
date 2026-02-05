import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PATCH - Update booking request status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingRequestId } = await params;
    const body = await request.json();
    const { status, admin_notes, denial_reason } = body;

    // Validate required fields
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be "approved" or "rejected"' },
        { status: 400 }
      );
    }

    // Get the booking request with user details
    const { data: bookingRequest, error: fetchError } = await supabase
      .from('booking_requests')
      .select(`
        *,
        users!booking_requests_requester_id_fkey(id, email, username, role, club_name),
        booking_request_halls(
          hall_id,
          halls(id, name)
        )
      `)
      .eq('id', bookingRequestId)
      .single();

    if (fetchError || !bookingRequest) {
      return NextResponse.json(
        { success: false, message: 'Booking request not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      status: string;
      updated_at: string;
      admin_notes?: string;
      denial_reason?: string;
    } = {
      status,
      updated_at: new Date().toISOString()
    };

    if (admin_notes) {
      updateData.admin_notes = admin_notes;
    }

    if (status === 'rejected' && denial_reason) {
      updateData.denial_reason = denial_reason;
    }

    // Update the booking request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('booking_requests')
      .update(updateData)
      .eq('id', bookingRequestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking request:', updateError);
      return NextResponse.json(
        { success: false, message: 'Error updating booking request' },
        { status: 500 }
      );
    }

    // Send email notification to the requester
    try {
      const { sendBookingNotificationEmail } = await import('@/lib/email');

      const hallNames = bookingRequest.booking_request_halls
        .map((brh: { halls: { name: string } }) => brh.halls.name)
        .join(', ');

      const subject = status === 'approved'
        ? `Booking Request Approved - ${bookingRequest.event_name}`
        : `Booking Request Rejected - ${bookingRequest.event_name}`;

      const html = `
        <h2>Booking Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
        <p><strong>Event:</strong> ${bookingRequest.event_name}</p>
        <p><strong>Halls:</strong> ${hallNames}</p>
        <p><strong>Date:</strong> ${bookingRequest.start_date} to ${bookingRequest.end_date}</p>
        <p><strong>Time:</strong> ${bookingRequest.start_time} to ${bookingRequest.end_time}</p>
        <p><strong>Status:</strong> ${status === 'approved' ? 'Approved' : 'Rejected'}</p>
        ${admin_notes ? `<p><strong>Admin Notes:</strong> ${admin_notes}</p>` : ''}
        ${status === 'rejected' && denial_reason ? `<p><strong>Reason for Rejection:</strong> ${denial_reason}</p>` : ''}
        <br>
        <p>${status === 'approved' ? 'Your booking request has been approved. Please ensure all arrangements are made accordingly.' : 'Your booking request has been rejected. Please contact the admin for more information.'}</p>
      `;

      await sendBookingNotificationEmail({
        to: bookingRequest.users.email,
        subject,
        html
      });
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    // Create notification for the requester
    await supabase
      .from('notifications')
      .insert({
        user_id: bookingRequest.requester_id,
        title: `Booking Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your booking request for "${bookingRequest.event_name}" has been ${status}.`,
        type: status === 'approved' ? 'success' : 'error',
        related_booking_request_id: bookingRequestId
      });

    return NextResponse.json({
      success: true,
      message: `Booking request ${status} successfully`,
      data: updatedRequest
    });

  } catch (error) {
    console.error('Error in PATCH /api/booking-requests/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get specific booking request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingRequestId } = await params;

    const { data: bookingRequest, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        users!booking_requests_requester_id_fkey(id, email, username, role, club_name),
        booking_request_halls(
          hall_id,
          halls(id, name, capacity, description, location, amenities)
        )
      `)
      .eq('id', bookingRequestId)
      .single();

    if (error || !bookingRequest) {
      return NextResponse.json(
        { success: false, message: 'Booking request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bookingRequest
    });

  } catch (error) {
    console.error('Error in GET /api/booking-requests/[id]:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
