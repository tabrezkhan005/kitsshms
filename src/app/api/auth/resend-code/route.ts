import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendVerificationEmail } from '@/lib/email'

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

    const { sessionToken } = await request.json()

    console.log('Resend code attempt for session:', sessionToken)

    // Validate input
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: 'Session token is required' },
        { status: 400 }
      )
    }

    let session, sessionError, user, userError

    try {
      // Find the existing session
      const sessionResult = await supabaseAdmin
        .from('login_sessions')
        .select('*')
        .eq('session_token', sessionToken)
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
      console.log('Session not found or expired:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session' },
        { status: 401 }
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
      console.log('User not found:', userError)
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new verification code
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    try {
      // Update the session with new code and extend expiry
      const { error: updateError } = await supabaseAdmin
        .from('login_sessions')
        .update({
          verification_code: newVerificationCode,
          expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        })
        .eq('id', session.id)

      if (updateError) {
        console.log('Failed to update session:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to generate new code' },
          { status: 500 }
        )
      }
    } catch (dbError) {
      console.error('Database error during session update:', dbError)
      return NextResponse.json(
        { success: false, message: 'Database error. Please try again later.' },
        { status: 503 }
      )
    }

    // Send email with new verification code
    const emailResult = await sendVerificationEmail(user.email, newVerificationCode, user.username)

    // Handle the new fallback system
    if (emailResult.fallback) {
      // Email was skipped due to domain verification issues, but code is available
      console.log(`✅ New verification code generated for ${user.username} (${user.role})`)
      console.log(`🔐 New Code: ${newVerificationCode}`)
      console.log(`📧 Email: ${user.email}`)

      return NextResponse.json({
        success: true,
        message: 'New verification code generated. Please check console or use the code displayed below.',
        codeSent: false,
        verificationCode: newVerificationCode, // Include code for display
        emailError: emailResult.error,
        fallback: true
      })
    } else if (!emailResult.success) {
      console.log('Failed to send email via Resend, falling back to console logging')
      // Fallback: log to console and include code in response for development
      console.log(`⚠️ Email delivery failed for ${user.email}`)
      console.log(`🔐 New verification code: ${newVerificationCode}`)
      console.log(`📧 User: ${user.username} (${user.role})`)

      return NextResponse.json({
        success: true,
        message: 'New verification code generated. Email delivery failed. Please check console for verification code.',
        codeSent: false,
        verificationCode: newVerificationCode, // Include code for development
        emailError: emailResult.error
      })
    }

    console.log(`✅ New verification code sent successfully to ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'New verification code sent to your email',
      codeSent: true
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to resend code' },
      { status: 500 }
    )
  }
}
