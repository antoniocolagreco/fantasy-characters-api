/**
 * Database seeding script
 * Populates the database with initial data for development and testing
 */

import { PrismaClient, Role, Rarity, Slot } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fantasy-api.com' },
    update: {},
    create: {
      email: 'admin@fantasy-api.com',
      passwordHash: '$2b$10$placeholder-hash-for-development', // This would be properly hashed in real app
      role: Role.ADMIN,
      displayName: 'Admin User',
      bio: 'System administrator',
      isEmailVerified: true,
      isActive: true,
    },
  })
  console.log('👤 Created admin user')

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fantasy-api.com' },
    update: {},
    create: {
      email: 'demo@fantasy-api.com',
      passwordHash: '$2b$10$placeholder-hash-for-development',
      role: Role.USER,
      displayName: 'Demo User',
      bio: 'Demonstration user account',
      isEmailVerified: true,
      isActive: true,
    },
  })
  console.log('👤 Created demo user')

  // Create basic tags
  const combatTag = await prisma.tag.upsert({
    where: { name: 'Combat' },
    update: {},
    create: {
      name: 'Combat',
      description: 'Skills and abilities related to fighting and warfare',
      createdById: adminUser.id,
    },
  })

  const magicTag = await prisma.tag.upsert({
    where: { name: 'Magic' },
    update: {},
    create: {
      name: 'Magic',
      description: 'Magical abilities and spellcasting',
      createdById: adminUser.id,
    },
  })

  const supportTag = await prisma.tag.upsert({
    where: { name: 'Support' },
    update: {},
    create: {
      name: 'Support',
      description: 'Abilities that help allies or provide utility',
      createdById: adminUser.id,
    },
  })
  console.log('🏷️ Created basic tags')

  // Create races
  const humanRace = await prisma.race.upsert({
    where: { name: 'Human' },
    update: {},
    create: {
      name: 'Human',
      description: 'Versatile and adaptable, humans are the most common race in fantasy worlds.',
      healthModifier: 100,
      manaModifier: 100,
      staminaModifier: 100,
      strengthModifier: 10,
      constitutionModifier: 10,
      dexterityModifier: 10,
      intelligenceModifier: 10,
      wisdomModifier: 10,
      charismaModifier: 10,
      createdById: adminUser.id,
    },
  })

  const elfRace = await prisma.race.upsert({
    where: { name: 'Elf' },
    update: {},
    create: {
      name: 'Elf',
      description: 'Graceful and long-lived, elves are naturally attuned to magic and nature.',
      healthModifier: 90,
      manaModifier: 120,
      staminaModifier: 100,
      strengthModifier: 8,
      constitutionModifier: 9,
      dexterityModifier: 12,
      intelligenceModifier: 11,
      wisdomModifier: 11,
      charismaModifier: 10,
      createdById: adminUser.id,
    },
  })

  const dwarfRace = await prisma.race.upsert({
    where: { name: 'Dwarf' },
    update: {},
    create: {
      name: 'Dwarf',
      description:
        'Sturdy and resilient, dwarfs are known for their craftsmanship and constitution.',
      healthModifier: 110,
      manaModifier: 80,
      staminaModifier: 110,
      strengthModifier: 11,
      constitutionModifier: 12,
      dexterityModifier: 9,
      intelligenceModifier: 10,
      wisdomModifier: 11,
      charismaModifier: 8,
      createdById: adminUser.id,
    },
  })
  console.log('🧙 Created races')

  // Create archetypes
  const warriorArchetype = await prisma.archetype.upsert({
    where: { name: 'Warrior' },
    update: {},
    create: {
      name: 'Warrior',
      description: 'A melee fighter skilled in combat and physical prowess.',
      createdById: adminUser.id,
    },
  })

  const wizardArchetype = await prisma.archetype.upsert({
    where: { name: 'Wizard' },
    update: {},
    create: {
      name: 'Wizard',
      description: 'A spellcaster who studies magic and wields powerful spells.',
      createdById: adminUser.id,
    },
  })

  const clericArchetype = await prisma.archetype.upsert({
    where: { name: 'Cleric' },
    update: {},
    create: {
      name: 'Cleric',
      description: 'A divine spellcaster who heals allies and smites enemies.',
      createdById: adminUser.id,
    },
  })
  console.log('⚔️ Created archetypes')

  // Create skills
  const swordSkill = await prisma.skill.upsert({
    where: { name: 'Sword Fighting' },
    update: {},
    create: {
      name: 'Sword Fighting',
      description: 'Proficiency with sword weapons in combat.',
      requiredLevel: 1,
      createdById: adminUser.id,
      races: { connect: [{ id: humanRace.id }, { id: elfRace.id }, { id: dwarfRace.id }] },
      archetypes: { connect: [{ id: warriorArchetype.id }] },
      tags: { connect: [{ id: combatTag.id }] },
    },
  })

  const fireballSkill = await prisma.skill.upsert({
    where: { name: 'Fireball' },
    update: {},
    create: {
      name: 'Fireball',
      description: 'Launch a ball of fire at enemies.',
      requiredLevel: 3,
      createdById: adminUser.id,
      races: { connect: [{ id: humanRace.id }, { id: elfRace.id }] },
      archetypes: { connect: [{ id: wizardArchetype.id }] },
      tags: { connect: [{ id: magicTag.id }, { id: combatTag.id }] },
    },
  })

  const healSkill = await prisma.skill.upsert({
    where: { name: 'Heal' },
    update: {},
    create: {
      name: 'Heal',
      description: 'Restore health to an ally.',
      requiredLevel: 1,
      createdById: adminUser.id,
      races: { connect: [{ id: humanRace.id }, { id: elfRace.id }] },
      archetypes: { connect: [{ id: clericArchetype.id }] },
      tags: { connect: [{ id: magicTag.id }, { id: supportTag.id }] },
    },
  })
  console.log('🎯 Created skills')

  // Create perks
  const toughPerk = await prisma.perk.upsert({
    where: { name: 'Tough' },
    update: {},
    create: {
      name: 'Tough',
      description: 'Increases maximum health by 20 points.',
      requiredLevel: 5,
      createdById: adminUser.id,
      tags: { connect: [{ id: combatTag.id }] },
    },
  })

  const scholarPerk = await prisma.perk.upsert({
    where: { name: 'Scholar' },
    update: {},
    create: {
      name: 'Scholar',
      description: 'Increases maximum mana by 30 points.',
      requiredLevel: 3,
      createdById: adminUser.id,
      tags: { connect: [{ id: magicTag.id }] },
    },
  })
  console.log('💪 Created perks')

  // Create items
  const ironSword = await prisma.item.upsert({
    where: { name: 'Iron Sword' },
    update: {},
    create: {
      name: 'Iron Sword',
      description: 'A sturdy sword made of iron. Reliable and effective.',
      damage: 15,
      rarity: Rarity.COMMON,
      slot: Slot.MAIN_HAND,
      requiredLevel: 1,
      weight: 3.5,
      durability: 100,
      maxDurability: 100,
      value: 50,
      isArmor: false,
      isWeapon: true,
      is2Handed: false,
      isShield: false,
      isThrowable: false,
      isConsumable: false,
      isQuestItem: false,
      isTradeable: true,
      userId: adminUser.id,
      tags: { connect: [{ id: combatTag.id }] },
    },
  })

  const wizardRobe = await prisma.item.upsert({
    where: { name: 'Wizard Robe' },
    update: {},
    create: {
      name: 'Wizard Robe',
      description: 'A flowing robe that enhances magical abilities.',
      bonusMana: 25,
      bonusIntelligence: 2,
      defense: 5,
      rarity: Rarity.UNCOMMON,
      slot: Slot.CHEST,
      requiredLevel: 3,
      weight: 2.0,
      durability: 80,
      maxDurability: 80,
      value: 150,
      isArmor: true,
      isWeapon: false,
      is2Handed: false,
      isShield: false,
      isThrowable: false,
      isConsumable: false,
      isQuestItem: false,
      isTradeable: true,
      userId: adminUser.id,
      tags: { connect: [{ id: magicTag.id }] },
    },
  })

  const healthPotion = await prisma.item.upsert({
    where: { name: 'Health Potion' },
    update: {},
    create: {
      name: 'Health Potion',
      description: 'A red potion that restores 50 health when consumed.',
      bonusHealth: 50,
      rarity: Rarity.COMMON,
      slot: Slot.NONE,
      requiredLevel: 1,
      weight: 0.5,
      durability: 1,
      maxDurability: 1,
      value: 25,
      isArmor: false,
      isWeapon: false,
      is2Handed: false,
      isShield: false,
      isThrowable: false,
      isConsumable: true,
      isQuestItem: false,
      isTradeable: true,
      userId: adminUser.id,
      tags: { connect: [{ id: supportTag.id }] },
    },
  })
  console.log('⚔️ Created items')

  // Create sample characters
  const demoCharacter = await prisma.character.upsert({
    where: { name: 'Sir Galahad' },
    update: {},
    create: {
      name: 'Sir Galahad',
      description: 'A noble human warrior dedicated to justice and righteousness.',
      level: 5,
      experience: 1250,
      health: 120,
      mana: 50,
      stamina: 100,
      strength: 15,
      constitution: 14,
      dexterity: 12,
      intelligence: 10,
      wisdom: 13,
      charisma: 14,
      userId: demoUser.id,
      raceId: humanRace.id,
      archetypeId: warriorArchetype.id,
      mainHandItemId: ironSword.id,
      isPublic: true,
      skills: { connect: [{ id: swordSkill.id }] },
      perks: { connect: [{ id: toughPerk.id }] },
      tags: { connect: [{ id: combatTag.id }] },
      inventory: { connect: [{ id: healthPotion.id }] },
    },
  })

  const wizardCharacter = await prisma.character.upsert({
    where: { name: 'Eldara the Wise' },
    update: {},
    create: {
      name: 'Eldara the Wise',
      description: 'An ancient elf wizard with vast knowledge of the arcane arts.',
      level: 8,
      experience: 3200,
      health: 90,
      mana: 150,
      stamina: 80,
      strength: 8,
      constitution: 10,
      dexterity: 14,
      intelligence: 18,
      wisdom: 16,
      charisma: 12,
      userId: demoUser.id,
      raceId: elfRace.id,
      archetypeId: wizardArchetype.id,
      chestItemId: wizardRobe.id,
      isPublic: true,
      skills: { connect: [{ id: fireballSkill.id }] },
      perks: { connect: [{ id: scholarPerk.id }] },
      tags: { connect: [{ id: magicTag.id }] },
    },
  })
  console.log('🧝 Created sample characters')

  console.log('🌱 Database seeding completed successfully!')
  console.log(`
📊 Seeded data summary:
- 👤 Users: 2 (admin, demo)
- 🏷️ Tags: 3 (combat, magic, support)
- 🧙 Races: 3 (human, elf, dwarf)
- ⚔️ Archetypes: 3 (warrior, wizard, cleric)
- 🎯 Skills: 3 (sword fighting, fireball, heal)
- 💪 Perks: 2 (tough, scholar)
- ⚔️ Items: 3 (iron sword, wizard robe, health potion)
- 🧝 Characters: 2 (Sir Galahad, Eldara the Wise)
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
