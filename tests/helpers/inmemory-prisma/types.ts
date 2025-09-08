import type {
    Role,
    User,
    Visibility,
    Image,
    RefreshToken,
    Tag,
    Skill,
    Perk,
    Race,
    Archetype,
    Item,
} from '@prisma/client'

export type CountResult = number
export type DeleteManyResult = { count: number }
export type UpdateManyResult = { count: number }

export type OrderBy = Array<Record<string, 'asc' | 'desc'>>

export type UserWhereUnique = { id?: string; email?: string }
export type UserWhere = {
    id?: string
    email?: string
    role?: Role
    isActive?: boolean
    isEmailVerified?: boolean
    isBanned?: boolean
    profilePictureId?: { not: null } | null
    createdAt?: { gte?: Date; lte?: Date }
    OR?: Array<Record<string, unknown>>
}

export type ImageWhereInput = {
    id?: string
    ownerId?: string | null
    visibility?: Visibility
    mimeType?: string
    width?: { gte?: number; lte?: number }
    height?: { gte?: number; lte?: number }
    description?: { contains?: string; mode?: 'insensitive' }
    OR?: Array<Record<string, unknown>>
}

export type OwnershipWhereInput = {
    id?: string
    ownerId?: string | null
    visibility?: Visibility
    name?: { contains?: string; mode?: 'insensitive' }
    description?: { contains?: string; mode?: 'insensitive' }
    OR?: OwnershipWhereInput[]
    AND?: OwnershipWhereInput[]
}

export type PrismaFake = {
    $connect(): Promise<void>
    $disconnect(): Promise<void>
    $queryRaw<T = unknown>(_query?: unknown): Promise<T>
    $executeRaw(_query?: unknown): Promise<number>
    $transaction<T>(fn: (tx: PrismaFake) => Promise<T>): Promise<T>
    user: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        create(args: { data: Partial<User> & { id: string; email: string } }): Promise<User>
        findUnique(args: {
            where: UserWhereUnique
            select?: { id?: boolean; role?: boolean }
        }): Promise<Partial<User> | null>
        findMany(args: { where?: UserWhere; orderBy?: OrderBy; take?: number }): Promise<User[]>
        update(args: { where: { id: string }; data: Partial<User> }): Promise<User>
        delete(args: { where: { id: string } }): Promise<User>
        count(args?: { where?: UserWhere }): Promise<CountResult>
        groupBy(_args: {
            by: Array<'role'>
            _count: { role: boolean }
        }): Promise<Array<{ role: Role; _count: { role: number } }>>
    }
    refreshToken: {
        deleteMany(args?: {
            where?: {
                OR?: Array<{ expiresAt?: { lt?: Date }; isRevoked?: boolean }>
                userId?: { in?: string[] }
            }
        }): Promise<DeleteManyResult>
        create(args: { data: RefreshToken }): Promise<RefreshToken>
        findFirst(args: {
            where: { token: string; isRevoked: boolean; expiresAt: { gt: Date } }
        }): Promise<RefreshToken | null>
        updateMany(args: {
            where: { token?: string; userId?: string; isRevoked: boolean }
            data: { isRevoked: boolean }
        }): Promise<UpdateManyResult>
        findMany(args: {
            where: { userId: string; isRevoked: boolean; expiresAt: { gt: Date } }
            orderBy?: { createdAt: 'asc' | 'desc' }
        }): Promise<RefreshToken[]>
    }
    character: {
        findUnique(args: {
            where: { id: string }
            select?: {
                ownerId?: boolean
                visibility?: boolean
                owner?: { select: { role: boolean } }
            }
        }): Promise<{ ownerId?: string; visibility?: Visibility; owner?: { role: Role } } | null>
    }
    image: {
        deleteMany(): Promise<DeleteManyResult>
        create(args: { data: Partial<Image> & { id: string } }): Promise<Image>
        findUnique(args: {
            where: { id: string }
            select?: {
                id?: boolean
                blob?: boolean
                description?: boolean
                size?: boolean
                mimeType?: boolean
                width?: boolean
                height?: boolean
                ownerId?: boolean
                visibility?: boolean
                createdAt?: boolean
                updatedAt?: boolean
            }
        }): Promise<Partial<Image> | null>
        findMany(args: {
            where?: ImageWhereInput
            orderBy?: OrderBy
            take?: number
            select?: {
                id?: boolean
                description?: boolean
                size?: boolean
                mimeType?: boolean
                width?: boolean
                height?: boolean
                ownerId?: boolean
                visibility?: boolean
                createdAt?: boolean
                updatedAt?: boolean
            }
        }): Promise<Partial<Image>[]>
        update(args: { where: { id: string }; data: Partial<Image> }): Promise<Image>
        delete(args: { where: { id: string } }): Promise<Image>
        count(args?: { where?: ImageWhereInput }): Promise<CountResult>
        groupBy(args: {
            by: Array<'visibility' | 'mimeType'>
            where?: ImageWhereInput
            _count: boolean
        }): Promise<Array<{ visibility?: Visibility; mimeType?: string; _count: number }>>
        aggregate(args: {
            where?: ImageWhereInput
            _sum: { size: boolean }
            _avg: { size: boolean; width: boolean; height: boolean }
        }): Promise<{
            _sum: { size: number | null }
            _avg: { size: number | null; width: number | null; height: number | null }
        }>
    }
    tag: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string } | { name: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<Tag | { ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Tag[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Tag> & { id: string } }): Promise<Tag>
        update(args: { where: { id: string }; data: Partial<Tag> }): Promise<Tag>
        delete(args: { where: { id: string } }): Promise<Tag>
    }
    skill: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Skill[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Skill> & { id: string } }): Promise<Skill>
    }
    perk: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Perk[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Perk> & { id: string } }): Promise<Perk>
    }
    race: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Race[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Race> & { id: string } }): Promise<Race>
    }
    archetype: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Archetype[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Archetype> & { id: string } }): Promise<Archetype>
    }
    item: {
        deleteMany(args?: { where?: { id?: { in?: string[] } } }): Promise<DeleteManyResult>
        findUnique(args: {
            where: { id: string }
            select?: { ownerId?: boolean; owner?: { select: { role: boolean } } }
        }): Promise<{ ownerId?: string | null; owner?: { role: Role } } | null>
        findMany(args: {
            where?: OwnershipWhereInput
            orderBy?: OrderBy
            take?: number
        }): Promise<Item[]>
        count(args?: { where?: OwnershipWhereInput }): Promise<CountResult>
        create(args: { data: Partial<Item> & { id: string } }): Promise<Item>
    }
}
