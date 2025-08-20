import type { UserProfileType } from '../auth/auth.schema'
import type { JwtPayload } from '../auth/jwt.utils'

// Extend FastifyRequest to include authentication information
declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    authUser?: UserProfileType
    authJwt?: JwtPayload
  }
}
