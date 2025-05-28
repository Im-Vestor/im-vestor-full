import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)', // Add any other protected routes here
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth(); // Destructure after awaiting
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