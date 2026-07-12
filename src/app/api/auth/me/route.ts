import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { getUser } from "@/lib/dal";

export const GET = withErrorHandler(async () => {
  const user = await getUser();

  if (!user) {
    return jsonError("Unauthorized", 401);
  }

  return jsonSuccess(user);
});
