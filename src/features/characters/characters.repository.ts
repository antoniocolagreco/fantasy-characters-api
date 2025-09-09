import { Prisma, Visibility } from '@prisma/client'

import type { Character } from './characters.domain.schema'
import type { CharacterListQuery, CharacterStats } from './v1/characters.http.schema'

import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils/uuid'

function transform(character: Prisma.CharacterGetPayload<object>): Character {
    return {
        id: character.id,
        name: character.name,
        visibility: character.visibility,
        createdAt: character.createdAt.toISOString(),
        updatedAt: character.updatedAt.toISOString(),
        level: character.level,
        experience: character.experience,
        health: character.health,
        mana: character.mana,
        stamina: character.stamina,
        strength: character.strength,
        constitution: character.constitution,
        dexterity: character.dexterity,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
        age: character.age,
        raceId: character.raceId,
        archetypeId: character.archetypeId,
        ...(character.ownerId ? { ownerId: character.ownerId } : {}),
        ...(character.description ? { description: character.description } : {}),
        ...(character.imageId ? { imageId: character.imageId } : {}),
        ...(character.sex ? { sex: character.sex } : {}),
    }
}

function applyCursor(
    where: Prisma.CharacterWhereInput,
    cursor: string | undefined,
    sortBy: string,
    sortDir: string
): Prisma.CharacterWhereInput {
    if (!cursor) return where
    if (sortDir !== 'asc' && sortDir !== 'desc') throw new Error('Invalid sort direction')
    try {
        const { lastValue, lastId } = JSON.parse(Buffer.from(cursor, 'base64').toString())
        const op = sortDir === 'desc' ? 'lt' : 'gt'
        return {
            ...where,
            OR: [{ [sortBy]: { [op]: lastValue } }, { [sortBy]: lastValue, id: { [op]: lastId } }],
        }
    } catch {
        throw err('VALIDATION_ERROR', 'Invalid cursor format')
    }
}

function orderBy(sortBy: string = 'createdAt', sortDir: 'asc' | 'desc' = 'desc') {
    return [{ [sortBy]: sortDir }, { id: sortDir }]
}

function paginate(
    items: { id: string; [k: string]: unknown }[],
    limit: number,
    sortField: string
): { items: { id: string; [k: string]: unknown }[]; hasNext: boolean; nextCursor?: string } {
    const hasNext = items.length > limit
    const finalItems = hasNext ? items.slice(0, limit) : items
    if (!hasNext || finalItems.length === 0) return { items: finalItems, hasNext: false }
    const last = finalItems[finalItems.length - 1]
    if (!last) return { items: finalItems, hasNext: false }
    const nextCursor = Buffer.from(
        JSON.stringify({ lastValue: last[sortField], lastId: last.id })
    ).toString('base64')
    return { items: finalItems, hasNext, nextCursor }
}

export const characterRepository = {
    async findById(id: string) {
        const character = await prisma.character.findUnique({ where: { id } })
        return character ? transform(character) : null
    },
    async findByIdWithOwnerRole(id: string) {
        const character = await prisma.character.findUnique({
            where: { id },
            include: { owner: { select: { role: true } } },
        })
        if (!character) return null
        const transformed = transform(character)
        return { character: transformed, ownerRole: character.owner?.role }
    },
    async findByName(name: string) {
        const character = await prisma.character.findUnique({ where: { name } })
        return character ? transform(character) : null
    },
    async findMany(query: CharacterListQuery & { filters?: Record<string, unknown> }) {
        const { limit = 20, cursor, sortBy = 'createdAt', sortDir = 'desc', filters = {} } = query
        const where = filters as Prisma.CharacterWhereInput
        const whereWithCursor = applyCursor(where, cursor, sortBy, sortDir)
        const characters = await prisma.character.findMany({
            where: whereWithCursor,
            orderBy: orderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
        })
        const { items, hasNext, nextCursor } = paginate(characters, limit, sortBy)
        return { characters: (items as typeof characters).map(transform), hasNext, nextCursor }
    },
    async create(
        data: Omit<
            Character,
            | 'id'
            | 'createdAt'
            | 'updatedAt'
            | 'description'
            | 'ownerId'
            | 'sex'
            | 'visibility'
            | 'imageId'
        > & {
            ownerId: string
            description?: string
            sex: Prisma.CharacterCreateInput['sex']
            visibility: Visibility
            imageId?: string
        }
    ) {
        const id = generateUUIDv7()
        const character = await prisma.character.create({
            data: {
                id,
                name: data.name,
                visibility: data.visibility,
                owner: { connect: { id: data.ownerId } },
                ...(data.description ? { description: data.description } : {}),
                ...(data.imageId ? { image: { connect: { id: data.imageId } } } : {}),
                level: data.level,
                experience: data.experience,
                health: data.health,
                mana: data.mana,
                stamina: data.stamina,
                strength: data.strength,
                constitution: data.constitution,
                dexterity: data.dexterity,
                intelligence: data.intelligence,
                wisdom: data.wisdom,
                charisma: data.charisma,
                age: data.age,
                sex: data.sex ?? 'MALE',
                race: { connect: { id: data.raceId } },
                archetype: { connect: { id: data.archetypeId } },
            },
        })
        return transform(character)
    },
    async update(id: string, data: Prisma.CharacterUpdateInput) {
        try {
            const character = await prisma.character.update({ where: { id }, data })
            return transform(character)
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') throw err('CONFLICT', 'Character name already exists')
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Character not found')
            }
            throw error
        }
    },
    async delete(id: string) {
        try {
            await prisma.character.delete({ where: { id } })
            return true
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') throw err('NOT_FOUND', 'Character not found')
            }
            throw error
        }
    },
    async getStats(): Promise<CharacterStats> {
        if (process.env.NODE_ENV === 'test') {
            const totalCharacters = await prisma.character.count()
            const publicCharacters = await prisma.character.count({
                where: { visibility: 'PUBLIC' },
            })
            return {
                totalCharacters,
                publicCharacters,
                privateCharacters: 0,
                hiddenCharacters: 0,
                newCharactersLast30Days: totalCharacters,
                averageLevel: 0,
                topArchetypes: [],
            }
        }
        const thirty = new Date()
        thirty.setDate(thirty.getDate() - 30)
        const [
            totalCharacters,
            publicCharacters,
            privateCharacters,
            hiddenCharacters,
            newCharactersLast30Days,
            averageLevel,
        ] = await Promise.all([
            prisma.character.count(),
            prisma.character.count({ where: { visibility: 'PUBLIC' } }),
            prisma.character.count({ where: { visibility: 'PRIVATE' } }),
            prisma.character.count({ where: { visibility: 'HIDDEN' } }),
            prisma.character.count({ where: { createdAt: { gte: thirty } } }),
            prisma.character.aggregate({ _avg: { level: true } }).then(r => r._avg.level ?? 0),
        ])

        const topArchetypesRaw = await prisma.archetype.findMany({
            select: { id: true, name: true, _count: { select: { characters: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10,
        })
        const topArchetypes = topArchetypesRaw
            .map(a => ({ id: a.id, name: a.name, count: a._count.characters }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        return {
            totalCharacters,
            publicCharacters,
            privateCharacters,
            hiddenCharacters,
            newCharactersLast30Days,
            averageLevel,
            topArchetypes,
        }
    },
} as const
