-- Database Index Optimization Migration
-- This migration adds performance-optimized indexes based on query patterns analysis

-- =============================================================================
-- USER TABLE OPTIMIZATIONS
-- =============================================================================

-- Composite index for user filtering and sorting (role + isActive + createdAt)
CREATE INDEX IF NOT EXISTS "idx_users_role_active_created" ON "users" ("role", "isActive", "createdAt" DESC);

-- Composite index for user authentication and status (email + isActive + isEmailVerified)
CREATE INDEX IF NOT EXISTS "idx_users_email_status" ON "users" ("email", "isActive", "isEmailVerified");

-- Time-based queries optimization (createdAt range queries for statistics)
CREATE INDEX IF NOT EXISTS "idx_users_created_at_desc" ON "users" ("createdAt" DESC);

-- User search optimization (name with trigram for fuzzy search)
CREATE INDEX IF NOT EXISTS "idx_users_name_trgm" ON "users" USING gin ("name" gin_trgm_ops);

-- Last login tracking for user activity analysis
CREATE INDEX IF NOT EXISTS "idx_users_last_login" ON "users" ("lastLogin" DESC);

-- Moderation queries (banned users)
CREATE INDEX IF NOT EXISTS "idx_users_banned" ON "users" ("isBanned", "bannedUntil") WHERE "isBanned" = true;

-- =============================================================================
-- REFRESH TOKEN OPTIMIZATIONS
-- =============================================================================

-- Token lookup and cleanup (primary usage pattern)
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token_active" ON "refresh_tokens" ("token", "isRevoked", "expiresAt") WHERE "isRevoked" = false;

-- User session management (find all tokens for user)
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_active" ON "refresh_tokens" ("userId", "isRevoked", "expiresAt") WHERE "isRevoked" = false;

-- Cleanup expired tokens efficiently
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_cleanup" ON "refresh_tokens" ("expiresAt") WHERE "isRevoked" = false;

-- =============================================================================
-- CONTENT MODELS OPTIMIZATIONS (Images, Tags, Skills, etc.)
-- =============================================================================

-- Images: ownership and visibility filtering
CREATE INDEX IF NOT EXISTS "idx_images_owner_visibility" ON "images" ("ownerId", "visibility", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_images_visibility_created" ON "images" ("visibility", "createdAt" DESC) WHERE "visibility" = 'PUBLIC';

-- Tags: search and ownership
CREATE INDEX IF NOT EXISTS "idx_tags_owner_visibility" ON "tags" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_tags_name_trgm" ON "tags" USING gin ("name" gin_trgm_ops);

-- Skills: level-based filtering and ownership
CREATE INDEX IF NOT EXISTS "idx_skills_level_visibility" ON "skills" ("requiredLevel", "visibility", "ownerId");
CREATE INDEX IF NOT EXISTS "idx_skills_owner_visibility" ON "skills" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_skills_name_trgm" ON "skills" USING gin ("name" gin_trgm_ops);

-- Perks: similar to skills
CREATE INDEX IF NOT EXISTS "idx_perks_level_visibility" ON "perks" ("requiredLevel", "visibility", "ownerId");
CREATE INDEX IF NOT EXISTS "idx_perks_owner_visibility" ON "perks" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_perks_name_trgm" ON "perks" USING gin ("name" gin_trgm_ops);

-- Races: attribute modifiers and usage
CREATE INDEX IF NOT EXISTS "idx_races_owner_visibility" ON "races" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_races_modifiers" ON "races" ("strengthModifier", "constitutionModifier", "dexterityModifier");
CREATE INDEX IF NOT EXISTS "idx_races_name_trgm" ON "races" USING gin ("name" gin_trgm_ops);

-- Archetypes: ownership and race relationships
CREATE INDEX IF NOT EXISTS "idx_archetypes_owner_visibility" ON "archetypes" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_archetypes_name_trgm" ON "archetypes" USING gin ("name" gin_trgm_ops);

-- =============================================================================
-- ITEMS AND EQUIPMENT OPTIMIZATIONS
-- =============================================================================

-- Items: complex filtering by rarity, slot, level, and ownership
CREATE INDEX IF NOT EXISTS "idx_items_rarity_slot_level" ON "items" ("rarity", "slot", "requiredLevel", "visibility");
CREATE INDEX IF NOT EXISTS "idx_items_owner_visibility" ON "items" ("ownerId", "visibility", "name");
CREATE INDEX IF NOT EXISTS "idx_items_slot_level" ON "items" ("slot", "requiredLevel") WHERE "slot" != 'NONE';
CREATE INDEX IF NOT EXISTS "idx_items_name_trgm" ON "items" USING gin ("name" gin_trgm_ops);

-- Items: combat stats for equipment queries
CREATE INDEX IF NOT EXISTS "idx_items_combat_stats" ON "items" ("damage", "defense") WHERE "damage" IS NOT NULL OR "defense" IS NOT NULL;

-- Equipment: character equipment lookups (already has characterId index)
-- The existing @@index([characterId]) is sufficient for equipment queries

-- =============================================================================
-- CHARACTER SYSTEM OPTIMIZATIONS
-- =============================================================================

-- Characters: multi-column filtering and sorting
CREATE INDEX IF NOT EXISTS "idx_characters_owner_visibility" ON "characters" ("ownerId", "visibility", "level" DESC, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_characters_race_archetype" ON "characters" ("raceId", "archetypeId", "visibility");
CREATE INDEX IF NOT EXISTS "idx_characters_level_visibility" ON "characters" ("level", "visibility", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_characters_name_trgm" ON "characters" USING gin ("name" gin_trgm_ops);

-- Character stats for filtering and comparison
CREATE INDEX IF NOT EXISTS "idx_characters_stats" ON "characters" ("level", "experience", "strength", "constitution");

-- =============================================================================
-- MANY-TO-MANY RELATIONSHIP OPTIMIZATIONS
-- =============================================================================

-- Character Skills (implicit table from Prisma)
-- These will be automatically handled by Prisma's relation handling

-- Character Tags
-- These will be automatically handled by Prisma's relation handling

-- Character Inventory (items)
-- These will be automatically handled by Prisma's relation handling

-- =============================================================================
-- GENERAL PERFORMANCE OPTIMIZATIONS
-- =============================================================================

-- Enable trigram extension for fuzzy text search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Analyze tables to update statistics for query planner
ANALYZE "users";
ANALYZE "refresh_tokens";
ANALYZE "images";
ANALYZE "tags";
ANALYZE "races";
ANALYZE "archetypes";
ANALYZE "skills";
ANALYZE "perks";
ANALYZE "items";
ANALYZE "equipment";
ANALYZE "characters";

-- =============================================================================
-- NOTES ON INDEX STRATEGY
-- =============================================================================
-- 
-- 1. Composite indexes are ordered by selectivity (most selective first)
-- 2. Included common filter combinations based on actual query patterns
-- 3. Partial indexes for frequently filtered subsets (e.g., active users only)
-- 4. GIN indexes for full-text search on name fields using trigrams
-- 5. Time-based indexes for statistics and cleanup operations
-- 6. RBAC-aware indexes combining ownership and visibility
-- 
-- Query patterns covered:
-- - User filtering: role + isActive + email verification
-- - Content filtering: ownerId + visibility (RBAC pattern)
-- - Search: trigram indexes for fuzzy name matching
-- - Level filtering: requiredLevel ranges for skills/perks/items
-- - Time-based: createdAt ranges for statistics
-- - Equipment: slot-based item filtering
-- - Character building: race + archetype combinations
-- =============================================================================
