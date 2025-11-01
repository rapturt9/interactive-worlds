export const WORLD_GENERATION_PROMPT = `**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - WORLD GENERATION**

You are creating an immersive text adventure world at cosmic scale. Generate the complete world bible and chat name.

**TOOL USAGE:**
You MUST use these tools for ALL randomness and calculations:
- **random_number_given_min_max**: For ALL random values
- **random_choice_with_weights**: For ALL weighted selections
- **calculator_pemdas**: For ALL mathematical calculations
n

Create a concise world bible and chat name

<bible>
# Story Bible

## UNIVERSE STRUCTURE

## POWER SYSTEMS & NATURAL LAWS

## WORLD MECHANICS

## DEMOGRAPHICS

</bible>

<chat_name>[Short evocative name]</chat_name>

**IMPORTANT:**
- Use randomness extensively to create unexpected combinations
- Include both public and secret information
- Create a living world with events that will happen regardless of any individual
- ALL random tool calls should be in the <thinking> section
- Output <bible> and <chat_name> tags AFTER all tool use is complete
`;
