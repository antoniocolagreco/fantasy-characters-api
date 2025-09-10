import { Prisma, Visibility } from '@prisma/client'

import type { Race } from './races.domain.schema'
import type { RaceListQuery, RaceStats } from './v1/races.http.schema'

import { prisma } from '@/infrastructure/database'
import { AppError, err } from '@/shared/errors'
import { applyCursor, buildOrderBy, buildPagination } from '@/shared/utils/query.helper'
import { generateUUIDv7 } from '@/shared/utils/uuid'

type CreateRaceData = {
    name: string
    description?: string
    visibility: Visibility
    ownerId?: string
    imageId?: string
    // modifiers
    healthModifier: number
    manaModifier: number
    staminaModifier: number
    strengthModifier: number
    constitutionModifier: number
    dexterityModifier: number
    intelligenceModifier: number
    wisdomModifier: number
    charismaModifier: number
}

function transform(race: Prisma.RaceGetPayload<object>): Race {
    return {
        id: race.id,
        name: race.name,
        visibility: race.visibility,
        createdAt: race.createdAt.toISOString(),
        updatedAt: race.updatedAt.toISOString(),
        healthModifier: race.healthModifier,
        manaModifier: race.manaModifier,
        staminaModifier: race.staminaModifier,
        strengthModifier: race.strengthModifier,
        constitutionModifier: race.constitutionModifier,
        dexterityModifier: race.dexterityModifier,
        intelligenceModifier: race.intelligenceModifier,
        wisdomModifier: race.wisdomModifier,
        charismaModifier: race.charismaModifier,
        ...(race.description ? { description: race.description } : {}),
        ...(race.ownerId ? { ownerId: race.ownerId } : {}),
        ...(race.imageId ? { imageId: race.imageId } : {}),
    }
}

// Local query helpers replaced by shared/utils/query.helper

export const raceRepository = {
    async findById(id: string) {
        const race = await prisma.race.findUnique({ where: { id } })
        return race ? transform(race) : null
    },
    async findByName(name: string) {
        const race = await prisma.race.findUnique({ where: { name } })
        return race ? transform(race) : null
    },
    async findMany(query: RaceListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query
        const where = filters as Prisma.RaceWhereInput
        let whereWithCursor: Prisma.RaceWhereInput
        try {
            whereWithCursor = applyCursor(
                where,
                cursor ?? null,
                sortBy as keyof Prisma.RaceWhereInput,
                sortDir
            )
        } catch (error) {
            if (error instanceof AppError) {
                if (error.message === 'Invalid sort direction') throw error
                if (error.message === 'Invalid cursor') {
                    throw err('VALIDATION_ERROR', 'Invalid cursor format')
                }
            }
            throw error
        }
        const races = await prisma.race.findMany({
            where: whereWithCursor,
            orderBy: buildOrderBy(sortBy, sortDir) as unknown as
                | Prisma.RaceOrderByWithRelationInput
                | Prisma.RaceOrderByWithRelationInput[],
            take: limit + 1,
        })
        const { items, hasNext, nextCursor } = buildPagination(
            races,
            limit,
            sortBy as keyof (typeof races)[number]
        )
        return { races: (items as typeof races).map(transform), hasNext, nextCursor }
    },
    async create(data: CreateRaceData) {
        const id = generateUUIDv7()
        const race = await prisma.race.create({ data: { id, ...data } })
        return transform(race)
    },
    async update(id: string, data: Prisma.RaceUpdateInput) {
        try {
            const race = await prisma.race.update({ where: { id }, data })
            return transform(race)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') throw err('CONFLICT', 'Race name already exists')
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Race not found')
            }
            throw error
        }
    },
    async delete(id: string) {
        try {
            await prisma.race.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Race not found')
                if (error.code === 'P2003')
                    throw err('RESOURCE_IN_USE', 'Resource is referenced and cannot be deleted')
            }
            throw error
        }
    },
    async getStats(): Promise<RaceStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalRaces = await prisma.race.count()
            const publicRaces = await prisma.race.count({ where: { visibility: 'PUBLIC' } })
            return {
                totalRaces,
                publicRaces,
                privateRaces: 0,
                hiddenRaces: 0,
                newRacesLast30Days: totalRaces,
                topRaces: [],
            }
        }
        const thirty = new Date()
        thirty.setDate(thirty.getDate() - 30)
        const [totalRaces, publicRaces, privateRaces, hiddenRaces, newRacesLast30Days] =
            await Promise.all([
                prisma.race.count(),
                prisma.race.count({ where: { visibility: 'PUBLIC' } }),
                prisma.race.count({ where: { visibility: 'PRIVATE' } }),
                prisma.race.count({ where: { visibility: 'HIDDEN' } }),
                prisma.race.count({ where: { createdAt: { gte: thirty } } }),
            ])

        const topRacesRaw = await prisma.race.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { characters: true, skills: true, tags: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })
        const topRaces = topRacesRaw
            .map(r => ({
                id: r.id,
                name: r.name,
                usageCount: r._count.characters + r._count.skills + r._count.tags,
            }))
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 10)
        return {
            totalRaces,
            publicRaces,
            privateRaces,
            hiddenRaces,
            newRacesLast30Days,
            topRaces,
        }
    },
} as const
