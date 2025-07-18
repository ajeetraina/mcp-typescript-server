// Update ServerCapabilities to match MCP SDK expectations
export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  logging?: {};
  [key: string]: unknown; // Add index signature for compatibility
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MiddlewareContext {
  method: string;
  params: any;
  timestamp: Date;
}

export type MiddlewareFunction = (
  context: MiddlewareContext,
  next: () => Promise<any>
) => Promise<any>;

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  tools: {
    [key: string]: boolean;
  };
}