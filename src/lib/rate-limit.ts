import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Checks rate limit for a specific IP and endpoint.
 * Returns true if allowed, false if rate-limited.
 */
export async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  const now = new Date();

  // Find existing rate limit record
  let record = await prisma.rateLimit.findUnique({
    where: {
      ip_endpoint: {
        ip,
        endpoint,
      },
    },
  });

  if (record) {
    // If currently locked out
    if (record.lockUntil && record.lockUntil > now) {
      return false; // Rate limited
    }

    // If lock has expired or wasn't locked but it's an old window (e.g. updated > 15 mins ago)
    // we can reset attempts. Let's reset attempts if the last attempt was more than LOCKOUT_MINUTES ago
    const timeSinceLastAttempt = now.getTime() - record.updatedAt.getTime();
    if (timeSinceLastAttempt > LOCKOUT_MINUTES * 60 * 1000) {
      record = await prisma.rateLimit.update({
        where: { id: record.id },
        data: { attempts: 1, lockUntil: null },
      });
      return true;
    }

    // Otherwise, increment attempts
    const newAttempts = record.attempts + 1;
    let newLockUntil = null;

    if (newAttempts >= MAX_ATTEMPTS) {
      newLockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
    }

    await prisma.rateLimit.update({
      where: { id: record.id },
      data: {
        attempts: newAttempts,
        lockUntil: newLockUntil,
      },
    });

    return newAttempts <= MAX_ATTEMPTS;
  } else {
    // Create new record
    await prisma.rateLimit.create({
      data: {
        ip,
        endpoint,
        attempts: 1,
      },
    });
    return true;
  }
}

/**
 * Resets rate limit for a successful action
 */
export async function resetRateLimit(ip: string, endpoint: string) {
  try {
    await prisma.rateLimit.delete({
      where: {
        ip_endpoint: {
          ip,
          endpoint,
        },
      },
    });
  } catch (e) {
    // Ignore if not found
  }
}
