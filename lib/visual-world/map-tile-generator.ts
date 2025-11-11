/**
 * Visual Map Tile Generator
 *
 * Generates 2D top-down RPG map tiles using OpenRouter GPT-5 Image Mini
 * Integrates with the existing Interactive Worlds text-based story system
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export type BiomeType =
  | 'village'
  | 'forest'
  | 'desert'
  | 'snow'
  | 'dungeon'
  | 'ocean'
  | 'mountain'
  | 'swamp';

export type TileDirection = 'north' | 'south' | 'east' | 'west';

export interface TileCoordinate {
  x: number;
  y: number;
}

export interface MapTile {
  id: string;
  coordinate: TileCoordinate;
  biome: BiomeType;
  imageUrl?: string;  // Base64 data URL or stored file path
  imageHash?: string; // For deduplication
  prompt: string;
  createdAt: Date;
  adjacentTiles: {
    north?: string; // tile ID
    south?: string;
    east?: string;
    west?: string;
  };
}

export interface TileGenerationOptions {
  biome: BiomeType;
  coordinate: TileCoordinate;
  worldSeed?: string;
  adjacentTiles?: Partial<Record<TileDirection, MapTile>>;
  pointsOfInterest?: string[]; // e.g., ['tavern', 'blacksmith']
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

/**
 * Generate a prompt for a map tile based on biome and context
 */
export function generateTilePrompt(options: TileGenerationOptions): string {
  const { biome, adjacentTiles, pointsOfInterest } = options;

  const basePrompts: Record<BiomeType, string> = {
    village: 'Top-down 2D pixel art RPG map tile of a village area with cobblestone paths, small buildings with tiled roofs, grass, and trees.',
    forest: 'Top-down 2D pixel art RPG map tile of a dense forest with tall trees, bushes, dirt paths, and dappled sunlight.',
    desert: 'Top-down 2D pixel art RPG map tile of a desert landscape with sand dunes, cacti, rocks, and sparse vegetation.',
    snow: 'Top-down 2D pixel art RPG map tile of a snowy tundra with snow-covered ground, pine trees, ice patches, and rocks.',
    dungeon: 'Top-down 2D pixel art RPG map tile of a dungeon interior with stone floors, walls, torches, and mysterious shadows.',
    ocean: 'Top-down 2D pixel art RPG map tile of ocean water with waves, occasional rocks, and marine features.',
    mountain: 'Top-down 2D pixel art RPG map tile of a mountainous area with rocky terrain, cliffs, and sparse vegetation.',
    swamp: 'Top-down 2D pixel art RPG map tile of a swamp with murky water, twisted trees, moss, and foggy atmosphere.'
  };

  let prompt = basePrompts[biome];

  // Add style consistency
  prompt += ' Classic 16-bit RPG style like SNES era games (Chrono Trigger, Final Fantasy VI).';

  // Add points of interest
  if (pointsOfInterest && pointsOfInterest.length > 0) {
    prompt += ` Include: ${pointsOfInterest.join(', ')}.`;
  }

  // Add adjacency hints for seamless transitions
  if (adjacentTiles) {
    const directions: TileDirection[] = ['north', 'south', 'east', 'west'];
    const adjacentBiomes = directions
      .filter(dir => adjacentTiles[dir])
      .map(dir => `${dir}: ${adjacentTiles[dir]!.biome}`);

    if (adjacentBiomes.length > 0) {
      prompt += ` This tile connects to: ${adjacentBiomes.join(', ')}. Ensure seamless transitions at the edges.`;
    }
  }

  // Emphasize seamless tiling
  prompt += ' The tile MUST have seamless edges that can connect to other tiles without visible seams.';

  return prompt;
}

/**
 * Generate a map tile using OpenRouter
 */
