import * as dotenv from "dotenv";
// Load environment variables
dotenv.config();

import { PromptGenEngine } from "./engine.js";
import { intentClassificationConfig } from "./config/default.config.js";
import { TestCase } from "./types.js";

// Import test cases directly instead of from examples
const intentClassificationTestCases: TestCase[] = [
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
];

export class EvaliteRunner {
  private engine: PromptGenEngine;

  constructor() {
    this.engine = new PromptGenEngine(
      intentClassificationConfig,
      intentClassificationTestCases
    );
  }

  async runEvolution(): Promise<void> {
    console.log("🧬 Starting PromptGen evolution with Evalite integration...");

    try {
      const result = await this.engine.evolve();

      console.log("\n🏆 Evolution Results:");
      console.log(`📈 Best Fitness: ${result.bestPrompt.fitness.toFixed(3)}`);
      console.log(`🧬 Best Prompt: "${result.bestPrompt.text}"`);
      console.log(`📊 Total Generations: ${result.totalGenerations}`);
      console.log(`🔬 Total Evaluations: ${result.totalEvaluations}`);

      console.log("\n🏆 Hall of Fame (Top 5):");
      result.hallOfFame.slice(0, 5).forEach((prompt: any, index: number) => {
        console.log(
          `${index + 1}. [${prompt.fitness.toFixed(3)}] "${prompt.text}"`
        );
      });

      // Save results for evalite to use
      await this.saveResultsForEvalite(result);
    } catch (error) {
      console.error("❌ Evolution failed:", error);
      throw error;
    }
  }

  private async saveResultsForEvalite(result: any): Promise<void> {
    // Save the best prompts to a file that evalite can use
    const fs = await import("fs");
    const path = await import("path");

    const resultsDir = path.join(process.cwd(), "evalite-results");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const resultsFile = path.join(resultsDir, "evolution-results.json");
    const resultsData = {
      timestamp: new Date().toISOString(),
      bestPrompt: result.bestPrompt,
      hallOfFame: result.hallOfFame.slice(0, 10), // Top 10
      stats: result.stats,
      totalGenerations: result.totalGenerations,
      totalEvaluations: result.totalEvaluations,
    };

    fs.writeFileSync(resultsFile, JSON.stringify(resultsData, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }

  async runEvaliteEvaluation(prompt: string): Promise<void> {
    console.log(`\n🎯 Running Evalite evaluation for prompt: "${prompt}"`);

    try {
      // This would run the evalite evaluation
      // For now, we'll just log that we would run it
      console.log("📊 Evalite evaluation would run here...");
      console.log("🔧 To run evalite evaluation, use: npm run eval");
    } catch (error) {
      console.error("❌ Evalite evaluation failed:", error);
      throw error;
    }
  }
}

// EvaliteRunner is already exported as a class above
