import { PrismaClient, Role, Rarity, Slot, Sex, Visibility } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import argon2 from 'argon2'

const prisma = new PrismaClient()

// Argon2 configuration for seeding
const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
}

// Utility function to read image files
const readImageFile = (filename: string): Buffer => {
  const filePath = path.join(process.cwd(), 'assets', filename)
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath)
  }
  throw new Error(`Image file not found: ${filePath}`)
}

// Utility function to get image dimensions (simple approximation)
const getImageDimensions = (filename: string): { width: number; height: number } => {
  // Default dimensions - in a real app you'd use an image library to get actual dimensions
  const defaults = { width: 300, height: 400 }

  // For WebP files, assume they are properly sized
  if (filename.endsWith('.webp')) {
    return { width: 350, height: 450 }
  }

  return defaults
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data in correct order (respecting foreign key constraints)
  console.log('🧹 Cleaning existing data...')
  await prisma.equipment.deleteMany()
  await prisma.character.deleteMany()
  await prisma.item.deleteMany()
  await prisma.archetype.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.perk.deleteMany()
  await prisma.race.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.image.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  console.log('✅ Existing data cleaned')

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fantasy-api.com',
      passwordHash: await argon2.hash('admin123', argon2Options),
      role: Role.ADMIN,
      name: 'System Administrator',
      bio: 'System administrator with full access',
      isEmailVerified: true,
      isActive: true,
    },
  })

  // Create moderator user
  const moderatorUser = await prisma.user.create({
    data: {
      email: 'moderator@fantasy-api.com',
      passwordHash: await argon2.hash('mod123', argon2Options),
      role: Role.MODERATOR,
      name: 'Content Moderator',
      bio: 'Moderator responsible for content quality',
      isEmailVerified: true,
      isActive: true,
    },
  })

  // Create regular users
  const regularUser = await prisma.user.create({
    data: {
      email: 'user@fantasy-api.com',
      passwordHash: await argon2.hash('user123', argon2Options),
      role: Role.USER,
      name: 'Fantasy Player',
      bio: 'Enthusiastic fantasy game player',
      isEmailVerified: true,
      isActive: true,
    },
  })

  const gameDesigner = await prisma.user.create({
    data: {
      email: 'designer@fantasy-api.com',
      passwordHash: await argon2.hash('design123', argon2Options),
      role: Role.USER,
      name: 'Game Designer',
      bio: 'Creative game designer and world builder',
      isEmailVerified: true,
      isActive: true,
    },
  })

  console.log('✅ Users created')

  // Create images for races and archetypes
  const images = {}

  try {
    // Dwarf image
    const dwarfImageData = readImageFile('dwarf.webp')
    const dwarfDimensions = getImageDimensions('dwarf.webp')
    images['dwarf'] = await prisma.image.create({
      data: {
        blob: dwarfImageData,
        filename: 'dwarf.webp',
        description: 'Sturdy dwarf warrior',
        size: dwarfImageData.length,
        mimeType: 'image/webp',
        width: dwarfDimensions.width,
        height: dwarfDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    // Elf image
    const elfImageData = readImageFile('elf.webp')
    const elfDimensions = getImageDimensions('elf.webp')
    images['elf'] = await prisma.image.create({
      data: {
        blob: elfImageData,
        filename: 'elf.webp',
        description: 'Graceful elven archer',
        size: elfImageData.length,
        mimeType: 'image/webp',
        width: elfDimensions.width,
        height: elfDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    // Halfling image
    const halflingImageData = readImageFile('halfling.webp')
    const halflingDimensions = getImageDimensions('halfling.webp')
    images['halfling'] = await prisma.image.create({
      data: {
        blob: halflingImageData,
        filename: 'halfling.webp',
        description: 'Nimble halfling rogue',
        size: halflingImageData.length,
        mimeType: 'image/webp',
        width: halflingDimensions.width,
        height: halflingDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    // Warrior archetype image
    const warriorImageData = readImageFile('warrior.webp')
    const warriorDimensions = getImageDimensions('warrior.webp')
    images['warrior'] = await prisma.image.create({
      data: {
        blob: warriorImageData,
        filename: 'warrior.webp',
        description: 'Mighty warrior in battle armor',
        size: warriorImageData.length,
        mimeType: 'image/webp',
        width: warriorDimensions.width,
        height: warriorDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    // Wizard archetype image
    const wizardImageData = readImageFile('wizard.webp')
    const wizardDimensions = getImageDimensions('wizard.webp')
    images['wizard'] = await prisma.image.create({
      data: {
        blob: wizardImageData,
        filename: 'wizard.webp',
        description: 'Wise wizard with magical staff',
        size: wizardImageData.length,
        mimeType: 'image/webp',
        width: wizardDimensions.width,
        height: wizardDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    // Cleric archetype image
    const clericImageData = readImageFile('cleric.webp')
    const clericDimensions = getImageDimensions('cleric.webp')
    images['cleric'] = await prisma.image.create({
      data: {
        blob: clericImageData,
        filename: 'cleric.webp',
        description: 'Holy cleric with divine blessing',
        size: clericImageData.length,
        mimeType: 'image/webp',
        width: clericDimensions.width,
        height: clericDimensions.height,
        ownerId: adminUser.id,
        visibility: Visibility.PUBLIC,
      },
    })

    console.log('✅ Images created')
  } catch (error) {
    console.warn('⚠️  Some images could not be loaded:', error.message)
  }

  // Create basic tags
  const combatTag = await prisma.tag.create({
    data: {
      name: 'Combat',
      description: 'Related to fighting and warfare',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
    },
  })

  const magicTag = await prisma.tag.create({
    data: {
      name: 'Magic',
      description: 'Related to magical abilities and spells',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
    },
  })

  const stealthTag = await prisma.tag.create({
    data: {
      name: 'Stealth',
      description: 'Related to sneaking and hiding',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
    },
  })

  const socialTag = await prisma.tag.create({
    data: {
      name: 'Social',
      description: 'Related to interaction with others',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
    },
  })

  const healingTag = await prisma.tag.create({
    data: {
      name: 'Healing',
      description: 'Related to restoration and healing',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
    },
  })

  console.log('✅ Tags created')

  // Create races
  const humanRace = await prisma.race.create({
    data: {
      name: 'Human',
      description: 'Versatile and ambitious, humans are the most common race',
      healthModifier: 100,
      manaModifier: 100,
      staminaModifier: 100,
      strengthModifier: 10,
      constitutionModifier: 10,
      dexterityModifier: 10,
      intelligenceModifier: 10,
      wisdomModifier: 10,
      charismaModifier: 10,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: socialTag.id }],
      },
    },
  })

  const elfRace = await prisma.race.create({
    data: {
      name: 'Elf',
      description: 'Graceful and long-lived, elves are masters of magic and archery',
      healthModifier: 90,
      manaModifier: 130,
      staminaModifier: 110,
      strengthModifier: 8,
      constitutionModifier: 8,
      dexterityModifier: 14,
      intelligenceModifier: 12,
      wisdomModifier: 12,
      charismaModifier: 11,
      imageId: images['elf']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: magicTag.id }, { id: stealthTag.id }],
      },
    },
  })

  const dwarfRace = await prisma.race.create({
    data: {
      name: 'Dwarf',
      description: 'Hardy and resilient, dwarves are excellent craftsmen and warriors',
      healthModifier: 120,
      manaModifier: 80,
      staminaModifier: 110,
      strengthModifier: 12,
      constitutionModifier: 14,
      dexterityModifier: 8,
      intelligenceModifier: 10,
      wisdomModifier: 11,
      charismaModifier: 8,
      imageId: images['dwarf']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }],
      },
    },
  })

  const halflingRace = await prisma.race.create({
    data: {
      name: 'Halfling',
      description: 'Small and nimble, halflings are natural rogues and scouts',
      healthModifier: 85,
      manaModifier: 90,
      staminaModifier: 120,
      strengthModifier: 7,
      constitutionModifier: 9,
      dexterityModifier: 15,
      intelligenceModifier: 10,
      wisdomModifier: 12,
      charismaModifier: 12,
      imageId: images['halfling']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: stealthTag.id }, { id: socialTag.id }],
      },
    },
  })

  console.log('✅ Races created')

  // Create skills
  const swordSkill = await prisma.skill.create({
    data: {
      name: 'Sword Fighting',
      description: 'Mastery of blade combat techniques',
      requiredLevel: 1,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }],
      },
    },
  })

  const magicMissileSkill = await prisma.skill.create({
    data: {
      name: 'Magic Missile',
      description: 'Basic offensive spell that never misses',
      requiredLevel: 1,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: magicTag.id }],
      },
    },
  })

  const stealthSkill = await prisma.skill.create({
    data: {
      name: 'Stealth',
      description: 'Move silently and remain hidden from enemies',
      requiredLevel: 1,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: stealthTag.id }],
      },
    },
  })

  const healingSkill = await prisma.skill.create({
    data: {
      name: 'Healing Touch',
      description: 'Restore health to yourself or allies',
      requiredLevel: 2,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: healingTag.id }, { id: magicTag.id }],
      },
    },
  })

  const persuasionSkill = await prisma.skill.create({
    data: {
      name: 'Persuasion',
      description: 'Convince others through charismatic speech',
      requiredLevel: 1,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: socialTag.id }],
      },
    },
  })

  console.log('✅ Skills created')

  // Create perks
  const toughnessPerk = await prisma.perk.create({
    data: {
      name: 'Toughness',
      description: 'Increases maximum health by 20%',
      requiredLevel: 3,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }],
      },
    },
  })

  const magicAffinityPerk = await prisma.perk.create({
    data: {
      name: 'Magic Affinity',
      description: 'Increases maximum mana by 25%',
      requiredLevel: 2,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: magicTag.id }],
      },
    },
  })

  const nimblePerk = await prisma.perk.create({
    data: {
      name: 'Nimble',
      description: 'Increases movement speed and dodge chance',
      requiredLevel: 4,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: stealthTag.id }],
      },
    },
  })

  const charismaticPerk = await prisma.perk.create({
    data: {
      name: 'Charismatic',
      description: 'Improves all social interactions',
      requiredLevel: 2,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: socialTag.id }],
      },
    },
  })

  console.log('✅ Perks created')

  // Create archetypes
  const warriorArchetype = await prisma.archetype.create({
    data: {
      name: 'Warrior',
      description: 'A master of melee combat, skilled with weapons and armor',
      imageId: images['warrior']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: swordSkill.id }],
      },
      tags: {
        connect: [{ id: combatTag.id }],
      },
      requiredRaces: {
        connect: [{ id: humanRace.id }, { id: dwarfRace.id }],
      },
    },
  })

  const wizardArchetype = await prisma.archetype.create({
    data: {
      name: 'Wizard',
      description: 'A scholar of the arcane arts, wielding powerful spells',
      imageId: images['wizard']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: magicMissileSkill.id }],
      },
      tags: {
        connect: [{ id: magicTag.id }],
      },
      requiredRaces: {
        connect: [{ id: humanRace.id }, { id: elfRace.id }],
      },
    },
  })

  const rogueArchetype = await prisma.archetype.create({
    data: {
      name: 'Rogue',
      description: 'A stealthy infiltrator skilled in subterfuge and precision strikes',
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: stealthSkill.id }],
      },
      tags: {
        connect: [{ id: stealthTag.id }, { id: combatTag.id }],
      },
      requiredRaces: {
        connect: [{ id: humanRace.id }, { id: halflingRace.id }, { id: elfRace.id }],
      },
    },
  })

  const clericArchetype = await prisma.archetype.create({
    data: {
      name: 'Cleric',
      description: 'A divine spellcaster devoted to healing and supporting allies',
      imageId: images['cleric']?.id,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: healingSkill.id }],
      },
      tags: {
        connect: [{ id: healingTag.id }, { id: magicTag.id }],
      },
      requiredRaces: {
        connect: [{ id: humanRace.id }, { id: dwarfRace.id }],
      },
    },
  })

  console.log('✅ Archetypes created')

  // Create items
  const ironSword = await prisma.item.create({
    data: {
      name: 'Iron Sword',
      description: 'A well-crafted iron blade',
      damage: 15,
      rarity: Rarity.COMMON,
      slot: Slot.ONE_HAND,
      requiredLevel: 1,
      weight: 3.5,
      value: 50,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }],
      },
      bonusSkills: {
        connect: [{ id: swordSkill.id }],
      },
    },
  })

  const leatherArmor = await prisma.item.create({
    data: {
      name: 'Leather Armor',
      description: 'Light protection made from treated leather',
      defense: 8,
      rarity: Rarity.COMMON,
      slot: Slot.CHEST,
      requiredLevel: 1,
      weight: 5.0,
      value: 40,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }],
      },
    },
  })

  const wizardStaff = await prisma.item.create({
    data: {
      name: 'Wizard Staff',
      description: 'A wooden staff imbued with magical energy',
      damage: 8,
      bonusMana: 20,
      bonusIntelligence: 2,
      rarity: Rarity.UNCOMMON,
      slot: Slot.TWO_HANDS,
      requiredLevel: 2,
      weight: 2.0,
      value: 120,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: magicTag.id }],
      },
      bonusSkills: {
        connect: [{ id: magicMissileSkill.id }],
      },
    },
  })

  const healingPotion = await prisma.item.create({
    data: {
      name: 'Healing Potion',
      description: 'A red potion that restores health when consumed',
      bonusHealth: 50,
      rarity: Rarity.COMMON,
      slot: Slot.NONE,
      requiredLevel: 1,
      weight: 0.5,
      value: 25,
      isConsumable: true,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: healingTag.id }],
      },
    },
  })

  const thiefDagger = await prisma.item.create({
    data: {
      name: 'Thief Dagger',
      description: 'A lightweight blade perfect for stealth attacks',
      damage: 12,
      bonusDexterity: 1,
      rarity: Rarity.COMMON,
      slot: Slot.ONE_HAND,
      requiredLevel: 1,
      weight: 1.0,
      value: 35,
      ownerId: adminUser.id,
      visibility: Visibility.PUBLIC,
      tags: {
        connect: [{ id: combatTag.id }, { id: stealthTag.id }],
      },
      bonusSkills: {
        connect: [{ id: stealthSkill.id }],
      },
    },
  })

  console.log('✅ Items created')

  // Create example characters
  const warriorCharacter = await prisma.character.create({
    data: {
      name: 'Thorin Ironbeard',
      sex: Sex.MALE,
      age: 85,
      description: 'A seasoned dwarf warrior with countless battles behind him',
      level: 5,
      experience: 1250,
      health: 140,
      mana: 60,
      stamina: 110,
      strength: 16,
      constitution: 18,
      dexterity: 8,
      intelligence: 10,
      wisdom: 12,
      charisma: 9,
      raceId: dwarfRace.id,
      archetypeId: warriorArchetype.id,
      ownerId: regularUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: swordSkill.id }],
      },
      perks: {
        connect: [{ id: toughnessPerk.id }],
      },
      tags: {
        connect: [{ id: combatTag.id }],
      },
      inventory: {
        connect: [{ id: ironSword.id }, { id: leatherArmor.id }, { id: healingPotion.id }],
      },
    },
  })

  const wizardCharacter = await prisma.character.create({
    data: {
      name: 'Elara Moonwhisper',
      sex: Sex.FEMALE,
      age: 150,
      description: 'An elven wizard devoted to the study of ancient magics',
      level: 4,
      experience: 800,
      health: 75,
      mana: 160,
      stamina: 95,
      strength: 7,
      constitution: 8,
      dexterity: 13,
      intelligence: 16,
      wisdom: 14,
      charisma: 12,
      imageId: images['elf']?.id,
      raceId: elfRace.id,
      archetypeId: wizardArchetype.id,
      ownerId: gameDesigner.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: magicMissileSkill.id }],
      },
      perks: {
        connect: [{ id: magicAffinityPerk.id }],
      },
      tags: {
        connect: [{ id: magicTag.id }],
      },
      inventory: {
        connect: [{ id: wizardStaff.id }, { id: healingPotion.id }],
      },
    },
  })

  const rogueCharacter = await prisma.character.create({
    data: {
      name: 'Pip Lightfingers',
      sex: Sex.MALE,
      age: 28,
      description: 'A quick-witted halfling rogue with nimble fingers',
      level: 3,
      experience: 450,
      health: 70,
      mana: 65,
      stamina: 130,
      strength: 8,
      constitution: 9,
      dexterity: 17,
      intelligence: 11,
      wisdom: 13,
      charisma: 14,
      imageId: images['halfling']?.id,
      raceId: halflingRace.id,
      archetypeId: rogueArchetype.id,
      ownerId: regularUser.id,
      visibility: Visibility.PUBLIC,
      skills: {
        connect: [{ id: stealthSkill.id }, { id: persuasionSkill.id }],
      },
      perks: {
        connect: [{ id: nimblePerk.id }, { id: charismaticPerk.id }],
      },
      tags: {
        connect: [{ id: stealthTag.id }, { id: socialTag.id }],
      },
      inventory: {
        connect: [{ id: thiefDagger.id }, { id: healingPotion.id }],
      },
    },
  })

  // Create equipment for warrior character
  await prisma.equipment.create({
    data: {
      characterId: warriorCharacter.id,
      chestId: leatherArmor.id,
      rightHandId: ironSword.id,
    },
  })

  // Create equipment for wizard character
  await prisma.equipment.create({
    data: {
      characterId: wizardCharacter.id,
      rightHandId: wizardStaff.id,
    },
  })

  // Create equipment for rogue character
  await prisma.equipment.create({
    data: {
      characterId: rogueCharacter.id,
      rightHandId: thiefDagger.id,
    },
  })

  console.log('✅ Characters and equipment created')

  console.log('\n🎉 Database seed completed successfully!')
  console.log('\n📊 Seed Summary:')
  console.log(`• Users: 4 (1 admin, 1 moderator, 2 regular users)`)
  console.log(`• Images: ${Object.keys(images).length} race/archetype images`)
  console.log(`• Tags: 5 category tags`)
  console.log(`• Races: 4 fantasy races`)
  console.log(`• Archetypes: 4 character classes`)
  console.log(`• Skills: 5 basic skills`)
  console.log(`• Perks: 4 character perks`)
  console.log(`• Items: 5 example items`)
  console.log(`• Characters: 3 example characters with equipment`)
  console.log('\n🔑 Test Accounts:')
  console.log('• Admin: admin@fantasy-api.com / admin123')
  console.log('• Moderator: moderator@fantasy-api.com / mod123')
  console.log('• User: user@fantasy-api.com / user123')
  console.log('• Designer: designer@fantasy-api.com / design123')
}

main()
  .catch(e => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
