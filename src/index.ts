// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();

import { PromptGenEngine } from "./engine.js";
import { TestCase } from "./types.js";
import { defaultConfig } from "./config/default.config.js";
import { loadTestCases } from "./util/testCaseLoader.js";
import { EvaliteRunner } from "./evaliteRunner.js";
import { runFileBasedEval } from "./fileBasedEvalRunner.js";
import path from "path";

async function main() {
  console.log("🚀 PromptGen - Genetic Algorithm for Prompt Evolution");
  console.log("====================================================\n");

  // Check for command line arguments
  const args = process.argv.slice(2);
  const evalArg = args.find(arg => arg.startsWith('--eval='));
  
  if (evalArg) {
    // Run file-based eval
    const evalName = evalArg.split('=')[1];
    const evalPath = path.resolve(`evals/${evalName}/${evalName}.eval.ts`);
    
    console.log(`📁 Running file-based eval: ${evalName}`);
    console.log(`📄 Eval path: ${evalPath}\n`);
    
    try {
      await runFileBasedEval(evalPath);
      return;
    } catch (error) {
      console.error("❌ Error running file-based eval:", error);
      process.exit(1);
    }
  }

  // Default behavior - run traditional eval
  console.log("📋 Running traditional eval (use --eval=<name> for file-based evals)\n");

  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    console.error(
      "❌ Error: OPENAI_API_KEY not found in environment variables"
    );
    console.log("Please create a .env file with your OpenAI API key:");
    console.log("OPENAI_API_KEY=sk-...");
    process.exit(1);
  }

  try {
    // Load test cases
    console.log("📋 Loading test cases...");
    const testCases = await loadTestCases();
    console.log(`✅ Loaded ${testCases.length} test cases\n`);

    // Initialize EvaliteRunner (which includes the engine)
    const evaliteRunner = new EvaliteRunner();

    // Run evolution with Evalite integration
    console.log("🧬 Starting evolution process with Evalite integration...\n");
    await evaliteRunner.runEvolution();

    console.log("\n🎉 Evolution Complete with Evalite Integration!");
    console.log("=================================================");
  } catch (error) {
    console.error("❌ Error during evolution:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Evolution interrupted by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Evolution terminated");
  process.exit(0);
});

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
