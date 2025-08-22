/**
 * Character controller - HTTP request/response handling
 * Handles character-related endpoints with proper validation and error handling
 */

import type { FastifyReply, FastifyRequest } from 'fastify'
import { errorHandler } from '../shared/errors'
import { HTTP_STATUS } from '../shared/constants'
import type {
  CreateCharacterData,
  UpdateCharacterData,
  CharacterFilters,
  ListCharactersQuery,
  CharacterResponse,
} from './character.types'
import {
  createCharacter,
  findCharacterById,
  listCharacters,
  updateCharacter,
  deleteCharacter,
  getCharacterStats,
} from './character.service'
import type { AuthUser } from '../shared/rbac.service'

type CharacterParams = { id: string }

/**
 * Convert null to undefined for consistency with service layer
 */
const normalizeUser = (user?: AuthUser | null): AuthUser | undefined => user ?? undefined

/**
 * Create a new character
 * POST /api/characters
 */
export const createCharacterHandler = async (
  request: FastifyRequest<{ Body: CreateCharacterData }>,
  reply: FastifyReply,
) => {
  try {
    const currentUser = request.authUser
    // Ensure user is authenticated (guaranteed by authenticateUser middleware)
    if (!currentUser) {
      throw new Error('User authentication required')
    }

    // Request body is already validated by Fastify schema validation
    const characterData = request.body

    const character = await createCharacter(characterData, currentUser)

    reply.status(HTTP_STATUS.CREATED)
    return character
  } catch (error) {
    return errorHandler(error as Error, request, reply)
  }
}

/**
 * Get character by ID
 * GET /api/characters/:id
 */
