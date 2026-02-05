import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailViaResend } from '@/lib/email'

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// PATCH - Update booking request (approve/deny)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { id: bookingId } = await params
    const body = await request.json()
    const { action, reason, admin_notes } = body

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      )
    }

    // Get the booking request details
    const { data: bookingRequest, error: fetchError } = await supabaseAdmin
      .from('booking_requests')
      .select(`
        *,
        seminar_halls(name),
        users(username, email)
      `)
      .eq('id', bookingId)
      .single()

    if (fetchError || !bookingRequest) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Booking request not found' },
        { status: 404 }
      )
    }

    // Update the booking request status
    const updateData: {
      status: string;
      updated_at: string;
      denial_reason?: string;
      admin_notes?: string;
    } = {
      status: action === 'approve' ? 'approved' : 'denied',
      updated_at: new Date().toISOString()
    }

    if (action === 'deny' && reason) {
      updateData.denial_reason = reason
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('booking_requests')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update booking request' },
        { status: 500 }
      )
    }

    // Send email notification to the requester
    try {
      const requesterName = bookingRequest.users?.username || 'User'
      const requesterEmail = bookingRequest.users?.email || ''

      if (action === 'approve') {
        // Send approval email
        await sendEmailViaResend(
          requesterEmail,
          'APPROVED',
          requesterName
        )
        console.log(`Approval email sent to ${requesterEmail}`)
      } else {
        // Send denial email
        await sendEmailViaResend(
          requesterEmail,
          'DENIED',
          requesterName
        )
        console.log(`Denial email sent to ${requesterEmail}`)
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails
    }

    // Create notification record
    try {
              await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: bookingRequest.requester_id,
          type: action === 'approve' ? 'booking_approved' : 'booking_denied',
          title: `Booking Request ${action === 'approve' ? 'Approved' : 'Denied'}`,
          message: `Your booking request has been ${action === 'approve' ? 'approved' : 'denied'}.`,
          related_booking_id: bookingId
        })
    } catch (notificationError) {
      console.error('Notification creation failed:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: `Booking request ${action === 'approve' ? 'approved' : 'denied'} successfully`,
      data: updatedRequest
    })

  } catch (error) {
    console.error('Error updating booking request:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete booking request or direct booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { id: bookingId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'request' or 'direct'

    if (!type || !['request', 'direct'].includes(type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid booking type' },
        { status: 400 }
      )
    }

    let deleteError

    if (type === 'request') {
      // Delete booking request
      const { error } = await supabaseAdmin
        .from('booking_requests')
        .delete()
        .eq('id', bookingId)
      deleteError = error
    } else {
      // Delete direct booking
      const { error } = await supabaseAdmin
        .from('direct_bookings')
        .delete()
        .eq('id', bookingId)
      deleteError = error
    }

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
