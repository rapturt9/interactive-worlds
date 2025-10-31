import { WorldParameters } from '@/types';

/**
 * Generate user prompt for world generation based on parameters
 */
export function generateWorldParametersPrompt(params: WorldParameters): string {
  const { genre, setting, theme, difficulty } = params;

  return `Please generate a complete world and starting character with these specifications:

**Genre:** ${genre}
**Setting:** ${setting}
**Theme:** ${theme}
**Difficulty:** ${difficulty}

Create a complete story bible following all sections (World Foundation, Pre-Determined Elements, Character Status, Timeline & Causality, Hidden Information).

Ensure the world matches the ${genre} genre with ${setting} setting and ${theme} theme. Difficulty level ${difficulty} should affect:
- Starting character's social class and resources
- Number and severity of hidden threats
- Complexity of conspiracies and traps
- Survival rates and mortality risks

Output the complete bible in <bible></bible> tags, starting character in <character></character> tags, and a short descriptive name in <chat_name></chat_name> tags.`;
}
