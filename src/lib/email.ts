import nodemailer from 'nodemailer'

// Singleton transporter instance
let transporterInstance: nodemailer.Transporter | null = null

// Create or retrieve a transporter using SMTP settings
const getTransporter = () => {
  if (transporterInstance) {
    return transporterInstance
  }

  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const secure = process.env.SMTP_SECURE === 'true' // true for 465, false for other ports

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP configuration missing. Email sending will be disabled.')
    return null
  }

  console.log('✅ Initializing SMTP transporter...')

  transporterInstance = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    // Performance optimizations
    pool: true, // Use pooled connections
    maxConnections: 5, // Limit concurrent connections
    maxMessages: 100, // Limit messages per connection
  })

  return transporterInstance
}

// Get the sender email from environment or use default
const getSenderEmail = () => {
  return process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@kits.ac.in'
}

const getSenderName = () => {
  return process.env.SMTP_FROM_NAME || 'KITS SHMS'
}

// Common style for all emails - Clean, Professional, Light Theme
const emailLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KITS SHMS Notification</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; color: #000000; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Minimal Header -->
    <div style="margin-bottom: 40px; border-bottom: 2px solid #000000; padding-bottom: 20px;">
      <h1 style="font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px; text-transform: uppercase;">KITS SHMS</h1>
    </div>

    <!-- Content -->
    <div style="font-size: 16px; line-height: 1.6;">
      ${content}
    </div>

    <!-- Minimal Footer -->
    <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eaeaea; font-size: 12px; color: #666666;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} KITS Seminar Hall Management System</p>
      <p style="margin: 5px 0 0;">Automated Notification. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
`

/**
 * Send verification code via Nodemailer SMTP
 */
export async function sendEmailViaNodemailer(email: string, verificationCode: string, username: string) {
  try {
    const transporter = getTransporter()

    if (!transporter) {
      console.log(`🔐 [Dev Mode] Code for ${email}: ${verificationCode}`)
      return {
        success: true,
        messageId: 'console-fallback',
        fallback: true,
        error: 'SMTP not configured - using console fallback'
      }
    }

    const fromEmail = getSenderEmail()
    const fromName = getSenderName()

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Login Verification</h2>

      <p style="margin-bottom: 24px;">Hello <strong>${username}</strong>,</p>

      <p style="margin-bottom: 24px;">Please use the following verification code to complete your login request:</p>

      <div style="background-color: #f4f4f4; border: 1px solid #e0e0e0; padding: 20px; text-align: center; margin-bottom: 24px; border-radius: 4px;">
        <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 4px; color: #000000;">${verificationCode}</span>
      </div>

      <p style="margin-bottom: 0;">This code will expire in 10 minutes.</p>
      <p style="margin-top: 10px; font-size: 14px; color: #666;">If you did not attempt to login, please ignore this email.</p>
    `

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject: `Verification Code: ${verificationCode}`,
      html: emailLayout(content)
    })

    console.log(`✅ Email sent to ${email} (ID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send email:', error)
    console.log(`🔐 [Fallback] Code for ${email}: ${verificationCode}`)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Aliases for compatibility
 */
export const sendVerificationEmail = sendEmailViaNodemailer
export const sendGuaranteedEmail = sendEmailViaNodemailer
export const sendEmailViaResend = sendEmailViaNodemailer

/**
 * Send booking notification email
 */
export async function sendBookingNotificationEmail(emailData: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailLayout(emailData.html) // Wrap raw HTML in layout if possible, or assume caller provides content
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send usage email:', error)
    return { success: false, error: 'Failed to send' }
  }
}

/**
 * Send booking confirmation email to requester
 */
export async function sendBookingConfirmationEmail(bookingData: {
  event_name: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  hall_names: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  reason_for_booking: string;
}) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Booking Request Received</h2>

      <p style="margin-bottom: 24px;">Dear ${bookingData.requester_name},</p>

      <p style="margin-bottom: 24px;">Your request for <strong>${bookingData.event_name}</strong> has been successfully submitted and is under review.</p>

      <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 140px; color: #666;">Halls:</td>
            <td style="padding: 8px 0;">${bookingData.hall_names}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Date:</td>
            <td style="padding: 8px 0;">${bookingData.start_date} ${bookingData.start_date !== bookingData.end_date ? `to ${bookingData.end_date}` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Time:</td>
            <td style="padding: 8px 0;">${bookingData.start_time} - ${bookingData.end_time}</td>
          </tr>
        </table>
      </div>

      <p>You will receive another email once your request has been approved or rejected.</p>
    `

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: bookingData.requester_email,
      subject: `Request Received: ${bookingData.event_name}`,
      html: emailLayout(content)
    })

    console.log(`✅ Confirmation email sent to requester (ID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    return { success: false, error: 'Failed' }
  }
}

/**
 * Send admin notification for new booking request
 */
export async function sendAdminBookingNotification(bookingData: {
  event_name: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  hall_names: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  reason_for_booking: string;
  expected_attendees?: string;
  club_name?: string;
}) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    // Use the configured admin email or fallback to the SMTP user for testing
    // In a production environment, this should be the actual admin's email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@kits.ac.in'

    console.log(`📧 Sending admin notification to: ${adminEmail}`)

    // Format requester details
    let requesterDetails = `${bookingData.requester_name} (${bookingData.requester_role})`;
    if (bookingData.requester_role === 'clubs' && bookingData.club_name) {
      requesterDetails = `${bookingData.club_name} (Club)`;
    }

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">New Booking Request</h2>

      <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 140px; color: #666;">Event:</td>
            <td style="padding: 8px 0;">${bookingData.event_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Requester:</td>
            <td style="padding: 8px 0;">${requesterDetails}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Halls:</td>
            <td style="padding: 8px 0;">${bookingData.hall_names}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Date:</td>
            <td style="padding: 8px 0;">${bookingData.start_date} ${bookingData.start_date !== bookingData.end_date ? `to ${bookingData.end_date}` : ''}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Time:</td>
            <td style="padding: 8px 0;">${bookingData.start_time} - ${bookingData.end_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Reason:</td>
            <td style="padding: 8px 0;">${bookingData.reason_for_booking}</td>
          </tr>
          ${bookingData.expected_attendees ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #666;">Attendees:</td>
            <td style="padding: 8px 0;">${bookingData.expected_attendees}</td>
          </tr>` : ''}
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">Review Request</a>
      </div>
    `

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: adminEmail,
      subject: `New Request: ${bookingData.event_name}`,
      html: emailLayout(content)
    })

    console.log(`✅ Admin notification sent (ID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send admin email:', error)
    return { success: false, error: 'Failed' }
  }
}

