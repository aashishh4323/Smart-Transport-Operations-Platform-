import { prisma } from "@/lib/prisma";
import { jsonSuccess, jsonError, withErrorHandler } from "@/lib/api-helpers";
import { SignupFormSchema } from "@/lib/definitions";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/session";
import { Role } from "@prisma/client";

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();

  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse(body);
  if (!validatedFields.success) {
    return jsonError("Validation failed", 400, validatedFields.error.flatten().fieldErrors);
  }

  const { name, email, password } = validatedFields.data;
  
  // Hardcode Driver role for all open signups.
  // Real apps might use invitations, but for a demo we default to least privilege.
  const role = Role.Driver;

  // 2. Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return jsonError("A user with this email already exists.", 409);
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Insert user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      role: role,
    },
  });

  // 5. Create user session
  await createSession(user.id, user.role);

  return jsonSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }, 201);
});
