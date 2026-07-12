import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

// Protect all /api routes except auth routes
const protectedApiRegex = /^\/api\/(?!auth\/(signup|login)).*/;

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedApiRoute = protectedApiRegex.test(path);

  // Optimistic check: Read and decrypt the session from the cookie
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  // API protection
  if (isProtectedApiRoute && !session?.userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized access: Please log in." },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

// Routes Proxy should run on
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
