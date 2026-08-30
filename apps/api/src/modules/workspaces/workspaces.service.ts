import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";

export class WorkspacesService {
  async listForUser(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId
      },
      include: {
        workspace: true
      }
    });

    return memberships.map((m) => m.workspace);
  }

  async assertOwnership(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: "OWNER"
      },
      include: {
        workspace: true
      }
    });

    if (!membership) {
      throw new AppError(
        "Workspace not found",
        404,
        "WORKSPACE_NOT_FOUND"
      );
    }

    return membership.workspace;
  }

  /**
   * Looser check than assertOwnership: confirms the user belongs to
   * the workspace at all (any role), for read/write access to
   * workspace-scoped resources (contacts, campaigns, etc.) that
   * shouldn't be restricted to the OWNER role alone.
   */
  async assertMembership(workspaceId: string, userId: string) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId
      },
      include: {
        workspace: true
      }
    });

    if (!membership) {
      throw new AppError(
        "Workspace not found",
        404,
        "WORKSPACE_NOT_FOUND"
      );
    }

    return membership;
  }

  async checkBilling(workspaceId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Admins have absolute free access and bypass all checks
    if (user?.isAdmin) {
      return {
        success: true,
        plan: "ADMIN",
        maxInstances: 9999,
        allowImages: true,
        expired: false,
        subscriptionExpiresAt: null
      };
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }

    const now = new Date();
    const expired = workspace.plan !== "FREE" && workspace.subscriptionExpiresAt
      ? now > workspace.subscriptionExpiresAt
      : true; // Free plan (or null expiration) counts as expired/inactive for premium features

    if (workspace.plan === "FREE" || expired) {
      return {
        success: false,
        plan: workspace.plan,
        maxInstances: 0,
        allowImages: false,
        expired: true,
        subscriptionExpiresAt: workspace.subscriptionExpiresAt
      };
    }

    const limits = {
      FREE: { maxInstances: 0, allowImages: false },
      BASIC: { maxInstances: 1, allowImages: false },
      PREMIUM: { maxInstances: 5, allowImages: false },
      PRO: { maxInstances: 10, allowImages: true }
    }[workspace.plan] || { maxInstances: 0, allowImages: false };

    return {
      success: true,
      plan: workspace.plan,
      maxInstances: limits.maxInstances,
      allowImages: limits.allowImages,
      expired: false,
      subscriptionExpiresAt: workspace.subscriptionExpiresAt
    };
  }

  async checkBillingByWorkspace(workspaceId: string) {
    const ownerMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, role: "OWNER" },
      include: { user: true }
    });

    if (ownerMember?.user?.isAdmin) {
      return {
        success: true,
        plan: "ADMIN",
        maxInstances: 9999,
        allowImages: true,
        expired: false,
        subscriptionExpiresAt: null
      };
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }

    const now = new Date();
    const expired = workspace.plan !== "FREE" && workspace.subscriptionExpiresAt
      ? now > workspace.subscriptionExpiresAt
      : true;

    if (workspace.plan === "FREE" || expired) {
      return {
        success: false,
        plan: workspace.plan,
        maxInstances: 0,
        allowImages: false,
        expired: true,
        subscriptionExpiresAt: workspace.subscriptionExpiresAt
      };
    }

    const limits = {
      FREE: { maxInstances: 0, allowImages: false },
      BASIC: { maxInstances: 1, allowImages: false },
      PREMIUM: { maxInstances: 5, allowImages: false },
      PRO: { maxInstances: 10, allowImages: true }
    }[workspace.plan] || { maxInstances: 0, allowImages: false };

    return {
      success: true,
      plan: workspace.plan,
      maxInstances: limits.maxInstances,
      allowImages: limits.allowImages,
      expired: false,
      subscriptionExpiresAt: workspace.subscriptionExpiresAt
    };
  }

  async assertBilling(workspaceId: string, userId: string, action: "create-instance" | "send-image") {
    const billing = await this.checkBilling(workspaceId, userId);
    
    if (billing.plan === "ADMIN") return billing;

    if (billing.expired || billing.plan === "FREE") {
      throw new AppError(
        "Active subscription required. Please upgrade your package.",
        402,
        "PAYMENT_REQUIRED"
      );
    }

    if (action === "create-instance") {
      const activeCount = await prisma.instance.count({
        where: { workspaceId }
      });
      if (activeCount >= billing.maxInstances) {
        throw new AppError(
          `Your ${billing.plan} plan limit reached (${billing.maxInstances} connected devices). Please upgrade your package to connect more devices.`,
          400,
          "LIMIT_EXCEEDED"
        );
      }
    }

    if (action === "send-image" && !billing.allowImages) {
      throw new AppError(
        `Image messages are only supported on the Pro plan. Please upgrade your package.`,
        400,
        "LIMIT_EXCEEDED"
      );
    }

    return billing;
  }
}

export const workspacesService = new WorkspacesService();