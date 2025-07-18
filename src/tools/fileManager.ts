import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { ToolDefinition, ToolResult } from '../types/index.js';

export class FileManagerTool {
  private readonly allowedPaths: string[];

  constructor() {
    // Define allowed paths for security
    this.allowedPaths = [
      resolve(process.cwd(), 'data'),
      resolve(process.cwd(), 'temp'),
    ];
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
      const safePath = this.validatePath(path);
      
      const content = await fs.readFile(safePath, 'utf-8');
      const stats = await fs.stat(safePath);
      
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
      const safePath = this.validatePath(path);
      
      // Ensure directory exists
      await fs.mkdir(dirname(safePath), { recursive: true });
      
      await fs.writeFile(safePath, content, 'utf-8');
      
      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote ${content.length} characters to ${path}`,
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
      const safePath = this.validatePath(path);
      
      const entries = await fs.readdir(safePath, { withFileTypes: true });
      const items = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(safePath, entry.name);
          const stats = await fs.stat(fullPath);
          
          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
          };
        })
      );
      
      const summary = `Directory: ${path}\nTotal items: ${items.length}\n\n` +
        items.map(item => 
          `${item.type === 'directory' ? '📁' : '📄'} ${item.name} (${item.size} bytes, ${item.modified})`
        ).join('\n');
      
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

  private validatePath(userPath: string): string {
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
    const message = error instanceof Error ? error.message : 'Unknown error';
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
}