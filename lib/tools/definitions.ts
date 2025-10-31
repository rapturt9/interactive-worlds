/**
 * Tool definitions for OpenRouter tool calling
 * Used for randomness and calculations in the game
 */

export const GAME_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'calculator_pemdas',
      description: `Evaluates mathematical expressions following PEMDAS order of operations (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction).

Usage examples:
- Calculate damage: "15 * 2 + 3" returns 33
- Subtract resources: "45 - 3 - 2 - 2" returns 38
- Complex calculation: "(10 + 5) * 2 ** 2" returns 60
- Division: "100 / 4" returns 25.0

Supported operators: +, -, *, /, //, %, ** (power), parentheses for grouping`,
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: "The mathematical expression to evaluate (e.g., '15 * 2 + 3')",
          },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'random_number_given_min_max',
      description: `Generates a random integer between min and max (inclusive).

Usage examples:
- Roll d20: min=1, max=20 returns random number 1-20
- Roll d6: min=1, max=6 returns random number 1-6
- Percentage: min=1, max=100 returns random number 1-100
- Damage roll: min=5, max=15 returns random number 5-15

Use this for dice rolls, random events, or any situation requiring a random number in a range.`,
      parameters: {
        type: 'object',
        properties: {
          min: {
            type: 'integer',
            description: 'Minimum value (inclusive)',
          },
          max: {
            type: 'integer',
            description: 'Maximum value (inclusive)',
          },
        },
        required: ['min', 'max'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'random_choice_with_weights',
      description: `Selects a random choice from a list with optional probability weights.

Usage examples:
- Weighted outcome: choices=["success", "failure"], weights=[0.7, 0.3] returns "success" 70% of time
- Equal probability: choices=["north", "south", "east", "west"] returns each 25% of time
- NPC attitude: choices=["friendly", "neutral", "hostile"], weights=[0.2, 0.5, 0.3]
- Loot drop: choices=["legendary", "rare", "common"], weights=[0.05, 0.25, 0.7]

If weights not provided, all choices have equal probability. Weights should sum to 1.0.`,
      parameters: {
        type: 'object',
        properties: {
          choices: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of possible choices to select from',
          },
          weights: {
            type: 'array',
            items: { type: 'number' },
            description: 'Optional probability weights for each choice (should sum to 1.0)',
          },
        },
        required: ['choices'],
      },
    },
  },
];
