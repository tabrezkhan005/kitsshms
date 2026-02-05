import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    // Get all users from the database
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, role, is_active')
      .eq('is_active', true)
      .order('role')

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      }, { status: 500 })
    }

    // Generate OTP codes for each user
    const usersWithOTP = users?.map(user => ({
      ...user,
      otp: Math.floor(100000 + Math.random() * 900000).toString(),
      timestamp: new Date().toISOString()
    })) || []

    return NextResponse.json({
      success: true,
      message: 'OTP codes generated successfully',
      users: usersWithOTP,
      note: 'These are test OTP codes. Use them for login verification.',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating OTP codes:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
