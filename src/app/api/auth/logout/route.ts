import { deleteSession } from "@/lib/session";
import { jsonSuccess, withErrorHandler } from "@/lib/api-helpers";

export const POST = withErrorHandler(async () => {
  await deleteSession();
  return jsonSuccess({ message: "Logged out successfully" });
});
