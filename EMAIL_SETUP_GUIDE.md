# Email Setup Guide - KITS SHMS

## Current Issue
Emails are being sent from Supabase but not being delivered to your inbox. This guide will help you set up reliable email delivery.

## Solution Options

### Option 1: Resend (Recommended - Most Reliable)

**Step 1: Sign up for Resend**
1. Go to [https://resend.com](https://resend.com)
2. Create a free account
3. Get your API key from the dashboard

**Step 2: Configure Resend**
1. Update your `.env` file:
   ```env
   RESEND_API_KEY=your_actual_resend_api_key_here
   ```

**Step 3: Test**
- Restart your development server
- Try logging in - emails will be sent via Resend

### Option 2: Custom SMTP in Supabase

**Step 1: Configure Gmail SMTP**
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Auth** → **SMTP**
3. Click "Set up custom SMTP server"
4. Use these settings:
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** `your-gmail@gmail.com`
   - **Password:** `your-app-password` (not regular password)
   - **From Email:** `your-gmail@gmail.com`
   - **From Name:** `KITS SHMS`

**Step 2: Generate Gmail App Password**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Enable **2-Step Verification** if not already enabled
3. Go to **Security** → **App passwords**
4. Generate a new app password for "Mail"
5. Use this app password in the SMTP configuration

### Option 3: Fix Supabase Email Delivery

**Step 1: Check Email Templates**
1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify the "Confirm signup" template is configured correctly
3. Make sure the template includes the verification code variable

**Step 2: Add Supabase to Safe Senders**
Add these to your email contacts:
- `noreply@supabase.co`
- `noreply@avfmvtuwsiwwluozrjrd.supabase.co`

**Step 3: Check All Email Locations**
For each email address, check:
- **Primary Inbox**
- **Spam/Junk folder**
- **Promotions tab** (Gmail)
- **All Mail/Archive**
- **Trash**

## Current User Email Addresses

- **Admin:** `tabrezkhangnt@gmail.com`
- **Faculty:** `tabrezkhanloyola@gmail.com`
- **Club:** `saberakhan94896@gmail.com`

## Testing

### Test with Resend (Recommended)
1. Get Resend API key
2. Update `.env` file
3. Restart server
4. Try logging in with any user

### Test with Custom SMTP
1. Configure SMTP in Supabase dashboard
2. Try logging in with any user

### Test Current Setup
1. Check terminal logs for verification codes
2. Check all email folders
3. Search for "supabase" or "noreply"

## Latest Verification Codes

From the terminal logs:
- **Admin:** `797445`
- **Faculty:** `866108`
- **Club:** `625276`

## Troubleshooting

### If emails still don't arrive:
1. **Check email provider settings**
2. **Add sender addresses to contacts**
3. **Check spam filter settings**
4. **Try a different email address**

### If Resend doesn't work:
1. **Verify API key is correct**
2. **Check Resend dashboard for delivery status**
3. **Check Resend logs for errors**

### If SMTP doesn't work:
1. **Verify Gmail app password**
2. **Check SMTP settings in Supabase**
3. **Test SMTP connection**

## Next Steps

1. **Choose an email solution** (Resend recommended)
2. **Configure the chosen solution**
3. **Test email delivery**
4. **Update application if needed**

## Support

- **Resend:** [https://resend.com/docs](https://resend.com/docs)
- **Supabase SMTP:** [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- **Gmail App Passwords:** [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
