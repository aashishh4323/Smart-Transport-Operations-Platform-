import { prisma } from "@/lib/prisma";
import { DriverStatus } from "@prisma/client";

/**
 * Shared Driver Status Service
 *
 * Single source of truth for all driver status transitions.
 * Trip dispatch operations MUST use this service.
 */

// Valid state transitions map
const VALID_TRANSITIONS: Record<DriverStatus, DriverStatus[]> = {
  [DriverStatus.Available]: [
    DriverStatus.OnTrip,
    DriverStatus.OffDuty,
    DriverStatus.Suspended,
  ],
  [DriverStatus.OnTrip]: [DriverStatus.Available],
  [DriverStatus.OffDuty]: [DriverStatus.Available, DriverStatus.Suspended],
  [DriverStatus.Suspended]: [DriverStatus.Available],
};

function assertTransition(
  current: DriverStatus,
  target: DriverStatus
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(target)) {
    throw new Error(
      `Invalid driver status transition: ${current} → ${target}. ` +
        `Allowed transitions from ${current}: [${allowed.join(", ")}]`
    );
  }
}

/**
 * Set driver status to OnTrip.
 * Only allowed from Available.
 */
export async function setDriverOnTrip(driverId: string) {
  const driver = await prisma.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { status: true },
  });

  assertTransition(driver.status, DriverStatus.OnTrip);

  return prisma.driver.update({
    where: { id: driverId },
    data: { status: DriverStatus.OnTrip },
  });
}

/**
 * Set driver status back to Available.
 * Allowed from OnTrip, OffDuty, or Suspended.
 */
export async function setDriverAvailable(driverId: string) {
  const driver = await prisma.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { status: true },
  });

  assertTransition(driver.status, DriverStatus.Available);

  return prisma.driver.update({
    where: { id: driverId },
    data: { status: DriverStatus.Available },
  });
}

/**
 * Set driver status to OffDuty.
 * Only allowed from Available.
 */
export async function setDriverOffDuty(driverId: string) {
  const driver = await prisma.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { status: true },
  });

  assertTransition(driver.status, DriverStatus.OffDuty);

  return prisma.driver.update({
    where: { id: driverId },
    data: { status: DriverStatus.OffDuty },
  });
}

/**
 * Set driver status to Suspended.
 * Allowed from Available or OffDuty.
 */
export async function setDriverSuspended(driverId: string) {
  const driver = await prisma.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { status: true },
  });

  assertTransition(driver.status, DriverStatus.Suspended);

  return prisma.driver.update({
    where: { id: driverId },
    data: { status: DriverStatus.Suspended },
  });
}

/**
 * Get driver with current status (for validation).
 */
export async function getDriverStatus(driverId: string) {
  return prisma.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { id: true, status: true, name: true },
  });
}
