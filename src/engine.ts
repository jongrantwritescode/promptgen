import { v4 as uuidv4 } from "uuid";
import {
  Prompt,
  Config,
  EvolutionResult,
  EvolutionStats,
  TestCase,
} from "./types.js";
import { HallOfFame } from "./storage/hallOfFame.js";
import {
  SelectionOperator,
  CrossoverOperator,
  MutationOperator,
} from "./types.js";
import {
  tournamentSelection,
  rouletteSelection,
} from "./operators/selection.js";
import {
  singlePointCrossover,
  uniformCrossover,
} from "./operators/crossover.js";
import {
  wordMutation,
  phraseMutation,
  structureMutation,
} from "./operators/mutation.js";
import {
  llmFitnessEvaluator,
  heuristicFitnessEvaluator,
} from "./fitness/fitnessEvaluator.js";
import { evaliteIntegration } from "./fitness/evaliteIntegration.js";
import { createFileBasedEvaluator } from "./fitness/fileBasedEvaluator.js";
import { OpenAIProvider } from "./providers/openaiProvider.js";
import { defaultConfig } from "./config/default.config.js";

export class PromptGenEngine {
  private config: Config;
  private hallOfFame: HallOfFame;
  private testCases: TestCase[];
  private stats: EvolutionStats[] = [];
  private totalEvaluations = 0;
  private evaluationMethod?:
    | "semantic-similarity"
    | "llm-judge"
    | "exact-match"
    | undefined;

  constructor(
    config: Config,
    testCases: TestCase[],
    evaluationMethod?: "semantic-similarity" | "llm-judge" | "exact-match"
  ) {
    this.config = config;
    this.testCases = testCases;
    this.evaluationMethod = evaluationMethod;
    this.hallOfFame = new HallOfFame(config.populationSize);
  }

