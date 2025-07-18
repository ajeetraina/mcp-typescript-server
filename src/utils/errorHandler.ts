export class MCPError extends Error {
  constructor(
    message: string,
    public code: number = -1,
    public data?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ErrorHandler {
  static handle(error: unknown): { message: string; code: number; data?: any } {
    if (error instanceof MCPError) {
      return {
        message: error.message,
        code: error.code,
        data: error.data,
      };
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: -32603, // Internal error
      };
    }

    return {
      message: 'Unknown error occurred',
      code: -32603,
    };
  }

  static createValidationError(message: string, field?: string): MCPError {
    return new MCPError(message, -32602, { field });
  }

  static createNotFoundError(resource: string): MCPError {
    return new MCPError(`Resource not found: ${resource}`, -32601);
  }

  static createInternalError(message: string): MCPError {
    return new MCPError(message, -32603);
  }
}