/**
 * API Route: Generate Map Tile
 *
 * POST /api/generate-map-tile
 *
 * Generates a visual map tile for a given coordinate or location
 */

import { NextRequest, NextResponse } from 'next/server';
import type { BiomeType, TileCoordinate } from '@/lib/visual-world/map-tile-generator';

// This will be replaced with actual OpenRouter API call
async function generateTileImage(
  prompt: string,
  aspectRatio: string = '1:1'
): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-5-image-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      modalities: ['image', 'text'],
      image_config: {
        aspect_ratio: aspectRatio
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const result = await response.json();

  // Extract image from response
  if (result?.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
    return result.choices[0].message.images[0].image_url.url;
  }

  throw new Error('No image in response');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      coordinate,
      biome,
      worldSeed,
      locationDescription,
      customPrompt,
      aspectRatio = '1:1'
    }: {
      coordinate?: TileCoordinate;
      biome?: BiomeType;
      worldSeed?: string;
      locationDescription?: string;
      customPrompt?: string;
      aspectRatio?: string;
    } = body;

    // Validate input
    if (!coordinate && !locationDescription) {
      return NextResponse.json(
        { error: 'Either coordinate or locationDescription must be provided' },
        { status: 400 }
      );
    }

    // Generate prompt based on input
    let prompt: string;

    if (customPrompt) {
      prompt = customPrompt;
    } else if (locationDescription) {
      // Generate prompt from location description
      prompt = `
        Create a top-down 2D pixel art RPG map tile for the following location:
        ${locationDescription}

        Style: Classic 16-bit RPG (SNES era - Chrono Trigger, Final Fantasy VI)
        The tile must have seamless edges for tiling with other map tiles.
      `;
    } else {
      // Generate prompt from biome and coordinate
      const biomePrompts: Record<BiomeType, string> = {
        village: 'a village area with cobblestone paths, buildings, grass, and trees',
        forest: 'a dense forest with tall trees, bushes, and dirt paths',
        desert: 'a desert landscape with sand dunes, cacti, and rocks',
        snow: 'a snowy tundra with snow-covered ground, pine trees, and ice',
        dungeon: 'a dungeon interior with stone floors, walls, and torches',
        ocean: 'ocean water with waves and occasional rocks',
        mountain: 'a mountainous area with rocky terrain and cliffs',
        swamp: 'a swamp with murky water, twisted trees, and moss'
      };

      const biomeDesc = biome ? biomePrompts[biome] : biomePrompts['forest'];

      prompt = `
        Create a top-down 2D pixel art RPG map tile showing ${biomeDesc}.
        Classic 16-bit RPG style (SNES era - Chrono Trigger, Final Fantasy VI).
        The tile MUST have seamless edges that can connect to other tiles.
      `;
    }

    // Generate the image
    console.log(`[Map Tile API] Generating tile for coordinate (${coordinate?.x}, ${coordinate?.y})`);
    console.log(`[Map Tile API] Prompt: ${prompt.substring(0, 100)}...`);

    const imageDataUrl = await generateTileImage(prompt, aspectRatio);

    // Create tile metadata
    const tile = {
      id: coordinate ? `tile_${coordinate.x}_${coordinate.y}` : `tile_${Date.now()}`,
      coordinate: coordinate || { x: 0, y: 0 },
      biome: biome || 'forest',
      imageUrl: imageDataUrl,
      prompt,
      createdAt: new Date().toISOString(),
      worldSeed
    };

    // TODO: Save to database for caching
    // await db.insert(mapTiles).values(tile);

    return NextResponse.json({
      success: true,
      tile
    });

  } catch (error) {
    console.error('[Map Tile API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve a cached tile
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const x = searchParams.get('x');
  const y = searchParams.get('y');

  if (!x || !y) {
    return NextResponse.json(
      { error: 'Both x and y coordinates are required' },
      { status: 400 }
    );
  }

  const coordinate = {
    x: parseInt(x),
    y: parseInt(y)
  };

  // TODO: Fetch from database
  // const tile = await db.query.mapTiles.findFirst({
  //   where: and(
  //     eq(mapTiles.x, coordinate.x),
  //     eq(mapTiles.y, coordinate.y)
  //   )
  // });

  // For now, return not found
  return NextResponse.json(
    { error: 'Tile not found', coordinate },
    { status: 404 }
  );
}
