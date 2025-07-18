import { readFileSync } from 'fs';
import { join } from 'path';

export interface ServerConfig {
  server: {
    name: string;
    version: string;
    port?: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
  };
  security: {
    allowedPaths: string[];
    rateLimitRpm: number;
  };
  tools: {
    calculator: {
      enabled: boolean;
      maxExpressionLength: number;
    };
    fileManager: {
      enabled: boolean;
      allowedExtensions: string[];
    };
  };
}

export class ConfigManager {
  private config: ServerConfig;

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
  }

  private loadConfig(configPath?: string): ServerConfig {
    const defaultConfig: ServerConfig = {
      server: {
        name: 'typescript-mcp-server',
        version: '1.0.0',
      },
      logging: {
        level: 'info',
        maxLogs: 1000,
      },
      security: {
        allowedPaths: ['./data', './temp'],
        rateLimitRpm: 60,
      },
      tools: {
        calculator: {
          enabled: true,
          maxExpressionLength: 100,
        },
        fileManager: {
          enabled: true,
          allowedExtensions: ['.txt', '.json', '.md'],
        },
      },
    };

    if (configPath) {
      try {
        const configFile = readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(configFile);
        return { ...defaultConfig, ...fileConfig };
      } catch (error) {
        console.warn('Failed to load config file, using defaults:', error);
      }
    }

    // Load from environment variables
    if (process.env.MCP_SERVER_NAME) {
      defaultConfig.server.name = process.env.MCP_SERVER_NAME;
    }
    
    if (process.env.MCP_RATE_LIMIT) {
      defaultConfig.security.rateLimitRpm = parseInt(process.env.MCP_RATE_LIMIT, 10);
    }

    return defaultConfig;
  }

  getConfig(): ServerConfig {
    return this.config;
  }

  get<T>(path: string): T {
    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      value = value?.[key];
    }

    return value as T;
  }

  set<T>(path: string, newValue: T): void {
    const keys = path.split('.');
    let current: any = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = newValue;
  }
}