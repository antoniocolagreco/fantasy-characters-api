import { Prisma, Visibility, Sex } from '@prisma/client'

import { characterRepository } from './characters.repository'
import type {
    Character,
    CharacterListQuery,
    CharacterStats,
    CreateCharacter,
    UpdateCharacter,
} from './v1/characters.http.schema'

import type { AuthenticatedUser } from '@/features/auth'
import { err } from '@/shared/errors'
import {
    applySecurityFilters,
    canModifyResource,
    canViewResource,
} from '@/shared/utils/rbac.helpers'

export const characterService = {
    async getById(id: string, user?: AuthenticatedUser): Promise<Character> {
        const character = await characterRepository.findById(id)
        if (!character) throw err('RESOURCE_NOT_FOUND', 'Character not found')
        if (!canViewResource(user, character))
            throw err('RESOURCE_NOT_FOUND', 'Character not found')
        return character
    },
    async getByName(name: string, user?: AuthenticatedUser): Promise<Character | null> {
        const character = await characterRepository.findByName(name)
        if (!character) return null
        if (!canViewResource(user, character)) return null
        return character
    },
    async list(query: CharacterListQuery, user?: AuthenticatedUser) {
        const businessFilters: Record<string, unknown> = {}
        if (query.visibility !== undefined) businessFilters.visibility = query.visibility
        if (query.search) {
            businessFilters.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ]
        }
        // Categorical dual-mode filters: if UUID treat as id, else substring on related name
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (query.race) {
            if (uuidRegex.test(query.race)) businessFilters.raceId = query.race
            else
                businessFilters.race = {
                    name: { contains: query.race, mode: 'insensitive' },
                }
        }
        if (query.archetype) {
            if (uuidRegex.test(query.archetype)) businessFilters.archetypeId = query.archetype
            else
                businessFilters.archetype = {
                    name: { contains: query.archetype, mode: 'insensitive' },
                }
        }
        if (query.sex) businessFilters.sex = query.sex

        // Helper for range construction & validation
        function range(min?: number, max?: number) {
            if (min !== undefined && max !== undefined && min > max) {
                throw err('VALIDATION_ERROR', 'Min value cannot be greater than max value')
            }
            if (min === undefined && max === undefined) return undefined
            return {
                ...(min !== undefined ? { gte: min } : {}),
                ...(max !== undefined ? { lte: max } : {}),
            }
        }

        const levelRange = range(query.levelMin, query.levelMax)
        if (levelRange) businessFilters.level = levelRange
        const experienceRange = range(query.experienceMin, query.experienceMax)
        if (experienceRange) businessFilters.experience = experienceRange
        const healthRange = range(query.healthMin, query.healthMax)
        if (healthRange) businessFilters.health = healthRange
        const manaRange = range(query.manaMin, query.manaMax)
        if (manaRange) businessFilters.mana = manaRange
        const staminaRange = range(query.staminaMin, query.staminaMax)
        if (staminaRange) businessFilters.stamina = staminaRange
        const strengthRange = range(query.strengthMin, query.strengthMax)
        if (strengthRange) businessFilters.strength = strengthRange
        const constitutionRange = range(query.constitutionMin, query.constitutionMax)
        if (constitutionRange) businessFilters.constitution = constitutionRange
        const dexterityRange = range(query.dexterityMin, query.dexterityMax)
        if (dexterityRange) businessFilters.dexterity = dexterityRange
        const intelligenceRange = range(query.intelligenceMin, query.intelligenceMax)
        if (intelligenceRange) businessFilters.intelligence = intelligenceRange
        const wisdomRange = range(query.wisdomMin, query.wisdomMax)
        if (wisdomRange) businessFilters.wisdom = wisdomRange
        const charismaRange = range(query.charismaMin, query.charismaMax)
        if (charismaRange) businessFilters.charisma = charismaRange
        const ageRange = range(query.ageMin, query.ageMax)
        if (ageRange) businessFilters.age = ageRange
        const secureFilters = applySecurityFilters(businessFilters, user)
        const { characters, hasNext, nextCursor } = await characterRepository.findMany({
            ...query,
            filters: secureFilters,
        })
        return {
            characters,
            pagination: {
                hasNext,
                hasPrev: !!query.cursor,
                limit: query.limit ?? 20,
                ...(nextCursor && { nextCursor }),
                ...(query.cursor && { startCursor: query.cursor }),
            },
        }
    },
    async create(data: CreateCharacter, user: AuthenticatedUser): Promise<Character> {
        const existing = await characterRepository.findByName(data.name)
        if (existing) throw err('RESOURCE_CONFLICT', 'Character with this name already exists')
        return characterRepository.create({
            name: data.name,
            visibility: (data.visibility ?? 'PUBLIC') as Visibility,
            ownerId: user.id,
            ...(data.description ? { description: data.description } : {}),
            ...(data.imageId ? { imageId: data.imageId } : {}),
            level: data.level ?? 1,
            experience: data.experience ?? 0,
            health: data.health ?? 100,
            mana: data.mana ?? 100,
            stamina: data.stamina ?? 100,
            strength: data.strength ?? 10,
            constitution: data.constitution ?? 10,
            dexterity: data.dexterity ?? 10,
            intelligence: data.intelligence ?? 10,
            wisdom: data.wisdom ?? 10,
            charisma: data.charisma ?? 10,
            age: data.age ?? 18,
            sex: (data.sex ?? 'MALE') as Sex,
            raceId: data.raceId,
            archetypeId: data.archetypeId,
        })
    },
    async update(id: string, data: UpdateCharacter, user: AuthenticatedUser): Promise<Character> {
        const currentWithRole = await characterRepository.findByIdWithOwnerRole(id)
        if (!currentWithRole) throw err('RESOURCE_NOT_FOUND', 'Character not found')
        const current = { ...currentWithRole.character, ownerRole: currentWithRole.ownerRole }
        // Conceal existence if user cannot view
        if (!canViewResource(user, current)) throw err('RESOURCE_NOT_FOUND', 'Character not found')
        // Visible but not modifiable -> 403
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to modify this character')
        if (data.name && data.name !== current.name) {
            const existing = await characterRepository.findByName(data.name)
            if (existing && existing.id !== id) {
                throw err('RESOURCE_CONFLICT', 'Character with this name already exists')
            }
        }
        const updateData: Prisma.CharacterUpdateInput = {}
        if (data.name !== undefined) updateData.name = data.name
        if (data.description !== undefined) updateData.description = data.description
        if (data.visibility !== undefined) updateData.visibility = data.visibility as Visibility
        if (data.imageId !== undefined) updateData.image = { connect: { id: data.imageId } }
        if (data.level !== undefined) updateData.level = data.level
        if (data.experience !== undefined) updateData.experience = data.experience
        if (data.health !== undefined) updateData.health = data.health
        if (data.mana !== undefined) updateData.mana = data.mana
        if (data.stamina !== undefined) updateData.stamina = data.stamina
        if (data.strength !== undefined) updateData.strength = data.strength
        if (data.constitution !== undefined) updateData.constitution = data.constitution
        if (data.dexterity !== undefined) updateData.dexterity = data.dexterity
        if (data.intelligence !== undefined) updateData.intelligence = data.intelligence
        if (data.wisdom !== undefined) updateData.wisdom = data.wisdom
        if (data.charisma !== undefined) updateData.charisma = data.charisma
        if (data.age !== undefined) updateData.age = data.age
        if (data.sex !== undefined) updateData.sex = data.sex as Sex
        if (data.raceId !== undefined) updateData.race = { connect: { id: data.raceId } }
        if (data.archetypeId !== undefined)
            updateData.archetype = { connect: { id: data.archetypeId } }
        return characterRepository.update(id, updateData)
    },
    async delete(id: string, user: AuthenticatedUser): Promise<void> {
        const currentWithRole = await characterRepository.findByIdWithOwnerRole(id)
        if (!currentWithRole) throw err('RESOURCE_NOT_FOUND', 'Character not found')
        const current = { ...currentWithRole.character, ownerRole: currentWithRole.ownerRole }
        if (!canViewResource(user, current)) throw err('RESOURCE_NOT_FOUND', 'Character not found')
        if (!canModifyResource(user, current))
            throw err('FORBIDDEN', 'You do not have permission to delete this character')
        await characterRepository.delete(id)
    },
    async getStats(user?: AuthenticatedUser): Promise<CharacterStats> {
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
            throw err('FORBIDDEN', 'You do not have permission to view character statistics')
        }
        return characterRepository.getStats()
    },
} as const
