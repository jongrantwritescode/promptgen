import { OperatorCache } from "../types.js";
import crypto from "crypto";

interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
}

export class OperatorCacheImpl implements OperatorCache {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    // 5 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key: string, value: string, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // If cache is full, remove oldest entry (LRU)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: entryTTL,
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
    };
  }

  // Generate cache key from operation type and input
  generateKey(operationType: string, input: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : "";
    const combined = `${operationType}:${input}:${contextStr}`;
    return crypto.createHash("md5").update(combined).digest("hex");
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const operatorCache = new OperatorCacheImpl();
