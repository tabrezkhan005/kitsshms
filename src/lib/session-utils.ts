// Session utilities for KITS Seminar Hall Management System
import { User } from './auth'

// Types for session management
export interface SessionData {
  user: User
  isAuthenticated: boolean
  sessionToken?: string
  lastActivity: number
}

// Session configuration
const SESSION_CONFIG = {
  USER_KEY: 'kits_user',
  SESSION_TOKEN_KEY: 'kits_session_token',
  LAST_ACTIVITY_KEY: 'kits_last_activity',
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  ACTIVITY_TIMEOUT: 30 * 60 * 1000 // 30 minutes
}

/**
 * Create a new user session
 */
export function createSession(user: User, sessionToken?: string): void {
  try {
    localStorage.setItem(SESSION_CONFIG.USER_KEY, JSON.stringify(user))
    if (sessionToken) {
      localStorage.setItem(SESSION_CONFIG.SESSION_TOKEN_KEY, sessionToken)
    }
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, Date.now().toString())
    console.log('Session created for user:', user.username)
  } catch (error) {
    console.error('Failed to create session:', error)
    throw new Error('Failed to create session')
  }
}

/**
 * Get current session data
 */
export function getSession(): SessionData | null {
  try {
    const userData = localStorage.getItem(SESSION_CONFIG.USER_KEY)
    const sessionToken = localStorage.getItem(SESSION_CONFIG.SESSION_TOKEN_KEY)
    const lastActivity = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY)

    if (!userData || !lastActivity) return null

    const user: User = JSON.parse(userData)
    const lastActivityTime = parseInt(lastActivity)

    if (isSessionExpired(lastActivityTime)) {
      clearSession()
      return null
    }

    return {
      user,
      isAuthenticated: true,
      sessionToken: sessionToken || undefined,
      lastActivity: lastActivityTime
    }
  } catch (error) {
    console.error('Failed to get session:', error)
    clearSession()
    return null
  }
}

/**
 * Clear all session data
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_CONFIG.USER_KEY)
    localStorage.removeItem(SESSION_CONFIG.SESSION_TOKEN_KEY)
    localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY)
    console.log('Session cleared successfully')
  } catch (error) {
    console.error('Failed to clear session:', error)
  }
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const session = getSession()
  return session !== null && session.isAuthenticated
}

/**
 * Get current user data
 */
export function getUser(): User | null {
  const session = getSession()
  return session?.user || null
}

/**
 * Check if user is authenticated
 */
export function isUserAuthenticated(): boolean {
  const user = getUser()
  return user !== null && user.is_active
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const user = getUser()
  return user !== null && user.role === role
}

/**
 * Get dashboard URL based on user role
 */
export function getDashboardUrl(): string {
  const user = getUser()
  if (!user) return '/login'

  switch (user.role) {
    case 'admin': return '/admin/dashboard'
    case 'faculty': return '/faculty/dashboard'
    case 'clubs': return '/club/dashboard'
    default: return '/login'
  }
}

/**
 * Check if session is expired
 */
export function isSessionExpired(lastActivity: number): boolean {
  const now = Date.now()
  const sessionAge = now - lastActivity
  return sessionAge > SESSION_CONFIG.SESSION_TIMEOUT
}

/**
 * Get session token
 */
export function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_CONFIG.SESSION_TOKEN_KEY)
}

/**
 * Update last activity
 */
export function updateLastActivity(): void {
  try {
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, Date.now().toString())
  } catch (error) {
    console.error('Failed to update last activity:', error)
  }
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(route: string): boolean {
  const user = getUser()
  if (!user) return false

  const routeAccess = {
    '/admin': ['admin'],
    '/faculty': ['faculty'],
    '/club': ['clubs']
  }

  for (const [protectedRoute, allowedRoles] of Object.entries(routeAccess)) {
    if (route.startsWith(protectedRoute)) {
      return allowedRoles.includes(user.role)
    }
  }

  return true
}

/**
 * Get user's display name
 */
export function getUserDisplayName(): string {
  const user = getUser()
  if (!user) return 'Unknown User'

  switch (user.role) {
    case 'admin': return 'Administrator'
    case 'faculty': return `Faculty - ${user.branch || 'Unknown Branch'}`
    case 'clubs': return `Club - ${user.club_name || 'Unknown Club'}`
    default: return user.username
  }
}

/**
 * Validate session and redirect if necessary
 */
export function validateSessionAndRedirect(redirectTo: (url: string) => void): boolean {
  if (!isSessionValid()) {
    redirectTo('/login')
    return false
  }

  const user = getUser()
  if (!user || !user.is_active) {
    clearSession()
    redirectTo('/login')
    return false
  }

  return true
}
