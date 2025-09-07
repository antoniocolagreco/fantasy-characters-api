import type { Role, Visibility } from '@prisma/client'

import { db } from '../db'
import type { CountResult, DeleteManyResult, OrderBy, OwnershipWhereInput } from '../types'
import { compareValues } from '../utils'

type Row = { id: string; ownerId: string | null; visibility: Visibility }

function makeOwnershipModel<T extends Row>(
    get: () => T[]
): {
    findUnique(args: {
        where: { id: string }
        select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
    }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
    deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
    findMany(args: { where?: OwnershipWhereInput; orderBy?: OrderBy; take?: number }): Promise<T[]>
    count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
} {
    return {
        async findUnique(args) {
            const row = get().find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) {
                const result: { ownerId: string | null; owner?: { role: Role } } = {
                    ownerId: row.ownerId,
                }
                if (row.ownerId) {
                    result.owner = {
                        role: db.users.find(u => u.id === row.ownerId)?.role || 'USER',
                    }
                }
                return result
            }
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role && row.ownerId)
                out.owner = { role: db.users.find(u => u.id === row.ownerId)?.role || 'USER' }
            return out as { ownerId?: string | null; owner?: { role: Role } }
        },

        async deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult> {
            const rows = get()
            if (!args?.where?.id?.in) {
                const count = rows.length
                rows.length = 0
                return { count }
            }
            const ids = new Set(args.where.id.in)
            const before = rows.length
            for (let i = rows.length - 1; i >= 0; i--) {
                const row = rows[i]
                if (row && ids.has(row.id)) rows.splice(i, 1)
            }
            return { count: before - rows.length }
        },

        async findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<T[]> {
            let list = get().slice()
            const { where } = args
            if (where) {
                if (where.id) list = list.filter(r => r.id === where.id)
                if (where.ownerId !== undefined)
                    list = list.filter(r => r.ownerId === where.ownerId)
                if (where.visibility) list = list.filter(r => r.visibility === where.visibility)
            }
            let order: OrderBy = args.orderBy ? [...args.orderBy] : []
            if (order.length === 1) {
                const first = order[0]
                if (first && !Object.prototype.hasOwnProperty.call(first, 'id')) {
                    const values = Object.values(first)
                    const firstVal = values.length > 0 ? values[0] : 'desc'
                    const dir: 'asc' | 'desc' = firstVal === 'asc' ? 'asc' : 'desc'
                    order = [...order, { id: dir }]
                }
            }
            for (const o of [...order].reverse()) {
                const entries = Object.entries(o)
                if (entries.length === 0) continue
                const [key, dir] = entries[0] as [string, 'asc' | 'desc']
                list.sort((a, b) => {
                    const av = (a as Record<string, unknown>)[key]
                    const bv = (b as Record<string, unknown>)[key]
                    const cmp = compareValues(av, bv)
                    return dir === 'asc' ? cmp : -1 * cmp
                })
            }
            if (args.take !== undefined) list = list.slice(0, args.take)
            return list
        },

        async count(args?: { where?: OwnershipWhereInput }): Promise<CountResult> {
            if (!args?.where) return get().length
            const rows = await this.findMany({ where: args.where })
            return rows.length
        },
    }
}

export const tagModel = makeOwnershipModel(() => db.tags)
export const skillModel = makeOwnershipModel(() => db.skills)
export const perkModel = makeOwnershipModel(() => db.perks)
export const raceModel = makeOwnershipModel(() => db.races)
export const archetypeModel = makeOwnershipModel(() => db.archetypes)
export const itemModel = makeOwnershipModel(() => db.items)
