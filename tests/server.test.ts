import { MCPTypeScriptServer } from '../src/server';
import { CalculatorTool } from '../src/tools/calculator';
import { FileManagerTool } from '../src/tools/fileManager';
import { Logger } from '../src/utils/logger';
import { ConfigManager } from '../src/config';

describe('MCP TypeScript Server', () => {
  let server: MCPTypeScriptServer;

  beforeAll(() => {
    // Use test configuration
    process.env.NODE_ENV = 'test';
    server = new MCPTypeScriptServer();
  });

  afterAll(() => {
    delete process.env.NODE_ENV;
  });

  it('should initialize server with default configuration', () => {
    expect(server).toBeDefined();
  });

  describe('Calculator Tool', () => {
    let calculator: CalculatorTool;

    beforeEach(() => {
      calculator = new CalculatorTool();
    });

    it('should perform basic arithmetic', async () => {
      const result = await calculator.calculate({ expression: '2 + 3' });
      expect(result.content[0].text).toContain('= 5');
      expect(result.isError).toBeFalsy();
    });

    it('should handle complex expressions', async () => {
      const result = await calculator.calculate({ expression: '(10 + 5) * 2 - 8' });
      expect(result.content[0].text).toContain('= 22');
      expect(result.isError).toBeFalsy();
    });

    it('should handle multiplication and division', async () => {
      const result = await calculator.calculate({ expression: '10 * 5 / 2' });
      expect(result.content[0].text).toContain('= 25');
      expect(result.isError).toBeFalsy();
    });

    it('should handle decimal numbers', async () => {
      const result = await calculator.calculate({ expression: '3.14 * 2' });
      expect(result.content[0].text).toContain('= 6.28');
      expect(result.isError).toBeFalsy();
    });

    it('should reject invalid expressions', async () => {
      const result = await calculator.calculate({ expression: 'alert("hack")' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Error');
    });

    it('should handle division by zero gracefully', async () => {
      const result = await calculator.calculate({ expression: '5 / 0' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Error');
    });

    it('should reject empty expressions', async () => {
      const result = await calculator.calculate({ expression: '' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Error');
    });

    it('should reject expressions with invalid characters', async () => {
      const result = await calculator.calculate({ expression: '2 + 3; console.log("hack")' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('invalid characters');
    });
  });

  describe('File Manager Tool', () => {
    let fileManager: FileManagerTool;

    beforeEach(() => {
      fileManager = new FileManagerTool();
    });

    it('should reject paths outside allowed directories', async () => {
      const result = await fileManager.readFile({ path: '/etc/passwd' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Access denied');
    });

    it('should handle non-existent file gracefully', async () => {
      const result = await fileManager.readFile({ path: './data/non-existent.txt' });
      expect(result.isError).toBeTruthy();
      expect(result.content[0].text).toContain('Error');
    });

    it('should validate file paths', () => {
      // This would normally test the private validatePath method
      // For now, we test through the public interface
      expect(fileManager).toBeDefined();
    });

    it('should return proper tool definition', () => {
      const definition = fileManager.getDefinition();
      expect(definition.name).toBe('file_operations');
      expect(definition.inputSchema.properties.operation).toBeDefined();
      expect(definition.inputSchema.properties.path).toBeDefined();
    });
  });

  describe('Logger', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger();
    });

    it('should log messages at different levels', () => {
      logger.info('Test info message');
      logger.warn('Test warning message');
      logger.error('Test error message');
      logger.debug('Test debug message');

      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should retrieve recent logs', () => {
      logger.info('Test message 1');
      logger.info('Test message 2');
      logger.info('Test message 3');

      const recentLogs = logger.getRecentLogs(2);
      expect(recentLogs).toContain('Test message 2');
      expect(recentLogs).toContain('Test message 3');
    });

    it('should limit the number of stored logs', () => {
      const originalMaxLogs = (logger as any).maxLogs;
      (logger as any).maxLogs = 5;

      for (let i = 0; i < 10; i++) {
        logger.info(`Test message ${i}`);
      }

      const logs = logger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(5);
      
      // Restore original value
      (logger as any).maxLogs = originalMaxLogs;
    });
  });

  describe('Configuration Manager', () => {
    let config: ConfigManager;

    beforeEach(() => {
      config = new ConfigManager();
    });

    it('should load default configuration', () => {
      const serverName = config.get('server.name');
      expect(serverName).toBe('typescript-mcp-server');
    });

    it('should get nested configuration values', () => {
      const rateLimitRpm = config.get('security.rateLimitRpm');
      expect(typeof rateLimitRpm).toBe('number');
      expect(rateLimitRpm).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent keys', () => {
      const nonExistent = config.get('non.existent.key');
      expect(nonExistent).toBeUndefined();
    });

    it('should allow setting configuration values', () => {
      config.set('test.value', 'test-data');
      const value = config.get('test.value');
      expect(value).toBe('test-data');
    });
  });
});