import type { FastifyRequest, FastifyReply } from 'fastify'
import {
  createRace,
  findRaceById,
  updateRace,
  deleteRace,
  listRaces,
  getRaceStats,
} from './race.service'
import type {
  CreateRaceData,
  UpdateRaceData,
  ListRacesQuery,
  RaceResponse,
  RaceStatsData,
} from './race.types'

// Create a new race
export const createRaceHandler = async (
  request: FastifyRequest<{ Body: CreateRaceData }>,
  reply: FastifyReply,
): Promise<RaceResponse> => {
  const race = await createRace(request.body, request.authUser)
  reply.status(201)
  return race
}

// Get race by ID
export const getRaceHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  _reply: FastifyReply,
): Promise<RaceResponse> => {
  return await findRaceById(request.params.id, request.authUser)
}

// Update race by ID
export const updateRaceHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateRaceData }>,
  _reply: FastifyReply,
): Promise<RaceResponse> => {
  return await updateRace(request.params.id, request.body, request.authUser)
}

// Delete race by ID
export const deleteRaceHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<void> => {
  await deleteRace(request.params.id, request.authUser)
  reply.status(204)
}

// List races with pagination and filtering
export const listRacesHandler = async (
  request: FastifyRequest<{ Querystring: ListRacesQuery }>,
  _reply: FastifyReply,
): Promise<{
  races: RaceResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}> => {
  return await listRaces(request.query, request.authUser)
}

// Get global race statistics
export const getRaceStatsHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<RaceStatsData> => {
  return await getRaceStats(request.authUser)
}
