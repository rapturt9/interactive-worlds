import { NextRequest, NextResponse } from 'next/server';
import {
  executeCalculatorPEMDAS,
  executeRandomNumber,
  executeRandomChoice,
} from '@/lib/tools/executor';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { toolName, arguments: args } = await req.json();

    let result;

    switch (toolName) {
      case 'calculator_pemdas':
        result = executeCalculatorPEMDAS(args.expression);
        break;

      case 'random_number_given_min_max':
        result = executeRandomNumber(args.min, args.max);
        break;

      case 'random_choice_with_weights':
        result = executeRandomChoice(args.choices, args.weights);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${toolName}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      {
        error: 'Tool execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
