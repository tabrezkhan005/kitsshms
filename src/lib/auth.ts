// Types for authentication
export interface User {
  id: string
  email: string
  username: string
  role: 'admin' | 'faculty' | 'clubs'
  branch?: string
  club_name?: string
  is_email_verified: boolean
  is_active: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  user?: User
  sessionToken?: string
  requiresVerification?: boolean
  codeSent?: boolean
  verificationCode?: string
  emailError?: string
  fallback?: boolean
}

export interface VerificationResponse {
  success: boolean
  message: string
  user?: User
}

export interface ResendCodeResponse {
  success: boolean
  message: string
  codeSent?: boolean
  verificationCode?: string
  emailError?: string
  fallback?: boolean
}

export interface LogoutResponse {
  success: boolean
  message: string
}

/**
 * Helper function to handle fetch responses and ensure JSON parsing
 */
async function handleApiResponse(response: Response) {
  // Check if response is ok (status 200-299)
  if (!response.ok) {
    // Try to parse error response as JSON
    try {
      const errorData = await response.json()
      return errorData
    } catch {
      // If not JSON, return generic error
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`
      }
    }
  }

  // Try to parse successful response as JSON
  try {
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to parse JSON response:', error)
    return {
      success: false,
      message: 'Invalid response format from server'
    }
  }
}

/**
 * Authenticate user with username/email and password
 */
export async function authenticateUser(identifier: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password }),
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      message: 'Network error: Unable to connect to server'
    }
  }
}

/**
 * Verify two-step authentication code
 */
export async function verifyLoginCode(sessionToken: string, verificationCode: string): Promise<VerificationResponse> {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken, verificationCode }),
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Verification error:', error)
    return {
      success: false,
      message: 'Network error: Unable to connect to server'
    }
  }
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(sessionToken: string): Promise<ResendCodeResponse> {
  try {
    const response = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken }),
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Resend code error:', error)
    return {
      success: false,
      message: 'Network error: Unable to connect to server'
    }
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<LogoutResponse> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return await handleApiResponse(response)
  } catch (error) {
    console.error('Logout error:', error)
    return {
      success: false,
      message: 'Network error: Unable to connect to server'
    }
  }
}

/**
 * Generate verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
