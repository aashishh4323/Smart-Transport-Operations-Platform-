import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./jwt";

export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  
  // Create DB Session
  const sessionDb = await prisma.session.create({
    data: {
      userId,
      role,
      expiresAt,
    },
  });

  const sessionToken = await encrypt({ sessionId: sessionDb.id, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "strict",
    path: "/",
  });
}

export async function updateSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;

  const payload = await decrypt(sessionToken);
  if (!payload?.sessionId) {
    return null;
  }

  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  
  // Update DB session expiry
  try {
    await prisma.session.update({
      where: { id: payload.sessionId },
      data: { expiresAt: expires },
    });
  } catch (e) {
    return null;
  }

  // Re-encrypt to update internal JWT expiration
  const newSessionToken = await encrypt({ sessionId: payload.sessionId, expiresAt: expires });

  cookieStore.set("session", newSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expires,
    sameSite: "strict",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (sessionToken) {
    const payload = await decrypt(sessionToken);
    if (payload?.sessionId) {
      try {
        await prisma.session.delete({ where: { id: payload.sessionId } });
      } catch (e) {
        // Ignore if already deleted
      }
    }
  }
  cookieStore.delete("session");
}
