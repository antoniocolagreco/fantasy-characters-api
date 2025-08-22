import type { AuthUser } from '../rbac.service'
import type { JwtPayload } from '../../auth/jwt.utils'

// Extend FastifyRequest to include authentication information
declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyRequest {
    authUser?: AuthUser
    authJwt?: JwtPayload
  }
}

// Export empty object to make this a module
export {}
