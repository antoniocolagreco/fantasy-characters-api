import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type PrismaClient, Visibility } from '@prisma/client'

import { generateUUIDv7 } from '@/shared/utils'

export async function seedTaxonomy(prisma: PrismaClient, ownerId: string) {
    const createImage = async (file: string, description: string) => {
        try {
            const p = join(process.cwd(), 'assets', file)
            const buf = readFileSync(p)
            return await prisma.image.create({
                data: {
                    id: generateUUIDv7(),
                    blob: buf,
                    description,
                    size: buf.length,
                    mimeType: file.endsWith('.webp')
                        ? 'image/webp'
                        : file.endsWith('.png')
                          ? 'image/png'
                          : 'image/jpeg',
                    width: 350,
                    height: 450,
                    ownerId,
                    visibility: Visibility.PUBLIC,
                },
            })
        } catch {
            return null
        }
    }

    const imagesRaw = await Promise.all([
        createImage('male_warrior.webp', 'Human warrior'),
        createImage('male_elf.webp', 'Elf wizard'),
        createImage('male_dwarf.webp', 'Dwarf cleric'),
        createImage('male_halfling.webp', 'Halfling rogue'),
        createImage('female_cleric.webp', 'Female cleric'),
    ])
    type RawImage = NonNullable<Awaited<ReturnType<typeof createImage>>>
    const filteredImages = imagesRaw.filter((i): i is RawImage => i !== null)
    const images = filteredImages.map(img => ({ id: img.id }))

    const races = await Promise.all([
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Human',
                description: 'Adaptable generalists',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Elf',
                description: 'Graceful magic affinity',
                manaModifier: 120,
                dexterityModifier: 14,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Dwarf',
                description: 'Stout and hardy',
                constitutionModifier: 14,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.race.create({
            data: {
                id: generateUUIDv7(),
                name: 'Halfling',
                description: 'Lucky and nimble',
                dexterityModifier: 15,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    const archetypes = await Promise.all([
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Warrior',
                description: 'Frontline fighter',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Wizard',
                description: 'Arcane scholar',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Rogue',
                description: 'Stealth specialist',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.archetype.create({
            data: {
                id: generateUUIDv7(),
                name: 'Cleric',
                description: 'Divine caster',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    const skills = await Promise.all([
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Sword Fighting',
                requiredLevel: 1,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Fireball',
                requiredLevel: 3,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Stealth',
                requiredLevel: 1,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.skill.create({
            data: {
                id: generateUUIDv7(),
                name: 'Healing Light',
                requiredLevel: 1,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    const perks = await Promise.all([
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Combat Veteran',
                requiredLevel: 5,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Arcane Scholar',
                requiredLevel: 3,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.perk.create({
            data: {
                id: generateUUIDv7(),
                name: 'Lucky',
                requiredLevel: 1,
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    const tags = await Promise.all([
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Combat',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Magic',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
        prisma.tag.create({
            data: {
                id: generateUUIDv7(),
                name: 'Stealth',
                ownerId,
                visibility: Visibility.PUBLIC,
            },
        }),
    ])

    return { images, races, archetypes, skills, perks, tags }
}
