import "server-only";

import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
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
  const session = await decrypt(cookie);

  if (!session?.userId) {
    return null;
  }

  return { isAuth: true, userId: session.userId, role: session.role };
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
