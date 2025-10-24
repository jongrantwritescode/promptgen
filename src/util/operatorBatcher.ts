import { OperatorBatchRequest, LLMProvider } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export class OperatorBatcher {
  private queue: OperatorBatchRequest[] = [];
  private batchSize: number;
  private batchWindow: number; // milliseconds
  private timeoutId: NodeJS.Timeout | null = null;
  private llmProvider: LLMProvider;

  constructor(
    llmProvider: LLMProvider,
    batchSize: number = 5,
    batchWindow: number = 100
  ) {
    this.llmProvider = llmProvider;
    this.batchSize = batchSize;
    this.batchWindow = batchWindow;
  }

  async addRequest(
    type: "crossover" | "mutation" | "selection",
    prompt: string,
    context?: any
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const request: OperatorBatchRequest = {
        id: uuidv4(),
        type,
        prompt,
        context,
        resolve,
        reject,
      };

      this.queue.push(request);

      // Process immediately if batch is full
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else {
        // Set timeout to process batch after window
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = setTimeout(() => {
          this.processBatch();
        }, this.batchWindow);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    // Clear timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    // Take up to batchSize requests
    const batch = this.queue.splice(0, this.batchSize);

    try {
      // Group requests by type for better batching
      const groupedRequests = this.groupRequestsByType(batch);

      // Process each group
      for (const [type, requests] of groupedRequests.entries()) {
        await this.processBatchGroup(type, requests);
      }
    } catch (error) {
      // Reject all requests in batch
      batch.forEach((request) => {
        request.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      });
    }
  }

  private groupRequestsByType(
    requests: OperatorBatchRequest[]
  ): Map<string, OperatorBatchRequest[]> {
    const grouped = new Map<string, OperatorBatchRequest[]>();

    for (const request of requests) {
      if (!grouped.has(request.type)) {
        grouped.set(request.type, []);
      }
      grouped.get(request.type)!.push(request);
    }

    return grouped;
  }

  private async processBatchGroup(
    type: string,
    requests: OperatorBatchRequest[]
  ): Promise<void> {
    if (requests.length === 1) {
      // Single request - process normally
      const request = requests[0]!;
      try {
        const result = await this.llmProvider.generate(request.prompt, {
          temperature: 0.7,
          maxTokens: 200,
        });
        request.resolve(result);
      } catch (error) {
        request.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      }
      return;
    }

    // Multiple requests - batch them
    const batchPrompt = this.createBatchPrompt(type, requests);

    try {
      const batchResult = await this.llmProvider.generate(batchPrompt, {
        temperature: 0.7,
        maxTokens: 1000,
      });

      // Parse batch result and distribute to individual requests
      const results = this.parseBatchResult(batchResult, requests.length);

      requests.forEach((request, index) => {
        if (results[index]) {
          request.resolve(results[index]!);
        } else {
          request.reject(new Error("Failed to parse batch result"));
        }
      });
    } catch (error) {
      requests.forEach((request) => {
        request.reject(
          error instanceof Error ? error : new Error(String(error))
        );
      });
    }
  }

  private createBatchPrompt(
    type: string,
    requests: OperatorBatchRequest[]
  ): string {
    const prompts = requests
      .map((req, i) => `${i + 1}. ${req.prompt}`)
      .join("\n\n");

    return `You are processing ${requests.length} ${type} operations. For each numbered prompt below, provide a response. Return your responses in the same order, separated by "---RESULT---":

${prompts}

Format your response as:
1. [Response to prompt 1]
---RESULT---
2. [Response to prompt 2]
---RESULT---
...`;
  }

  private parseBatchResult(result: string, expectedCount: number): string[] {
    const parts = result.split("---RESULT---");
    const responses: string[] = [];

    for (let i = 0; i < expectedCount; i++) {
      const part = parts[i];
      if (part) {
        // Extract the response (remove numbering)
        const cleanResponse = part.replace(/^\d+\.\s*/, "").trim();
        responses.push(cleanResponse);
      } else {
        responses.push("");
      }
    }

    return responses;
  }

  // Force process any remaining requests
  async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    await this.processBatch();
  }

  // Get current queue size
  getQueueSize(): number {
    return this.queue.length;
  }

  // Update batch configuration
  updateConfig(batchSize: number, batchWindow: number): void {
    this.batchSize = batchSize;
    this.batchWindow = batchWindow;
  }
}
