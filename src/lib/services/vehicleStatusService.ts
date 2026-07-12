import { prisma } from "@/lib/prisma";
import { VehicleStatus } from "@prisma/client";

/**
 * Shared Vehicle Status Service
 *
 * Single source of truth for all vehicle status transitions.
 * Both Trip dispatch and Maintenance operations MUST use this
 * service to avoid race conditions on the Vehicle status field.
 */

// Valid state transitions map
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

function assertTransition(
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

/**
 * Set vehicle status to OnTrip.
 * Only allowed from Available.
 */
export async function setVehicleOnTrip(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    select: { status: true },
  });

  assertTransition(vehicle.status, VehicleStatus.OnTrip);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: VehicleStatus.OnTrip },
  });
}

/**
 * Set vehicle status to InShop (maintenance).
 * Only allowed from Available.
 */
export async function setVehicleInShop(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    select: { status: true },
  });

  assertTransition(vehicle.status, VehicleStatus.InShop);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: VehicleStatus.InShop },
  });
}

/**
 * Set vehicle status back to Available.
 * Allowed from OnTrip or InShop (NOT from Retired).
 */
export async function setVehicleAvailable(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    select: { status: true },
  });

  assertTransition(vehicle.status, VehicleStatus.Available);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: VehicleStatus.Available },
  });
}

/**
 * Set vehicle status to Retired (soft delete).
 * Allowed from Available or InShop. NOT allowed from OnTrip.
 */
export async function setVehicleRetired(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    select: { status: true },
  });

  assertTransition(vehicle.status, VehicleStatus.Retired);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: VehicleStatus.Retired },
  });
}

/**
 * Get vehicle with current status (for validation).
 */
export async function getVehicleStatus(vehicleId: string) {
  return prisma.vehicle.findUniqueOrThrow({
    where: { id: vehicleId },
    select: { id: true, status: true, registrationNumber: true },
  });
}
