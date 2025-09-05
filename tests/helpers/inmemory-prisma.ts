// In-memory Prisma-like client for tests
// Provides minimal subset used by users and refresh tokens features
import type { User, RefreshToken, Role, Visibility } from '@prisma/client'

const db = {
    users: [] as User[],
    tokens: [] as RefreshToken[],
    characters: [] as Array<{
        id: string
        ownerId: string
        visibility: Visibility
        owner?: { role: Role }
    }>,
    images: [] as Array<{
        id: string
        ownerId: string
        visibility: Visibility
        owner?: { role: Role }
    }>,
    tags: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
    skills: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
    perks: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
    races: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
    archetypes: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
    items: [] as Array<{ id: string; ownerId: string; owner?: { role: Role } }>,
}

export function resetDb(): void {
    db.users.length = 0
    db.tokens.length = 0
    db.characters.length = 0
    db.images.length = 0
    db.tags.length = 0
    db.skills.length = 0
    db.perks.length = 0
    db.races.length = 0
    db.archetypes.length = 0
    db.items.length = 0
}

// Helper narrowing
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function getNow(): Date {
    return new Date()
}

class PrismaLikeError extends Error {
    code: string
    meta?: unknown
    constructor(code: string, meta?: unknown) {
        super(code)
        this.code = code
        this.meta = meta
    }
}

function compareValues(a: unknown, b: unknown): number {
    if (a === b) return 0
    if (typeof a === 'number' && typeof b === 'number') return a - b
    const sa = String(a)
    const sb = String(b)
    if (sa === sb) return 0
    return sa > sb ? 1 : -1
}

// Prisma-like return types
export type CountResult = number
export type DeleteManyResult = { count: number }
export type UpdateManyResult = { count: number }

// Minimal where shapes used
export type UserWhereUnique = { id?: string; email?: string }
export type UserWhere = {
    id?: string
    email?: string
    role?: Role
    isActive?: boolean
    isBanned?: boolean
    profilePictureId?: { not: null } | null
    OR?: Array<Record<string, unknown>>
}
export type OrderBy = Array<Record<string, 'asc' | 'desc'>>

