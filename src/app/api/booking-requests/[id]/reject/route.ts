import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingRejectionEmail } from "@/lib/email";

// Type for booking request hall
interface BookingRequestHall {
  hall_id: string;
  halls: {
    id: string;
    name: string;
    capacity: number;
  };
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { rejection_reason } = await request.json();

    if (!rejection_reason || !rejection_reason.trim()) {
      return NextResponse.json(
        { success: false, message: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Get the booking request with user details
    const { data: bookingRequest, error: fetchError } = await supabase
      .from('booking_requests')
      .select(`
        *,
        users (
          id,
          username,
          email,
          role,
          club_name
        ),
        booking_request_halls (
          hall_id,
          halls (
            id,
            name,
            capacity
          )
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError || !bookingRequest) {
      return NextResponse.json(
        { success: false, message: 'Booking request not found' },
        { status: 404 }
      );
    }

    // Check if request is already processed
    if (bookingRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Update the booking request status to rejected with reason
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating booking request:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to reject request' },
        { status: 500 }
      );
    }

    // Send rejection email notification
    try {
      await sendBookingRejectionEmail({
        to: bookingRequest.users.email,
        username: bookingRequest.users.username,
        eventName: bookingRequest.event_name,
        startDate: bookingRequest.start_date,
        endDate: bookingRequest.end_date,
        startTime: bookingRequest.start_time,
        endTime: bookingRequest.end_time,
        halls: bookingRequest.booking_request_halls.map((h: BookingRequestHall) => h.halls.name).join(', '),
        rejectionReason: rejection_reason.trim(),
        role: bookingRequest.users.role,
        clubName: bookingRequest.users.club_name
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking request rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting booking request:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
