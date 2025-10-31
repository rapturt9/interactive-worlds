import { z } from "zod";

// Define tools using AI SDK v5 format
export const calculatorTool = {
  description: `Evaluates mathematical expressions following PEMDAS order of operations (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction).

Usage examples:
- Calculate damage: "15 * 2 + 3" returns 33
- Subtract resources: "45 - 3 - 2 - 2" returns 38
- Complex calculation: "(10 + 5) * 2 ** 2" returns 60
- Division: "100 / 4" returns 25.0

Supported operators: +, -, *, /, //, %, ** (power), parentheses for grouping`,
  parameters: z.object({
    expression: z
      .string()
      .describe("The mathematical expression to evaluate (e.g., '15 * 2 + 3')"),
  }),
  inputSchema: z.object({
    expression: z
      .string()
      .describe("The mathematical expression to evaluate (e.g., '15 * 2 + 3')"),
  }),
  execute: async ({ expression }: { expression: string }) => {
    try {
      // Security: Only allow safe math characters
      if (!/^[0-9+\-*/.()%\s^]+$/.test(expression)) {
        return { error: "Invalid characters in expression", expression };
      }

      // Safe math evaluation without dynamic code execution
      // Replace ** with ^ for compatibility, then use a simple evaluator
      const sanitized = expression.replace(/\*\*/g, "^").replace(/\s+/g, "");

      // Simple recursive descent parser for mathematical expressions
      // Supports: +, -, *, /, %, ^, parentheses, PEMDAS order
      const evaluate = (expr: string): number => {
        let pos = 0;

        const parseNumber = (): number => {
          let num = "";
          while (pos < expr.length && /[0-9.]/.test(expr[pos])) {
            num += expr[pos++];
          }
          if (!num || isNaN(parseFloat(num))) {
            throw new Error(`Invalid number at position ${pos}`);
          }
          return parseFloat(num);
        };

        const parseAtom = (): number => {
          if (expr[pos] === "(") {
            pos++; // skip '('
            const result = parseExpression();
            if (expr[pos] !== ")") throw new Error("Missing closing parenthesis");
            pos++; // skip ')'
            return result;
          }
          return parseNumber();
        };

        const parsePower = (): number => {
          let result = parseAtom();
          while (expr[pos] === "^") {
            pos++;
            result = Math.pow(result, parseAtom());
          }
          return result;
        };

        const parseMultDiv = (): number => {
          let result = parsePower();
          while (expr[pos] === "*" || expr[pos] === "/" || expr[pos] === "%") {
            const op = expr[pos++];
            if (op === "*") result *= parsePower();
            else if (op === "/") {
              const divisor = parsePower();
              if (divisor === 0) throw new Error("Division by zero");
              result /= divisor;
            } else result %= parsePower();
          }
          return result;
        };

        const parseAddSub = (): number => {
          let result = parseMultDiv();
          while (expr[pos] === "+" || expr[pos] === "-") {
            const op = expr[pos++];
            if (op === "+") result += parseMultDiv();
            else result -= parseMultDiv();
          }
          return result;
        };

        const parseExpression = (): number => {
          let result = parseAddSub();
          if (pos < expr.length) {
            throw new Error(`Unexpected character at position ${pos}: ${expr[pos]}`);
          }
          return result;
        };

        return parseExpression();
      };

      const result = evaluate(sanitized);

      if (typeof result !== "number" || !isFinite(result)) {
        return { error: "Result is not a valid number", expression };
      }

      return { result, expression };
    } catch (error) {
      return {
        error: `Calculation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        expression,
      };
    }
  },
};

export const randomNumberTool = {
  description: `Generates a random integer between min and max (inclusive).

Usage examples:
- Roll d20: min=1, max=20 returns random number 1-20
- Roll d6: min=1, max=6 returns random number 1-6
- Percentage: min=1, max=100 returns random number 1-100
- Damage roll: min=5, max=15 returns random number 5-15

Use this for dice rolls, random events, or any situation requiring a random number in a range.`,
  parameters: z.object({
    min: z.number().int().describe("Minimum value (inclusive)"),
    max: z.number().int().describe("Maximum value (inclusive)"),
  }),
  inputSchema: z.object({
    min: z.number().int().describe("Minimum value (inclusive)"),
    max: z.number().int().describe("Maximum value (inclusive)"),
  }),
  execute: async ({ min, max }: { min: number; max: number }) => {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return { result, min, max };
  },
};

export const randomChoiceTool = {
  description: `Selects a random choice from a list with optional probability weights.

Usage examples:
- Weighted outcome: choices=["success", "failure"], weights=[0.7, 0.3] returns "success" 70% of time
- Equal probability: choices=["north", "south", "east", "west"] returns each 25% of time
- NPC attitude: choices=["friendly", "neutral", "hostile"], weights=[0.2, 0.5, 0.3]
- Loot drop: choices=["legendary", "rare", "common"], weights=[0.05, 0.25, 0.7]

If weights not provided, all choices have equal probability. Weights should sum to 1.0.`,
  parameters: z.object({
    choices: z.array(z.string()).describe("List of possible choices to select from"),
    weights: z
      .array(z.number())
      .optional()
      .describe("Optional probability weights for each choice (should sum to 1.0)"),
  }),
  inputSchema: z.object({
    choices: z.array(z.string()).describe("List of possible choices to select from"),
    weights: z
      .array(z.number())
      .optional()
      .describe("Optional probability weights for each choice (should sum to 1.0)"),
  }),
  execute: async ({
    choices,
    weights,
  }: {
    choices: string[];
    weights?: number[];
  }) => {
    if (!choices || choices.length === 0) {
      return { error: "choices list cannot be empty", choices, weights };
    }

    if (weights) {
      if (weights.length !== choices.length) {
        return {
          error: `weights length (${weights.length}) must match choices length (${choices.length})`,
          choices,
          weights,
        };
      }

      if (weights.some((w) => w < 0)) {
        return { error: "weights cannot be negative", choices, weights };
      }

      const weightSum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(weightSum - 1.0) > 0.001) {
        return {
          error: `weights must sum to 1.0, got ${weightSum}`,
          choices,
          weights,
        };
      }

      let random = Math.random();
      for (let i = 0; i < choices.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return { result: choices[i], choices, weights };
        }
      }
      return { result: choices[choices.length - 1], choices, weights };
    }

    const randomIndex = Math.floor(Math.random() * choices.length);
    return { result: choices[randomIndex], choices };
  },
};

export const allTools = {
  calculator_pemdas: calculatorTool,
  random_number_given_min_max: randomNumberTool,
  random_choice_with_weights: randomChoiceTool,
};
