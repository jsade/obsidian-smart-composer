import { Plugin } from 'obsidian';

/**
 * MemoryUsageInfo interface for storing memory usage data
 */
type MemoryUsageInfo = {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Memory statistics including growth rates
 */
type MemoryStats = {
  currentUsedMB: number;
  currentTotalMB: number;
  limitMB: number;
  usagePercentage: number;
  growthRateMBPerMinute: number;
  timeWindowMinutes: number;
  measurements: number;
}

/**
 * Memory Tracker for Obsidian plugins
 * Helps identify memory leaks by tracking JS heap memory usage over time
 */
export class MemoryTracker {
  private plugin: Plugin;
  private memoryHistory: MemoryUsageInfo[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private maxHistoryLength = 100; // Maximum number of history entries to keep
  private intervalMs: number;
  private debugMode: boolean;
  private lastLogTime = 0;
  private memoryThresholdPercentage: number;
  
  /**
   * Create a new MemoryTracker instance
   * @param plugin The Obsidian plugin instance
   * @param options Configuration options
   */
  constructor(
    plugin: Plugin, 
    options: {
      /** Interval in milliseconds between memory checks */
      intervalMs?: number;
      /** Whether to log all measurements to console */
      debugMode?: boolean;
      /** Maximum history length to store */
      maxHistoryLength?: number;
      /** Threshold percentage at which to issue warnings */
      memoryThresholdPercentage?: number;
    } = {}
  ) {
    this.plugin = plugin;
    this.intervalMs = options.intervalMs || 60000; // Default: check every minute
    this.debugMode = options.debugMode || false;
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this.memoryThresholdPercentage = options.memoryThresholdPercentage || 80;
  }

  /**
   * Start memory tracking
   */
  start(): void {
    if (this.checkInterval) {
      this.stop(); // Clear any existing interval
    }

    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.intervalMs);

    // Run an initial check immediately
    this.checkMemoryUsage();
    
    console.log('Memory tracking started');
  }

  /**
   * Stop memory tracking
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Memory tracking stopped');
    }
  }

  /**
   * Check current memory usage and record it
   */
  private checkMemoryUsage(): void {
    if (!window.performance || !(performance as any).memory) {
      console.log('Performance memory API not available');
      return;
    }

    const memoryInfo = (performance as any).memory;
    
    // Record memory usage data
    this.memoryHistory.push({
      timestamp: Date.now(),
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit
    });
    
    // Keep history size within limit
    if (this.memoryHistory.length > this.maxHistoryLength) {
      this.memoryHistory.shift();
    }
    
    // Calculate stats and log if in debug mode
    const stats = this.calculateStats();
    if (this.debugMode) {
      this.logMemoryStats(stats);
    }
    
    // Always log if memory usage is high
    if (stats.usagePercentage >= this.memoryThresholdPercentage) {
      // Limit logging to once every 5 minutes for high memory warnings
      const now = Date.now();
      if (now - this.lastLogTime >= 5 * 60 * 1000) {
        this.lastLogTime = now;
        this.logHighMemoryWarning(stats);
      }
    }
  }

  /**
   * Calculate memory statistics based on recorded history
   */
  private calculateStats(): MemoryStats {
    const latest = this.memoryHistory[this.memoryHistory.length - 1];
    
    // Calculate values in MB
    const currentUsedMB = Math.round(latest.usedJSHeapSize / (1024 * 1024));
    const currentTotalMB = Math.round(latest.totalJSHeapSize / (1024 * 1024));
    const limitMB = Math.round(latest.jsHeapSizeLimit / (1024 * 1024));
    const usagePercentage = Math.round((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100);
    
    // Calculate growth rate if we have enough history
    let growthRateMBPerMinute = 0;
    let timeWindowMinutes = 0;
    
    if (this.memoryHistory.length > 1) {
      const oldest = this.memoryHistory[0];
      timeWindowMinutes = (latest.timestamp - oldest.timestamp) / (1000 * 60);
      
      if (timeWindowMinutes > 0) {
        const usedHeapDifferenceMB = 
          (latest.usedJSHeapSize - oldest.usedJSHeapSize) / (1024 * 1024);
        growthRateMBPerMinute = usedHeapDifferenceMB / timeWindowMinutes;
      }
    }
    
    return {
      currentUsedMB,
      currentTotalMB,
      limitMB,
      usagePercentage,
      growthRateMBPerMinute,
      timeWindowMinutes,
      measurements: this.memoryHistory.length
    };
  }

  /**
   * Log memory statistics to the console
   */
  private logMemoryStats(stats: MemoryStats): void {
    console.log(
      `Smart Composer Memory Usage:
      - Used JS Heap: ${stats.currentUsedMB} MB (${stats.usagePercentage}% of limit)
      - Total JS Heap: ${stats.currentTotalMB} MB
      - JS Heap Limit: ${stats.limitMB} MB
      - Growth Rate: ${stats.growthRateMBPerMinute.toFixed(2)} MB/minute over last ${stats.timeWindowMinutes.toFixed(1)} minutes
      - Measurements: ${stats.measurements}`
    );
  }

  /**
   * Log a warning when memory usage is high
   */
  private logHighMemoryWarning(stats: MemoryStats): void {
    console.warn(
      `⚠️ Smart Composer HIGH MEMORY USAGE WARNING ⚠️
      Used: ${stats.currentUsedMB} MB (${stats.usagePercentage}% of ${stats.limitMB} MB limit)
      Growth Rate: ${stats.growthRateMBPerMinute.toFixed(2)} MB/minute
      
      Possible memory leak detected. Consider restarting Obsidian if performance degrades.`
    );
  }

  /**
   * Get current memory stats (for external use)
   */
  getMemoryStats(): MemoryStats {
    // Force a memory check if we don't have any data yet
    if (this.memoryHistory.length === 0) {
      this.checkMemoryUsage();
    }
    
    return this.calculateStats();
  }

  /**
   * Clear memory history
   */
  clearHistory(): void {
    this.memoryHistory = [];
    console.log('Memory tracking history cleared');
  }

  /**
   * Log the current memory usage immediately
   */
  logNow(): void {
    this.checkMemoryUsage();
    const stats = this.calculateStats();
    this.logMemoryStats(stats);
  }
} 