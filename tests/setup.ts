// Global test setup
import { promises as fs } from 'fs';
import { join } from 'path';

// Create test directories
beforeAll(async () => {
  const testDirs = ['./data', './temp', './logs'];
  
  for (const dir of testDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
  
  // Create test data files
  const testDataDir = join(process.cwd(), 'data');
  await fs.writeFile(
    join(testDataDir, 'test-sample.txt'),
    'This is a test file for MCP server testing.\nLine 2\nLine 3'
  );
  
  await fs.writeFile(
    join(testDataDir, 'test-config.json'),
    JSON.stringify({ test: true, value: 42 }, null, 2)
  );
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up test files
  try {
    const testFiles = [
      './data/test-sample.txt',
      './data/test-config.json'
    ];
    
    for (const file of testFiles) {
      try {
        await fs.unlink(file);
      } catch {
        // File might not exist
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
});

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Only show console output if tests fail or in debug mode
  if (!process.env.DEBUG) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterEach(() => {
  if (!process.env.DEBUG) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});