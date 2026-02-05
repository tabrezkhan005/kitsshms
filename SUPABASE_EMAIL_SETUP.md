# Supabase Email Setup Guide

## Overview
This guide will help you set up real email functionality using Supabase's built-in email templates for the KITS Seminar Hall Management System.

## Current Status
✅ **Application is working** - verification codes are logged to console
✅ **JSON parsing error is fixed**
✅ **Supabase integration is complete**
🔄 **Email templates need to be configured**

## Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `avfmvtuwsiwwluozrjrd`
3. Navigate to **Authentication** → **Email Templates**

## Step 2: Configure Email Templates

### Option A: Use Built-in Templates (Recommended)

1. **Confirm Signup Template**
   - Go to **Authentication** → **Email Templates** → **Confirm signup**
   - Customize the template to include verification codes
   - Add your KITS branding and styling

2. **Reset Password Template**
   - Go to **Authentication** → **Email Templates** → **Reset password**
   - Customize for password reset functionality

### Option B: Create Custom Email Templates

1. **Create a new template for verification codes**
2. **Use Supabase Edge Functions** for more control
3. **Configure SMTP settings** if needed

## Step 3: Template Customization

### Sample Email Template (Confirm Signup)

```html
<h2>KITS Seminar Hall Management System</h2>
<h3>Two-Step Verification</h3>

<p>Hello {{ .User.UserMetadata.username }},</p>

<p>You have requested to log in to your KITS SHMS account. Please use the verification code below to complete your login:</p>

<div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
  <h3 style="color: #667eea; margin: 0; font-size: 24px; letter-spacing: 5px;">{{ .User.UserMetadata.verification_code }}</h3>
</div>

<p>This code will expire in 10 minutes for security reasons.</p>

<p>If you didn't request this login, please ignore this email or contact the system administrator.</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

<p style="color: #999; font-size: 12px; text-align: center;">
  This is an automated message from KITS Seminar Hall Management System.<br>
  Please do not reply to this email.
</p>
```

## Step 4: Enable Email Sending

### Method 1: Use Supabase Auth (Current Implementation)

The application is already configured to use Supabase Auth email templates. To enable real email sending:

1. **Update the email function** in `src/lib/email.ts`
2. **Switch from `sendVerificationEmailSimple` to `sendVerificationEmail`**
3. **Configure email templates** in Supabase dashboard

### Method 2: Use Edge Functions (Advanced)

1. **Create an Edge Function** for email sending
2. **Deploy the function** to Supabase
3. **Update the application** to use the Edge Function

## Step 5: Testing

### Current Testing Method
1. **Login with demo credentials:**
   - Admin: `admin` / `password123`
   - Faculty: `faculty` / `password123`
   - Club: `club` / `password123`

2. **Check console for verification codes:**
   - Browser console (F12 → Console)
   - Terminal where `npm run dev` is running

### After Email Setup
1. **Verification codes will be sent via email**
2. **Check your email inbox** for verification codes
3. **Enter the code** in the verification form

## Step 6: Advanced Configuration

### Custom SMTP (Optional)
If you want to use your own SMTP server:

1. **Go to Supabase Dashboard** → **Settings** → **API**
2. **Configure SMTP settings**
3. **Update email templates** to use custom SMTP

### Email Rate Limiting
1. **Configure rate limits** in Supabase dashboard
2. **Set up email quotas** if needed
3. **Monitor email usage** in the dashboard

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Supabase dashboard for email logs
   - Verify email template configuration
   - Check SMTP settings if using custom SMTP

2. **Verification codes not working**
   - Check console logs for verification codes
   - Verify session token is valid
   - Check database for session records

3. **Template variables not working**
   - Use correct Supabase template syntax
   - Test templates in Supabase dashboard
   - Check user metadata structure

### Debug Steps

1. **Check Supabase logs:**
   ```bash
   # In your terminal
   npm run dev
   # Look for email-related logs
   ```

2. **Test API endpoints:**
   ```bash
   curl -X POST http://localhost:3002/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin","password":"password123"}'
   ```

3. **Check database:**
   - Verify users table has correct data
   - Check login_sessions table for active sessions

## Next Steps

1. **Configure email templates** in Supabase dashboard
2. **Test email sending** with real email addresses
3. **Customize email templates** with KITS branding
4. **Set up email monitoring** and logging
5. **Configure email rate limits** if needed

## Support

If you need help with Supabase email setup:
- [Supabase Email Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Current Status:** ✅ Ready for email template configuration
**Next Action:** Configure email templates in Supabase dashboard
