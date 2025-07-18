import { ToolDefinition, ToolResult } from '../types/index.js';

export class CalculatorTool {
  getDefinition(): ToolDefinition {
    return {
      name: 'calculate',
      description: 'Perform mathematical calculations with support for basic operations',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
          },
        },
        required: ['expression'],
      },
    };
  }

  async calculate(args: { expression: string }): Promise<ToolResult> {
    try {
      const { expression } = args;
      
      // Basic validation
      if (!expression || typeof expression !== 'string') {
        throw new Error('Expression must be a non-empty string');
      }

      // Sanitize the expression to prevent code injection
      const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
      if (sanitized !== expression) {
        throw new Error('Expression contains invalid characters');
      }

      // Evaluate the expression safely
      const result = this.evaluateExpression(sanitized);
      
      return {
        content: [
          {
            type: 'text',
            text: `Result: ${expression} = ${result}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Calculation failed';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private evaluateExpression(expression: string): number {
    // Simple expression evaluator - in production, use a proper math parser
    try {
      // Using Function constructor as a safer alternative to eval
      const fn = new Function('return (' + expression + ')');
      const result = fn();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid mathematical expression');
      }
      
      return result;
    } catch {
      throw new Error('Failed to evaluate expression');
    }
  }
}