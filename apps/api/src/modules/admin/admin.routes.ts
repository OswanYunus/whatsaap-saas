import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { adminController } from "./admin.controller";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

async function superUserGuard(request: FastifyRequest, _reply: FastifyReply) {
  const userId = request.authUser!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || (!user.isAdmin && user.email.toLowerCase() !== "oswanbarackyunus@gmail.com")) {
    throw new AppError("Access denied. Admin rights required.", 403, "FORBIDDEN");
  }
}

export default async function adminRoutes(fastify: FastifyInstance) {
  fastify.get("/admin/users", {
    preHandler: [fastify.authenticate, superUserGuard],
    handler: adminController.listUsers
  });

  fastify.post("/admin/users/:id/elevate", {
    preHandler: [fastify.authenticate, superUserGuard],
    handler: adminController.toggleElevate
  });

  fastify.post("/admin/users/:id/block", {
    preHandler: [fastify.authenticate, superUserGuard],
    handler: adminController.toggleBlock
  });
}
