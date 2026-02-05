import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const protectedRoutes = {
  '/admin': ['admin'],
  '/faculty': ['faculty'],
  '/club': ['clubs']
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and API routes
  if (pathname === '/login' || pathname.startsWith('/api/') || pathname === '/') {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true'
  const userData = request.cookies.get('user')?.value

  // If not authenticated, redirect to login
  if (!isAuthenticated || !userData) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const user = JSON.parse(userData)
    const userRole = user.role

    // Check if user is trying to access a protected route
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        // If user's role is not allowed for this route, redirect to their dashboard
        if (!allowedRoles.includes(userRole)) {
          const redirectUrl = getDashboardUrl(userRole)
          return NextResponse.redirect(new URL(redirectUrl, request.url))
        }
        break
      }
    }

    return NextResponse.next()
  } catch {
    // If user data is invalid, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'faculty':
      return '/faculty/dashboard'
    case 'clubs':
      return '/club/dashboard'
    default:
      return '/login'
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     * - logo (logo files)
     * - Static file extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets|logo|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$|.*\\.avif$).*)',
  ],
}
