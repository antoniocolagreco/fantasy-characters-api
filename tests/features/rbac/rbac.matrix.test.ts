import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildApp } from '@/app'
import { generateUUIDv7 } from '@/shared/utils'
import { createAuthHeaders } from '@/tests/helpers/auth.helper'
import { createTestItem, createTestUserInDb } from '@/tests/helpers/data.helper'

/**
 * RBAC Matrix Integration Test
 * Verifies CRUD permissions for USER, MODERATOR, ADMIN across own vs others' content and visibilities.
 * Scope: representative "items" resource (coverage proxy for other owned entities).
 */

type Role = 'USER' | 'MODERATOR' | 'ADMIN'

type Ownership = 'OWN' | 'OTHER'
type Scenario = {
    actorRole: Role
    ownerRole: Role
    ownership: Ownership
    visibility: 'PUBLIC' | 'PRIVATE' | 'HIDDEN'
    expect: {
        read: boolean
        update: boolean
        delete: boolean
    }
}

// Define expectation matrix according to authorization spec.
const vis: Array<'PUBLIC' | 'PRIVATE' | 'HIDDEN'> = ['PUBLIC', 'PRIVATE', 'HIDDEN']

const scenarios: Scenario[] = [
    // USER own
    ...vis.map(v => ({
        actorRole: 'USER' as Role,
        ownerRole: 'USER' as Role,
        ownership: 'OWN' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
    // USER others
    ...vis.map(v => ({
        actorRole: 'USER' as Role,
        ownerRole: 'USER' as Role,
        ownership: 'OTHER' as Ownership,
        visibility: v,
        expect: {
            read: v === 'PUBLIC',
            update: false,
            delete: false,
        },
    })),
    // MODERATOR own
    ...vis.map(v => ({
        actorRole: 'MODERATOR' as Role,
        ownerRole: 'MODERATOR' as Role,
        ownership: 'OWN' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
    // MODERATOR -> USER (other)
    ...vis.map(v => ({
        actorRole: 'MODERATOR' as Role,
        ownerRole: 'USER' as Role,
        ownership: 'OTHER' as Ownership,
        visibility: v,
        expect: {
            read: true, // moderator can view PUBLIC/PRIVATE/HIDDEN/PRIVATE
            update: false, // per current canModifyResource logic
            delete: false,
        },
    })),
    // ADMIN -> USER
    ...vis.map(v => ({
        actorRole: 'ADMIN' as Role,
        ownerRole: 'USER' as Role,
        ownership: 'OTHER' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
    // ADMIN -> MODERATOR
    ...vis.map(v => ({
        actorRole: 'ADMIN' as Role,
        ownerRole: 'MODERATOR' as Role,
        ownership: 'OTHER' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
    // ADMIN own (sanity)
    ...vis.map(v => ({
        actorRole: 'ADMIN' as Role,
        ownerRole: 'ADMIN' as Role,
        ownership: 'OWN' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
    // ADMIN -> other ADMIN
    ...vis.map(v => ({
        actorRole: 'ADMIN' as Role,
        ownerRole: 'ADMIN' as Role,
        ownership: 'OTHER' as Ownership,
        visibility: v,
        expect: { read: true, update: true, delete: true },
    })),
]

async function createActor(role: Role) {
    const user = await createTestUserInDb({
        role,
        email: `rbac-${role.toLowerCase()}-${generateUUIDv7()}@test.local`,
    })
    return user
}

async function createOwnedItem(
    ownerId: string,
    visibility: 'PUBLIC' | 'PRIVATE' | 'HIDDEN',
    name: string
) {
    return createTestItem({ ownerId, visibility, name })
}

describe('RBAC Matrix - Items CRUD', () => {
    let app: FastifyInstance
    beforeAll(async () => {
        process.env.RBAC_ENABLED = 'true'
        app = await buildApp()
        await app.ready()
    })
    afterAll(async () => {
        await app.close()
    })

    for (const s of scenarios) {
        const title = `${s.actorRole} (${s.ownership}) -> ${s.ownerRole} ${s.visibility}`
        it(title, async () => {
            // Arrange: create owner and actor
            const owner = await createActor(s.ownerRole)
            const actor =
                s.ownership === 'OWN' && s.actorRole === s.ownerRole
                    ? owner
                    : await createActor(s.actorRole)
            // Special case: ADMIN (OTHER) -> ADMIN scenarios need different admins; logic above already ensures that
            const itemName = `itm-${generateUUIDv7().slice(0, 8)}`
            const item = await createOwnedItem(owner.id, s.visibility, itemName)

            // READ
            const readRes = await app.inject({
                method: 'GET',
                url: `/api/v1/items/${item.id}`,
                headers: createAuthHeaders({ id: actor.id, role: actor.role }),
            })
            if (s.expect.read) {
                expect(readRes.statusCode).toBe(200)
            } else {
                expect([403, 404]).toContain(readRes.statusCode)
            }

            // UPDATE
            const updateRes = await app.inject({
                method: 'PUT',
                url: `/api/v1/items/${item.id}`,
                headers: createAuthHeaders({ id: actor.id, role: actor.role }),
                payload: { name: `${item.name}-u` },
            })
            if (s.expect.update) {
                expect(updateRes.statusCode).toBe(200)
            } else {
                expect([403, 404]).toContain(updateRes.statusCode)
            }

            // DELETE
            const deleteRes = await app.inject({
                method: 'DELETE',
                url: `/api/v1/items/${item.id}`,
                headers: createAuthHeaders({ id: actor.id, role: actor.role }),
            })
            if (s.expect.delete) {
                expect(deleteRes.statusCode).toBe(204)
            } else {
                expect([403, 404]).toContain(deleteRes.statusCode)
            }
        })
    }
})
