# Visual World Integration Guide

This document explains how to integrate the visual map generation system with the existing Interactive Worlds text-based story engine.

## Overview

The visual world system runs in parallel with the text-based story system, providing:
- **Top-down 2D RPG map visualization** of the story world
- **Infinite procedural map generation** using AI inpainting/outpainting
- **Seamless integration** with existing story locations and world state
- **Efficient caching** to minimize API costs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Interactive Worlds                        │
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────┐     │
│  │  Story Engine      │         │  Visual World       │     │
│  │  (Text-based)      │◄────────┤  System             │     │
│  │                    │         │  (Image-based)      │     │
│  │  - Narrative       │         │  - Map Tiles        │     │
│  │  - Entity Graph    │ Sync    │  - Biomes           │     │
│  │  - Story Bible     │────────►│  - POIs             │     │
│  │  - World State     │         │  - Transitions      │     │
│  └────────────────────┘         └─────────────────────┘     │
│           │                              │                   │
│           ▼                              ▼                   │
│  ┌────────────────────────────────────────────────┐         │
│  │         Shared Database (PostgreSQL)           │         │
│  │  - Chats          - Map Tiles                  │         │
│  │  - Worlds         - Regions                    │         │
│  │  - Entities       - POIs                       │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Core Modules

#### `lib/visual-world/map-tile-generator.ts`
Generates individual map tiles using OpenRouter GPT-5 Image Mini.

**Key Functions:**
- `generateMapTile()` - Create a new tile from scratch
- `expandTile()` - Outpaint to expand existing tiles
- `generateTransitionTile()` - Create biome transitions
- `inpaintTile()` - Modify specific regions of tiles

#### `lib/visual-world/tile-manager.ts`
Manages tile caching, retrieval, and world state.

**Key Classes:**
- `TileManager` - Main interface for tile operations
- `InMemoryTileCache` - Fast in-memory caching
- `DatabaseTileCache` - Persistent database caching
- `WorldIntegratedTileManager` - Story-aware tile management

#### `lib/db/schema-map-tiles.ts`
Database schema for storing tiles, regions, and POIs.

**Tables:**
- `map_tiles` - Generated map tiles with metadata
- `world_regions` - Named areas with specific properties
- `biome_transitions` - Rules for blending biomes
- `points_of_interest` - Special locations (towns, dungeons)
- `map_tile_access_log` - Access tracking for cache optimization

### 2. API Routes

#### `POST /api/generate-map-tile`
Generate a new map tile or retrieve from cache.

**Request:**
```typescript
{
  coordinate: { x: number, y: number },
  biome?: BiomeType,
  worldSeed?: string,
  locationDescription?: string,
  customPrompt?: string
}
```

**Response:**
```typescript
{
  success: true,
  tile: {
    id: string,
    coordinate: { x, y },
    biome: BiomeType,
    imageUrl: string, // base64 data URL
    prompt: string,
    createdAt: string
  }
}
```

## Integration with Existing Story System

### Scenario 1: Text Location → Visual Tile

When a player enters a new location in the text story:

```typescript
// In your gameplay chat handler
import { WorldIntegratedTileManager } from '@/lib/visual-world/tile-manager';

async function handlePlayerMove(chatId: string, locationName: string) {
  // 1. Update text-based story state (existing code)
  await updatePlayerLocation(chatId, locationName);

  // 2. Generate visual representation
  const tileManager = new WorldIntegratedTileManager(chatId, worldSeed);

  const locationDescription = await getLocationDescription(locationName);
  const tile = await tileManager.getTileForLocation(
    locationName,
    locationDescription
  );

  // 3. Return both text and visual data to frontend
  return {
    text: storyText,
    visualTile: tile
  };
}
```

### Scenario 2: Infinite Exploration

As player explores, pre-generate surrounding tiles:

```typescript
import { getDefaultTileManager } from '@/lib/visual-world/tile-manager';

async function onPlayerMove(currentPosition: { x: number, y: number }) {
  const tileManager = getDefaultTileManager(worldSeed);

  // Get current tile
  const currentTile = await tileManager.getTile(currentPosition);

  // Pre-fetch surrounding tiles for smooth UX
  await tileManager.prefetchSurrounding(currentPosition, radius: 2);

  return currentTile;
}
```

### Scenario 3: Story-Driven POI Generation

When story creates a new important location:

```typescript
import { db } from '@/lib/db';
import { pointsOfInterest } from '@/lib/db/schema-map-tiles';

async function createStoryLocation(
  worldId: string,
  name: string,
  type: string,
  description: string
) {
  // 1. Generate tile for this location
  const coordinate = determineLocationCoordinate(worldId, name);

  const tile = await generateMapTile({
    coordinate,
    biome: inferBiomeFromDescription(description),
    pointsOfInterest: [type]
  });

  // 2. Save POI to database
  await db.insert(pointsOfInterest).values({
    id: generateId(),
    worldId,
    x: coordinate.x,
    y: coordinate.y,
    tileId: tile.id,
    name,
    type,
    description,
    isDiscovered: 0
  });

  return tile;
}
```

