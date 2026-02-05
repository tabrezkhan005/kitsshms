import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all users with optional filters
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
    const userId = searchParams.get('id')
    const role = searchParams.get('role')
    const search = searchParams.get('search')

    // If specific user ID requested, fetch with full details
    if (userId) {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        )
      }

      // Fetch user's booking history
      const { data: bookings } = await supabaseAdmin
        .from('booking_requests')
        .select(`
          *,
          booking_request_halls(
            hall_id,
            halls(id, name, capacity)
          )
        `)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })

      // Calculate user stats
      const stats = {
        totalBookings: bookings?.length || 0,
        approved: bookings?.filter(b => b.status === 'approved').length || 0,
        pending: bookings?.filter(b => b.status === 'pending').length || 0,
        rejected: bookings?.filter(b => b.status === 'rejected').length || 0,
        upcomingEvents: bookings?.filter(b =>
          b.status === 'approved' && new Date(b.start_date) >= new Date()
        ).length || 0
      }

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          bookings: bookings || [],
          stats
        }
      })
    }

    // Build query for all users
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,club_name.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: users || []
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role, branch, club_name } = body

    // Validate required fields
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'faculty', 'clubs'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        role,
        branch: role === 'faculty' ? branch : null,
        club_name: role === 'clubs' ? club_name : null,
        is_email_verified: true, // Admin-created users are pre-verified
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return NextResponse.json(
        { success: false, message: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, username, email, role, branch, club_name, is_active } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (branch !== undefined) updateData.branch = branch
    if (club_name !== undefined) updateData.club_name = club_name
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.updated_at = new Date().toISOString()

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if user has any bookings
    const { data: bookings } = await supabaseAdmin
      .from('booking_requests')
      .select('id')
      .eq('requester_id', userId)
      .limit(1)

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete user with existing bookings. Deactivate instead.' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
