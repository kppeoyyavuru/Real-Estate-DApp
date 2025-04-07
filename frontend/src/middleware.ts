import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that should not be protected
const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/api/(.*)' 
]);

export default clerkMiddleware({
  // Skip protection for public routes
  publicRoutes: (req) => isPublicRoute(req.url),
  afterAuth: (auth, req, evt) => {
    // Redirect to dashboard if trying to access login/signup while signed in
    if (auth.isSignedIn && (req.url.includes('/login') || req.url.includes('/signup'))) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/dashboard' },
      });
    }
  }
});

export const config = {
  matcher: [
    // Match all paths except specified static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ],
};