## Workflow Examples

### Example 1: Starting a New Game

```typescript
// User creates new world
async function createNewWorld(userId: string, worldPrompt: string) {
  // 1. Create world in existing story system
  const world = await createWorldStory(userId, worldPrompt);

  // 2. Generate starting tile
  const tileManager = new WorldIntegratedTileManager(
    world.id,
    world.seed
  );

  const startingTile = await tileManager.getTile(
    { x: 0, y: 0 },
    'village' // Starting area
  );

  // 3. Set player starting position
  await setPlayerPosition(world.id, { x: 0, y: 0 });

  return {
    world,
    startingTile
  };
}
```

### Example 2: Player Discovers New Region

```typescript
async function onPlayerDiscovery(
  chatId: string,
  regionName: string,
  regionDescription: string
) {
  // 1. Create region in database
  const region = await db.insert(worldRegions).values({
    id: generateId(),
    worldId: chatId,
    name: regionName,
    description: regionDescription,
    minX: currentX - 10,
    minY: currentY - 10,
    maxX: currentX + 10,
    maxY: currentY + 10,
    dominantBiome: 'forest',
    dangerLevel: 5
  });

  // 2. Update story bible with this region
  await updateStoryBible(chatId, {
    type: 'region',
    name: regionName,
    description: regionDescription
  });

  // 3. Pre-generate tiles for this region
  const tileManager = new WorldIntegratedTileManager(chatId, worldSeed);

  for (let x = region.minX; x <= region.maxX; x += 5) {
    for (let y = region.minY; y <= region.maxY; y += 5) {
      await tileManager.getTile({ x, y }, region.dominantBiome);
    }
  }
}
```

### Example 3: Combat Encounter Visualization

When combat starts, show the battlefield:

```typescript
async function initiateCombat(
  chatId: string,
  enemyType: string,
  terrainType: BiomeType
) {
  // 1. Generate combat arena tile
  const arenaPrompt = `
    Top-down 2D pixel art RPG battle arena in a ${terrainType} biome.
    Show the battlefield with ${enemyType} enemy positions marked.
    Classic 16-bit RPG style. Include tactical elements like cover and obstacles.
  `;

  const response = await fetch('/api/generate-map-tile', {
    method: 'POST',
    body: JSON.stringify({
      coordinate: { x: battleX, y: battleY },
      biome: terrainType,
      customPrompt: arenaPrompt
    })
  });

  const { tile } = await response.json();

  return tile;
}
```

## Cost Optimization Strategies

### 1. Aggressive Caching

```typescript
// Cache tiles indefinitely unless explicitly regenerated
const cachedTile = await db.query.mapTiles.findFirst({
  where: and(
    eq(mapTiles.worldId, worldId),
    eq(mapTiles.x, x),
    eq(mapTiles.y, y)
  )
});

if (cachedTile) {
  return cachedTile; // No API call needed!
}
```

### 2. Tile Reuse via Hashing

```typescript
// Check if similar tile already exists
const existingTile = await db.query.mapTiles.findFirst({
  where: eq(mapTiles.imageHash, computePromptHash(prompt))
});

if (existingTile) {
  // Reuse existing tile at new coordinate
  await duplicateTile(existingTile, newCoordinate);
}
```

### 3. Lazy Generation

```typescript
// Only generate when player is close
function shouldGenerateTile(
  tileCoord: { x, y },
  playerCoord: { x, y },
  viewRadius: number
): boolean {
  const distance = Math.sqrt(
    Math.pow(tileCoord.x - playerCoord.x, 2) +
    Math.pow(tileCoord.y - playerCoord.y, 2)
  );
  return distance <= viewRadius;
}
```

### 4. Quality Tiers

```typescript
// Use lower quality for distant tiles
function getTileQuality(distance: number): 'low' | 'medium' | 'high' {
  if (distance <= 1) return 'high';
  if (distance <= 3) return 'medium';
  return 'low';
}
```

## Frontend Integration

### React Component Example

