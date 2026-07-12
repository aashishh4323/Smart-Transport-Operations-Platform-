import "server-only";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/jwt";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Data Access Layer for User Sessions
 *
 * Verifies session and returns auth state. Memoized per render pass.
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const payload = await decrypt(cookie);

  if (!payload?.sessionId) {
    return null;
  }

  try {
    const sessionDb = await prisma.session.findUnique({
      where: { id: payload.sessionId },
      include: { user: { select: { role: true, id: true } } },
    });

    if (!sessionDb || sessionDb.expiresAt < new Date()) {
      return null;
    }

    return { isAuth: true, userId: sessionDb.user.id, role: sessionDb.user.role };
  } catch (e) {
    return null;
  }
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
});
