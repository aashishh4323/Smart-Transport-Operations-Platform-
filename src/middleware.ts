import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/jwt";

// Protect all /api routes except auth routes
const protectedApiRegex = /^\/api\/(?!auth\/(signup|login)).*/;

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedApiRoute = protectedApiRegex.test(path);

  // Optimistic check: Read and decrypt the session from the cookie
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  // CSRF Protection for mutating endpoints
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    // Only verify origin if it is present. In production, we'd strictly enforce it or allow certain CORS origins.
    if (origin) {
      const host = req.headers.get("host") || "";
      const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
      const expectedOrigin = isLocalhost ? `http://${host}` : `https://${host}`;

      if (origin !== expectedOrigin) {
        return NextResponse.json(
          { success: false, error: "CSRF verification failed" },
          { status: 403 }
        );
      }
    }
  }

  // API protection
  if (isProtectedApiRoute && !session?.sessionId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access: Please log in." },
      { status: 401 }
    );
  }

  const response = NextResponse.next();
  // Add some security headers manually just in case
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

// Routes Proxy should run on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
