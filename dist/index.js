// Load environment variables first
import * as dotenv from "dotenv";
dotenv.config();
import { PromptGenEngine } from "./engine.js";
import { defaultConfig } from "./config/default.config.js";
import { loadTestCases } from "./util/testCaseLoader.js";
async function main() {
    console.log("🚀 PromptGen - Genetic Algorithm for Prompt Evolution");
    console.log("====================================================\n");
    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Error: OPENAI_API_KEY not found in environment variables");
        console.log("Please create a .env file with your OpenAI API key:");
        console.log("OPENAI_API_KEY=sk-...");
        process.exit(1);
    }
    try {
        // Load test cases
        console.log("📋 Loading test cases...");
        const testCases = await loadTestCases();
        console.log(`✅ Loaded ${testCases.length} test cases\n`);
        // Initialize engine
        const engine = new PromptGenEngine(defaultConfig, testCases);
        // Run evolution
        console.log("🧬 Starting evolution process...\n");
        const result = await engine.evolve();
        // Display results
        console.log("\n🎉 Evolution Complete!");
        console.log("======================");
        console.log(`🏆 Best Prompt (Fitness: ${result.bestPrompt.fitness.toFixed(3)}):`);
        console.log(`"${result.bestPrompt.text}"`);
        console.log(`\n📊 Statistics:`);
        console.log(`- Total Generations: ${result.totalGenerations}`);
        console.log(`- Total Evaluations: ${result.totalEvaluations}`);
        console.log(`- Final Best Fitness: ${result.stats[result.stats.length - 1]?.bestFitness.toFixed(3) || "N/A"}`);
        console.log(`- Final Average Fitness: ${result.stats[result.stats.length - 1]?.averageFitness.toFixed(3) ||
            "N/A"}`);
        // Show Hall of Fame
        console.log("\n🏆 Hall of Fame:");
        console.log("===============");
        result.hallOfFame.slice(0, 5).forEach((prompt, index) => {
            console.log(`${index + 1}. [${prompt.fitness.toFixed(3)}] "${prompt.text}"`);
        });
        // Show fitness progression
        console.log("\n📈 Fitness Progression:");
        console.log("=======================");
        result.stats.forEach((stat, index) => {
            if (index % 10 === 0 || index === result.stats.length - 1) {
                console.log(`Gen ${stat.generation}: Best=${stat.bestFitness.toFixed(3)}, Avg=${stat.averageFitness.toFixed(3)}, Diversity=${stat.diversity.toFixed(3)}`);
            }
        });
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map