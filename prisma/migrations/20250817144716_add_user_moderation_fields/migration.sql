/*
  Warnings:

  - You are about to drop the column `createdById` on the `archetypes` table. All the data in the column will be lost.
  - You are about to drop the column `amuletItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `backItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `beltItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `chestItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `feetItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `handsItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `headItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `legsItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `mainHandItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `offHandItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `ring1ItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `ring2ItemId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `characters` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `images` table. All the data in the column will be lost.
  - You are about to drop the column `isArmor` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `isShield` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `isWeapon` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `perks` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `races` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `skills` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `users` table. All the data in the column will be lost.
  - Added the required column `ownerId` to the `characters` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "headId" TEXT,
    "faceId" TEXT,
    "chestId" TEXT,
    "legsId" TEXT,
    "feetId" TEXT,
    "handsId" TEXT,
    "rightHandId" TEXT,
    "leftHandId" TEXT,
    "rightRingId" TEXT,
    "leftRingId" TEXT,
    "amuletId" TEXT,
    "beltId" TEXT,
    "backpackId" TEXT,
    "cloakId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "equipment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "equipment_headId_fkey" FOREIGN KEY ("headId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_faceId_fkey" FOREIGN KEY ("faceId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_chestId_fkey" FOREIGN KEY ("chestId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_legsId_fkey" FOREIGN KEY ("legsId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_feetId_fkey" FOREIGN KEY ("feetId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_handsId_fkey" FOREIGN KEY ("handsId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_rightHandId_fkey" FOREIGN KEY ("rightHandId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_leftHandId_fkey" FOREIGN KEY ("leftHandId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_rightRingId_fkey" FOREIGN KEY ("rightRingId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_leftRingId_fkey" FOREIGN KEY ("leftRingId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_amuletId_fkey" FOREIGN KEY ("amuletId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_beltId_fkey" FOREIGN KEY ("beltId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_backpackId_fkey" FOREIGN KEY ("backpackId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "equipment_cloakId_fkey" FOREIGN KEY ("cloakId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_archetypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageId" TEXT,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "archetypes_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "archetypes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_archetypes" ("createdAt", "description", "id", "imageId", "name", "updatedAt") SELECT "createdAt", "description", "id", "imageId", "name", "updatedAt" FROM "archetypes";
DROP TABLE "archetypes";
ALTER TABLE "new_archetypes" RENAME TO "archetypes";
CREATE UNIQUE INDEX "archetypes_name_key" ON "archetypes"("name");
CREATE INDEX "archetypes_name_idx" ON "archetypes"("name");
CREATE INDEX "archetypes_ownerId_idx" ON "archetypes"("ownerId");
CREATE INDEX "archetypes_visibility_idx" ON "archetypes"("visibility");
CREATE TABLE "new_characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sex" TEXT NOT NULL DEFAULT 'MALE',
    "age" INTEGER NOT NULL DEFAULT 18,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "ownerId" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "mana" INTEGER NOT NULL DEFAULT 100,
    "stamina" INTEGER NOT NULL DEFAULT 100,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "raceId" TEXT NOT NULL,
    "archetypeId" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "characters_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "characters_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "characters_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_characters" ("archetypeId", "charisma", "constitution", "createdAt", "description", "dexterity", "experience", "health", "id", "imageId", "intelligence", "level", "mana", "name", "raceId", "stamina", "strength", "updatedAt", "wisdom") SELECT "archetypeId", "charisma", "constitution", "createdAt", "description", "dexterity", "experience", "health", "id", "imageId", "intelligence", "level", "mana", "name", "raceId", "stamina", "strength", "updatedAt", "wisdom" FROM "characters";
DROP TABLE "characters";
ALTER TABLE "new_characters" RENAME TO "characters";
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");
CREATE INDEX "characters_name_idx" ON "characters"("name");
CREATE INDEX "characters_raceId_idx" ON "characters"("raceId");
CREATE INDEX "characters_archetypeId_idx" ON "characters"("archetypeId");
CREATE INDEX "characters_level_idx" ON "characters"("level");
CREATE INDEX "characters_ownerId_idx" ON "characters"("ownerId");
CREATE INDEX "characters_visibility_idx" ON "characters"("visibility");
CREATE TABLE "new_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "images_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_images" ("blob", "createdAt", "description", "filename", "height", "id", "mimeType", "size", "updatedAt", "width") SELECT "blob", "createdAt", "description", "filename", "height", "id", "mimeType", "size", "updatedAt", "width" FROM "images";
DROP TABLE "images";
ALTER TABLE "new_images" RENAME TO "images";
CREATE INDEX "images_ownerId_idx" ON "images"("ownerId");
CREATE INDEX "images_visibility_idx" ON "images"("visibility");
CREATE TABLE "new_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bonusHealth" INTEGER,
    "bonusMana" INTEGER,
    "bonusStamina" INTEGER,
    "bonusStrength" INTEGER,
    "bonusConstitution" INTEGER,
    "bonusDexterity" INTEGER,
    "bonusIntelligence" INTEGER,
    "bonusWisdom" INTEGER,
    "bonusCharisma" INTEGER,
    "damage" INTEGER,
    "defense" INTEGER,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "slot" TEXT NOT NULL DEFAULT 'NONE',
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "durability" INTEGER NOT NULL DEFAULT 100,
    "maxDurability" INTEGER NOT NULL DEFAULT 100,
    "value" INTEGER NOT NULL DEFAULT 0,
    "is2Handed" BOOLEAN NOT NULL DEFAULT false,
    "isThrowable" BOOLEAN NOT NULL DEFAULT false,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "isQuestItem" BOOLEAN NOT NULL DEFAULT false,
    "isTradeable" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "imageId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "items_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_items" ("bonusCharisma", "bonusConstitution", "bonusDexterity", "bonusHealth", "bonusIntelligence", "bonusMana", "bonusStamina", "bonusStrength", "bonusWisdom", "createdAt", "damage", "defense", "description", "durability", "id", "imageId", "is2Handed", "isConsumable", "isQuestItem", "isThrowable", "isTradeable", "maxDurability", "name", "rarity", "requiredLevel", "slot", "updatedAt", "value", "weight") SELECT "bonusCharisma", "bonusConstitution", "bonusDexterity", "bonusHealth", "bonusIntelligence", "bonusMana", "bonusStamina", "bonusStrength", "bonusWisdom", "createdAt", "damage", "defense", "description", "durability", "id", "imageId", "is2Handed", "isConsumable", "isQuestItem", "isThrowable", "isTradeable", "maxDurability", "name", "rarity", "requiredLevel", "slot", "updatedAt", "value", "weight" FROM "items";
DROP TABLE "items";
ALTER TABLE "new_items" RENAME TO "items";
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");
CREATE INDEX "items_name_idx" ON "items"("name");
CREATE INDEX "items_rarity_idx" ON "items"("rarity");
CREATE INDEX "items_slot_idx" ON "items"("slot");
CREATE INDEX "items_requiredLevel_idx" ON "items"("requiredLevel");
CREATE INDEX "items_ownerId_idx" ON "items"("ownerId");
CREATE INDEX "items_visibility_idx" ON "items"("visibility");
CREATE TABLE "new_perks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "perks_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "perks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_perks" ("createdAt", "description", "id", "name", "requiredLevel", "updatedAt") SELECT "createdAt", "description", "id", "name", "requiredLevel", "updatedAt" FROM "perks";
DROP TABLE "perks";
ALTER TABLE "new_perks" RENAME TO "perks";
CREATE UNIQUE INDEX "perks_name_key" ON "perks"("name");
CREATE INDEX "perks_name_idx" ON "perks"("name");
CREATE INDEX "perks_ownerId_idx" ON "perks"("ownerId");
CREATE INDEX "perks_visibility_idx" ON "perks"("visibility");
CREATE TABLE "new_races" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "healthModifier" INTEGER NOT NULL DEFAULT 100,
    "manaModifier" INTEGER NOT NULL DEFAULT 100,
    "staminaModifier" INTEGER NOT NULL DEFAULT 100,
    "strengthModifier" INTEGER NOT NULL DEFAULT 10,
    "constitutionModifier" INTEGER NOT NULL DEFAULT 10,
    "dexterityModifier" INTEGER NOT NULL DEFAULT 10,
    "intelligenceModifier" INTEGER NOT NULL DEFAULT 10,
    "wisdomModifier" INTEGER NOT NULL DEFAULT 10,
    "charismaModifier" INTEGER NOT NULL DEFAULT 10,
    "ownerId" TEXT,
    "imageId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "races_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "races_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_races" ("charismaModifier", "constitutionModifier", "createdAt", "description", "dexterityModifier", "healthModifier", "id", "imageId", "intelligenceModifier", "manaModifier", "name", "staminaModifier", "strengthModifier", "updatedAt", "wisdomModifier") SELECT "charismaModifier", "constitutionModifier", "createdAt", "description", "dexterityModifier", "healthModifier", "id", "imageId", "intelligenceModifier", "manaModifier", "name", "staminaModifier", "strengthModifier", "updatedAt", "wisdomModifier" FROM "races";
DROP TABLE "races";
ALTER TABLE "new_races" RENAME TO "races";
CREATE UNIQUE INDEX "races_name_key" ON "races"("name");
CREATE INDEX "races_name_idx" ON "races"("name");
CREATE INDEX "races_ownerId_idx" ON "races"("ownerId");
CREATE INDEX "races_visibility_idx" ON "races"("visibility");
CREATE TABLE "new_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "imageId" TEXT,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "skills_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "skills_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_skills" ("createdAt", "description", "id", "imageId", "name", "requiredLevel", "updatedAt") SELECT "createdAt", "description", "id", "imageId", "name", "requiredLevel", "updatedAt" FROM "skills";
DROP TABLE "skills";
ALTER TABLE "new_skills" RENAME TO "skills";
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");
CREATE INDEX "skills_name_idx" ON "skills"("name");
CREATE INDEX "skills_ownerId_idx" ON "skills"("ownerId");
CREATE INDEX "skills_visibility_idx" ON "skills"("visibility");
CREATE TABLE "new_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tags_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tags" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "tags";
DROP TABLE "tags";
ALTER TABLE "new_tags" RENAME TO "tags";
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
CREATE INDEX "tags_name_idx" ON "tags"("name");
CREATE INDEX "tags_ownerId_idx" ON "tags"("ownerId");
CREATE INDEX "tags_visibility_idx" ON "tags"("visibility");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "name" TEXT,
    "bio" TEXT,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "lastPasswordChange" DATETIME,
    "lastLogin" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "bannedUntil" DATETIME,
    "bannedById" TEXT,
    "profilePictureId" TEXT,
    CONSTRAINT "users_profilePictureId_fkey" FOREIGN KEY ("profilePictureId") REFERENCES "images" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("bio", "createdAt", "email", "id", "isActive", "isEmailVerified", "lastLogin", "lastPasswordChange", "oauthId", "oauthProvider", "passwordHash", "profilePictureId", "role", "updatedAt") SELECT "bio", "createdAt", "email", "id", "isActive", "isEmailVerified", "lastLogin", "lastPasswordChange", "oauthId", "oauthProvider", "passwordHash", "profilePictureId", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_profilePictureId_key" ON "users"("profilePictureId");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_name_idx" ON "users"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "equipment_characterId_key" ON "equipment"("characterId");

-- CreateIndex
CREATE INDEX "equipment_characterId_idx" ON "equipment"("characterId");
