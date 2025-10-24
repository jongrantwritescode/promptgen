// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();

import { PromptGenEngine } from "./engine.js";
import { TestCase } from "./types.js";
import { defaultConfig } from "./config/default.config.js";
import { loadTestCases } from "./util/testCaseLoader.js";
import { EvaliteRunner } from "./evaliteRunner.js";

async function main() {
  console.log("🚀 PromptGen - Genetic Algorithm for Prompt Evolution");
  console.log("====================================================\n");

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
