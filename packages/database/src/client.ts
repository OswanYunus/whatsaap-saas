import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __waasPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__waasPrisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__waasPrisma = prisma;
}

export type { PrismaClient };