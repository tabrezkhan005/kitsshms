import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendBookingApprovalEmail } from "@/lib/email";

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

    // Update the booking request status to approved
    const { error: updateError } = await supabase
      .from('booking_requests')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating booking request:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to approve request' },
        { status: 500 }
      );
    }

    // Send approval email notification
    try {
      await sendBookingApprovalEmail({
        to: bookingRequest.users.email,
        username: bookingRequest.users.username,
        eventName: bookingRequest.event_name,
        startDate: bookingRequest.start_date,
        endDate: bookingRequest.end_date,
        startTime: bookingRequest.start_time,
        endTime: bookingRequest.end_time,
        halls: bookingRequest.booking_request_halls.map((h: BookingRequestHall) => h.halls.name).join(', '),
        role: bookingRequest.users.role,
        clubName: bookingRequest.users.club_name
      });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking request approved successfully'
    });

  } catch (error) {
    console.error('Error approving booking request:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
