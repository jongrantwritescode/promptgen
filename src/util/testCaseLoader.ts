import { TestCase } from "../types.js";
import fs from "fs/promises";
import path from "path";

export async function loadTestCases(): Promise<TestCase[]> {
  try {
    // Try to load from examples directory first
    const examplesPath = path.join(
      process.cwd(),
      "examples",
      "classify-intent",
      "test-cases.json"
    );

    try {
      const data = await fs.readFile(examplesPath, "utf-8");
      const testCases = JSON.parse(data);
      return testCases.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        metadata: tc.metadata || {},
      }));
    } catch (error) {
      console.log("No test cases file found, using default test cases");
    }

    // Default test cases for intent classification
    return [
      {
        input: "What are your business hours?",
        expectedOutput: "question",
        metadata: { category: "question", domain: "business" },
      },
      {
        input: "I'm not happy with my recent purchase",
        expectedOutput: "complaint",
        metadata: { category: "complaint", domain: "sales" },
      },
      {
        input: "Your customer service is excellent!",
        expectedOutput: "compliment",
        metadata: { category: "compliment", domain: "service" },
      },
      {
        input: "Can you help me reset my password?",
        expectedOutput: "request",
        metadata: { category: "request", domain: "technical" },
      },
      {
        input: "The weather is nice today",
        expectedOutput: "other",
        metadata: { category: "other", domain: "general" },
      },
      {
        input: "How do I return an item?",
        expectedOutput: "question",
        metadata: { category: "question", domain: "returns" },
      },
      {
        input: "This product is defective",
        expectedOutput: "complaint",
        metadata: { category: "complaint", domain: "product" },
      },
      {
        input: "Thank you for your help!",
        expectedOutput: "compliment",
        metadata: { category: "compliment", domain: "service" },
      },
      {
        input: "I need to update my address",
        expectedOutput: "request",
        metadata: { category: "request", domain: "account" },
      },
      {
        input: "Have a great day!",
        expectedOutput: "other",
        metadata: { category: "other", domain: "general" },
      },
    ];
  } catch (error) {
    console.error("Error loading test cases:", error);
    throw error;
  }
}

export function generateRandomId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function calculateDiversity(prompts: string[]): number {
  if (prompts.length <= 1) return 0;

  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < prompts.length; i++) {
    for (let j = i + 1; j < prompts.length; j++) {
      const prompt1 = prompts[i];
      const prompt2 = prompts[j];
      if (prompt1 && prompt2) {
        const similarity = calculateSimilarity(prompt1, prompt2);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
  }

  const averageSimilarity = totalSimilarity / comparisons;
  return 1 - averageSimilarity; // Diversity is inverse of similarity
}

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

export function formatFitness(fitness: number): string {
  return (fitness * 100).toFixed(1) + "%";
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
