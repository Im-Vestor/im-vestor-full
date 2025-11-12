import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)', // Add any other protected routes here
]);

// Routes that should not be accessible if the user is authenticated
const isAuthOnlyRoute = createRouteMatcher([
  '/login',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Redirect authenticated users away from login and sign-up pages
  if (userId && isAuthOnlyRoute(req)) {
    const redirectUrl = new URL("/home", req.url);
    return Response.redirect(redirectUrl);
  }

  if (isProtectedRoute(req)) {
    const isAdmin = sessionClaims?.publicMetadata?.userIsAdmin;

    if (!userId || !isAdmin) {
      const redirectUrl = new URL("/404", req.url);
      return Response.redirect(redirectUrl);
    }
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};