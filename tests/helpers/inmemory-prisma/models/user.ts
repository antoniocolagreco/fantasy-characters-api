import type { Role, User } from '@prisma/client'

import { db } from '../db'
import type { CountResult, DeleteManyResult, OrderBy, UserWhere, UserWhereUnique } from '../types'
import { compareValues, now, PrismaLikeError } from '../utils'

export const userModel = {
    async deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult> {
        if (!args?.where?.id?.in) {
            const count = db.users.length
            db.users.length = 0
            return { count }
        }
        const ids = new Set(args.where.id.in)
        const before = db.users.length
        for (let i = db.users.length - 1; i >= 0; i--) {
            const u = db.users[i]
            if (u && ids.has(u.id)) db.users.splice(i, 1)
        }
        return { count: before - db.users.length }
    },

    async create(args: { data: Partial<User> & { id: string; email: string } }): Promise<User> {
        const existsByEmail = db.users.some(u => u.email === args.data.email)
        if (existsByEmail) throw new PrismaLikeError('P2002', { target: ['email'] })

        if (args.data.profilePictureId) {
            const existsByPfp = db.users.some(
                u => u.profilePictureId === args.data.profilePictureId
            )
            if (existsByPfp) throw new PrismaLikeError('P2002', { target: ['profilePictureId'] })
        }

        const ts = now()
        const user: User = {
            id: args.data.id,
            email: args.data.email,
            passwordHash: (args.data.passwordHash as string) || '',
            role: (args.data.role as Role) || 'USER',
            isEmailVerified: (args.data.isEmailVerified as boolean) ?? false,
            isActive: (args.data.isActive as boolean) ?? true,
            lastLogin: (args.data.lastLogin as Date) || ts,
            isBanned: (args.data.isBanned as boolean) ?? false,
            createdAt: ts,
            updatedAt: ts,
            name: (args.data.name as string | null) ?? null,
            bio: (args.data.bio as string | null) ?? null,
            oauthProvider: (args.data.oauthProvider as string | null) ?? null,
            oauthId: (args.data.oauthId as string | null) ?? null,
            lastPasswordChange: (args.data.lastPasswordChange as Date | null) ?? null,
            banReason: (args.data.banReason as string | null) ?? null,
            bannedUntil: (args.data.bannedUntil as Date | null) ?? null,
            bannedById: (args.data.bannedById as string | null) ?? null,
            profilePictureId: (args.data.profilePictureId as string | null) ?? null,
        }
        db.users.push(user)
        return user
    },

    async createMany(args: {
        data: Array<Partial<User> & { id: string; email: string }>
    }): Promise<{ count: number }> {
        const results = []
        for (const userData of args.data) {
            const user = await this.create({ data: userData })
            results.push(user)
        }
        return { count: results.length }
    },

    async findUnique(args: {
        where: UserWhereUnique
        select?: { id?: boolean; role?: boolean }
    }): Promise<Partial<User> | null> {
        const { where } = args
        const found = where.id
            ? db.users.find(u => u.id === where.id) || null
            : where.email
              ? db.users.find(u => u.email === where.email) || null
              : null
        if (!found) return null
        if (!args.select) return found
        const out: Partial<User> = {}
        if (args.select.id) out.id = found.id
        if (args.select.role) out.role = found.role
        return out
    },

    async findMany(args: { where?: UserWhere; orderBy?: OrderBy; take?: number }): Promise<User[]> {
        let list = db.users.slice()
        const { where } = args
        if (where) {
            if (where.role !== undefined) list = list.filter(u => u.role === where.role)
            if (where.isActive !== undefined) list = list.filter(u => u.isActive === where.isActive)
            if (where.isEmailVerified !== undefined)
                list = list.filter(u => u.isEmailVerified === where.isEmailVerified)
            if (where.isBanned !== undefined) list = list.filter(u => u.isBanned === where.isBanned)
            if (where.createdAt?.gte !== undefined)
                list = list.filter(u => u.createdAt >= (where.createdAt?.gte || u.createdAt))
            if (where.createdAt?.lte !== undefined)
                list = list.filter(u => u.createdAt <= (where.createdAt?.lte || u.createdAt))
            if (where.profilePictureId !== undefined) {
                if (where.profilePictureId === null)
                    list = list.filter(u => u.profilePictureId === null)
                else list = list.filter(u => u.profilePictureId !== null)
            }
            if (where.OR && where.OR.length > 0) {
                list = list.filter(u => {
                    return (
                        where.OR?.some(cond => {
                            const entries = Object.entries(cond)
                            const searchHit = entries.some(([key, val]) => {
                                if (!val || typeof val !== 'object') return false
                                const rec = val as Record<string, unknown>
                                if ('contains' in rec) {
                                    const needle = String(
                                        (rec as { contains: unknown }).contains
                                    ).toLowerCase()
                                    const hay = String(
                                        (u as Record<string, unknown>)[key] || ''
                                    ).toLowerCase()
                                    return hay.includes(needle)
                                }
                                return false
                            })
                            if (searchHit) return true

                            const cmpAll = entries.every(([key, val]) => {
                                const uVal = (u as Record<string, unknown>)[key]
                                if (val && typeof val === 'object') {
                                    const r = val as Record<string, unknown>
                                    if ('lt' in r) return compareValues(uVal, r.lt) < 0
                                    if ('gt' in r) return compareValues(uVal, r.gt) > 0
                                    return false
                                }
                                return uVal === val
                            })
                            return cmpAll
                        }) || false
                    )
                })
            }
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
        if (args.take !== undefined) return list.slice(0, args.take)
        return list
    },

    async update(args: { where: { id: string }; data: Partial<User> }): Promise<User> {
        const idx = db.users.findIndex(u => u.id === args.where.id)
        if (idx === -1) throw new PrismaLikeError('P2025')
        if (args.data.email) {
            const existsByEmail = db.users.some(
                u => u.email === args.data.email && u.id !== args.where.id
            )
            if (existsByEmail) throw new PrismaLikeError('P2002', { target: ['email'] })
        }
        if (args.data.profilePictureId) {
            const existsByPfp = db.users.some(
                u => u.profilePictureId === args.data.profilePictureId && u.id !== args.where.id
            )
            if (existsByPfp) throw new PrismaLikeError('P2002', { target: ['profilePictureId'] })
        }
        const current = db.users[idx]
        if (!current) throw new PrismaLikeError('P2025')
        const ts = now()
        const updated: User = {
            id: current.id,
            email: args.data.email ?? current.email,
            passwordHash: args.data.passwordHash ?? current.passwordHash,
            role: args.data.role ?? current.role,
            isEmailVerified: args.data.isEmailVerified ?? current.isEmailVerified,
            isActive: args.data.isActive ?? current.isActive,
            lastLogin: args.data.lastLogin ?? current.lastLogin,
            isBanned: args.data.isBanned ?? current.isBanned,
            createdAt: current.createdAt,
            updatedAt: ts,
            name:
                'name' in args.data
                    ? args.data.name === undefined
                        ? current.name
                        : args.data.name
                    : current.name,
            bio:
                'bio' in args.data
                    ? args.data.bio === undefined
                        ? current.bio
                        : args.data.bio
                    : current.bio,
            oauthProvider:
                'oauthProvider' in args.data
                    ? args.data.oauthProvider === undefined
                        ? current.oauthProvider
                        : args.data.oauthProvider
                    : current.oauthProvider,
            oauthId:
                'oauthId' in args.data
                    ? args.data.oauthId === undefined
                        ? current.oauthId
                        : args.data.oauthId
                    : current.oauthId,
            lastPasswordChange:
                'lastPasswordChange' in args.data
                    ? args.data.lastPasswordChange === undefined
                        ? current.lastPasswordChange
                        : args.data.lastPasswordChange
                    : current.lastPasswordChange,
            banReason:
                'banReason' in args.data
                    ? args.data.banReason === undefined
                        ? current.banReason
                        : args.data.banReason
                    : current.banReason,
            bannedUntil:
                'bannedUntil' in args.data
                    ? args.data.bannedUntil === undefined
                        ? current.bannedUntil
                        : args.data.bannedUntil
                    : current.bannedUntil,
            bannedById:
                'bannedById' in args.data
                    ? args.data.bannedById === undefined
                        ? current.bannedById
                        : args.data.bannedById
                    : current.bannedById,
            profilePictureId:
                'profilePictureId' in args.data
                    ? args.data.profilePictureId === undefined
                        ? current.profilePictureId
                        : args.data.profilePictureId
                    : current.profilePictureId,
        }
        db.users[idx] = updated
        return updated
    },

    async delete(args: { where: { id: string } }): Promise<User> {
        const idx = db.users.findIndex(u => u.id === args.where.id)
        if (idx === -1) throw new PrismaLikeError('P2025')
        const removed = db.users.splice(idx, 1)[0]
        if (!removed) throw new PrismaLikeError('P2025')
        for (let i = db.tokens.length - 1; i >= 0; i--) {
            const t = db.tokens[i]
            if (t && t.userId === removed.id) db.tokens.splice(i, 1)
        }
        return removed
    },

    async count(args?: { where?: UserWhere }): Promise<CountResult> {
        if (!args?.where) return db.users.length
        return (await this.findMany({ where: args.where })).length
    },

    async groupBy(_args: {
        by: Array<'role'>
        _count: { role: boolean }
    }): Promise<Array<{ role: Role; _count: { role: number } }>> {
        const map: Record<Role, number> = { USER: 0, MODERATOR: 0, ADMIN: 0 }
        for (const u of db.users) map[u.role]++
        return (Object.keys(map) as Role[]).map(role => ({ role, _count: { role: map[role] } }))
    },
}
