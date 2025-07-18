import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { ToolDefinition, ToolResult } from '../types/index.js';

export class FileManagerTool {
  private readonly allowedPaths: string[];
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB limit

  constructor() {
    // Define allowed paths for security
    this.allowedPaths = [
      resolve(process.cwd(), 'data'),
      resolve(process.cwd(), 'temp'),
    ];

    // Ensure allowed directories exist
    this.ensureDirectoriesExist();
  }

  private async ensureDirectoriesExist(): Promise<void> {
    for (const path of this.allowedPaths) {
      try {
        await fs.mkdir(path, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create directory ${path}:`, error);
      }
    }
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'file_operations',
      description: 'Manage files and directories with read, write, and list operations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['read', 'write', 'list'],
            description: 'Operation to perform',
          },
          path: {
            type: 'string',
            description: 'File or directory path',
          },
          content: {
            type: 'string',
            description: 'Content to write (required for write operation)',
          },
        },
        required: ['operation', 'path'],
      },
    };
  }

  async readFile(args: { path: string }): Promise<ToolResult> {
    try {
      const { path } = args;
      const safePath = await this.validatePath(path);
      
      const stats = await fs.stat(safePath);
      
      // Check file size
      if (stats.size > this.maxFileSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${this.maxFileSize} bytes)`);
      }
      
      const content = await fs.readFile(safePath, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `File: ${path}\nSize: ${stats.size} bytes\nModified: ${stats.mtime.toISOString()}\n\nContent:\n${content}`,
          },
        ],
      };
    } catch (error) {
      return this.handleError(error, `reading file: ${args.path}`);
    }
  }

  async writeFile(args: { path: string; content: string }): Promise<ToolResult> {
    try {
      const { path, content } = args;
      
      if (!content) {
        throw new Error('Content is required for write operation');
      }
      
      const safePath = await this.validatePath(path);
      
      // Check content size
      const contentSize = Buffer.byteLength(content, 'utf-8');
      if (contentSize > this.maxFileSize) {
        throw new Error(`Content too large: ${contentSize} bytes (max: ${this.maxFileSize} bytes)`);
      }
      
      // Ensure directory exists
      await fs.mkdir(dirname(safePath), { recursive: true });
      
      await fs.writeFile(safePath, content, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote ${contentSize} bytes to ${path}`,
          },
        ],
      };
    } catch (error) {
      return this.handleError(error, `writing file: ${args.path}`);
    }
  }

  async listDirectory(args: { path: string }): Promise<ToolResult> {
    try {
      const { path } = args;
      const safePath = await this.validatePath(path);
      
      const stats = await fs.stat(safePath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${path}`);
      }
      
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (entry) => {
          try {
            const fullPath = join(safePath, entry.name);
            const itemStats = await fs.stat(fullPath);
            
            return {
              name: entry.name,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: itemStats.size,
              modified: itemStats.mtime.toISOString(),
              accessible: true,
            };
          } catch {
            return {
              name: entry.name,
              type: entry.isDirectory() ? 'directory' : 'file',
              size: 0,
              modified: 'unknown',
              accessible: false,
            };
          }
        })
      );
      
      const summary = `Directory: ${path}\nTotal items: ${items.length}\n\n` +
        items.map(item => {
          const icon = item.type === 'directory' ? '📁' : '📄';
          const status = item.accessible ? '' : ' (inaccessible)';
          return `${icon} ${item.name} (${item.size} bytes, ${item.modified})${status}`;
        }).join('\n');
      
      return {
        content: [
          {
            type: 'text',
            text: summary,
          },
        ],
      };
    } catch (error) {
      return this.handleError(error, `listing directory: ${args.path}`);
    }
  }

  private async validatePath(userPath: string): Promise<string> {
    if (!userPath || typeof userPath !== 'string') {
      throw new Error('Path must be a non-empty string');
    }

    // Resolve the path
    const resolvedPath = resolve(userPath);
    
    // Check if path is within allowed directories
    const isAllowed = this.allowedPaths.some(allowedPath => 
      resolvedPath.startsWith(allowedPath)
    );
    
    if (!isAllowed) {
      throw new Error(`Access denied: Path ${userPath} is not in allowed directories`);
    }
    
    return resolvedPath;
  }

  private handleError(error: unknown, operation: string): ToolResult {
    let message: string;
    
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = 'Unknown error occurred';
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Error ${operation}: ${message}`,
        },
      ],
      isError: true,
    };
  }

  // Utility methods
  getAllowedPaths(): string[] {
    return [...this.allowedPaths];
  }

  getMaxFileSize(): number {
    return this.maxFileSize;
  }
}