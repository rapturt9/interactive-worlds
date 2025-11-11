/**
 * Map Tile Manager
 *
 * Handles caching, storage, and retrieval of generated map tiles
 * Ensures efficient use of the image generation API by avoiding duplicate generations
 */

import type { MapTile, TileCoordinate, BiomeType } from './map-tile-generator';

export interface TileCache {
  tiles: Map<string, MapTile>;
  getByCoordinate(coord: TileCoordinate): MapTile | null;
  getByHash(hash: string): MapTile | null;
  set(tile: MapTile): void;
  clear(): void;
}

/**
 * In-memory tile cache
 */
class InMemoryTileCache implements TileCache {
  tiles: Map<string, MapTile>;
  private coordinateIndex: Map<string, string>; // coordinate key -> tile ID
  private hashIndex: Map<string, string>; // image hash -> tile ID

  constructor() {
    this.tiles = new Map();
    this.coordinateIndex = new Map();
    this.hashIndex = new Map();
  }

  private coordToKey(coord: TileCoordinate): string {
    return `${coord.x},${coord.y}`;
  }

  getByCoordinate(coord: TileCoordinate): MapTile | null {
    const key = this.coordToKey(coord);
    const tileId = this.coordinateIndex.get(key);
    if (!tileId) return null;
    return this.tiles.get(tileId) || null;
  }

  getByHash(hash: string): MapTile | null {
    const tileId = this.hashIndex.get(hash);
    if (!tileId) return null;
    return this.tiles.get(tileId) || null;
  }

  set(tile: MapTile): void {
    this.tiles.set(tile.id, tile);
    this.coordinateIndex.set(this.coordToKey(tile.coordinate), tile.id);
    if (tile.imageHash) {
      this.hashIndex.set(tile.imageHash, tile.id);
    }
  }

  clear(): void {
    this.tiles.clear();
    this.coordinateIndex.clear();
    this.hashIndex.clear();
  }

  size(): number {
    return this.tiles.size;
  }

  getAllTiles(): MapTile[] {
    return Array.from(this.tiles.values());
  }
}

/**
 * Tile Manager - Main interface for managing map tiles
 */
export class TileManager {
  private cache: TileCache;
  private worldSeed: string;

  constructor(worldSeed: string = 'default', cache?: TileCache) {
    this.worldSeed = worldSeed;
    this.cache = cache || new InMemoryTileCache();
  }

  /**
   * Get or generate a tile at the specified coordinate
   */
  async getTile(
    coordinate: TileCoordinate,
    biome?: BiomeType,
    forceRegenerate: boolean = false
  ): Promise<MapTile> {
    // Check cache first
    if (!forceRegenerate) {
      const cached = this.cache.getByCoordinate(coordinate);
      if (cached) {
        console.log(`📦 Using cached tile at (${coordinate.x}, ${coordinate.y})`);
        return cached;
      }
    }

    // Generate new tile
    console.log(`🎨 Generating new tile at (${coordinate.x}, ${coordinate.y})`);

    // Get adjacent tiles for better continuity
    const adjacentTiles = this.getAdjacentTiles(coordinate);

    // Determine biome (use provided or infer from neighbors)
    const determinedBiome = biome || this.inferBiomeFromNeighbors(adjacentTiles);

    // TODO: Call actual tile generation function
    // const tile = await generateMapTile({
    //   biome: determinedBiome,
    //   coordinate,
    //   worldSeed: this.worldSeed,
    //   adjacentTiles
    // });

    // Placeholder tile
    const tile: MapTile = {
      id: `tile_${coordinate.x}_${coordinate.y}`,
      coordinate,
      biome: determinedBiome,
      prompt: `Generated tile for ${determinedBiome} at (${coordinate.x}, ${coordinate.y})`,
      createdAt: new Date(),
      adjacentTiles: {}
    };

    // Cache the new tile
    this.cache.set(tile);

    return tile;
  }

  /**
   * Get tiles surrounding a coordinate
   */
  getAdjacentTiles(coordinate: TileCoordinate): Partial<Record<'north' | 'south' | 'east' | 'west', MapTile>> {
    return {
      north: this.cache.getByCoordinate({ x: coordinate.x, y: coordinate.y - 1 }) || undefined,
      south: this.cache.getByCoordinate({ x: coordinate.x, y: coordinate.y + 1 }) || undefined,
      east: this.cache.getByCoordinate({ x: coordinate.x + 1, y: coordinate.y }) || undefined,
      west: this.cache.getByCoordinate({ x: coordinate.x - 1, y: coordinate.y }) || undefined
    };
  }

  /**
   * Infer biome based on neighboring tiles (for smooth transitions)
   */
  inferBiomeFromNeighbors(adjacentTiles: Partial<Record<string, MapTile>>): BiomeType {
    const biomes = Object.values(adjacentTiles)
      .filter(tile => tile !== undefined)
      .map(tile => tile!.biome);

    if (biomes.length === 0) return 'forest'; // default

    // Return most common biome among neighbors
    const biomeCount = new Map<BiomeType, number>();
    biomes.forEach(biome => {
      biomeCount.set(biome, (biomeCount.get(biome) || 0) + 1);
    });

    let maxCount = 0;
    let dominantBiome: BiomeType = 'forest';
    biomeCount.forEach((count, biome) => {
      if (count > maxCount) {
        maxCount = count;
        dominantBiome = biome;
      }
    });

    return dominantBiome;
  }

