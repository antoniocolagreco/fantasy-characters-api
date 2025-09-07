import type {
    Archetype,
    Character,
    Equipment,
    Image,
    Item,
    Perk,
    Race,
    RefreshToken,
    Role,
    Skill,
    Tag,
    User,
    Visibility,
} from '@prisma/client'

// Central in-memory storage used by all model clients
export const db = {
    users: [] as User[],
    tokens: [] as RefreshToken[],
    images: [] as Image[],
    characters: [] as Character[],
    tags: [] as Tag[],
    skills: [] as Skill[],
    perks: [] as Perk[],
    races: [] as Race[],
    archetypes: [] as Archetype[],
    items: [] as Item[],
    equipment: [] as Equipment[],
}

export function resetDb(): void {
    db.users.length = 0
    db.tokens.length = 0
    db.images.length = 0
    db.characters.length = 0
    db.tags.length = 0
    db.skills.length = 0
    db.perks.length = 0
    db.races.length = 0
    db.archetypes.length = 0
    db.items.length = 0
    db.equipment.length = 0
}

// Re-export commonly used Prisma enums for convenience
export type { Role, Visibility }
