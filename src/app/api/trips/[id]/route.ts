import { prisma } from "@/lib/prisma";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";

/**
 * GET /api/trips/:id
 * Get trip details with vehicle and driver info.
 */
export const GET = withErrorHandler(
  async (req: Request, { params }: { params: Promise<Record<string, string>> }) => {
    const { id } = await params;

    const trip = await prisma.trip.findUniqueOrThrow({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });

    return jsonSuccess(trip);
  }
);
