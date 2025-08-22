import { Type } from '@sinclair/typebox'

/**
 * Cache headers documentation for OpenAPI responses
 * Used to document automatic HTTP caching headers in API responses
 */
export const cacheResponseHeaders = {
  'cache-control': {
    type: 'string',
    description: 'Cache control directives indicating how responses should be cached',
    example: 'public, max-age=300',
  },
  etag: {
    type: 'string',
    description: 'Entity tag for cache validation and conditional requests',
    example: '"abc123def456"',
  },
  'last-modified': {
    type: 'string',
    description: 'Date when the resource was last modified',
    example: 'Wed, 21 Oct 2015 07:28:00 GMT',
  },
  age: {
    type: 'integer',
    description: 'Age of cached response in seconds',
    example: 120,
  },
  'x-cache': {
    type: 'string',
    description: 'Cache status indicating if response was served from cache',
    enum: ['HIT', 'MISS'],
    example: 'HIT',
  },
  expires: {
    type: 'string',
    description: 'Date when the cached response expires',
    example: 'Wed, 21 Oct 2015 07:33:00 GMT',
  },
}

/**
 * Request headers for conditional caching requests
 */
export const cacheRequestHeaders = Type.Object({
  'if-none-match': Type.Optional(
    Type.String({
      description: 'ETag value for conditional GET requests',
      example: '"abc123def456"',
    }),
  ),
  'if-modified-since': Type.Optional(
    Type.String({
      description: 'Date for conditional GET requests',
      example: 'Wed, 21 Oct 2015 07:28:00 GMT',
    }),
  ),
})

/**
 * 304 Not Modified response schema
 */
export const notModifiedResponse = Type.Null({
  description: 'Not Modified - Resource has not been modified since last request',
})