export const prismaFake = {
    // Minimal Prisma client surface
    async $connect() {
        /* no-op */
    },
    async $disconnect() {
        /* no-op */
    },
    async $queryRaw<T = unknown>(_query?: unknown): Promise<T> {
        return [] as unknown as T
    },
    async $executeRaw(_query?: unknown): Promise<number> {
        return 0
    },
    async $transaction<T>(fn: (tx: typeof prismaFake) => Promise<T>): Promise<T> {
        return fn(this)
    },
    user: {
        async deleteMany(): Promise<DeleteManyResult> {
            const count = db.users.length
            db.users.length = 0
            return { count }
        },
        async create(args: { data: Partial<User> & { id: string; email: string } }): Promise<User> {
            // Unique constraints: email, profilePictureId
            const existsByEmail = db.users.some(u => u.email === args.data.email)
            if (existsByEmail) {
                throw new PrismaLikeError('P2002', { target: ['email'] })
            }
            if (args.data.profilePictureId) {
                const existsByPfp = db.users.some(
                    u => u.profilePictureId === args.data.profilePictureId
                )
                if (existsByPfp) {
                    throw new PrismaLikeError('P2002', { target: ['profilePictureId'] })
                }
            }
            const now = getNow()
            const user: User = {
                id: args.data.id,
                email: args.data.email,
                passwordHash: (args.data.passwordHash as string) || '',
                role: (args.data.role as Role) || 'USER',
                isEmailVerified: (args.data.isEmailVerified as boolean) ?? false,
                isActive: (args.data.isActive as boolean) ?? true,
                lastLogin: (args.data.lastLogin as Date) || now,
                isBanned: (args.data.isBanned as boolean) ?? false,
                createdAt: now,
                updatedAt: now,
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
        async findUnique(args: {
            where: UserWhereUnique
            select?: { id?: boolean; role?: boolean }
        }): Promise<Partial<User> | null> {
            const w = args.where
            let found: User | null = null
            if (w.id) {
                found = db.users.find(u => u.id === w.id) || null
            } else if (w.email) {
                found = db.users.find(u => u.email === w.email) || null
            }
            if (!found) return null
            if (!args.select) return found
            const out: Partial<User> = {}
            if (args.select.id) out.id = found.id
            if (args.select.role) out.role = found.role
            return out
        },
        async findMany(args: {
            where?: UserWhere
            orderBy?: OrderBy
            take?: number
        }): Promise<User[]> {
            let list = db.users.slice()
            const { where } = args
            if (where) {
                if (where.role !== undefined) list = list.filter(u => u.role === where.role)
                if (where.isActive !== undefined)
                    list = list.filter(u => u.isActive === where.isActive)
                if (where.isBanned !== undefined)
                    list = list.filter(u => u.isBanned === where.isBanned)
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
                                return entries.some(([key, val]) => {
                                    if (!isRecord(val)) return false
                                    if ('contains' in val) {
                                        const needle = String(val.contains).toLowerCase()
                                        const hay = String(
                                            (u as Record<string, unknown>)[key] || ''
                                        ).toLowerCase()
                                        return hay.includes(needle)
                                    }
                                    return false
                                })
                            }) || false
                        )
                    })
                }
            }
            let order = args.orderBy || []
            // Ensure stable tie-breaker by id when ordering
            if (order.length === 1 && !('id' in order[0])) {
                const dir = (Object.values(order[0])[0] as 'asc' | 'desc') || 'desc'
                order = [...order, { id: dir }]
            }
            for (const o of order.reverse()) {
                const [key, dir] = Object.entries(o)[0]
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
            if (idx === -1) {
                throw new PrismaLikeError('P2025')
            }
            // Unique constraints on update (email/profilePictureId)
            if (args.data.email) {
                const existsByEmail = db.users.some(
                    u => u.email === args.data.email && u.id !== args.where.id
                )
                if (existsByEmail) {
                    throw new PrismaLikeError('P2002', { target: ['email'] })
                }
            }
            if (args.data.profilePictureId) {
                const existsByPfp = db.users.some(
                    u => u.profilePictureId === args.data.profilePictureId && u.id !== args.where.id
                )
                if (existsByPfp) {
                    throw new PrismaLikeError('P2002', { target: ['profilePictureId'] })
                }
            }
            const now = getNow()
            const current = db.users[idx]
            const updated: User = {
                ...current,
                ...args.data,
                updatedAt: now,
            }
            db.users[idx] = updated
            return updated
        },
        async delete(args: { where: { id: string } }): Promise<User> {
            const idx = db.users.findIndex(u => u.id === args.where.id)
            if (idx === -1) {
                throw new PrismaLikeError('P2025')
            }
            const [removed] = db.users.splice(idx, 1)
            // Cascade: RefreshToken has onDelete: Cascade in schema
            for (let i = db.tokens.length - 1; i >= 0; i--) {
                if (db.tokens[i].userId === removed.id) db.tokens.splice(i, 1)
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
    },
    refreshToken: {
        async deleteMany(): Promise<DeleteManyResult> {
            const count = db.tokens.length
            db.tokens.length = 0
            return { count }
        },
        async create(args: { data: RefreshToken }): Promise<RefreshToken> {
            // Unique constraint: token
            const existsByToken = db.tokens.some(t => t.token === args.data.token)
            if (existsByToken) {
                throw new PrismaLikeError('P2002', { target: ['token'] })
            }
            db.tokens.push(args.data)
            return args.data
        },
        async findFirst(args: {
            where: { token: string; isRevoked: boolean; expiresAt: { gt: Date } }
        }): Promise<RefreshToken | null> {
            const { token } = args.where
            const now = getNow()
            return (
                db.tokens.find(t => t.token === token && !t.isRevoked && t.expiresAt > now) || null
            )
        },
        async updateMany(args: {
            where: { token: string; isRevoked: boolean }
            data: { isRevoked: boolean }
        }): Promise<UpdateManyResult> {
            let count = 0
            for (const t of db.tokens) {
                if (t.token === args.where.token && !t.isRevoked) {
                    t.isRevoked = true
                    t.updatedAt = getNow()
                    count++
                }
            }
            return { count }
        },
        async findMany(args: {
            where: { userId: string; isRevoked: boolean; expiresAt: { gt: Date } }
            orderBy?: { createdAt: 'asc' | 'desc' }
        }): Promise<RefreshToken[]> {
            const now = getNow()
            const list = db.tokens.filter(
                t => t.userId === args.where.userId && !t.isRevoked && t.expiresAt > now
            )
            const order = args.orderBy?.createdAt || 'desc'
            list.sort((a, b) =>
                order === 'asc'
                    ? a.createdAt.getTime() - b.createdAt.getTime()
                    : b.createdAt.getTime() - a.createdAt.getTime()
            )
            return list
        },
    },
    character: {
        async findUnique(args: {
            where: { id: string }
            select?: {
                ownerId?: boolean
                visibility?: boolean
                owner?: { select: { role: boolean } }
            }
        }) {
            const row = db.characters.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.visibility) out.visibility = row.visibility
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    image: {
        async findUnique(args: {
            where: { id: string }
            select?: {
                ownerId?: boolean
                visibility?: boolean
                owner?: { select: { role: boolean } }
            }
        }) {
            const row = db.images.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.visibility) out.visibility = row.visibility
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    tag: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.tags.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    skill: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.skills.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    perk: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.perks.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    race: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.races.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    archetype: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.archetypes.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
    item: {
        async findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }) {
            const row = db.items.find(c => c.id === args.where.id) || null
            if (!row) return null
            if (!args.select) return row
            const out: Record<string, unknown> = {}
            if (args.select.ownerId) out.ownerId = row.ownerId
            if (args.select.owner?.select.role) out.owner = { role: row.owner?.role ?? 'USER' }
            return out
        },
    },
}

export type PrismaFake = typeof prismaFake
