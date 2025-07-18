import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ToolDefinition, ToolResult, Resource, ServerCapabilities } from './types/index.js';
import { CalculatorTool } from './tools/calculator.js';
import { FileManagerTool } from './tools/fileManager.js';
import { Logger } from './utils/logger.js';
import { ConfigManager } from './config/index.js';
import { MiddlewareManager, loggingMiddleware, rateLimitMiddleware } from './middleware/index.js';
import { HealthChecker } from './health.js';

export class MCPTypeScriptServer {
  private server: Server;
  private tools: Map<string, any> = new Map();
  private resources: Map<string, Resource> = new Map();
  private logger: Logger;
  private config: ConfigManager;
  private middleware: MiddlewareManager;
  private healthChecker: HealthChecker;

  constructor(configPath?: string) {
    this.logger = new Logger();
    this.config = new ConfigManager(configPath);
    this.middleware = new MiddlewareManager();
    this.healthChecker = new HealthChecker();
    
    this.server = new Server(
      {
        name: this.config.get('server.name'),
        version: this.config.get('server.version'),
      },
      {
        capabilities: this.getServerCapabilities(),
      }
    );

    this.setupMiddleware();
    this.initializeTools();
    this.initializeResources();
    this.setupHandlers();
  }

  private getServerCapabilities(): ServerCapabilities {
    return {
      tools: {
        listChanged: true,
      },
      resources: {
        subscribe: true,
        listChanged: true,
      },
      logging: {},
    };
  }

  private setupMiddleware(): void {
    this.middleware.use(loggingMiddleware);
    this.middleware.use(rateLimitMiddleware(this.config.get('security.rateLimitRpm')));
  }

  private initializeTools(): void {
    // Register calculator tool if enabled
    if (this.config.get('tools.calculator.enabled')) {
      const calculatorTool = new CalculatorTool();
      this.tools.set('calculate', calculatorTool);
    }

    // Register file manager tools if enabled
    if (this.config.get('tools.fileManager.enabled')) {
      const fileManagerTool = new FileManagerTool();
      this.tools.set('read_file', fileManagerTool);
      this.tools.set('write_file', fileManagerTool);
      this.tools.set('list_directory', fileManagerTool);
    }

    this.logger.info(`Initialized ${this.tools.size} tools`);
  }

  private initializeResources(): void {
    // Add sample resources
    this.resources.set('config://server.json', {
      uri: 'config://server.json',
      name: 'Server Configuration',
      description: 'Current server configuration',
      mimeType: 'application/json',
    });

    this.resources.set('logs://recent.txt', {
      uri: 'logs://recent.txt',
      name: 'Recent Logs',
      description: 'Recent server logs',
      mimeType: 'text/plain',
    });

    this.resources.set('health://status.json', {
      uri: 'health://status.json',
      name: 'Health Status',
      description: 'Current server health status',
      mimeType: 'application/json',
    });

    this.logger.info(`Initialized ${this.resources.size} resources`);
  }

  private setupHandlers(): void {
    // Handle tool listing
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      return this.middleware.execute(
        { method: 'tools/list', params: request.params, timestamp: new Date() },
        async () => {
          const toolDefinitions: ToolDefinition[] = [];

          this.tools.forEach((tool, name) => {
            if (tool.getDefinition) {
              toolDefinitions.push(tool.getDefinition());
            }
          });

          return { tools: toolDefinitions };
        }
      );
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return this.middleware.execute(
        { method: 'tools/call', params: request.params, timestamp: new Date() },
        async () => {
          const { name, arguments: args } = request.params;

          this.logger.info(`Executing tool: ${name}`, args);

          try {
            const tool = this.tools.get(name);
            if (!tool) {
              throw new Error(`Tool '${name}' not found`);
            }

            let result: ToolResult;

            // Handle different tool methods
            switch (name) {
              case 'calculate':
                result = await tool.calculate(args);
                break;
              case 'read_file':
                result = await tool.readFile(args);
                break;
              case 'write_file':
                result = await tool.writeFile(args);
                break;
              case 'list_directory':
                result = await tool.listDirectory(args);
                break;
              default:
                throw new Error(`Unknown tool method: ${name}`);
            }

            this.logger.info(`Tool ${name} executed successfully`);
            return result;
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Tool execution failed: ${errorMessage}`);
            
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              isError: true,
            };
          }
        }
      );
    });

    // Handle resource listing
    this.server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
      return this.middleware.execute(
        { method: 'resources/list', params: request.params, timestamp: new Date() },
        async () => {
          const resourceList = Array.from(this.resources.values());
          return { resources: resourceList };
        }
      );
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return this.middleware.execute(
        { method: 'resources/read', params: request.params, timestamp: new Date() },
        async () => {
          const { uri } = request.params;
          const resource = this.resources.get(uri);

          if (!resource) {
            throw new Error(`Resource not found: ${uri}`);
          }

          // Simulate resource content based on URI
          let content: string;
          switch (uri) {
            case 'config://server.json':
              content = JSON.stringify(this.config.getConfig(), null, 2);
              break;
            case 'logs://recent.txt':
              content = this.logger.getRecentLogs();
              break;
            case 'health://status.json':
              content = JSON.stringify(this.healthChecker.getHealthStatus(), null, 2);
              break;
            default:
              content = `Content for ${uri}`;
          }

          return {
            contents: [
              {
                uri,
                mimeType: resource.mimeType || 'text/plain',
                text: content,
              },
            ],
          };
        }
      );
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP TypeScript Server started successfully');
    
    // Start health monitoring
    this.healthChecker.startMonitoring();
  }

  public async stop(): Promise<void> {
    this.logger.info('Stopping MCP TypeScript Server...');
    // Add cleanup logic here
    process.exit(0);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new MCPTypeScriptServer();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    await server.stop();
  });
  
  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    await server.stop();
  });
  
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}