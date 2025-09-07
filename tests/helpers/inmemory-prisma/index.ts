import { resetDb } from './db'
import { characterModel } from './models/character'
import { imageModel } from './models/image'
import {
    archetypeModel,
    itemModel,
    perkModel,
    raceModel,
    skillModel,
    tagModel,
} from './models/ownership'
import { refreshTokenModel } from './models/refresh-token'
import { userModel } from './models/user'
import type { PrismaFake } from './types'

export const prismaFake: PrismaFake = {
    async $connect() {},
    async $disconnect() {},
    async $queryRaw<T = unknown>(_query?: unknown): Promise<T> {
        return [] as T
    },
    async $executeRaw(_query?: unknown): Promise<number> {
        return 0
    },
    async $transaction<T>(fn: (tx: PrismaFake) => Promise<T>): Promise<T> {
        return fn(this)
    },
    user: userModel,
    refreshToken: refreshTokenModel,
    image: imageModel,
    character: characterModel,
    tag: tagModel,
    skill: skillModel,
    perk: perkModel,
    race: raceModel,
    archetype: archetypeModel,
    item: itemModel,
}

export { resetDb }
