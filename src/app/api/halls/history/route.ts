import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch hall history and usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const hallId = searchParams.get('hall_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // If specific hall requested
    if (hallId) {
      // Fetch hall details
      const { data: hall, error: hallError } = await supabaseAdmin
        .from('halls')
        .select('*')
        .eq('id', hallId)
        .single()

      if (hallError || !hall) {
        return NextResponse.json(
          { success: false, message: 'Hall not found' },
          { status: 404 }
        )
      }

      // Fetch hall booking history
      let bookingsQuery = supabaseAdmin
        .from('booking_request_halls')
        .select(`
          booking_request_id,
          booking_requests(
            id,
            event_name,
            start_date,
            end_date,
            start_time,
            end_time,
            status,
            expected_attendees,
            reason_for_booking,
            created_at,
            users:users!booking_requests_requester_id_fkey(id, username, email, role, club_name)
          )
        `)
        .eq('hall_id', hallId)
        .order('created_at', { foreignTable: 'booking_requests', ascending: false })

      const { data: bookingHalls, error: bookingsError } = await bookingsQuery

      // Extract and flatten bookings
      const bookings = bookingHalls
        ?.map(bh => bh.booking_requests)
        .filter(b => b !== null)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []

      // Calculate hall statistics
      const stats = {
        totalBookings: bookings.length,
        approved: bookings.filter((b: any) => b.status === 'approved').length,
        pending: bookings.filter((b: any) => b.status === 'pending').length,
        rejected: bookings.filter((b: any) => b.status === 'rejected').length,
        totalAttendees: bookings
          .filter((b: any) => b.status === 'approved')
          .reduce((sum: number, b: any) => sum + (b.expected_attendees || 0), 0),
        upcomingEvents: bookings.filter((b: any) =>
          b.status === 'approved' && new Date(b.start_date) >= new Date()
        ).length,
        facultyBookings: bookings.filter((b: any) => b.users?.role === 'faculty').length,
        clubBookings: bookings.filter((b: any) => b.users?.role === 'clubs').length
      }

      // Monthly usage (last 6 months)
      const monthlyUsage: Record<string, number> = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
        monthlyUsage[key] = 0
      }

      bookings.forEach((b: any) => {
        if (b.status === 'approved') {
          const d = new Date(b.start_date)
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' })
          if (monthlyUsage[key] !== undefined) {
            monthlyUsage[key]++
          }
        }
      })

      return NextResponse.json({
        success: true,
        hall: {
          ...hall,
          bookings,
          stats,
          monthlyUsage: Object.entries(monthlyUsage).map(([month, count]) => ({ month, count }))
        }
      })
    }

    // Fetch all halls with summary stats
    const { data: halls, error: hallsError } = await supabaseAdmin
      .from('halls')
      .select('*')
      .order('name')

    if (hallsError) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch halls' },
        { status: 500 }
      )
    }

    // Fetch booking counts per hall
    const hallsWithStats = await Promise.all(
      (halls || []).map(async (hall) => {
        const { data: bookingHalls } = await supabaseAdmin
          .from('booking_request_halls')
          .select(`
            booking_requests(status)
          `)
          .eq('hall_id', hall.id)

        const bookings = bookingHalls?.map(bh => bh.booking_requests).filter(b => b) || []

        return {
          ...hall,
          stats: {
            totalBookings: bookings.length,
            approved: bookings.filter((b: any) => b.status === 'approved').length,
            pending: bookings.filter((b: any) => b.status === 'pending').length
          }
        }
      })
    )

    return NextResponse.json({
      success: true,
      halls: hallsWithStats
    })
  } catch (error) {
    console.error('Halls history error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
