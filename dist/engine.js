import { v4 as uuidv4 } from "uuid";
import { HallOfFame } from "./storage/hallOfFame.js";
import { tournamentSelection, rouletteSelection, } from "./operators/selection.js";
import { singlePointCrossover, uniformCrossover, } from "./operators/crossover.js";
import { wordMutation, phraseMutation, structureMutation, } from "./operators/mutation.js";
import { llmFitnessEvaluator, heuristicFitnessEvaluator, } from "./fitness/fitnessEvaluator.js";
export class PromptGenEngine {
    config;
    hallOfFame;
    testCases;
    stats = [];
    totalEvaluations = 0;
    constructor(config, testCases) {
        this.config = config;
        this.testCases = testCases;
        this.hallOfFame = new HallOfFame(config.populationSize);
    }
    async evolve() {
        console.log("🧬 Starting PromptGen evolution...");
        console.log(`📊 Population: ${this.config.populationSize}, Generations: ${this.config.generations}`);
        // Initialize population
        let population = this.initializePopulation();
        // Evaluate initial population
        population = await this.evaluatePopulation(population);
        // Main evolution loop
        for (let generation = 1; generation <= this.config.generations; generation++) {
            console.log(`\n🔄 Generation ${generation}/${this.config.generations}`);
            // Update hall of fame
            this.updateHallOfFame(population);
            // Record statistics
            const generationStats = this.calculateStats(population, generation);
            this.stats.push(generationStats);
            // Log progress
            this.logProgress(generationStats);
            // Check for convergence
            if (this.hasConverged()) {
                console.log("🎯 Population converged! Stopping evolution.");
                break;
            }
            // Create next generation
            population = await this.createNextGeneration(population);
        }
        // Final evaluation and results
        const bestPrompt = this.hallOfFame.getBest();
        const finalStats = this.calculateStats(population, this.config.generations);
        this.stats.push(finalStats);
        console.log("\n🏆 Evolution complete!");
        console.log(`📈 Best fitness: ${bestPrompt.fitness.toFixed(3)}`);
        console.log(`🔬 Total evaluations: ${this.totalEvaluations}`);
        return {
            bestPrompt,
            hallOfFame: this.hallOfFame.getAll(),
            stats: this.stats,
            totalGenerations: this.config.generations,
            totalEvaluations: this.totalEvaluations,
        };
    }
    initializePopulation() {
        const population = [];
        // Add seed prompt
        population.push({
            id: uuidv4(),
            text: this.config.seedPrompt,
            fitness: 0,
            generation: 0,
        });
        // Generate variations
        for (let i = 1; i < this.config.populationSize; i++) {
            const variation = this.generateInitialVariation(this.config.seedPrompt);
            population.push({
                id: uuidv4(),
                text: variation,
                fitness: 0,
                generation: 0,
            });
        }
        return population;
    }
    generateInitialVariation(seedPrompt) {
        // Simple variation strategies for initial population
        const variations = [
            seedPrompt.replace(/please/gi, "kindly"),
            seedPrompt.replace(/you/gi, "the user"),
            seedPrompt.replace(/analyze/gi, "examine"),
            seedPrompt.replace(/classify/gi, "categorize"),
            seedPrompt.replace(/determine/gi, "identify"),
            seedPrompt + " Be precise and concise.",
            "Given the following input, " + seedPrompt.toLowerCase(),
            seedPrompt.replace(/^/, "Task: "),
        ];
        return (variations[Math.floor(Math.random() * variations.length)] || seedPrompt);
    }
    async evaluatePopulation(population) {
        console.log("📊 Evaluating population...");
        const evaluatedPopulation = [];
        for (let i = 0; i < population.length; i++) {
            const prompt = population[i];
            if (prompt) {
                console.log(`  🔍 Evaluating prompt ${i + 1}/${population.length}: "${prompt.text}"`);
                const fitness = await this.evaluateFitness(prompt.text);
                console.log(`  ✅ Fitness: ${fitness.toFixed(3)}`);
                evaluatedPopulation.push({
                    ...prompt,
                    fitness,
                });
                this.totalEvaluations++;
            }
        }
        console.log("📊 Population evaluation complete!");
        return evaluatedPopulation.sort((a, b) => b.fitness - a.fitness);
    }
    async evaluateFitness(promptText) {
        console.log(`    🤖 Running LLM evaluation...`);
        // Use LLM evaluator for main fitness
        const llmScore = await llmFitnessEvaluator.evaluate(promptText, this.testCases);
        console.log(`    🤖 LLM Score: ${llmScore.toFixed(3)}`);
        console.log(`    📏 Running heuristic evaluation...`);
        // Use heuristic evaluator for additional criteria
        const heuristicScore = await heuristicFitnessEvaluator.evaluate(promptText, this.testCases);
        console.log(`    📏 Heuristic Score: ${heuristicScore.toFixed(3)}`);
        // Combine scores based on rubric weights
        const combinedScore = llmScore * 0.7 + heuristicScore * 0.3;
        console.log(`    🎯 Combined Score: ${combinedScore.toFixed(3)}`);
        return Math.max(0, Math.min(1, combinedScore));
    }
    updateHallOfFame(population) {
        for (const prompt of population) {
            this.hallOfFame.addPrompt(prompt);
        }
    }
    calculateStats(population, generation) {
        const fitnesses = population.map((p) => p.fitness);
        const bestFitness = Math.max(...fitnesses);
        const worstFitness = Math.min(...fitnesses);
        const averageFitness = fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
        // Calculate diversity (standard deviation of fitness)
        const variance = fitnesses.reduce((sum, f) => sum + Math.pow(f - averageFitness, 2), 0) /
            fitnesses.length;
        const diversity = Math.sqrt(variance);
        return {
            generation,
            bestFitness,
            averageFitness,
            worstFitness,
            diversity,
            timestamp: new Date(),
        };
    }
    logProgress(stats) {
        console.log(`📈 Best: ${stats.bestFitness.toFixed(3)}, Avg: ${stats.averageFitness.toFixed(3)}, Diversity: ${stats.diversity.toFixed(3)}`);
        // Show hall of fame progress
        const hallOfFame = this.hallOfFame.getAll();
        if (hallOfFame.length > 0) {
            console.log(`🏆 Hall of Fame: ${hallOfFame.length} prompts, Best: ${hallOfFame[0]?.fitness.toFixed(3) || "N/A"}`);
        }
    }
    hasConverged() {
        if (this.stats.length < 10)
            return false;
        const recentStats = this.stats.slice(-10);
        const bestFitnesses = recentStats.map((s) => s.bestFitness);
        // Check if best fitness hasn't improved significantly
        const maxFitness = Math.max(...bestFitnesses);
        const minFitness = Math.min(...bestFitnesses);
        const improvement = maxFitness - minFitness;
        return improvement < 0.01; // Less than 1% improvement in last 10 generations
    }
    async createNextGeneration(population) {
        console.log("🧬 Creating next generation...");
        const nextGeneration = [];
        // Elitism: keep best individuals
        const eliteCount = Math.floor(this.config.populationSize * this.config.eliteSize);
        const elite = population.slice(0, eliteCount);
        nextGeneration.push(...elite);
        console.log(`  👑 Keeping ${eliteCount} elite individuals`);
        // Generate offspring
        const offspringCount = this.config.populationSize - eliteCount;
        console.log(`  🧬 Generating ${offspringCount} offspring...`);
        for (let i = 0; i < offspringCount; i++) {
            console.log(`    🧬 Creating offspring ${i + 1}/${offspringCount}...`);
            const offspring = await this.generateOffspring(population);
            nextGeneration.push(offspring);
        }
        console.log("🧬 Next generation created!");
        return nextGeneration;
    }
    async generateOffspring(population) {
        console.log(`      👥 Selecting parents...`);
        // Selection
        const parent1 = this.selectParent(population);
        const parent2 = this.selectParent(population);
        console.log(`      👥 Selected parents with fitness: ${parent1.fitness.toFixed(3)}, ${parent2.fitness.toFixed(3)}`);
        // Crossover
        let offspring;
        if (Math.random() < this.config.crossoverRate) {
            console.log(`      🔀 Performing crossover...`);
            const crossoverOperator = this.getCrossoverOperator();
            const offspringArray = crossoverOperator.crossover(parent1, parent2);
            offspring =
                offspringArray[Math.floor(Math.random() * offspringArray.length)] ||
                    parent1;
        }
        else {
            console.log(`      📋 No crossover, copying parent...`);
            offspring = { ...parent1 };
        }
        // Mutation
        if (Math.random() < this.config.mutationRate) {
            console.log(`      🧬 Applying mutation...`);
            const mutationOperator = this.getMutationOperator();
            offspring.text = await mutationOperator.mutate(offspring.text);
        }
        else {
            console.log(`      🧬 No mutation applied...`);
        }
        // Update offspring metadata
        offspring.id = uuidv4();
        offspring.fitness = 0;
        offspring.parentIds = [parent1.id, parent2.id];
        offspring.mutationHistory = [
            ...(offspring.mutationHistory || []),
            "generated",
        ];
        console.log(`      ✅ Offspring created: "${offspring.text}"`);
        return offspring;
    }
    selectParent(population) {
        if (population.length === 0) {
            throw new Error("Cannot select from empty population");
        }
        if (this.config.selectionMethod === "tournament") {
            const selected = tournamentSelection.select(population, 1, this.config);
            return selected[0];
        }
        else {
            const selected = rouletteSelection.select(population, 1, this.config);
            return selected[0];
        }
    }
    getCrossoverOperator() {
        const operators = [singlePointCrossover, uniformCrossover];
        return (operators[Math.floor(Math.random() * operators.length)] ||
            singlePointCrossover);
    }
    getMutationOperator() {
        const operators = [wordMutation, phraseMutation, structureMutation];
        return (operators[Math.floor(Math.random() * operators.length)] || wordMutation);
    }
}
//# sourceMappingURL=engine.js.map