  async evolve(): Promise<EvolutionResult> {
    console.log("🧬 Starting PromptGen evolution...");
    console.log(
      `📊 Population: ${this.config.populationSize}, Generations: ${this.config.generations}`
    );

    // Initialize population
    let population = this.initializePopulation();

    // Evaluate initial population
    population = await this.evaluatePopulation(population);

    // Main evolution loop
    for (
      let generation = 1;
      generation <= this.config.generations;
      generation++
    ) {
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
    const bestPrompt = this.hallOfFame.getBest()!;
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

  private initializePopulation(): Prompt[] {
    const population: Prompt[] = [];

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

  private generateInitialVariation(seedPrompt: string): string {
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

    return (
      variations[Math.floor(Math.random() * variations.length)] || seedPrompt
    );
  }

  private async evaluatePopulation(population: Prompt[]): Promise<Prompt[]> {
    console.log("📊 Evaluating population...");

    const evaluatedPopulation: Prompt[] = [];

    for (let i = 0; i < population.length; i++) {
      const prompt = population[i];
      if (prompt) {
        console.log(
          `  🔍 Evaluating prompt ${i + 1}/${population.length}: "${
            prompt.text
          }"`
        );

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

  private async evaluateFitness(promptText: string): Promise<number> {
    if (this.evaluationMethod) {
      // Use file-based evaluation
      console.log(
        `    🎯 Running file-based evaluation (${this.evaluationMethod})...`
      );
      const fileBasedEvaluator = createFileBasedEvaluator(
        this.evaluationMethod
      );
      const fileBasedScore = await fileBasedEvaluator.evaluate(
        promptText,
        this.testCases
      );
      console.log(`    🎯 File-based Score: ${fileBasedScore.toFixed(3)}`);

      console.log(`    📏 Running heuristic evaluation...`);
      const heuristicScore = await heuristicFitnessEvaluator.evaluate(
        promptText,
        this.testCases
      );
      console.log(`    📏 Heuristic Score: ${heuristicScore.toFixed(3)}`);

      const combinedScore = fileBasedScore * 0.8 + heuristicScore * 0.2;
      console.log(`    🎯 Combined Score: ${combinedScore.toFixed(3)}`);

      return Math.max(0, Math.min(1, combinedScore));
    } else {
      // Use traditional Evalite-based evaluation
      console.log(`    🎯 Running Evalite-based evaluation...`);
      const evaliteScore = await evaliteIntegration.evaluate(
        promptText,
        this.testCases
      );
      console.log(`    🎯 Evalite Score: ${evaliteScore.toFixed(3)}`);

      console.log(`    📏 Running heuristic evaluation...`);
      const heuristicScore = await heuristicFitnessEvaluator.evaluate(
        promptText,
        this.testCases
      );
      console.log(`    📏 Heuristic Score: ${heuristicScore.toFixed(3)}`);

      const combinedScore = evaliteScore * 0.8 + heuristicScore * 0.2;
      console.log(`    🎯 Combined Score: ${combinedScore.toFixed(3)}`);

      return Math.max(0, Math.min(1, combinedScore));
    }
  }

  /**
   * Evaluate fitness using file-based evaluator for document processing tasks
   */
  async evaluateFitnessWithFileBasedEvaluator(
    promptText: string,
    evaluationMethod:
      | "semantic-similarity"
      | "llm-judge"
      | "exact-match" = "semantic-similarity"
  ): Promise<number> {
    console.log(
      `    🎯 Running file-based evaluation (${evaluationMethod})...`
    );

    const fileBasedEvaluator = createFileBasedEvaluator(evaluationMethod);
    const fileBasedScore = await fileBasedEvaluator.evaluate(
      promptText,
      this.testCases
    );
    console.log(`    🎯 File-based Score: ${fileBasedScore.toFixed(3)}`);

    console.log(`    📏 Running heuristic evaluation...`);
    // Use heuristic evaluator for additional criteria
    const heuristicScore = await heuristicFitnessEvaluator.evaluate(
      promptText,
      this.testCases
    );
    console.log(`    📏 Heuristic Score: ${heuristicScore.toFixed(3)}`);

    // Combine scores - File-based evaluation provides comprehensive scoring
    const combinedScore = fileBasedScore * 0.8 + heuristicScore * 0.2;
    console.log(`    🎯 Combined Score: ${combinedScore.toFixed(3)}`);

    return Math.max(0, Math.min(1, combinedScore));
  }

  private updateHallOfFame(population: Prompt[]): void {
    for (const prompt of population) {
      this.hallOfFame.addPrompt(prompt);
    }
  }

  private calculateStats(
    population: Prompt[],
    generation: number
  ): EvolutionStats {
    const fitnesses = population.map((p) => p.fitness);
    const bestFitness = Math.max(...fitnesses);
    const worstFitness = Math.min(...fitnesses);
    const averageFitness =
      fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;

    // Calculate diversity (standard deviation of fitness)
    const variance =
      fitnesses.reduce((sum, f) => sum + Math.pow(f - averageFitness, 2), 0) /
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

  private logProgress(stats: EvolutionStats): void {
    console.log(
      `📈 Best: ${stats.bestFitness.toFixed(
        3
      )}, Avg: ${stats.averageFitness.toFixed(
        3
      )}, Diversity: ${stats.diversity.toFixed(3)}`
    );

    // Show hall of fame progress
    const hallOfFame = this.hallOfFame.getAll();
    if (hallOfFame.length > 0) {
      console.log(
        `🏆 Hall of Fame: ${hallOfFame.length} prompts, Best: ${
          hallOfFame[0]?.fitness.toFixed(3) || "N/A"
        }`
      );
    }
  }

  private hasConverged(): boolean {
    if (this.stats.length < 10) return false;

    const recentStats = this.stats.slice(-10);
    const bestFitnesses = recentStats.map((s) => s.bestFitness);

    // Check if best fitness hasn't improved significantly
    const maxFitness = Math.max(...bestFitnesses);
    const minFitness = Math.min(...bestFitnesses);
    const improvement = maxFitness - minFitness;

    return improvement < 0.01; // Less than 1% improvement in last 10 generations
  }

  private async createNextGeneration(population: Prompt[]): Promise<Prompt[]> {
    console.log("🧬 Creating next generation...");
    const nextGeneration: Prompt[] = [];

    // Elitism: keep best individuals
    const eliteCount = Math.floor(
      this.config.populationSize * this.config.eliteSize
    );
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

  private async generateOffspring(population: Prompt[]): Promise<Prompt> {
    console.log(`      👥 Selecting parents...`);
    // Selection
    const parent1 = this.selectParent(population);
    const parent2 = this.selectParent(population);
    console.log(
      `      👥 Selected parents with fitness: ${parent1.fitness.toFixed(
        3
      )}, ${parent2.fitness.toFixed(3)}`
    );

    // Crossover
    let offspring: Prompt;
    if (Math.random() < this.config.crossoverRate) {
      console.log(`      🔀 Performing crossover...`);
      const crossoverOperator = this.getCrossoverOperator();
      const offspringArray = crossoverOperator.crossover(parent1, parent2);
      offspring =
        offspringArray[Math.floor(Math.random() * offspringArray.length)] ||
        parent1;
    } else {
      console.log(`      📋 No crossover, copying parent...`);
      offspring = { ...parent1 };
    }

    // Mutation
    if (Math.random() < this.config.mutationRate) {
      console.log(`      🧬 Applying mutation...`);
      const mutationOperator = this.getMutationOperator();
      offspring.text = await mutationOperator.mutate(offspring.text);
    } else {
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

  private selectParent(population: Prompt[]): Prompt {
    if (population.length === 0) {
      throw new Error("Cannot select from empty population");
    }

    if (this.config.selectionMethod === "tournament") {
      const selected = tournamentSelection.select(population, 1, this.config);
      return selected[0]!;
    } else {
      const selected = rouletteSelection.select(population, 1, this.config);
      return selected[0]!;
    }
  }

  private getCrossoverOperator(): CrossoverOperator {
    const operators = [singlePointCrossover, uniformCrossover];
    return (
      operators[Math.floor(Math.random() * operators.length)] ||
      singlePointCrossover
    );
  }

  private getMutationOperator(): MutationOperator {
    const operators = [wordMutation, phraseMutation, structureMutation];
    return (
      operators[Math.floor(Math.random() * operators.length)] || wordMutation
    );
  }
}
