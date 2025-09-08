import type { Role, Visibility } from '@prisma/client'

import { db } from '../db'
import type { CountResult, DeleteManyResult, OrderBy, OwnershipWhereInput } from '../types'
import { compareValues, now } from '../utils'

type Row = { id: string; ownerId: string | null; visibility: Visibility }

function matchesFilter<T extends Row>(item: T, where: OwnershipWhereInput): boolean {
    // Handle AND conditions first
    if (where.AND) {
        return where.AND.every(andCondition => matchesFilter(item, andCondition))
    }

    // Handle OR conditions
    if (where.OR) {
        const orResult = where.OR.some(orCondition => {
            const result = matchesFilter(item, orCondition)
            return result
        })

        // Check if there are other conditions besides OR
        const otherConditions = { ...where }
        delete otherConditions.OR

        // If there are other conditions, both OR and other conditions must be true
        if (Object.keys(otherConditions).length > 0) {
            return orResult && matchesFilter(item, otherConditions)
        }

        // If only OR conditions exist, return OR result
        return orResult
    }

    // Handle individual filters
    if (where.id && item.id !== where.id) {
        return false
    }

    if (where.ownerId !== undefined && item.ownerId !== where.ownerId) {
        return false
    }

    if (where.visibility && item.visibility !== where.visibility) {
        return false
    }

    // Handle text search in name field
    if (where.name?.contains) {
        const searchTerm = where.name.contains.toLowerCase()
        const itemName = (item as { name?: string }).name?.toLowerCase() || ''
        const nameMatches = itemName.includes(searchTerm)
        if (!nameMatches) {
            return false
        }
    }

    // Handle text search in description field
    if (where.description?.contains) {
        const searchTerm = where.description.contains.toLowerCase()
        const itemDescription = (item as { description?: string }).description?.toLowerCase() || ''
        const descMatches = itemDescription.includes(searchTerm)
        if (!descMatches) {
            return false
        }
    }

    return true
}

function makeOwnershipModel<T extends Row>(
    get: () => T[]
): {
    findUnique(args: {
        where: { id: string } | { name: string }
        select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
    }): Promise<T | { ownerId?: string | null; owner?: { role: Role } } | null>
    deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
    findMany(args: { where?: OwnershipWhereInput; orderBy?: OrderBy; take?: number }): Promise<T[]>
    count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
    create(args: { data: Partial<T> & { id: string } }): Promise<T>
    update(args: { where: { id: string }; data: Partial<T> }): Promise<T>
    delete(args: { where: { id: string } }): Promise<T>
} {
    return {
        async findUnique(args) {
            let row: T | undefined

            if ('id' in args.where) {
                row = get().find(c => c.id === (args.where as { id: string }).id)
            } else if ('name' in args.where) {
                row = get().find(
                    c =>
                        (c as Record<string, unknown>).name ===
                        (args.where as { name: string }).name
                )
            }

            if (!row) return null

            if (!args.select) {
                // Return the full object when no select is specified
                return row
            }

            // Return partial object when select is specified
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
                list = list.filter(item => matchesFilter(item, where))
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

        async create(args: { data: Partial<T> & { id: string } }): Promise<T> {
            const ts = now()
            const entity = {
                ...args.data,
                createdAt: ts,
                updatedAt: ts,
                visibility: args.data.visibility || 'PUBLIC',
            } as unknown as T

            get().push(entity)
            return entity
        },

        async update(args: { where: { id: string }; data: Partial<T> }): Promise<T> {
            const list = get()
            const index = list.findIndex(item => item.id === args.where.id)
            if (index === -1) {
                throw new Error(`Record not found: ${args.where.id}`)
            }

            const updated = {
                ...list[index],
                ...args.data,
                updatedAt: now(),
            } as unknown as T

            list[index] = updated
            return updated
        },

        async delete(args: { where: { id: string } }): Promise<T> {
            const list = get()
            const index = list.findIndex(item => item.id === args.where.id)
            if (index === -1) {
                throw new Error(`Record not found: ${args.where.id}`)
            }

            const deleted = list[index] as T
            list.splice(index, 1)
            return deleted
        },
    }
}

export const tagModel = makeOwnershipModel(() => db.tags)
export const skillModel = makeOwnershipModel(() => db.skills)
export const perkModel = makeOwnershipModel(() => db.perks)
export const raceModel = makeOwnershipModel(() => db.races)
export const archetypeModel = makeOwnershipModel(() => db.archetypes)
export const itemModel = makeOwnershipModel(() => db.items)
