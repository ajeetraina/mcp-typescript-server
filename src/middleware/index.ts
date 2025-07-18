import { MiddlewareContext, MiddlewareFunction } from '../types/index.js';

export class MiddlewareManager {
  private middlewares: MiddlewareFunction[] = [];

  use(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  async execute(context: MiddlewareContext, handler: () => Promise<any>): Promise<any> {
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= this.middlewares.length) {
        return handler();
      }

      const middleware = this.middlewares[index++];
      return middleware(context, next);
    };

    return next();
  }
}

// Example middleware implementations
export const loggingMiddleware: MiddlewareFunction = async (context, next) => {
  const start = Date.now();
  console.log(`[${context.timestamp.toISOString()}] Starting ${context.method}`);
  
  try {
    const result = await next();
    const duration = Date.now() - start;
    console.log(`[${context.timestamp.toISOString()}] Completed ${context.method} in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[${context.timestamp.toISOString()}] Failed ${context.method} in ${duration}ms:`, error);
    throw error;
  }
};

export const rateLimitMiddleware = (requestsPerMinute: number): MiddlewareFunction => {
  const requests = new Map<string, number[]>();

  return async (context, next) => {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    const clientId = 'default'; // In real implementation, extract from context

    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId)!;
    // Remove old requests outside the window
    const recentRequests = clientRequests.filter(time => time > windowStart);
    requests.set(clientId, recentRequests);

    if (recentRequests.length >= requestsPerMinute) {
      throw new Error('Rate limit exceeded');
    }

    recentRequests.push(now);
    return next();
  };
};

export const validationMiddleware: MiddlewareFunction = async (context, next) => {
  // Add request validation logic here
  if (!context.params) {
    throw new Error('Missing parameters');
  }
  
  return next();
};

export const authenticationMiddleware = (apiKey?: string): MiddlewareFunction => {
  return async (context, next) => {
    if (apiKey && process.env.MCP_API_KEY) {
      if (apiKey !== process.env.MCP_API_KEY) {
        throw new Error('Unauthorized: Invalid API key');
      }
    }
    
    return next();
  };
};