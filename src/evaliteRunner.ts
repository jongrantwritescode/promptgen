import { PromptGenEngine } from "./engine.js";
import { TestCase } from "./types.js";
import { defaultConfig } from "./config/default.config.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class EvaliteRunner {
  private engine: PromptGenEngine;
  private testCases: TestCase[];

  constructor(testCases: TestCase[]) {
    this.testCases = testCases;
    this.engine = new PromptGenEngine(defaultConfig, testCases);
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

    const resultsDir = path.join(process.cwd(), "eval-results");
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
}

/**
 * Load and run an Evalite eval from a file path
 */
export async function runEvaliteEval(evalPath: string): Promise<void> {
  try {
    // Dynamic import of the eval file
    const evalModule = await import(evalPath);

    // Extract test cases from the eval file
    const testCases = extractTestCasesFromEvalite(evalModule);

    if (!testCases || testCases.length === 0) {
      throw new Error(`No test cases found in ${evalPath}`);
    }

    console.log(`📋 Loaded ${testCases.length} test cases from eval`);

    const runner = new EvaliteRunner(testCases);
    await runner.runEvolution();
  } catch (error) {
    console.error("❌ Error running Evalite eval:", error);
    throw error;
  }
}

/**
 * Extract test cases from an Evalite eval module
 */
function extractTestCasesFromEvalite(evalModule: any): TestCase[] {
  // Look for test cases in various possible locations
  if (evalModule.testCases) {
    return evalModule.testCases.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expected,
      metadata: tc.metadata || {},
    }));
  }

  // If no testCases export, we'll need to parse the evalite call
  // This is a simplified approach - in a real implementation, you might need
  // to parse the evalite function call more carefully
  return [];
}
