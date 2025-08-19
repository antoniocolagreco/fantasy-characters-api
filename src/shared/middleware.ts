// Shared middleware functions
import type { FastifyRequest, FastifyReply } from 'fastify'

export type MiddlewareFunction = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

// Add middleware implementations here as they are developed
