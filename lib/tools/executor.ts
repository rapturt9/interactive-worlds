/**
 * Tool execution functions for game mechanics
 * Implements calculator, random number generation, and weighted choice
 */

interface CalculatorResult {
  result?: number;
  error?: string;
  expression: string;
}

interface RandomNumberResult {
  result: number;
  min: number;
  max: number;
}

interface RandomChoiceResult {
  result?: string;
  error?: string;
  choices: string[];
  weights?: number[];
}

/**
 * Safely evaluate a mathematical expression
 * Supports: +, -, *, /, //, %, ** (power), parentheses
 */
export function executeCalculatorPEMDAS(expression: string): CalculatorResult {
  try {
    // Remove whitespace
    const cleaned = expression.replace(/\s+/g, '');

    // Security: Only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/.()%\s]+$/.test(expression)) {
      return {
        error: 'Invalid characters in expression',
        expression,
      };
    }

    // Replace ** with Math.pow for exponentiation
    let evalExpression = cleaned.replace(/\*\*/g, '^');
    evalExpression = evalExpression.replace(/\^/g, '**');

    // Use Function constructor for safer eval (still sandbox within Node)
    // eslint-disable-next-line no-new-func
    const result = new Function(`'use strict'; return (${evalExpression})`)();

    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        error: 'Result is not a valid number',
        expression,
      };
    }

    return {
      result,
      expression,
    };
  } catch (error) {
    return {
      error: `Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      expression,
    };
  }
}

/**
 * Generate random integer between min and max (inclusive)
 */
export function executeRandomNumber(min: number, max: number): RandomNumberResult {
  const result = Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    result,
    min,
    max,
  };
}

/**
 * Select random choice with optional weights
 */
export function executeRandomChoice(
  choices: string[],
  weights?: number[]
): RandomChoiceResult {
  // Validate inputs
  if (!choices || choices.length === 0) {
    return {
      error: 'choices list cannot be empty',
      choices,
      weights,
    };
  }

  if (weights) {
    // Validate weights
    if (weights.length !== choices.length) {
      return {
        error: `weights length (${weights.length}) must match choices length (${choices.length})`,
        choices,
        weights,
      };
    }

    // Check for negative weights
    if (weights.some((w) => w < 0)) {
      return {
        error: 'weights cannot be negative',
        choices,
        weights,
      };
    }

    // Validate sum (allow small floating point error)
    const weightSum = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      return {
        error: `weights must sum to 1.0, got ${weightSum}`,
        choices,
        weights,
      };
    }

    // Weighted random selection
    let random = Math.random();
    for (let i = 0; i < choices.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return {
          result: choices[i],
          choices,
          weights,
        };
      }
    }

    // Fallback (shouldn't reach here if weights sum to 1.0)
    return {
      result: choices[choices.length - 1],
      choices,
      weights,
    };
  }

  // Equal probability
  const randomIndex = Math.floor(Math.random() * choices.length);
  return {
    result: choices[randomIndex],
    choices,
  };
}
