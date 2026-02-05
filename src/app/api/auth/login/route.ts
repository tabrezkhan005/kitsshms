import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { sendEmailViaResend } from '@/lib/email'

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

    const { identifier, password } = await request.json()

    // Validate input
    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email or username
    // Optimization: We scan both with a single efficient query strategy if possible,
    // but separate queries are safer for type checking.

    let user = null

    // Check if identifier looks like an email
    const isEmail = identifier.includes('@')

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq(isEmail ? 'email' : 'username', identifier)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      // Don't reveal if user exists or not for security, but logging for internal debug is fine
      console.log('Login failed: User not found', identifier)
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    user = data

    // Verify password asynchronously to prevent event loop blocking
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      console.log('Login failed: Invalid password', identifier)
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate session token and verification code for two-step auth
    const sessionToken = uuidv4()
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString() // 6-digit code

    // Store session in database
    const { error: sessionError } = await supabaseAdmin
      .from('login_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        verification_code: verificationCode,
        expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Failed to create login session' },
        { status: 500 }
      )
    }

    // Send verification code via optimized Email service
    // Note: We await this to ensure the user knows if the email failed
    const emailResult = await sendEmailViaResend(user.email, verificationCode, user.username)

    if (!emailResult.success) {
      console.log('Failed to send email, falling back to console logging')
      // Fallback: log to console
      console.log(`🔐 Verification code for ${user.email}: ${verificationCode}`)

      return NextResponse.json({
        success: true,
        message: 'Please check your email for verification code (or check console if email fails)',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          branch: user.branch,
          club_name: user.club_name,
          is_email_verified: user.is_email_verified,
          is_active: user.is_active
        },
        sessionToken,
        requiresVerification: true,
        codeSent: false
      })
    }

    return NextResponse.json({
      success: true,
      message: 'verification code sent',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        branch: user.branch,
        club_name: user.club_name,
        is_email_verified: user.is_email_verified,
        is_active: user.is_active
      },
      sessionToken,
      requiresVerification: true,
      codeSent: true
    })
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    )
  }
}
