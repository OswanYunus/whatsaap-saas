import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

/**
 * User-facing (non-auth) profile logic. Kept separate from AuthService,
 * which owns credential handling — this module owns everything else
 * about a user record (profile lookups, future profile updates, etc.).
 */
export class UsersService {
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
  workspaces: {
    include: {
      workspace: true
    }
  }
}
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return user;
  }
}

export const usersService = new UsersService();