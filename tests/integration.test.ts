import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { promises as fs } from 'fs';

describe('MCP Server Integration Tests', () => {
  let serverProcess: ChildProcess;
  const serverPath = join(__dirname, '../dist/server.js');

  beforeAll(async () => {
    // Ensure the server is built
    try {
      await fs.access(serverPath);
    } catch {
      throw new Error('Server not built. Run `npm run build` first.');
    }
  });

  afterEach(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  it('should start server and respond to basic requests', async () => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timeout'));
      }, 10000);

      serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        
        // Check if server started successfully
        if (output.includes('MCP TypeScript Server started successfully')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Server process error: ${error.message}`));
      });

      serverProcess.on('exit', (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}. stderr: ${errorOutput}`));
        }
      });

      // Give the server a moment to start
      setTimeout(() => {
        if (!output.includes('started successfully')) {
          clearTimeout(timeout);
          reject(new Error(`Server did not start within timeout. Output: ${output}, Error: ${errorOutput}`));
        }
      }, 5000);
    });
  }, 15000);

  it('should handle MCP protocol requests', async () => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timeout'));
      }, 10000);

      serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let responseReceived = false;

      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        
        // Look for JSON-RPC response
        if (output.includes('"jsonrpc"') && output.includes('"result"')) {
          responseReceived = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Wait for server to start then send a request
      setTimeout(() => {
        const request = JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {},
        });

        serverProcess.stdin?.write(request + '\n');
        
        // Wait for response
        setTimeout(() => {
          if (!responseReceived) {
            clearTimeout(timeout);
            reject(new Error(`No response received. Output: ${output}`));
          }
        }, 3000);
      }, 2000);
    });
  }, 15000);

  it('should handle tool execution requests', async () => {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Test timeout'));
      }, 10000);

      serverProcess = spawn('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let calculationResponseReceived = false;

      serverProcess.stdout?.on('data', (data) => {
        output += data.toString();
        
        // Look for calculation result
        if (output.includes('"Result:') && output.includes('= 7')) {
          calculationResponseReceived = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Wait for server to start then send a calculation request
      setTimeout(() => {
        const request = JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'calculate',
            arguments: {
              expression: '3 + 4'
            }
          },
        });

        serverProcess.stdin?.write(request + '\n');
        
        // Wait for response
        setTimeout(() => {
          if (!calculationResponseReceived) {
            clearTimeout(timeout);
            reject(new Error(`No calculation response received. Output: ${output}`));
          }
        }, 3000);
      }, 2000);
    });
  }, 15000);
});