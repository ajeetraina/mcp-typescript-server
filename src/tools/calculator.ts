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

      // Additional validation
      if (sanitized.length === 0) {
        throw new Error('Expression cannot be empty after sanitization');
      }

      // Check for balanced parentheses
      if (!this.isBalancedParentheses(sanitized)) {
        throw new Error('Unbalanced parentheses in expression');
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

  private isBalancedParentheses(expression: string): boolean {
    let count = 0;
    for (const char of expression) {
      if (char === '(') count++;
      if (char === ')') count--;
      if (count < 0) return false;
    }
    return count === 0;
  }

  private evaluateExpression(expression: string): number {
    try {
      // Using Function constructor as a safer alternative to eval
      // Still not 100% safe but better than direct eval
      const fn = new Function('return (' + expression + ')');
      const result = fn();
      
      if (typeof result !== 'number') {
        throw new Error('Expression did not evaluate to a number');
      }
      
      if (!isFinite(result)) {
        throw new Error('Result is not a finite number (division by zero or overflow)');
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to evaluate expression: ${error.message}`);
      }
      throw new Error('Failed to evaluate expression');
    }
  }

  // Additional utility methods for enhanced functionality
  validateExpression(expression: string): { valid: boolean; error?: string } {
    if (!expression || typeof expression !== 'string') {
      return { valid: false, error: 'Expression must be a non-empty string' };
    }

    const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
    if (sanitized !== expression) {
      return { valid: false, error: 'Expression contains invalid characters' };
    }

    if (!this.isBalancedParentheses(sanitized)) {
      return { valid: false, error: 'Unbalanced parentheses' };
    }

    return { valid: true };
  }
}