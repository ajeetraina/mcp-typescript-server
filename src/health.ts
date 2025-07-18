import { HealthStatus } from './types/index.js';

export class HealthChecker {
  private startTime = Date.now();
  private healthCheckInterval?: NodeJS.Timeout;
  private memoryThreshold = 500 * 1024 * 1024; // 500MB

  getHealthStatus(): HealthStatus {
    const now = Date.now();
    const memUsage = process.memoryUsage();
    const isHealthy = memUsage.heapUsed < this.memoryThreshold;

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: now - this.startTime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
      },
      tools: {
        calculator: true,
        fileManager: true,
      },
    };
  }

  startMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      const status = this.getHealthStatus();
      
      if (status.status === 'unhealthy') {
        console.warn('Health check failed:', status);
        
        // Trigger garbage collection if available
        if (global.gc) {
          global.gc();
          console.log('Triggered garbage collection');
        }
      }
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  isHealthy(): boolean {
    return this.getHealthStatus().status === 'healthy';
  }
}