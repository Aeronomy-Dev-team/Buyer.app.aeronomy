import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/health(.*)', // Health check endpoints
  '/api/lots/external(.*)', // External API for Producer Dashboard
  '/api/lots(.*)', // Public lots API (GET only, POST requires auth)
  '/api/bids(.*)', // Bids API (POST from external, GET requires auth, accept-counter)
  '/api/contracts/external(.*)', // External contract fetch for Producer
  '/verify-otp(.*)', // Allow OTP verification page
])

export default clerkMiddleware((auth, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip everything under /_next/ (static, HMR, RSC) and common static files — auth here breaks CSS/JS loads
    '/((?!_next/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|mov|avi|mp3|wav|ogg)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
