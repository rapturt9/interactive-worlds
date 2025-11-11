/**
 * Database Schema Extension: Map Tiles
 *
 * Extends the existing schema to support visual map tile storage and caching
 *
 * To apply this schema:
 * 1. Merge with existing schema in lib/db/schema.ts
 * 2. Run: npx drizzle-kit generate
 * 3. Run: npx drizzle-kit migrate
 */

import { pgTable, text, integer, timestamp, index, unique, jsonb, vector } from 'drizzle-orm/pg-core';

/**
 * Map Tiles Table
 * Stores generated visual map tiles with caching and deduplication
 */
export const mapTiles = pgTable('map_tiles', {
  // Primary key
  id: text('id').primaryKey(),

  // Coordinate in the infinite world
  x: integer('x').notNull(),
  y: integer('y').notNull(),

  // World association (links to your existing worlds/games)
  worldId: text('world_id'),
  worldSeed: text('world_seed'),

  // Tile properties
  biome: text('biome').notNull(), // BiomeType enum

  // Image data
  imageUrl: text('image_url'), // Base64 data URL or S3/CDN URL
  imageHash: text('image_hash'), // Hash for deduplication

  // Generation details
  prompt: text('prompt').notNull(),
  model: text('model').default('openai/gpt-5-image-mini'),

  // Adjacency information (for seamless tiling)
  adjacentTiles: jsonb('adjacent_tiles').$type<{
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  }>(),

  // Metadata
  pointsOfInterest: jsonb('points_of_interest').$type<string[]>(),
  customData: jsonb('custom_data'), // Flexible field for additional data

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at'),

  // Stats
  accessCount: integer('access_count').default(0),

  // For future RAG integration - store tile description for semantic search
  descriptionEmbedding: vector('description_embedding', { dimensions: 1536 })
}, (table) => ({
  // Indexes for efficient queries
  coordinateIdx: index('map_tiles_coordinate_idx').on(table.x, table.y),
  worldIdx: index('map_tiles_world_idx').on(table.worldId),
  worldSeedIdx: index('map_tiles_world_seed_idx').on(table.worldSeed),
  biomeIdx: index('map_tiles_biome_idx').on(table.biome),
  hashIdx: index('map_tiles_hash_idx').on(table.imageHash),

  // Unique constraint on coordinate per world
  uniqueCoordinate: unique('map_tiles_unique_coordinate').on(table.worldId, table.x, table.y),

  // Index for finding tiles by hash (deduplication)
  uniqueHash: unique('map_tiles_unique_hash').on(table.imageHash)
}));

/**
 * Map Tile Access Log
 * Tracks when tiles are viewed/accessed for cache management
 */
export const mapTileAccessLog = pgTable('map_tile_access_log', {
  id: text('id').primaryKey(),
  tileId: text('tile_id').notNull().references(() => mapTiles.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  userId: text('user_id'),
  accessedAt: timestamp('accessed_at').notNull().defaultNow(),

  // Context of access
  context: jsonb('context').$type<{
    playerPosition?: { x: number; y: number };
    viewportSize?: { width: number; height: number };
    deviceType?: string;
  }>()
}, (table) => ({
  tileIdx: index('map_tile_access_log_tile_idx').on(table.tileId),
  timeIdx: index('map_tile_access_log_time_idx').on(table.accessedAt)
}));

/**
 * World Regions
 * Define named regions in the world with specific characteristics
 */
export const worldRegions = pgTable('world_regions', {
  id: text('id').primaryKey(),
  worldId: text('world_id').notNull(),

  name: text('name').notNull(), // e.g., "Whispering Woods", "Desert of Doom"
  description: text('description'),

  // Bounding box
  minX: integer('min_x').notNull(),
  minY: integer('min_y').notNull(),
  maxX: integer('max_x').notNull(),
  maxY: integer('max_y').notNull(),

  // Region properties
  dominantBiome: text('dominant_biome').notNull(),
  dangerLevel: integer('danger_level').default(1), // 1-10 scale

  // Generation rules for this region
  generationRules: jsonb('generation_rules').$type<{
    biomeDistribution?: Record<string, number>;
    pointsOfInterest?: string[];
    specialFeatures?: string[];
    mood?: string;
    weatherEffects?: string[];
  }>(),

  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  worldIdx: index('world_regions_world_idx').on(table.worldId),
  boundsIdx: index('world_regions_bounds_idx').on(table.minX, table.minY, table.maxX, table.maxY)
}));

