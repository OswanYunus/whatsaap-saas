import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import type { CreateApiKeyInput } from "./api-keys.schema";

const SALT_ROUNDS = 12;
const KEY_PREFIX = "wak";

export class ApiKeysService {
  async list(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true
      }
    });

    return keys.map((key) => ({
      ...key,
      maskedKey: `****************${key.keyPrefix.slice(-4)}`
    }));
  }

  async create(input: CreateApiKeyInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    const rawKey = `${KEY_PREFIX}_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const keyPrefix = rawKey.slice(0, 12);

    const record = await prisma.apiKey.create({
      data: {
        workspaceId: input.workspaceId,
        name: input.name,
        keyHash,
        keyPrefix,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
      }
    });

    return {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      maskedKey: `****************${record.keyPrefix.slice(-4)}`,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      revokedAt: record.revokedAt,
      rawKey
    };
  }

  async revoke(keyId: string, userId: string) {
    const key = await prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!key) {
      throw new AppError("API key not found", 404, "API_KEY_NOT_FOUND");
    }
    await workspacesService.assertMembership(key.workspaceId, userId);

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() }
    });

    return { id: keyId, revoked: true };
  }
}

export const apiKeysService = new ApiKeysService();
