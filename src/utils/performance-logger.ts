/**
 * Performance Logging Utilities
 *
 * Tracks endpoint performance and generates optimization reports
 */

interface PerformanceMetric {
  endpoint: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  input?: any;
}

class PerformanceTracker {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 requests

  log(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getStats() {
    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = {
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          successRate: 0,
          successCount: 0,
        };
      }

      const stats = acc[metric.endpoint]!;
      stats.count++;
      stats.totalDuration += metric.duration;
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      if (metric.success) stats.successCount++;

      return acc;
    }, {} as Record<string, any>);

    // Calculate averages and success rates
    Object.keys(grouped).forEach(endpoint => {
      const stats = grouped[endpoint]!;
      stats.avgDuration = Math.round(stats.totalDuration / stats.count);
      stats.successRate = Math.round((stats.successCount / stats.count) * 100);
    });

    return grouped;
  }

  generateReport(): string {
    const stats = this.getStats();
    const endpoints = Object.keys(stats);

    if (endpoints.length === 0) {
      return 'No performance data collected yet.';
    }

    // Sort by average duration (slowest first)
    const sorted = endpoints
      .map(endpoint => ({ endpoint, ...stats[endpoint]! }))
      .sort((a, b) => b.avgDuration - a.avgDuration);

    let report = '\n📊 PERFORMANCE REPORT\n';
    report += '═══════════════════════════════════════════════════════════\n\n';

    // Top 10 slowest endpoints
    report += '🐌 SLOWEST ENDPOINTS (Top 10):\n';
    report += '─────────────────────────────────────────────────────────\n';

    sorted.slice(0, 10).forEach((stat, index) => {
      const icon = stat.avgDuration > 500 ? '🔴' : stat.avgDuration > 200 ? '🟡' : '🟢';
      report += `${index + 1}. ${icon} ${stat.endpoint}\n`;
      report += `   Avg: ${stat.avgDuration}ms | Min: ${stat.minDuration}ms | Max: ${stat.maxDuration}ms\n`;
      report += `   Calls: ${stat.count} | Success Rate: ${stat.successRate}%\n\n`;
    });

    // Optimization recommendations
    report += '\n💡 OPTIMIZATION RECOMMENDATIONS:\n';
    report += '─────────────────────────────────────────────────────────\n';

    const slowEndpoints = sorted.filter(s => s.avgDuration > 500);
    if (slowEndpoints.length > 0) {
      report += `⚠️  ${slowEndpoints.length} endpoint(s) taking >500ms on average:\n`;
      slowEndpoints.forEach(stat => {
        report += `   - ${stat.endpoint} (${stat.avgDuration}ms)\n`;
      });
      report += '\n   Actions:\n';
      report += '   • Check if database indexes are applied\n';
      report += '   • Look for N+1 query patterns\n';
      report += '   • Consider adding caching (Redis)\n';
      report += '   • Review query complexity\n\n';
    }

    const mediumEndpoints = sorted.filter(s => s.avgDuration > 200 && s.avgDuration <= 500);
    if (mediumEndpoints.length > 0) {
      report += `🟡 ${mediumEndpoints.length} endpoint(s) taking 200-500ms:\n`;
      mediumEndpoints.forEach(stat => {
        report += `   - ${stat.endpoint} (${stat.avgDuration}ms)\n`;
      });
      report += '\n   Consider optimization if heavily used\n\n';
    }

    // Success rate warnings
    const lowSuccessRate = sorted.filter(s => s.successRate < 90);
    if (lowSuccessRate.length > 0) {
      report += `❌ ENDPOINTS WITH LOW SUCCESS RATE (<90%):\n`;
      lowSuccessRate.forEach(stat => {
        report += `   - ${stat.endpoint} (${stat.successRate}% success)\n`;
      });
      report += '\n';
    }

    report += '═══════════════════════════════════════════════════════════\n';
    report += `Total endpoints tracked: ${endpoints.length}\n`;
    report += `Total requests: ${sorted.reduce((acc, s) => acc + s.count, 0)}\n`;

    return report;
  }

  reset() {
    this.metrics = [];
  }
}

// Global singleton
export const performanceTracker = new PerformanceTracker();

// Export function to print report
export function printPerformanceReport() {
  console.log(performanceTracker.generateReport());
}

// Auto-generate report every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = performanceTracker.getStats();
    if (Object.keys(stats).length > 0) {
      printPerformanceReport();
    }
  }, 5 * 60 * 1000); // 5 minutes
}
