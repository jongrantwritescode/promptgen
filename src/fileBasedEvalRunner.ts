import { PromptGenEngine } from "./engine.js";
import { FileBasedEvalConfig } from "./types.js";
import { loadFileBasedTestCases, saveEvolutionResults, validateInputFiles } from "./util/fileLoader.js";
import { defaultConfig } from "./config/default.config.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class FileBasedEvalRunner {
  private config: any;
  private evalConfig: FileBasedEvalConfig;

  constructor(evalConfig: FileBasedEvalConfig) {
    this.evalConfig = evalConfig;
    this.config = {
      ...defaultConfig,
      seedPrompt: evalConfig.initialPrompt,
      taskDescription: `File-based evaluation: ${evalConfig.name}`,
    };
  }

  async runEvolution(): Promise<void> {
    console.log(`🚀 Starting File-Based Evolution: ${this.evalConfig.name}`);
    console.log("====================================================\n");

    // Validate input files
    console.log("📋 Validating input files...");
    const { valid, invalid } = await validateInputFiles(this.evalConfig.inputFiles);
    
    if (invalid.length > 0) {
      console.warn(`⚠️ Warning: ${invalid.length} files not found:`, invalid);
    }
    
    if (valid.length === 0) {
      throw new Error("No valid input files found");
    }
    
    console.log(`✅ Found ${valid.length} valid files\n`);

    // Load test cases from files
    console.log("📄 Loading file-based test cases...");
    const testCases = await loadFileBasedTestCases(this.evalConfig);
    console.log(`✅ Loaded ${testCases.length} test cases\n`);

    // Initialize engine
    const engine = new PromptGenEngine(this.config, testCases, this.evalConfig.evaluationMethod);

    // Run evolution with file-based evaluation
    console.log("🧬 Starting evolution with file-based evaluation...\n");
    const results = await this.runEvolutionWithFileBasedEvaluator(engine);

    // Save results
    console.log("\n💾 Saving results...");
    const resultPath = await saveEvolutionResults(
      this.evalConfig.name.toLowerCase().replace(/\s+/g, "-"),
      results,
      this.evalConfig.outputDir
    );

    console.log("\n🎉 File-Based Evolution Complete!");
    console.log("=================================");
    console.log(`📊 Best Score: ${results.bestPrompt.fitness.toFixed(3)}`);
    console.log(`📁 Results saved to: ${resultPath}`);
    console.log(`🏆 Hall of Fame: ${results.hallOfFame.length} prompts`);
  }

  private async runEvolutionWithFileBasedEvaluator(engine: PromptGenEngine): Promise<any> {
    // Use the public method for file-based evaluation
    const results = await engine.evolve();
    return results;
  }
}

/**
 * Load and run a file-based eval from a file path
 */
export async function runFileBasedEval(evalPath: string): Promise<void> {
  try {
    // Dynamic import of the eval file
    const evalModule = await import(evalPath);
    const evalConfig = evalModule.articleSummaryEval || evalModule.default;
    
    if (!evalConfig) {
      throw new Error(`No eval configuration found in ${evalPath}`);
    }

    const runner = new FileBasedEvalRunner(evalConfig);
    await runner.runEvolution();
  } catch (error) {
    console.error("❌ Error running file-based eval:", error);
    throw error;
  }
}
