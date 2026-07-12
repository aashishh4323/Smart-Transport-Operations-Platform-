import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler, getClientIp } from "@/lib/api-helpers";
import { LoginFormSchema } from "@/lib/definitions";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export const POST = withErrorHandler(async (req: Request) => {
  const ip = getClientIp(req);
  if (!(await checkRateLimit(ip, "login"))) {
    return jsonError("Too many login attempts. Please try again later.", 429);
  }

  const body = await req.json();

  // 1. Validate form fields
  const validatedFields = LoginFormSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const { email, password } = validatedFields.data;

  // 2. Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return jsonError("Invalid email or password", 401);
  }

  // 3. Verify password
  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordsMatch) {
    return jsonError("Invalid email or password", 401);
  }

  // 4. Create user session
  await createSession(user.id, user.role);

  await resetRateLimit(ip, "login");

  return jsonSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});
