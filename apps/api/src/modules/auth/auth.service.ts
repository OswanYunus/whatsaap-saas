import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import type { RegisterInput, LoginInput } from "./auth.schema";

const SALT_ROUNDS = 10;

/**
 * Business logic for authentication. Kept independent of Fastify so it
 * can be unit tested without spinning up an HTTP server, and reused
 * later from other entry points (e.g. a CLI or admin script).
 */
export class AuthService {
  async register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existing) {
    throw new AppError(
      "An account with this email already exists",
      409,
      "EMAIL_TAKEN"
    );
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash
    }
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: input.workspaceName
    }
  });

  await prisma.workspaceMember.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER"
    }
  });

  return user;
}

  async validateCredentials(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    return user;
  }
}

export const authService = new AuthService();