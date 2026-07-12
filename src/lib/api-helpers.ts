import { NextResponse } from "next/server";

/**
 * Standard JSON success response.
 */
export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Standard JSON error response.
 */
export function jsonError(message: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

/**
 * Wraps an async route handler with try/catch
 * and returns standardized error responses.
 */
export function withErrorHandler<T = any>(
  handler: (
    req: Request,
    context: T
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    req: Request,
    context: T
  ) => {
    try {
      return await handler(req, context);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Internal server error";

      // Prisma not-found errors (P2025 is standard for findUniqueOrThrow)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return jsonError("Resource not found", 404);
      }

      // Prisma unique constraint errors
      if (
        error instanceof Error &&
        "code" in error &&
        (error as Record<string, unknown>).code === "P2002"
      ) {
        return jsonError("A record with this value already exists", 409);
      }

      console.error("[API Error]", error);
      return jsonError(message, 500);
    }
  };
}
