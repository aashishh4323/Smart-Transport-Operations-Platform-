import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { LoginFormSchema } from "@/lib/definitions";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";

export const POST = withErrorHandler(async (req: Request) => {
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

  return jsonSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});