  /**
   * Get a region of tiles (for rendering a larger map view)
   */
  async getRegion(
    centerCoordinate: TileCoordinate,
    radiusX: number,
    radiusY: number
  ): Promise<MapTile[][]> {
    const tiles: MapTile[][] = [];

    for (let y = centerCoordinate.y - radiusY; y <= centerCoordinate.y + radiusY; y++) {
      const row: MapTile[] = [];
      for (let x = centerCoordinate.x - radiusX; x <= centerCoordinate.x + radiusX; x++) {
        const tile = await this.getTile({ x, y });
        row.push(tile);
      }
      tiles.push(row);
    }

    return tiles;
  }

  /**
   * Pre-generate tiles around a coordinate (for smoother UX)
   */
  async prefetchSurrounding(
    coordinate: TileCoordinate,
    radius: number = 1
  ): Promise<void> {
    const promises: Promise<MapTile>[] = [];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue; // skip center

        const coord = {
          x: coordinate.x + dx,
          y: coordinate.y + dy
        };

        // Only prefetch if not already cached
        if (!this.cache.getByCoordinate(coord)) {
          promises.push(this.getTile(coord));
        }
      }
    }

    await Promise.all(promises);
    console.log(`✅ Prefetched ${promises.length} tiles around (${coordinate.x}, ${coordinate.y})`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const allTiles = (this.cache as InMemoryTileCache).getAllTiles();
    const biomeCount = new Map<BiomeType, number>();

    allTiles.forEach(tile => {
      biomeCount.set(tile.biome, (biomeCount.get(tile.biome) || 0) + 1);
    });

    return {
      totalTiles: (this.cache as InMemoryTileCache).size(),
      biomeDistribution: Object.fromEntries(biomeCount),
      cacheHitRate: 0 // TODO: track this
    };
  }

  /**
   * Export world state (for saving)
   */
  exportWorld(): {
    worldSeed: string;
    tiles: MapTile[];
  } {
    return {
      worldSeed: this.worldSeed,
      tiles: (this.cache as InMemoryTileCache).getAllTiles()
    };
  }

  /**
   * Import world state (for loading)
   */
  importWorld(data: { worldSeed: string; tiles: MapTile[] }): void {
    this.worldSeed = data.worldSeed;
    this.cache.clear();
    data.tiles.forEach(tile => this.cache.set(tile));
    console.log(`📥 Imported ${data.tiles.length} tiles for world "${data.worldSeed}"`);
  }

  /**
   * Clear all cached tiles
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

/**
 * Database-backed tile cache (for persistence)
 * This would integrate with your existing PostgreSQL database
 */
export class DatabaseTileCache implements TileCache {
  tiles: Map<string, MapTile>;

  constructor() {
    this.tiles = new Map();
    // TODO: Initialize database connection
  }

  async getByCoordinate(coord: TileCoordinate): Promise<MapTile | null> {
    // TODO: Query database
    // SELECT * FROM map_tiles WHERE x = ? AND y = ?
    return null;
  }

  async getByHash(hash: string): Promise<MapTile | null> {
    // TODO: Query database
    // SELECT * FROM map_tiles WHERE image_hash = ?
    return null;
  }

  async set(tile: MapTile): Promise<void> {
    // TODO: Insert/update in database
    // INSERT INTO map_tiles (...) VALUES (...) ON CONFLICT UPDATE
    this.tiles.set(tile.id, tile);
  }

  async clear(): Promise<void> {
    // TODO: Clear database table
    this.tiles.clear();
  }
}

/**
 * World-aware tile manager
 * Integrates with the existing story/world state
 */
export class WorldIntegratedTileManager extends TileManager {
  private worldId: string;

  constructor(worldId: string, worldSeed: string) {
    super(worldSeed);
    this.worldId = worldId;
  }

  /**
   * Generate a tile based on the current story context
   */
  async getTileForLocation(
    locationName: string,
    locationDescription: string
  ): Promise<MapTile> {
    // TODO: Use AI to analyze location description and determine:
    // 1. Appropriate biome
    // 2. Points of interest to include
    // 3. Style and mood

    // For now, use a simple mapping
    const coordinate = this.locationToCoordinate(locationName);

    return this.getTile(coordinate);
  }

  /**
   * Convert a location name to a deterministic coordinate
   */
  private locationToCoordinate(locationName: string): TileCoordinate {
    // Simple hash-based coordinate generation
    // In production, maintain a location -> coordinate mapping in the database

    let hash = 0;
    for (let i = 0; i < locationName.length; i++) {
      hash = ((hash << 5) - hash) + locationName.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    return {
      x: Math.abs(hash % 1000),
      y: Math.abs(Math.floor(hash / 1000) % 1000)
    };
  }
}

// Export singleton instance for easy use
let defaultManager: TileManager | null = null;

export function getDefaultTileManager(worldSeed?: string): TileManager {
  if (!defaultManager) {
    defaultManager = new TileManager(worldSeed);
  }
  return defaultManager;
}