export const getCharacterByIdHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Querystring: { includeRelations?: string } }>,
  reply: FastifyReply,
) => {
  try {
    const currentUser = request.authUser || null
    const { id } = request.params
    const includeRelations = request.query.includeRelations === 'true'

    const character = await findCharacterById(id, normalizeUser(currentUser), includeRelations)

    if (!character) {
      return reply.status(HTTP_STATUS.NOT_FOUND).send({
        error: 'Not Found',
        message: 'Character not found',
        statusCode: 404,
      })
    }

    return character
  } catch (error) {
    return errorHandler(error as Error, request, reply)
  }
}
export const listCharactersHandler = async (
  request: FastifyRequest<{ Querystring: ListCharactersQuery }>,
  _reply: FastifyReply,
): Promise<{
  characters: CharacterResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  // Convert string query parameters to proper types for service layer
  const query = request.query

  // Transform string parameters to numbers for service layer
  const serviceFilters: Partial<CharacterFilters> = {
    // Convert pagination strings to numbers
    ...(query.page && { page: parseInt(query.page, 10) }),
    ...(query.limit && { limit: parseInt(query.limit, 10) }),

    // Pass UUID strings directly
    ...(query.raceId && { raceId: query.raceId }),
    ...(query.archetypeId && { archetypeId: query.archetypeId }),
    ...(query.ownerId && { ownerId: query.ownerId }),
    ...(query.skillId && { skillId: query.skillId }),
    ...(query.perkId && { perkId: query.perkId }),
    ...(query.tagId && { tagId: query.tagId }),

    // Convert level and age filters
    ...(query.minLevel && { minLevel: parseInt(query.minLevel, 10) }),
    ...(query.maxLevel && { maxLevel: parseInt(query.maxLevel, 10) }),
    ...(query.minAge && { minAge: parseInt(query.minAge, 10) }),
    ...(query.maxAge && { maxAge: parseInt(query.maxAge, 10) }),
    ...(query.minExperience && { minExperience: parseInt(query.minExperience, 10) }),
    ...(query.maxExperience && { maxExperience: parseInt(query.maxExperience, 10) }),

    // Convert primary attribute filters
    ...(query.minStrength && { minStrength: parseInt(query.minStrength, 10) }),
    ...(query.maxStrength && { maxStrength: parseInt(query.maxStrength, 10) }),
    ...(query.minConstitution && { minConstitution: parseInt(query.minConstitution, 10) }),
    ...(query.maxConstitution && { maxConstitution: parseInt(query.maxConstitution, 10) }),
    ...(query.minDexterity && { minDexterity: parseInt(query.minDexterity, 10) }),
    ...(query.maxDexterity && { maxDexterity: parseInt(query.maxDexterity, 10) }),
    ...(query.minIntelligence && { minIntelligence: parseInt(query.minIntelligence, 10) }),
    ...(query.maxIntelligence && { maxIntelligence: parseInt(query.maxIntelligence, 10) }),
    ...(query.minWisdom && { minWisdom: parseInt(query.minWisdom, 10) }),
    ...(query.maxWisdom && { maxWisdom: parseInt(query.maxWisdom, 10) }),
    ...(query.minCharisma && { minCharisma: parseInt(query.minCharisma, 10) }),
    ...(query.maxCharisma && { maxCharisma: parseInt(query.maxCharisma, 10) }),

    // Convert core attribute filters
    ...(query.minHealth && { minHealth: parseInt(query.minHealth, 10) }),
    ...(query.maxHealth && { maxHealth: parseInt(query.maxHealth, 10) }),
    ...(query.minMana && { minMana: parseInt(query.minMana, 10) }),
    ...(query.maxMana && { maxMana: parseInt(query.maxMana, 10) }),
    ...(query.minStamina && { minStamina: parseInt(query.minStamina, 10) }),
    ...(query.maxStamina && { maxStamina: parseInt(query.maxStamina, 10) }),

    // Pass enums directly - TypeScript knows these are correct from schema validation
    ...(query.sex && { sex: query.sex as 'MALE' | 'FEMALE' }),
    ...(query.visibility && { visibility: query.visibility as 'PUBLIC' | 'PRIVATE' | 'HIDDEN' }),

    // Convert boolean-like strings
    ...(query.includeOrphaned && { includeOrphaned: query.includeOrphaned === 'true' }),
    ...(query.includeRelations && { includeRelations: query.includeRelations === 'true' }),

    // Pass search string directly
    ...(query.search && { search: query.search }),

    // Add sorting options
    ...(query.sortBy && { sortBy: query.sortBy }),
    ...(query.sortOrder && { sortOrder: query.sortOrder as 'asc' | 'desc' }),
  }

  const currentUser = request.authUser || null
  return await listCharacters(serviceFilters, normalizeUser(currentUser))
}

/**
 * Update character
 * PUT /api/characters/:id
 */
export const updateCharacterHandler = async (
  request: FastifyRequest<{
    Params: CharacterParams
    Body: UpdateCharacterData
  }>,
  reply: FastifyReply,
) => {
  try {
    // Request params and body are already validated by Fastify schema validation
    const params = request.params
    const updateData = request.body
    const currentUser = request.authUser || null

    const character = await updateCharacter(params.id, updateData, normalizeUser(currentUser))

    return character
  } catch (error) {
    return errorHandler(error as Error, request, reply)
  }
}

/**
 * Delete character
 * DELETE /api/characters/:id
 */
export const deleteCharacterHandler = async (
  request: FastifyRequest<{ Params: CharacterParams }>,
  reply: FastifyReply,
) => {
  try {
    // Request params are already validated by Fastify schema validation
    const params = request.params
    const currentUser = request.authUser || null

    await deleteCharacter(params.id, normalizeUser(currentUser))

    return reply.status(HTTP_STATUS.NO_CONTENT).send()
  } catch (error) {
    return errorHandler(error as Error, request, reply)
  }
}

/**
 * Get character statistics
 * GET /api/characters/stats
 */
export const getCharacterStatsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = request.authUser || null
    const stats = await getCharacterStats(normalizeUser(currentUser))

    return reply.status(HTTP_STATUS.OK).send({
      success: true,
      data: stats,
    })
  } catch (error) {
    return errorHandler(error as Error, request, reply)
  }
}
