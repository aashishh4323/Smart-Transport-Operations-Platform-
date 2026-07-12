import { DriverStatus } from "@prisma/client";

/**
 * Shared Driver Status Service
 *
 * Single source of truth for all driver status transitions.
 */

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

export function assertDriverTransition(
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
