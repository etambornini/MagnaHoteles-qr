import { PrismaClient } from "../generated/prisma";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: env.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  global.prisma = prisma;
}