/**
 * Send booking approval email
 */
export async function sendBookingApprovalEmail(approvalData: {
  to: string;
  username: string;
  eventName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  halls: string;
  role: string;
  clubName?: string;
}) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    // Use club name if available
    const recipientName = approvalData.clubName || approvalData.username;

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Booking Approved</h2>

      <p style="margin-bottom: 24px;">Dear ${recipientName},</p>

      <p style="margin-bottom: 24px;">Your booking request for <strong>${approvalData.eventName}</strong> has been approved.</p>

      <div style="border: 1px solid #e0e0e0; padding: 20px; border-radius: 4px; margin-bottom: 24px; background-color: #fafafa;">
        <h3 style="font-size: 16px; margin: 0 0 15px 0;">Booking Details</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 5px 0;"><strong>Halls:</strong> ${approvalData.halls}</li>
          <li style="padding: 5px 0;"><strong>Date:</strong> ${approvalData.startDate}</li>
          <li style="padding: 5px 0;"><strong>Time:</strong> ${approvalData.startTime} - ${approvalData.endTime}</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/${approvalData.role === 'faculty' ? 'faculty' : 'club'}/dashboard" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">View Dashboard</a>
      </div>
    `

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: approvalData.to,
      subject: `Approved: ${approvalData.eventName}`,
      html: emailLayout(content)
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send approval email:', error)
    return { success: false, error: 'Failed' }
  }
}

/**
 * Send booking rejection email
 */
export async function sendBookingRejectionEmail(rejectionData: {
  to: string;
  username: string;
  eventName: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  halls: string;
  rejectionReason: string;
  role: string;
  clubName?: string;
}) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    // Use club name if available
    const recipientName = rejectionData.clubName || rejectionData.username;

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Booking Update</h2>

      <p style="margin-bottom: 24px;">Dear ${recipientName},</p>

      <p style="margin-bottom: 24px;">We regret to inform you that your booking request for <strong>${rejectionData.eventName}</strong> could not be approved.</p>

      <div style="border-left: 4px solid #000000; padding: 15px; margin-bottom: 24px; background-color: #f4f4f4;">
        <strong style="display: block; margin-bottom: 5px; font-size: 12px; text-transform: uppercase;">Reason</strong>
        ${rejectionData.rejectionReason}
      </div>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/${rejectionData.role === 'faculty' ? 'faculty' : 'club'}/book" style="display: inline-block; border: 2px solid #000000; color: #000000; padding: 10px 22px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">New Request</a>
      </div>
    `

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: rejectionData.to,
      subject: `Update: ${rejectionData.eventName}`,
      html: emailLayout(content)
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send rejection email:', error)
    return { success: false, error: 'Failed' }
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, username: string) {
  try {
    const transporter = getTransporter()
    if (!transporter) return { success: false, error: 'SMTP not configured' }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`

    const content = `
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 24px;">Reset Password</h2>

      <p style="margin-bottom: 24px;">Hello ${username},</p>

      <p style="margin-bottom: 24px;">You have requested to reset your password. Click the button below to proceed:</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">Reset Password</a>
      </div>

      <p style="margin-bottom: 0; font-size: 14px; color: #666;">Link expires in 1 hour.</p>
    `

    const info = await transporter.sendMail({
      from: `"${getSenderName()}" <${getSenderEmail()}>`,
      to: email,
      subject: 'Password Reset Request',
      html: emailLayout(content)
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
