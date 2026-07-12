import { VehicleStatus } from "@prisma/client";

/**
 * Shared Vehicle Status Service
 *
 * Single source of truth for all vehicle status transitions.
 */

const VALID_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  [VehicleStatus.Available]: [
    VehicleStatus.OnTrip,
    VehicleStatus.InShop,
    VehicleStatus.Retired,
  ],
  [VehicleStatus.OnTrip]: [VehicleStatus.Available],
  [VehicleStatus.InShop]: [VehicleStatus.Available, VehicleStatus.Retired],
  [VehicleStatus.Retired]: [], // terminal state
};

export function assertVehicleTransition(
  current: VehicleStatus,
  target: VehicleStatus
): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(target)) {
    throw new Error(
      `Invalid vehicle status transition: ${current} → ${target}. ` +
        `Allowed transitions from ${current}: [${allowed.join(", ")}]`
    );
  }
}
