
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { prisma } from "@waas/database";
import { AppError } from "../../plugins/error-handler";
import { workspacesService } from "../workspaces/workspaces.service";
import type { CreateApiKeyInput } from "./api-keys.schema";

const SALT_ROUNDS = 12;
const KEY_PREFIX = "wak";

export class ApiKeysService {
  async list(workspaceId: string, userId: string) {
    await workspacesService.assertMembership(workspaceId, userId);

    return prisma.workspaceApiKey.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      // keyHash is intentionally never selected — it should never
      // leave the database once created.
      select: { id: true, label: true, keyPrefix: true, createdAt: true, lastUsedAt: true }
    });
  }

  /**
   * Creates a new key and returns the raw value exactly once. Only
   * the bcrypt hash + a short display prefix are persisted; the raw
   * key cannot be recovered after this call returns.
   */
  async create(input: CreateApiKeyInput, userId: string) {
    await workspacesService.assertMembership(input.workspaceId, userId);

    const rawKey = `${KEY_PREFIX}_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = await bcrypt.hash(rawKey, SALT_ROUNDS);
    const keyPrefix = rawKey.slice(0, 12);

    const record = await prisma.workspaceApiKey.create({
      data: {
        workspaceId: input.workspaceId,
        label: input.label,
        keyHash,
        keyPrefix
      }
    });

    return {
      id: record.id,
      label: record.label,
      keyPrefix: record.keyPrefix,
      createdAt: record.createdAt,
      // Only present in this one response.
      rawKey
    };
  }

  async revoke(keyId: string, userId: string) {
    const key = await prisma.workspaceApiKey.findUnique({ where: { id: keyId } });
    if (!key) {
      throw new AppError("API key not found", 404, "API_KEY_NOT_FOUND");
    }
    await workspacesService.assertMembership(key.workspaceId, userId);

    await prisma.workspaceApiKey.delete({ where: { id: keyId } });
    return { id: keyId, revoked: true };
  }
}

export const apiKeysService = new ApiKeysService();