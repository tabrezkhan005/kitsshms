import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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

    const { sessionToken, verificationCode } = await request.json()

    // Validate input
    if (!sessionToken || !verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Session token and verification code are required' },
        { status: 400 }
      )
    }

    let session, sessionError, user, userError

    try {
      // Find and verify session
      const sessionResult = await supabaseAdmin
        .from('login_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('verification_code', verificationCode)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      session = sessionResult.data
      sessionError = sessionResult.error
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database connection error. Please try again later.' },
        { status: 503 }
      )
    }

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification code' },
        { status: 401 }
      )
    }

    try {
      // Mark session as verified
      const { error: updateError } = await supabaseAdmin
        .from('login_sessions')
        .update({
          is_verified: true
        })
        .eq('id', session.id)

      if (updateError) {
        return NextResponse.json(
          { success: false, message: 'Failed to verify session' },
          { status: 500 }
        )
      }
    } catch (dbError) {
      console.error('Database error during session verification:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database error. Please try again later.' },
        { status: 503 }
      )
    }

    try {
      // Get user details
      const userResult = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .single()

      user = userResult.data
      userError = userResult.error
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database error. Please try again later.' },
        { status: 503 }
      )
    }

    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        branch: user.branch,
        club_name: user.club_name,
        is_email_verified: user.is_email_verified,
        is_active: user.is_active
      }
    })

    // Set authentication cookies
    response.cookies.set('isAuthenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    response.cookies.set('user', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      branch: user.branch,
      club_name: user.club_name,
      is_email_verified: user.is_email_verified,
      is_active: user.is_active
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    )
  }
}
