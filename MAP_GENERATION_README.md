# Visual Map Generation Testing

This directory contains tools for testing infinite map generation using OpenRouter's GPT-5 Image Mini model with inpainting/outpainting techniques.

## Quick Start

### 1. Install Dependencies

```bash
pip install requests pillow numpy matplotlib ipython jupyter
```

### 2. Set Up Your API Key

Create a `.env` file in the project root or export your OpenRouter API key:

```bash
export OPENROUTER_API_KEY="your-key-here"
```

You can get your API key from: https://openrouter.ai/keys

### 3. Run the Notebook

```bash
jupyter notebook map_generation_testing.ipynb
```

Or if you prefer JupyterLab:

```bash
jupyter lab map_generation_testing.ipynb
```

## What This Tests

The notebook includes 8 comprehensive tests:

1. **Generate Initial Map Tile** - Create a base 2D RPG map tile
2. **Outpainting** - Expand the map by generating adjacent tiles
3. **Inpainting** - Modify specific regions of existing tiles
4. **Multi-Directional Expansion** - Expand maps in all directions
5. **Different Biomes** - Generate forest, desert, snow, and dungeon tiles
6. **Biome Transitions** - Create smooth transitions between biomes
7. **Seamless Tiling** - Generate tiles that can repeat infinitely
8. **Streaming** - Test progressive image generation

## Output

All generated images are saved to the `outputs/` directory with descriptive names:
- `map_tile_base.png` - Initial generated tile
- `map_tile_expanded_right.png` - Outpainted expansion
- `tile_forest.png`, `tile_desert.png`, etc. - Different biomes
- And more...

## Model Information

- **Model**: `openai/gpt-5-image-mini`
- **Provider**: OpenRouter
- **Capabilities**:
  - Natively multimodal (text + image)
  - Superior instruction following
  - Text rendering in images
  - Detailed image editing
  - Reduced latency and cost vs GPT Image 1

## Key Features for Infinite Maps

### Outpainting
Expand existing map tiles in any direction by:
1. Creating an extended canvas with the original tile
2. Adding a mask indicating where new content should be generated
3. Providing a prompt describing how to extend the map

### Inpainting
Modify specific regions of tiles to:
- Add new features (dungeons, towns, etc.)
- Change terrain types
- Fix inconsistencies
- Add points of interest

### Seamless Tiling
Generate tiles that can repeat infinitely by:
- Prompting for seamless edges
- Testing 3x3 tiled demos
- Ensuring color and style consistency

## Integration Ideas

This map generation system can integrate with your Interactive Worlds project:

### Potential Architecture

```typescript
// New modules to create:
lib/visual-world/
  ├── tile-generator.ts      // Core tile generation
  ├── tile-manager.ts         // Caching and coordinate tracking
  ├── biome-system.ts         // Biome definitions and rules
  ├── map-stitcher.ts         // Combine tiles into larger maps
  └── world-seed.ts           // Deterministic world generation

components/
  └── MapCanvas.tsx           // Display generated maps

app/api/
  └── generate-map-tile/
      └── route.ts            // Tile generation endpoint
```

### Workflow
1. Player explores world in text mode (existing system)
2. As player moves, generate visual map tiles
3. Cache tiles for reuse
4. Stitch tiles together for continuous map display
5. Use world seed to ensure consistency

### Cost Optimization
- Cache all generated tiles in database
- Only generate new tiles when player enters unexplored areas
- Use lower quality for background tiles
- Use higher quality for important locations (towns, dungeons)
- Implement tile prediction to pre-generate likely next tiles

## Next Steps

1. **Test the notebook** - Run all cells and verify image generation works
2. **Experiment with prompts** - Try different art styles and themes
3. **Test consistency** - Generate multiple tiles and check if they blend well
4. **Measure costs** - Track API usage to estimate production costs
5. **Plan integration** - Decide how to incorporate into Interactive Worlds

## Troubleshooting

### No images generated
- Check your OPENROUTER_API_KEY is set correctly
- Verify you have credits in your OpenRouter account
- Check the console output for error messages

### Images don't tile seamlessly
- Emphasize "seamless edges" in prompts
- Try different aspect ratios
- Use inpainting to fix edge inconsistencies

### Poor quality results
- Try different prompts with more specific art style descriptions
- Experiment with quality settings
- Consider using reference images for better consistency

## Resources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter Image Generation Guide](https://openrouter.ai/docs/features/multimodal/image-generation)
- [OpenAI GPT Image Documentation](https://platform.openai.com/docs/guides/image-generation)

## Cost Estimation

GPT-5 Image Mini pricing (via OpenRouter):
- Generally more affordable than GPT Image 1
- Costs vary based on image size and quality
- Check current pricing: https://openrouter.ai/models/openai/gpt-5-image-mini

For infinite world generation:
- Initial testing: ~10-50 tiles = low cost
- Small game world: ~100-500 tiles = moderate
- Large persistent world: 1000+ tiles = consider caching strategy

## Future Enhancements

- **Dynamic LOD**: Generate high-res tiles only for player's immediate area
- **Procedural enhancement**: Combine procedural generation with AI for consistency
- **Style transfer**: Apply consistent art style across all tiles
- **Object placement**: Add interactive objects, NPCs, items to tiles
- **Lighting and weather**: Generate tiles with different lighting/weather conditions
- **Animation**: Generate animated tiles for water, fire, etc.
