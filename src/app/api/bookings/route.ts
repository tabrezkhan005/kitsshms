import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all bookings and requests
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'requests', 'direct', 'all'
    const status = searchParams.get('status') // 'pending', 'approved', 'denied', etc.
    const hallId = searchParams.get('hall_id')

    let query = ''

    if (type === 'requests') {
      // Fetch booking requests
      query = `
        SELECT
          br.*,
          sh.name as hall_name,
          u.username as requester_name,
          u.email as requester_email
        FROM booking_requests br
        LEFT JOIN seminar_halls sh ON br.hall_id = sh.id
        LEFT JOIN users u ON br.requester_id = u.id
        WHERE 1=1
      `
    } else if (type === 'direct') {
      // Fetch direct bookings
      query = `
        SELECT
          db.*,
          sh.name as hall_name,
          u.username as booked_by_name
        FROM direct_bookings db
        LEFT JOIN seminar_halls sh ON db.hall_id = sh.id
        LEFT JOIN users u ON db.booked_by = u.id
        WHERE 1=1
      `
    } else {
      // Fetch all bookings (combined view)
      query = `
        SELECT
          'request' as event_type,
          br.id,
          br.hall_id,
          br.start_date,
          br.end_date,
          br.start_time,
          br.end_time,
          br.purpose,
          br.status,
          br.requester_type,
          br.attendees_count,
          br.created_at,
          sh.name as hall_name,
          u.username as requester_name,
          u.email as requester_email,
          NULL as is_unavailable,
          NULL as unavailability_reason
        FROM booking_requests br
        LEFT JOIN seminar_halls sh ON br.hall_id = sh.id
        LEFT JOIN users u ON br.requester_id = u.id
        UNION ALL
        SELECT
          'direct' as event_type,
          db.id,
          db.hall_id,
          db.start_date,
          db.end_date,
          db.start_time,
          db.end_time,
          db.purpose,
          'approved' as status,
          'admin' as requester_type,
          db.attendees_count,
          db.created_at,
          sh.name as hall_name,
          u.username as requester_name,
          u.email as requester_email,
          db.is_unavailable,
          db.unavailability_reason
        FROM direct_bookings db
        LEFT JOIN seminar_halls sh ON db.hall_id = sh.id
        LEFT JOIN users u ON db.booked_by = u.id
      `
    }

    // Add filters
    if (status) {
      query += ` AND status = '${status}'`
    }
    if (hallId) {
      query += ` AND hall_id = '${hallId}'`
    }

    query += ' ORDER BY created_at DESC'

    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: query })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bookings fetched successfully',
      data: data || []
    })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new booking request or direct booking
export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { type, ...bookingData } = body

    if (type === 'request') {
      // Create booking request
      const {
        hall_id,
        requester_id,
        requester_type,
        start_date,
        end_date,
        start_time,
        end_time,
        purpose,
        attendees_count,
        requester_name,
        requester_email
      } = bookingData

      // Validate required fields
      if (!hall_id || !requester_id || !requester_type || !start_date || !end_date ||
          !start_time || !end_time || !purpose || !attendees_count) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Check for conflicts
      const conflictQuery = `
        SELECT COUNT(*) as count
        FROM (
          SELECT start_date, end_date, start_time, end_time
          FROM booking_requests
          WHERE hall_id = '${hall_id}' AND status IN ('pending', 'approved')
          UNION ALL
          SELECT start_date, end_date, start_time, end_time
          FROM direct_bookings
          WHERE hall_id = '${hall_id}'
        ) bookings
        WHERE (
          (start_date <= '${start_date}' AND end_date >= '${start_date}') OR
          (start_date <= '${end_date}' AND end_date >= '${end_date}') OR
          (start_date >= '${start_date}' AND end_date <= '${end_date}')
        ) AND (
          (start_time < '${end_time}' AND end_time > '${start_time}')
        )
      `

      const { data: conflictData, error: conflictError } = await supabaseAdmin.rpc('exec_sql', {
        sql: conflictQuery
      })

      if (conflictError) {
        console.error('Conflict check error:', conflictError)
        return NextResponse.json(
          { success: false, message: 'Failed to check booking conflicts' },
          { status: 500 }
        )
      }

      if (conflictData && conflictData[0]?.count > 0) {
        return NextResponse.json(
          { success: false, message: 'Booking conflicts with existing reservation' },
          { status: 409 }
        )
      }

      // Insert booking request
      const { data: newRequest, error: insertError } = await supabaseAdmin
        .from('booking_requests')
        .insert({
          hall_id,
          requester_id,
          requester_type,
          start_date,
          end_date,
          start_time,
          end_time,
          purpose,
          attendees_count
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { success: false, message: 'Failed to create booking request' },
          { status: 500 }
        )
      }

      // TODO: Send email notification to admin
      console.log(`New booking request from ${requester_name} (${requester_email})`)

      return NextResponse.json({
        success: true,
        message: 'Booking request created successfully',
        data: newRequest
      })

    } else if (type === 'direct') {
      // Create direct booking (admin only)
      const {
        hall_id,
        booked_by,
        start_date,
        end_date,
        start_time,
        end_time,
        purpose,
        attendees_count,
        is_unavailable,
        unavailability_reason
      } = bookingData

      // Validate required fields
      if (!hall_id || !booked_by || !start_date || !end_date ||
          !start_time || !end_time || !purpose) {
        return NextResponse.json(
          { success: false, message: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Insert direct booking
      const { data: newBooking, error: insertError } = await supabaseAdmin
        .from('direct_bookings')
        .insert({
          hall_id,
          booked_by,
          start_date,
          end_date,
          start_time,
          end_time,
          purpose,
          attendees_count: attendees_count || 0,
          is_unavailable: is_unavailable || false,
          unavailability_reason
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json(
          { success: false, message: 'Failed to create direct booking' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Direct booking created successfully',
        data: newBooking
      })

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid booking type' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}


