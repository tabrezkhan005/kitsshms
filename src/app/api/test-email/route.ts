import { NextResponse } from 'next/server'
import { sendGuaranteedEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'Email address is required'
      }, { status: 400 })
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    console.log(`Testing email sending to: ${email}`)
    console.log(`Test verification code: ${verificationCode}`)

    const result = await sendGuaranteedEmail(email, verificationCode, 'test-user')

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        email: email,
        verificationCode: verificationCode,
        note: 'Check your email inbox and spam folder'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        verificationCode: verificationCode,
        note: 'Code logged to console as fallback'
      })
    }
  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
