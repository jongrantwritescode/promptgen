import {
  CrossoverOperator,
  MutationOperator,
  SelectionOperator,
  LLMProvider,
  Prompt,
  Config,
} from "../types.js";
import { operatorCache } from "../util/operatorCache.js";
import { OperatorBatcher } from "../util/operatorBatcher.js";
import { operatorStatsTracker } from "../storage/operatorStats.js";

// Import all available operators
import {
  llmSinglePointCrossover,
  llmUniformCrossover,
  llmMultiPointCrossover,
  llmSemanticCrossover,
  llmHybridCrossover,
} from "./crossover.js";

import {
  llmWordMutation,
  llmPhraseMutation,
  llmStructureMutation,
  llmContextAwareMutation,
  llmTemplateMutation,
  llmProgressiveMutation,
  llmPromptEngineeringMutation,
} from "./mutation.js";

import {
  llmQualitySelection,
  llmDiversitySelection,
  llmBalancedSelection,
  llmRankSelection,
  llmDiversityAwareSelection,
} from "./selection.js";

export class LLMOperatorSelector {
  private llmProvider: LLMProvider;
  private batcher: OperatorBatcher;
  private config: Config;

  // Available operators
  private crossoverOperators: CrossoverOperator[] = [
    llmSinglePointCrossover,
    llmUniformCrossover,
    llmMultiPointCrossover,
    llmSemanticCrossover,
    llmHybridCrossover,
  ];

  private mutationOperators: MutationOperator[] = [
    llmWordMutation,
    llmPhraseMutation,
    llmStructureMutation,
    llmContextAwareMutation,
    llmTemplateMutation,
    llmProgressiveMutation,
    llmPromptEngineeringMutation,
  ];

  private selectionOperators: SelectionOperator[] = [
    llmQualitySelection,
    llmDiversitySelection,
    llmBalancedSelection,
    llmRankSelection,
    llmDiversityAwareSelection,
  ];

  constructor(llmProvider: LLMProvider, config: Config) {
    this.llmProvider = llmProvider;
    this.config = config;
    this.batcher = new OperatorBatcher(llmProvider);
  }

  async selectCrossoverOperator(
    parent1: Prompt,
    parent2: Prompt,
    population: Prompt[],
    generation: number
  ): Promise<CrossoverOperator> {
    const cacheKey = operatorCache.generateKey(
      "meta-selector-crossover",
      `${parent1.id}-${parent2.id}`,
      { generation, populationSize: population.length }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      const operatorName = cached;
      const operator = this.crossoverOperators.find(
        (op) => op.name === operatorName
      );
      if (operator) {
        return operator;
      }
    }

    // Get performance statistics
    const recommendations = operatorStatsTracker.getOperatorRecommendations();
    const performanceTrends = operatorStatsTracker.getPerformanceTrends();

    const metaPrompt = `
You are selecting the best crossover operator for genetic algorithm evolution.

Context:
- Generation: ${generation}
- Population size: ${population.length}
- Parent 1 fitness: ${parent1.fitness}
- Parent 2 fitness: ${parent2.fitness}
- Task: ${this.config.taskDescription}

Available crossover operators:
${this.crossoverOperators.map((op, i) => `${i + 1}. ${op.name}`).join("\n")}

Performance recommendations:
- Recommended: ${recommendations.recommended.join(", ")}
- Avoid: ${recommendations.avoid.join(", ")}

Performance trends:
${Object.entries(performanceTrends)
  .map(([name, trend]) => `- ${name}: ${trend}`)
  .join("\n")}

Select the most appropriate crossover operator for this context. Consider:
1. Current generation (early vs late evolution)
2. Population diversity
3. Parent fitness levels
4. Historical performance
5. Task requirements

Return only the operator name (e.g., "llm-semantic"):`;

    try {
      const result = await this.batcher.addRequest("selection", metaPrompt);
      const selectedName = result.trim().toLowerCase();

      // Find the selected operator
      const selectedOperator = this.crossoverOperators.find(
        (op) => op.name.toLowerCase() === selectedName
      );

      if (selectedOperator) {
        // Cache the result
        operatorCache.set(cacheKey, selectedOperator.name);
        return selectedOperator;
      } else {
        console.warn(`Unknown crossover operator selected: ${selectedName}`);
        // Fallback to semantic crossover
        return llmSemanticCrossover;
      }
    } catch (error) {
      console.warn(`Meta-selection failed for crossover: ${error}`);
      // Fallback to semantic crossover
      return llmSemanticCrossover;
    }
  }

