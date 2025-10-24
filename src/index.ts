// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();

import { runEvaliteEval } from "./evaliteRunner.js";
import path from "path";

async function main() {
  console.log("🚀 PromptGen - Genetic Algorithm for Prompt Evolution");
  console.log("====================================================\n");

  // Check for command line arguments
  const args = process.argv.slice(2);
  const evalArg = args.find((arg) => arg.startsWith("--eval="));

  if (evalArg) {
    const evalName = evalArg.split("=")[1];

    if (!evalName) {
      console.error("❌ No eval name provided!");
      process.exit(1);
    }

    const evalPath = path.resolve(`evals/${evalName}/${evalName}.eval.ts`);

    console.log(`📁 Running eval: ${evalName}`);
    console.log(`📄 Eval path: ${evalPath}\n`);

    try {
      await runEvaliteEval(evalPath, evalName);
      return;
    } catch (error) {
      console.error("❌ Error running eval:", error);
      process.exit(1);
    }
  }

  // No eval specified - show usage
  console.log("❌ No eval specified!");
  console.log("\nUsage:");
  console.log("  npm run start -- --eval=<eval-name>");
  console.log("\nAvailable evals:");
  console.log("  - intent-classification");
  console.log("  - article-summary");
  console.log("\nExample:");
  console.log("  npm run start -- --eval=intent-classification");
  process.exit(1);
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