/**
 * Biome Transitions
 * Define how different biomes blend together
 */
export const biomeTransitions = pgTable('biome_transitions', {
  id: text('id').primaryKey(),
  worldId: text('world_id'),

  fromBiome: text('from_biome').notNull(),
  toBiome: text('to_biome').notNull(),

  // Transition configuration
  transitionStyle: text('transition_style').default('gradual'), // gradual, sharp, coastal
  transitionWidth: integer('transition_width').default(1), // in tiles

  // Custom prompt additions for this transition
  promptModifier: text('prompt_modifier'),

  // Example transition tile reference
  exampleTileId: text('example_tile_id').references(() => mapTiles.id),

  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  fromBiomeIdx: index('biome_transitions_from_idx').on(table.fromBiome),
  toBiomeIdx: index('biome_transitions_to_idx').on(table.toBiome),
  uniqueTransition: unique('biome_transitions_unique').on(table.worldId, table.fromBiome, table.toBiome)
}));

/**
 * Points of Interest
 * Special locations on the map (towns, dungeons, landmarks)
 */
export const pointsOfInterest = pgTable('points_of_interest', {
  id: text('id').primaryKey(),
  worldId: text('world_id').notNull(),

  // Location
  x: integer('x').notNull(),
  y: integer('y').notNull(),
  tileId: text('tile_id').references(() => mapTiles.id),

  // POI details
  name: text('name').notNull(),
  type: text('type').notNull(), // town, dungeon, landmark, quest_location, etc.
  description: text('description'),

  // Integration with story system
  linkedLocationId: text('linked_location_id'), // Reference to story location

  // Visual representation
  iconUrl: text('icon_url'),
  markerStyle: jsonb('marker_style').$type<{
    color?: string;
    icon?: string;
    size?: number;
  }>(),

  // Discovery and visibility
  isDiscovered: integer('is_discovered').default(0), // boolean
  visibleOnMap: integer('visible_on_map').default(1), // boolean

  createdAt: timestamp('created_at').notNull().defaultNow()
}, (table) => ({
  worldIdx: index('points_of_interest_world_idx').on(table.worldId),
  coordinateIdx: index('points_of_interest_coordinate_idx').on(table.x, table.y),
  typeIdx: index('points_of_interest_type_idx').on(table.type)
}));

// Types for TypeScript
export type MapTile = typeof mapTiles.$inferSelect;
export type NewMapTile = typeof mapTiles.$inferInsert;

export type WorldRegion = typeof worldRegions.$inferSelect;
export type NewWorldRegion = typeof worldRegions.$inferInsert;

export type BiomeTransition = typeof biomeTransitions.$inferSelect;
export type NewBiomeTransition = typeof biomeTransitions.$inferInsert;

export type PointOfInterest = typeof pointsOfInterest.$inferSelect;
export type NewPointOfInterest = typeof pointsOfInterest.$inferInsert;

/**
 * Example queries for the tile system
 */

/*
-- Get a tile at specific coordinates
SELECT * FROM map_tiles
WHERE world_id = ? AND x = ? AND y = ?;

-- Get all tiles in a region
SELECT * FROM map_tiles
WHERE world_id = ?
  AND x BETWEEN ? AND ?
  AND y BETWEEN ? AND ?;

-- Find duplicate tiles (same hash)
SELECT image_hash, COUNT(*) as count
FROM map_tiles
GROUP BY image_hash
HAVING COUNT(*) > 1;

-- Get most accessed tiles (for cache prioritization)
SELECT t.*, COUNT(l.id) as access_count
FROM map_tiles t
LEFT JOIN map_tile_access_log l ON t.id = l.tile_id
WHERE t.world_id = ?
GROUP BY t.id
ORDER BY access_count DESC
LIMIT 100;

-- Get all POIs in a region
SELECT * FROM points_of_interest
WHERE world_id = ?
  AND x BETWEEN ? AND ?
  AND y BETWEEN ? AND ?
  AND is_discovered = 1;

-- Find tiles that need regeneration (old or rarely accessed)
SELECT * FROM map_tiles
WHERE world_id = ?
  AND last_accessed_at < NOW() - INTERVAL '30 days'
  AND access_count < 5
ORDER BY last_accessed_at ASC;
*/
