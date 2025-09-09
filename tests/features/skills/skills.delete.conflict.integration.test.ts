import type { FastifyInstance } from 'fastify'
import { describe, it, expect, beforeAll } from 'vitest'

import { buildApp } from '@/app'
import { prisma } from '@/infrastructure/database'
import { HTTP_STATUS } from '@/shared/constants/http-status'
import { generateUUIDv7 } from '@/shared/utils/uuid'
import { createAuthHeaders } from '@/tests/helpers/test.helper'

async function createAdmin() {
    return prisma.user.create({
        data: {
            id: generateUUIDv7(),
            email: `admin-skill-${Date.now()}@test.dev`,
            passwordHash: 'x',
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        },
    })
}

async function createSkill(ownerId: string) {
    return prisma.skill.create({
        data: {
            id: generateUUIDv7(),
            name: `Skill-${generateUUIDv7()}`,
            ownerId,
            requiredLevel: 1,
            visibility: 'PUBLIC',
        },
    })
}

async function createRace(ownerId: string) {
    return prisma.race.create({
        data: {
            id: generateUUIDv7(),
            name: `R-${generateUUIDv7()}`,
            ownerId,
            healthModifier: 100,
            manaModifier: 100,
            staminaModifier: 100,
            strengthModifier: 10,
            constitutionModifier: 10,
            dexterityModifier: 10,
            intelligenceModifier: 10,
            wisdomModifier: 10,
            charismaModifier: 10,
            visibility: 'PUBLIC',
        },
    })
}

async function attachSkillToRace(raceId: string, skillId: string) {
    return prisma.raceSkill.create({
        data: { raceId, skillId },
    })
}

describe('Skill deletion conflict (409)', () => {
    let app: FastifyInstance

    beforeAll(async () => {
        app = await buildApp()
        await app.ready()
    })

    it('returns 409 when skill is referenced by race', async () => {
        const admin = await createAdmin()
        const skill = await createSkill(admin.id)
        const race = await createRace(admin.id)
        await attachSkillToRace(race.id, skill.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })

        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/skills/${skill.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.CONFLICT)
        expect(res.json().error.code).toBe('RESOURCE_IN_USE')
    })

    it('deletes skill when unused', async () => {
        const admin = await createAdmin()
        const skill = await createSkill(admin.id)
        const headers = createAuthHeaders({ id: admin.id, role: 'ADMIN', email: admin.email })
        const res = await app.inject({
            method: 'DELETE',
            url: `/api/v1/skills/${skill.id}`,
            headers,
        })
        expect(res.statusCode).toBe(HTTP_STATUS.NO_CONTENT)
    })
})
