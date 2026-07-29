import { env } from "@waas/config";

/**
 * JWT configuration shared by the @fastify/jwt plugin registration
 * and anywhere else tokens need to be signed/verified (e.g. queue
 * workers validating a token passed through a job payload).
 */
export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
};

export interface AccessTokenPayload {
  sub: string; // user id
  email: string;
}