```typescript
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function MapView({
  chatId,
  playerPosition
}: {
  chatId: string;
  playerPosition: { x: number; y: number };
}) {
  const [tiles, setTiles] = useState<MapTile[][]>([]);
  const viewRadius = 3;

  useEffect(() => {
    async function loadTiles() {
      const newTiles: MapTile[][] = [];

      for (
        let y = playerPosition.y - viewRadius;
        y <= playerPosition.y + viewRadius;
        y++
      ) {
        const row: MapTile[] = [];
        for (
          let x = playerPosition.x - viewRadius;
          x <= playerPosition.x + viewRadius;
          x++
        ) {
          const response = await fetch('/api/generate-map-tile', {
            method: 'POST',
            body: JSON.stringify({
              coordinate: { x, y },
              worldSeed: chatId
            })
          });

          const { tile } = await response.json();
          row.push(tile);
        }
        newTiles.push(row);
      }

      setTiles(newTiles);
    }

    loadTiles();
  }, [playerPosition, chatId]);

  return (
    <div className="map-grid">
      {tiles.map((row, y) => (
        <div key={y} className="map-row">
          {row.map((tile, x) => (
            <div
              key={tile.id}
              className={`map-tile ${
                x === viewRadius && y === viewRadius ? 'player-tile' : ''
              }`}
            >
              {tile.imageUrl && (
                <Image
                  src={tile.imageUrl}
                  alt={`Tile at ${tile.coordinate.x}, ${tile.coordinate.y}`}
                  width={256}
                  height={256}
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Testing Strategy

### 1. Test Tile Generation

```bash
# Run the test script
python test_map_generation.py

# Or use the notebook
jupyter notebook map_generation_testing.ipynb
```

### 2. Test API Endpoint

```bash
# Test tile generation
curl -X POST http://localhost:3000/api/generate-map-tile \
  -H "Content-Type: application/json" \
  -d '{
    "coordinate": {"x": 0, "y": 0},
    "biome": "forest"
  }'
```

### 3. Test Integration

Create a test file:

```typescript
// tests/visual-world-integration.test.ts
import { expect, test } from 'vitest';
import { TileManager } from '@/lib/visual-world/tile-manager';

test('generates consistent tiles for same coordinates', async () => {
  const manager = new TileManager('test-seed');

  const tile1 = await manager.getTile({ x: 0, y: 0 });
  const tile2 = await manager.getTile({ x: 0, y: 0 });

  expect(tile1.id).toBe(tile2.id);
  expect(tile1.biome).toBe(tile2.biome);
});
```

## Migration Path

### Phase 1: Foundation (Week 1)
- ✅ Set up Python notebook for testing
- ✅ Create TypeScript modules
- ✅ Design database schema
- ⬜ Test basic tile generation

### Phase 2: API Integration (Week 2)
- ⬜ Implement API routes
- ⬜ Add database tables
- ⬜ Set up caching layer
- ⬜ Test end-to-end flow

### Phase 3: Story Integration (Week 3)
- ⬜ Link tiles to story locations
- ⬜ Implement POI system
- ⬜ Add region management
- ⬜ Test story-driven generation

### Phase 4: Frontend (Week 4)
- ⬜ Create MapView component
- ⬜ Add player position tracking
- ⬜ Implement smooth tile loading
- ⬜ Polish UX

### Phase 5: Optimization (Week 5)
- ⬜ Optimize caching strategy
- ⬜ Implement tile deduplication
- ⬜ Add quality tiers
- ⬜ Performance testing

## Estimated Costs

### GPT-5 Image Mini Pricing
- **Approximate**: $0.01-0.05 per image (check OpenRouter for current pricing)

### Cost Scenarios

#### Small World (100 tiles)
- First-time generation: 100 tiles × $0.03 = **$3.00**
- With caching: Virtually $0 after initial generation

#### Medium World (1,000 tiles)
- First-time generation: 1,000 tiles × $0.03 = **$30.00**
- With 90% cache hit rate: $3.00 per session

#### Large Persistent World (10,000 tiles)
- Gradual generation over time
- With intelligent caching and deduplication
- Estimated monthly cost: **$10-50** depending on player activity

### Cost Reduction Tips
1. **Aggressive caching** - Never regenerate the same tile
2. **Tile deduplication** - Reuse similar tiles
3. **Lazy loading** - Only generate visible/nearby tiles
4. **Quality tiers** - Use lower quality for background tiles
5. **Batch generation** - Pre-generate during off-peak hours

## Next Steps

1. **Test the Python notebook** to verify OpenRouter API works
2. **Set up environment variable** for OPENROUTER_API_KEY
3. **Run test script**: `python test_map_generation.py`
4. **Extend database schema** by merging schema-map-tiles.ts
5. **Implement API route** and test with Postman/curl
6. **Build frontend component** to display tiles
7. **Integrate with story system** gradually

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [GPT-5 Image Mini Model Page](https://openrouter.ai/models/openai/gpt-5-image-mini)
- [Map Generation Testing Notebook](./map_generation_testing.ipynb)
- [Test Script](./test_map_generation.py)

## Questions?

Refer to:
- `MAP_GENERATION_README.md` - Detailed testing guide
- `PROJECT_REQUIREMENTS.md` - Overall project vision
- `CLAUDE.md` - Development guidelines

The visual world system is designed to **complement, not replace** the text-based story engine. They work together to create a rich, immersive experience!