export async function generateMapTile(
  options: TileGenerationOptions
): Promise<MapTile> {
  const prompt = generateTilePrompt(options);
  const tileId = `tile_${options.coordinate.x}_${options.coordinate.y}`;

  // NOTE: This is a placeholder implementation
  // The actual OpenRouter API for image generation with GPT-5 Image Mini
  // would be called here using the fetch API as shown in the Python notebook

  // For now, this is a TypeScript structure showing how it would integrate

  const tile: MapTile = {
    id: tileId,
    coordinate: options.coordinate,
    biome: options.biome,
    prompt,
    createdAt: new Date(),
    adjacentTiles: {}
  };

  // TODO: Actual API call to OpenRouter
  // const imageUrl = await callOpenRouterImageAPI(prompt, options.aspectRatio);
  // tile.imageUrl = imageUrl;

  return tile;
}

/**
 * Generate an outpainting expansion of an existing tile
 */
export async function expandTile(
  existingTile: MapTile,
  direction: TileDirection,
  newBiome?: BiomeType
): Promise<MapTile> {
  const newCoordinate: TileCoordinate = { ...existingTile.coordinate };

  switch (direction) {
    case 'north':
      newCoordinate.y -= 1;
      break;
    case 'south':
      newCoordinate.y += 1;
      break;
    case 'east':
      newCoordinate.x += 1;
      break;
    case 'west':
      newCoordinate.x -= 1;
      break;
  }

  const adjacentTiles: Partial<Record<TileDirection, MapTile>> = {};
  const oppositeDirection: Record<TileDirection, TileDirection> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east'
  };
  adjacentTiles[oppositeDirection[direction]] = existingTile;

  return generateMapTile({
    biome: newBiome || existingTile.biome,
    coordinate: newCoordinate,
    adjacentTiles
  });
}

/**
 * Generate a transition tile between two different biomes
 */
export async function generateTransitionTile(
  fromBiome: BiomeType,
  toBiome: BiomeType,
  coordinate: TileCoordinate
): Promise<MapTile> {
  const prompt = `
    Top-down 2D pixel art RPG map tile showing a gradual transition from ${fromBiome} to ${toBiome}.
    The left side should show ${fromBiome} features gradually transitioning to ${toBiome} features on the right side.
    Classic 16-bit RPG style. Seamless edges for tiling.
  `;

  return {
    id: `tile_transition_${coordinate.x}_${coordinate.y}`,
    coordinate,
    biome: fromBiome, // Primary biome
    prompt,
    createdAt: new Date(),
    adjacentTiles: {}
  };
}

/**
 * Generate a tile with specific inpainting modifications
 */
export interface InpaintOptions {
  tile: MapTile;
  maskRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  modification: string; // e.g., "add a treasure chest", "place a dungeon entrance"
}

export async function inpaintTile(options: InpaintOptions): Promise<MapTile> {
  const { tile, maskRegion, modification } = options;

  const prompt = `
    Modify this top-down 2D pixel art RPG map tile.
    In the masked region, ${modification}.
    Maintain the same art style and blend seamlessly with the surrounding area.
  `;

  // TODO: Implement actual inpainting API call with mask

  return {
    ...tile,
    prompt: tile.prompt + ' | Modified: ' + modification,
    createdAt: new Date()
  };
}

/**
 * Integration example: Generate visual representation of story location
 */
export async function generateLocationTile(
  locationDescription: string,
  coordinate: TileCoordinate
): Promise<MapTile> {
  // Use the existing AI to interpret the location and determine biome
  // This bridges the text-based story world with visual generation

  const biomeMapping = new Map<string, BiomeType>([
    ['village', 'village'],
    ['town', 'village'],
    ['city', 'village'],
    ['forest', 'forest'],
    ['woods', 'forest'],
    ['desert', 'desert'],
    ['snow', 'snow'],
    ['ice', 'snow'],
    ['cave', 'dungeon'],
    ['dungeon', 'dungeon'],
    ['ocean', 'ocean'],
    ['sea', 'ocean'],
    ['mountain', 'mountain'],
    ['swamp', 'swamp'],
    ['marsh', 'swamp']
  ]);

  // Simple keyword matching (in production, use AI to analyze)
  let detectedBiome: BiomeType = 'forest'; // default

  for (const [keyword, biome] of biomeMapping) {
    if (locationDescription.toLowerCase().includes(keyword)) {
      detectedBiome = biome;
      break;
    }
  }

  return generateMapTile({
    biome: detectedBiome,
    coordinate
  });
}
