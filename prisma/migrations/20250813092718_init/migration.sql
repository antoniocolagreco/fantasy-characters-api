-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "bio" TEXT,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "lastPasswordChange" DATETIME,
    "lastLogin" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "profilePictureId" TEXT,
    CONSTRAINT "users_profilePictureId_fkey" FOREIGN KEY ("profilePictureId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blob" BLOB NOT NULL,
    "description" TEXT,
    "filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tags_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "races" (
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
    "createdById" TEXT,
    "imageId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "races_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "races_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "archetypes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "archetypes_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "archetypes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" INTEGER NOT NULL DEFAULT 1,
    "imageId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "skills_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "skills_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "perks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiredLevel" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "perks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
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
    "isArmor" BOOLEAN NOT NULL DEFAULT false,
    "isWeapon" BOOLEAN NOT NULL DEFAULT false,
    "is2Handed" BOOLEAN NOT NULL DEFAULT false,
    "isShield" BOOLEAN NOT NULL DEFAULT false,
    "isThrowable" BOOLEAN NOT NULL DEFAULT false,
    "isConsumable" BOOLEAN NOT NULL DEFAULT false,
    "isQuestItem" BOOLEAN NOT NULL DEFAULT false,
    "isTradeable" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "imageId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "items_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "userId" TEXT NOT NULL,
    "health" INTEGER NOT NULL DEFAULT 100,
    "mana" INTEGER NOT NULL DEFAULT 100,
    "stamina" INTEGER NOT NULL DEFAULT 100,
    "strength" INTEGER NOT NULL DEFAULT 10,
    "constitution" INTEGER NOT NULL DEFAULT 10,
    "dexterity" INTEGER NOT NULL DEFAULT 10,
    "intelligence" INTEGER NOT NULL DEFAULT 10,
    "wisdom" INTEGER NOT NULL DEFAULT 10,
    "charisma" INTEGER NOT NULL DEFAULT 10,
    "mainHandItemId" TEXT,
    "offHandItemId" TEXT,
    "headItemId" TEXT,
    "chestItemId" TEXT,
    "legsItemId" TEXT,
    "feetItemId" TEXT,
    "handsItemId" TEXT,
    "ring1ItemId" TEXT,
    "ring2ItemId" TEXT,
    "amuletItemId" TEXT,
    "beltItemId" TEXT,
    "backItemId" TEXT,
    "raceId" TEXT NOT NULL,
    "archetypeId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "characters_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "characters_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "characters_archetypeId_fkey" FOREIGN KEY ("archetypeId") REFERENCES "archetypes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "characters_mainHandItemId_fkey" FOREIGN KEY ("mainHandItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_offHandItemId_fkey" FOREIGN KEY ("offHandItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_headItemId_fkey" FOREIGN KEY ("headItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_chestItemId_fkey" FOREIGN KEY ("chestItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_legsItemId_fkey" FOREIGN KEY ("legsItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_feetItemId_fkey" FOREIGN KEY ("feetItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_handsItemId_fkey" FOREIGN KEY ("handsItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_ring1ItemId_fkey" FOREIGN KEY ("ring1ItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_ring2ItemId_fkey" FOREIGN KEY ("ring2ItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_amuletItemId_fkey" FOREIGN KEY ("amuletItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_beltItemId_fkey" FOREIGN KEY ("beltItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "characters_backItemId_fkey" FOREIGN KEY ("backItemId") REFERENCES "items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RaceSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RaceSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "races" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RaceSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RaceTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RaceTags_A_fkey" FOREIGN KEY ("A") REFERENCES "races" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RaceTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArchetypeSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArchetypeSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "archetypes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArchetypeSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArchetypeRequiredRaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArchetypeRequiredRaces_A_fkey" FOREIGN KEY ("A") REFERENCES "archetypes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArchetypeRequiredRaces_B_fkey" FOREIGN KEY ("B") REFERENCES "races" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArchetypeTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArchetypeTags_A_fkey" FOREIGN KEY ("A") REFERENCES "archetypes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArchetypeTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SkillTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SkillTags_A_fkey" FOREIGN KEY ("A") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SkillTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_PerkTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PerkTags_A_fkey" FOREIGN KEY ("A") REFERENCES "perks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PerkTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ItemBonusSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ItemBonusSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ItemBonusSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ItemBonusPerks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ItemBonusPerks_A_fkey" FOREIGN KEY ("A") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ItemBonusPerks_B_fkey" FOREIGN KEY ("B") REFERENCES "perks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ItemTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ItemTags_A_fkey" FOREIGN KEY ("A") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ItemTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterInventory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterInventory_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterInventory_B_fkey" FOREIGN KEY ("B") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterPerks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterPerks_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterPerks_B_fkey" FOREIGN KEY ("B") REFERENCES "perks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CharacterTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterTags_A_fkey" FOREIGN KEY ("A") REFERENCES "characters" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_profilePictureId_key" ON "users"("profilePictureId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_displayName_idx" ON "users"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "races_name_key" ON "races"("name");

-- CreateIndex
CREATE INDEX "races_name_idx" ON "races"("name");

-- CreateIndex
CREATE UNIQUE INDEX "archetypes_name_key" ON "archetypes"("name");

-- CreateIndex
CREATE INDEX "archetypes_name_idx" ON "archetypes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "perks_name_key" ON "perks"("name");

-- CreateIndex
CREATE INDEX "perks_name_idx" ON "perks"("name");

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");

-- CreateIndex
CREATE INDEX "items_name_idx" ON "items"("name");

-- CreateIndex
CREATE INDEX "items_rarity_idx" ON "items"("rarity");

-- CreateIndex
CREATE INDEX "items_slot_idx" ON "items"("slot");

-- CreateIndex
CREATE INDEX "items_requiredLevel_idx" ON "items"("requiredLevel");

-- CreateIndex
CREATE UNIQUE INDEX "characters_name_key" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_name_idx" ON "characters"("name");

-- CreateIndex
CREATE INDEX "characters_raceId_idx" ON "characters"("raceId");

-- CreateIndex
CREATE INDEX "characters_archetypeId_idx" ON "characters"("archetypeId");

-- CreateIndex
CREATE INDEX "characters_level_idx" ON "characters"("level");

-- CreateIndex
CREATE INDEX "characters_isPublic_idx" ON "characters"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "_RaceSkills_AB_unique" ON "_RaceSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_RaceSkills_B_index" ON "_RaceSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RaceTags_AB_unique" ON "_RaceTags"("A", "B");

-- CreateIndex
CREATE INDEX "_RaceTags_B_index" ON "_RaceTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArchetypeSkills_AB_unique" ON "_ArchetypeSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_ArchetypeSkills_B_index" ON "_ArchetypeSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArchetypeRequiredRaces_AB_unique" ON "_ArchetypeRequiredRaces"("A", "B");

-- CreateIndex
CREATE INDEX "_ArchetypeRequiredRaces_B_index" ON "_ArchetypeRequiredRaces"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArchetypeTags_AB_unique" ON "_ArchetypeTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ArchetypeTags_B_index" ON "_ArchetypeTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_SkillTags_AB_unique" ON "_SkillTags"("A", "B");

-- CreateIndex
CREATE INDEX "_SkillTags_B_index" ON "_SkillTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PerkTags_AB_unique" ON "_PerkTags"("A", "B");

-- CreateIndex
CREATE INDEX "_PerkTags_B_index" ON "_PerkTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ItemBonusSkills_AB_unique" ON "_ItemBonusSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemBonusSkills_B_index" ON "_ItemBonusSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ItemBonusPerks_AB_unique" ON "_ItemBonusPerks"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemBonusPerks_B_index" ON "_ItemBonusPerks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ItemTags_AB_unique" ON "_ItemTags"("A", "B");

-- CreateIndex
CREATE INDEX "_ItemTags_B_index" ON "_ItemTags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterInventory_AB_unique" ON "_CharacterInventory"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterInventory_B_index" ON "_CharacterInventory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterSkills_AB_unique" ON "_CharacterSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterSkills_B_index" ON "_CharacterSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterPerks_AB_unique" ON "_CharacterPerks"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterPerks_B_index" ON "_CharacterPerks"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterTags_AB_unique" ON "_CharacterTags"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterTags_B_index" ON "_CharacterTags"("B");
