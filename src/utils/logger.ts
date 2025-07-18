export class Logger {
  private logs: Array<{ level: string; message: string; timestamp: Date; data?: any }> = [];
  private maxLogs = 1000;

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  }

  error(message: string, data?: any): void {
    this.log('ERROR', message, data);
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : '');
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  }

  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
    }
  }

  private log(level: string, message: string, data?: any): void {
    this.logs.push({
      level,
      message,
      data,
      timestamp: new Date(),
    });

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getRecentLogs(count: number = 50): string {
    return this.logs
      .slice(-count)
      .map(log => `[${log.timestamp.toISOString()}] ${log.level}: ${log.message}`)
      .join('\n');
  }

  getLogs(): Array<{ level: string; message: string; timestamp: Date; data?: any }> {
    return [...this.logs];
  }
}