  async selectMutationOperator(
    prompt: string,
    population: Prompt[],
    generation: number,
    hallOfFame: Prompt[]
  ): Promise<MutationOperator> {
    const cacheKey = operatorCache.generateKey(
      "meta-selector-mutation",
      prompt,
      {
        generation,
        populationSize: population.length,
        hallOfFameSize: hallOfFame.length,
      }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      const operatorName = cached;
      const operator = this.mutationOperators.find(
        (op) => op.name === operatorName
      );
      if (operator) {
        return operator;
      }
    }

    // Get performance statistics
    const recommendations = operatorStatsTracker.getOperatorRecommendations();
    const performanceTrends = operatorStatsTracker.getPerformanceTrends();

    const metaPrompt = `
You are selecting the best mutation operator for genetic algorithm evolution.

Context:
- Generation: ${generation}
- Population size: ${population.length}
- Hall of fame size: ${hallOfFame.length}
- Prompt to mutate: "${prompt.substring(0, 100)}..."
- Task: ${this.config.taskDescription}

Available mutation operators:
${this.mutationOperators.map((op, i) => `${i + 1}. ${op.name}`).join("\n")}

Performance recommendations:
- Recommended: ${recommendations.recommended.join(", ")}
- Avoid: ${recommendations.avoid.join(", ")}

Performance trends:
${Object.entries(performanceTrends)
  .map(([name, trend]) => `- ${name}: ${trend}`)
  .join("\n")}

Select the most appropriate mutation operator for this context. Consider:
1. Current generation (early vs late evolution)
2. Prompt complexity and current quality
3. Available learning data (hall of fame)
4. Historical performance
5. Task requirements

Return only the operator name (e.g., "llm-context-aware"):`;

    try {
      const result = await this.batcher.addRequest("selection", metaPrompt);
      const selectedName = result.trim().toLowerCase();

      // Find the selected operator
      const selectedOperator = this.mutationOperators.find(
        (op) => op.name.toLowerCase() === selectedName
      );

      if (selectedOperator) {
        // Cache the result
        operatorCache.set(cacheKey, selectedOperator.name);
        return selectedOperator;
      } else {
        console.warn(`Unknown mutation operator selected: ${selectedName}`);
        // Fallback to context-aware mutation
        return llmContextAwareMutation;
      }
    } catch (error) {
      console.warn(`Meta-selection failed for mutation: ${error}`);
      // Fallback to context-aware mutation
      return llmContextAwareMutation;
    }
  }

  async selectSelectionOperator(
    population: Prompt[],
    count: number,
    generation: number
  ): Promise<SelectionOperator> {
    const cacheKey = operatorCache.generateKey(
      "meta-selector-selection",
      JSON.stringify(population.map((p) => ({ id: p.id, fitness: p.fitness }))),
      { count, generation }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      const operatorName = cached;
      const operator = this.selectionOperators.find(
        (op) => op.name === operatorName
      );
      if (operator) {
        return operator;
      }
    }

    // Calculate population statistics
    const fitnesses = population.map((p) => p.fitness);
    const avgFitness =
      fitnesses.reduce((sum, f) => sum + f, 0) / fitnesses.length;
    const fitnessVariance =
      fitnesses.reduce((sum, f) => sum + Math.pow(f - avgFitness, 2), 0) /
      fitnesses.length;
    const diversity = Math.sqrt(fitnessVariance);

    // Get performance statistics
    const recommendations = operatorStatsTracker.getOperatorRecommendations();

    const metaPrompt = `
You are selecting the best selection operator for genetic algorithm evolution.

Context:
- Generation: ${generation}
- Population size: ${population.length}
- Selection count: ${count}
- Average fitness: ${avgFitness.toFixed(3)}
- Population diversity: ${diversity.toFixed(3)}
- Task: ${this.config.taskDescription}

Available selection operators:
${this.selectionOperators.map((op, i) => `${i + 1}. ${op.name}`).join("\n")}

Performance recommendations:
- Recommended: ${recommendations.recommended.join(", ")}

Select the most appropriate selection operator for this context. Consider:
1. Current generation (early vs late evolution)
2. Population diversity (high diversity = use diversity-aware, low diversity = use quality-based)
3. Selection pressure needed
4. Historical performance
5. Task requirements

Return only the operator name (e.g., "llm-balanced"):`;

    try {
      const result = await this.batcher.addRequest("selection", metaPrompt);
      const selectedName = result.trim().toLowerCase();

      // Find the selected operator
      const selectedOperator = this.selectionOperators.find(
        (op) => op.name.toLowerCase() === selectedName
      );

      if (selectedOperator) {
        // Cache the result
        operatorCache.set(cacheKey, selectedOperator.name);
        return selectedOperator;
      } else {
        console.warn(`Unknown selection operator selected: ${selectedName}`);
        // Fallback to balanced selection
        return llmBalancedSelection;
      }
    } catch (error) {
      console.warn(`Meta-selection failed for selection: ${error}`);
      // Fallback to balanced selection
      return llmBalancedSelection;
    }
  }

  // Get all available operators for debugging/stats
  getAllOperators(): {
    crossover: CrossoverOperator[];
    mutation: MutationOperator[];
    selection: SelectionOperator[];
  } {
    return {
      crossover: [...this.crossoverOperators],
      mutation: [...this.mutationOperators],
      selection: [...this.selectionOperators],
    };
  }

  // Update configuration
  updateConfig(config: Config): void {
    this.config = config;
    this.batcher.updateConfig(
      config.operatorBatchSize,
      config.operatorBatchWindow
    );
  }
}
