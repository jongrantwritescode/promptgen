import { PromptGenEngine } from "./engine.js";
import { TestCase, Config } from "./types.js";
import { defaultConfig } from "./config/default.config.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface EvalInfo {
  testCases: TestCase[];
  seedPrompt: string;
  taskDescription: string;
  evalName: string;
}

export class EvaliteRunner {
  private engine: PromptGenEngine;
  private testCases: TestCase[];
  private evalName: string;
  private config: Config;

  constructor(evalInfo: EvalInfo) {
    this.testCases = evalInfo.testCases;
    this.evalName = evalInfo.evalName;
    this.config = this.createConfigFromEval(evalInfo);
    this.engine = new PromptGenEngine(
      this.config,
      this.testCases,
      this.evalName
    );
  }

  private createConfigFromEval(evalInfo: EvalInfo): Config {
    return {
      ...defaultConfig,
      seedPrompt: evalInfo.seedPrompt,
      taskDescription: evalInfo.taskDescription,
    };
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

    // Generate timestamp for filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const resultsFile = path.join(
      resultsDir,
      `${this.evalName}-${timestamp}.json`
    );

    const resultsData = {
      evalName: this.evalName,
      timestamp: new Date().toISOString(),
      originalPrompt: this.config.seedPrompt,
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
export async function runEvaliteEval(
  evalPath: string,
  evalName: string
): Promise<void> {
  try {
    // Dynamic import of the eval file
    const evalModule = await import(evalPath);

    // Extract eval information from the eval file
    const evalInfo = extractEvalInfoFromEvalite(evalModule, evalName);

    if (!evalInfo.testCases || evalInfo.testCases.length === 0) {
      throw new Error(`No test cases found in ${evalPath}`);
    }

    console.log(`📋 Loaded ${evalInfo.testCases.length} test cases from eval`);
    console.log(`🎯 Seed prompt: "${evalInfo.seedPrompt}"`);
    console.log(`📝 Task description: ${evalInfo.taskDescription}`);

    const runner = new EvaliteRunner(evalInfo);
    await runner.runEvolution();
  } catch (error) {
    console.error("❌ Error running Evalite eval:", error);
    throw error;
  }
}

/**
 * Extract eval information from an Evalite eval module
 */
function extractEvalInfoFromEvalite(
  evalModule: any,
  evalName: string
): EvalInfo {
  // Extract test cases
  let testCases: TestCase[] = [];
  if (evalModule.testCases) {
    testCases = evalModule.testCases.map((tc: any) => ({
      input: tc.input,
      expectedOutput: tc.expected,
      metadata: tc.metadata || {},
    }));
  }

  // Extract seed prompt and task description from exported values
  const seedPrompt = evalModule.seedPrompt || "Complete the following task:";
  const taskDescription =
    evalModule.taskDescription || `Complete ${evalName} task`;

  return {
    testCases,
    seedPrompt,
    taskDescription,
    evalName,
  };
}
