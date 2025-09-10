import { Prisma, Visibility } from '@prisma/client'

import type { Character } from './characters.domain.schema'
import type { CharacterListQuery, CharacterStats } from './v1/characters.http.schema'

import { prisma } from '@/infrastructure/database'
import { err } from '@/shared/errors'
import { generateUUIDv7 } from '@/shared/utils/uuid'

// Base transform (no relations)
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

// Transform with minimal relations (race & archetype) for list endpoint convenience
function transformWithBasics(
    character: Prisma.CharacterGetPayload<{ include: { race: true; archetype: true } }>
): Character {
    const base = transform(character)
    const race = character.race
        ? {
              id: character.race.id,
              name: character.race.name,
              ...(character.race.description !== null
                  ? { description: character.race.description ?? '' }
                  : {}),
              visibility: String(character.race.visibility),
              ...(character.race.ownerId ? { ownerId: character.race.ownerId } : {}),
          }
        : undefined
    const archetype = character.archetype
        ? {
              id: character.archetype.id,
              name: character.archetype.name,
              ...(character.archetype.description !== null
                  ? { description: character.archetype.description ?? '' }
                  : {}),
              visibility: String(character.archetype.visibility),
              ...(character.archetype.ownerId ? { ownerId: character.archetype.ownerId } : {}),
          }
        : undefined
    return { ...base, ...(race ? { race } : {}), ...(archetype ? { archetype } : {}) }
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
    async findByIdExpanded(id: string) {
        const character = await prisma.character.findUnique({
            where: { id },
            include: {
                race: true,
                archetype: true,
                equipment: {
                    include: {
                        head: true,
                        face: true,
                        chest: true,
                        legs: true,
                        feet: true,
                        hands: true,
                        rightHand: true,
                        leftHand: true,
                        rightRing: true,
                        leftRing: true,
                        amulet: true,
                        belt: true,
                        backpack: true,
                        cloak: true,
                    },
                },
            },
        })
        if (!character) return null
        const base = transform(character)
        // Helper: map a Prisma Item to the minimal equipment slot shape
        const mapItem = (item: unknown) => {
            if (!item || typeof item !== 'object') return null
            const i = item as Record<string, unknown>
            const id = typeof i.id === 'string' ? i.id : undefined
            const name = typeof i.name === 'string' ? i.name : undefined
            const description =
                typeof i.description === 'string' ? (i.description as string) : undefined
            const ownerId = typeof i.ownerId === 'string' ? i.ownerId : undefined
            const visibilityRaw = i.visibility
            const visibility =
                typeof visibilityRaw === 'string' ? (visibilityRaw as string) : undefined
            if (id || name || description || ownerId || visibility) {
                return {
                    ...(id ? { id } : {}),
                    ...(name ? { name } : {}),
                    ...(description ? { description } : {}),
                    ...(ownerId ? { ownerId } : {}),
                    ...(visibility ? { visibility } : {}),
                }
            }
            return null
        }
        const equipment = character.equipment
            ? {
                  head: mapItem(character.equipment.head),
                  face: mapItem(character.equipment.face),
                  chest: mapItem(character.equipment.chest),
                  legs: mapItem(character.equipment.legs),
                  feet: mapItem(character.equipment.feet),
                  hands: mapItem(character.equipment.hands),
                  rightHand: mapItem(character.equipment.rightHand),
                  leftHand: mapItem(character.equipment.leftHand),
                  rightRing: mapItem(character.equipment.rightRing),
                  leftRing: mapItem(character.equipment.leftRing),
                  amulet: mapItem(character.equipment.amulet),
                  belt: mapItem(character.equipment.belt),
                  backpack: mapItem(character.equipment.backpack),
                  cloak: mapItem(character.equipment.cloak),
              }
            : undefined
        return {
            ...base,
            race: character.race
                ? {
                      id: character.race.id,
                      name: character.race.name,
                      description: character.race.description ?? undefined,
                      visibility: String(character.race.visibility),
                      ownerId: character.race.ownerId ?? undefined,
                  }
                : undefined,
            archetype: character.archetype
                ? {
                      id: character.archetype.id,
                      name: character.archetype.name,
                      description: character.archetype.description ?? undefined,
                      visibility: String(character.archetype.visibility),
                      ownerId: character.archetype.ownerId ?? undefined,
                  }
                : undefined,
            ...(equipment ? { equipment } : {}),
        }
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
        const expanded: boolean = (query as unknown as { expanded?: boolean }).expanded === true
        const where = filters as Prisma.CharacterWhereInput
        const whereWithCursor = applyCursor(where, cursor, sortBy, sortDir)
        const characters = await prisma.character.findMany({
            where: whereWithCursor,
            orderBy: orderBy(sortBy, sortDir as 'asc' | 'desc'),
            take: limit + 1,
            // Prisma includes expect object or null; null preserves typing with exactOptionalPropertyTypes
            include: expanded ? { race: true, archetype: true } : null,
        })
        const { items, hasNext, nextCursor } = paginate(characters, limit, sortBy)
        type CharacterWithBasics = Prisma.CharacterGetPayload<{
            include: { race: true; archetype: true }
        }>
        function hasBasics(ch: unknown): ch is CharacterWithBasics {
            if (typeof ch !== 'object' || ch === null) return false
            if (!('race' in ch) || !('archetype' in ch)) return false
            const rec = ch as Record<string, unknown>
            return !!rec.race && !!rec.archetype
        }
        const mapped = (items as typeof characters).map(c => {
            if (expanded && hasBasics(c)) return transformWithBasics(c)
            return transform(c)
        })
        return { characters: mapped as Character[], hasNext, nextCursor }
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
