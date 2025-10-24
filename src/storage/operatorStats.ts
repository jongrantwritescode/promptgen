import { Prompt } from "../types.js";

interface OperatorStats {
  usageCount: number;
  totalFitnessImprovement: number;
  successCount: number;
  failureCount: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  lastUsed: Date;
}

export class OperatorStatsTracker {
  private stats = new Map<string, OperatorStats>();
  private responseTimes = new Map<string, number[]>();

  recordUsage(
    operatorName: string,
    fitnessImprovement: number,
    success: boolean,
    responseTime: number,
    cacheHit: boolean
  ): void {
    const current = this.stats.get(operatorName) || {
      usageCount: 0,
      totalFitnessImprovement: 0,
      successCount: 0,
      failureCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      lastUsed: new Date(),
    };

    current.usageCount++;
    current.totalFitnessImprovement += fitnessImprovement;
    current.lastUsed = new Date();

    if (success) {
      current.successCount++;
    } else {
      current.failureCount++;
    }

    if (cacheHit) {
      current.cacheHits++;
    } else {
      current.cacheMisses++;
    }

    // Track response times
    if (!this.responseTimes.has(operatorName)) {
      this.responseTimes.set(operatorName, []);
    }
    const times = this.responseTimes.get(operatorName)!;
    times.push(responseTime);

    // Keep only last 100 response times
    if (times.length > 100) {
      times.shift();
    }

    // Calculate average response time
    current.averageResponseTime =
      times.reduce((sum, time) => sum + time, 0) / times.length;

    this.stats.set(operatorName, current);
  }

  getStats(operatorName: string): OperatorStats | null {
    return this.stats.get(operatorName) || null;
  }

  getAllStats(): Map<string, OperatorStats> {
    return new Map(this.stats);
  }

  getTopPerformers(
    count: number = 5
  ): Array<{ name: string; stats: OperatorStats; score: number }> {
    const performers: Array<{
      name: string;
      stats: OperatorStats;
      score: number;
    }> = [];

    for (const [name, stats] of this.stats.entries()) {
      if (stats.usageCount < 3) continue; // Need minimum usage for reliable stats

      // Calculate composite score
      const successRate = stats.successCount / stats.usageCount;
      const avgFitnessImprovement =
        stats.totalFitnessImprovement / stats.usageCount;
      const cacheHitRate =
        stats.cacheHits / (stats.cacheHits + stats.cacheMisses) || 0;

      // Weighted score: success rate (40%), fitness improvement (40%), cache efficiency (20%)
      const score =
        successRate * 0.4 + avgFitnessImprovement * 0.4 + cacheHitRate * 0.2;

      performers.push({ name, stats, score });
    }

    return performers.sort((a, b) => b.score - a.score).slice(0, count);
  }

  getWorstPerformers(
    count: number = 3
  ): Array<{ name: string; stats: OperatorStats; score: number }> {
    const performers = this.getTopPerformers(100); // Get all performers
    return performers.slice(-count).reverse(); // Return worst performers
  }

  getOperatorRecommendations(): {
    recommended: string[];
    avoid: string[];
    reasons: Record<string, string>;
  } {
    const topPerformers = this.getTopPerformers(3);
    const worstPerformers = this.getWorstPerformers(2);

    const recommended = topPerformers.map((p) => p.name);
    const avoid = worstPerformers.map((p) => p.name);

    const reasons: Record<string, string> = {};

    for (const performer of topPerformers) {
      const stats = performer.stats;
      reasons[performer.name] = `High success rate (${(
        (stats.successCount / stats.usageCount) *
        100
      ).toFixed(1)}%), good fitness improvement (${(
        stats.totalFitnessImprovement / stats.usageCount
      ).toFixed(3)})`;
    }

    for (const performer of worstPerformers) {
      const stats = performer.stats;
      reasons[performer.name] = `Low success rate (${(
        (stats.successCount / stats.usageCount) *
        100
      ).toFixed(1)}%), poor fitness improvement (${(
        stats.totalFitnessImprovement / stats.usageCount
      ).toFixed(3)})`;
    }

    return { recommended, avoid, reasons };
  }

  getCacheEfficiency(): {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
  } {
    let totalHits = 0;
    let totalMisses = 0;

    for (const stats of this.stats.values()) {
      totalHits += stats.cacheHits;
      totalMisses += stats.cacheMisses;
    }

    const hitRate = totalHits / (totalHits + totalMisses) || 0;

    return { totalHits, totalMisses, hitRate };
  }

  getPerformanceTrends(): Record<string, "improving" | "declining" | "stable"> {
    const trends: Record<string, "improving" | "declining" | "stable"> = {};

    for (const [name, stats] of this.stats.entries()) {
      if (stats.usageCount < 10) {
        trends[name] = "stable";
        continue;
      }

      const times = this.responseTimes.get(name) || [];
      if (times.length < 5) {
        trends[name] = "stable";
        continue;
      }

      // Compare recent performance vs older performance
      const recent = times.slice(-5);
      const older = times.slice(-10, -5);

      if (recent.length === 0 || older.length === 0) {
        trends[name] = "stable";
        continue;
      }

      const recentAvg =
        recent.reduce((sum, time) => sum + time, 0) / recent.length;
      const olderAvg =
        older.reduce((sum, time) => sum + time, 0) / older.length;

      const improvement = (olderAvg - recentAvg) / olderAvg;

      if (improvement > 0.1) {
        trends[name] = "improving";
      } else if (improvement < -0.1) {
        trends[name] = "declining";
      } else {
        trends[name] = "stable";
      }
    }

    return trends;
  }

  reset(): void {
    this.stats.clear();
    this.responseTimes.clear();
  }

  exportStats(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      operators: Object.fromEntries(this.stats),
      recommendations: this.getOperatorRecommendations(),
      cacheEfficiency: this.getCacheEfficiency(),
      performanceTrends: this.getPerformanceTrends(),
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Singleton instance
export const operatorStatsTracker = new OperatorStatsTracker();
