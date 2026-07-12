import { verifySession } from "./dal";
import { jsonError } from "./api-helpers";
import { Role as PrismaRole } from "@prisma/client";

// Define role aliases for clarity based on requirements
export type Role = "FleetManager" | "Dispatcher" | "SafetyOfficer" | "FinancialAnalyst";

/**
 * Maps PrismaRole enum to the internal Role type used here.
 */
function mapPrismaRoleToRole(prismaRole: PrismaRole): Role {
  return prismaRole as unknown as Role;
}

/**
 * Wraps an API route handler to ensure the user is authenticated.
 * Injects session context into the handler parameters.
 */
export function withAuth(
  handler: (req: Request, ctx: { params?: Promise<Record<string, string>>; session: { userId: string; role: string } }) => Promise<Response> | Response
) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => {
    const session = await verifySession();

    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    return handler(req, { ...ctx, session });
  };
}

/**
 * Wraps an API route handler to ensure the user is authenticated AND
 * has one of the allowed roles.
 */
export function withRole(
  allowedRoles: Role[],
  handler: (req: Request, ctx: { params?: Promise<Record<string, string>>; session: { userId: string; role: string } }) => Promise<Response> | Response
) {
  return async (req: Request, ctx?: { params?: Promise<Record<string, string>> }) => {
    const session = await verifySession();

    if (!session) {
      return jsonError("Unauthorized", 401);
    }

    if (!allowedRoles.includes(session.role as Role)) {
      return jsonError("Forbidden: Insufficient role permissions", 403);
    }

    return handler(req, { ...ctx, session });
  };
}
