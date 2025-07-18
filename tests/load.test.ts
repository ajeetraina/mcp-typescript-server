import { CalculatorTool } from '../src/tools/calculator';
import { Logger } from '../src/utils/logger';
import { LRUCache } from '../src/utils/cache';

describe('Load Testing', () => {
  describe('Calculator Tool Performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const calculator = new CalculatorTool();
      const promises = [];
      const startTime = Date.now();

      // Create 100 concurrent calculation requests
      for (let i = 0; i < 100; i++) {
        promises.push(
          calculator.calculate({ expression: `${i} + ${i * 2}` })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      results.forEach((result, index) => {
        expect(result.isError).toBeFalsy();
        expect(result.content[0].text).toContain(`= ${index + index * 2}`);
      });

      console.log(`100 concurrent calculations completed in ${duration}ms`);
    });

    it('should handle complex expressions under load', async () => {
      const calculator = new CalculatorTool();
      const complexExpressions = [
        '((10 + 5) * 2 - 8) / 3',
        '((20 - 5) * 3 + 10) / 5',
        '((30 + 10) / 4 * 2) - 5',
        '((40 - 15) / 5 + 8) * 2',
        '((50 + 25) / 3 - 10) + 5'
      ];

      const promises = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        for (const expression of complexExpressions) {
          promises.push(calculator.calculate({ expression }));
        }
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(iterations * complexExpressions.length);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
      
      results.forEach(result => {
        expect(result.isError).toBeFalsy();
      });

      console.log(`${results.length} complex calculations completed in ${duration}ms`);
    });
  });

  describe('Logger Performance', () => {
    it('should handle high-frequency logging', () => {
      const logger = new Logger();
      const startTime = Date.now();
      const messageCount = 1000;

      for (let i = 0; i < messageCount; i++) {
        logger.info(`Performance test message ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.length).toBeLessThanOrEqual(messageCount);

      console.log(`${messageCount} log messages processed in ${duration}ms`);
    });
  });

  describe('Cache Performance', () => {
    it('should handle rapid cache operations', () => {
      const cache = new LRUCache<string>(100, 60000); // 100 items, 1 minute TTL
      const startTime = Date.now();
      const operationCount = 1000;

      // Perform mixed read/write operations
      for (let i = 0; i < operationCount; i++) {
        if (i % 3 === 0) {
          cache.set(`key-${i}`, `value-${i}`);
        } else {
          cache.get(`key-${Math.floor(Math.random() * i + 1)}`);
        }
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      expect(cache.size()).toBeGreaterThan(0);
      expect(cache.size()).toBeLessThanOrEqual(100);

      console.log(`${operationCount} cache operations completed in ${duration}ms`);
    });

    it('should handle cache eviction efficiently', () => {
      const cache = new LRUCache<string>(10, 60000); // Small cache for testing eviction
      const startTime = Date.now();

      // Fill cache beyond capacity
      for (let i = 0; i < 20; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should complete quickly
      expect(cache.size()).toBe(10); // Should maintain max size

      // Verify LRU behavior - oldest items should be evicted
      expect(cache.get('key-0')).toBeUndefined();
      expect(cache.get('key-19')).toBeDefined();

      console.log(`Cache eviction test completed in ${duration}ms`);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during intensive operations', async () => {
      const initialMemory = process.memoryUsage();
      const calculator = new CalculatorTool();
      const logger = new Logger();
      
      // Perform intensive operations
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(
          calculator.calculate({ expression: `${Math.random() * 100} + ${Math.random() * 100}` })
        );
        logger.info(`Memory test iteration ${i}`);
      }

      await Promise.all(promises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
  });
});