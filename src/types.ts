export interface Prompt {
  id: string;
  text: string;
  fitness: number;
  generation: number;
  parentIds?: string[];
  mutationHistory?: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  metadata?: Record<string, any>;
}

export interface Config {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  selectionMethod: "tournament" | "roulette";
  tournamentSize?: number;
  eliteSize: number;
  seedPrompt: string;
  taskDescription: string;
  rubric: Rubric;
  llmProvider: "openai" | "claude" | "gemini";
  modelName: string;
  temperature: number;
  maxTokens: number;
  operatorCacheSize: number;
  operatorCacheTTL: number;
  operatorBatchSize: number;
  operatorBatchWindow: number;
  metaSelectionEnabled: boolean;
  operatorTemperature: number;
}

export interface Rubric {
  criteria: RubricCriterion[];
  weights: Record<string, number>;
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number;
  evaluator: "llm" | "heuristic";
  prompt?: string; // For LLM evaluators
  heuristic?: (output: string, expected: string) => number; // For heuristic evaluators
}

export interface FitnessEvaluator {
  name: string;
  evaluate: (
    prompt: string,
    testCases: TestCase[],
    evalName?: string
  ) => Promise<number>;
}

export interface SelectionOperator {
  name: string;
  select: (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ) => Promise<Prompt[]>;
}

export interface CrossoverOperator {
  name: string;
  crossover: (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ) => Promise<Prompt[]>;
}

export interface MutationOperator {
  name: string;
  mutate: (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ) => Promise<string>;
}

export interface LLMProvider {
  name: string;
  generate: (prompt: string, config: Partial<Config>) => Promise<string>;
  batchGenerate: (
    prompts: string[],
    config: Partial<Config>
  ) => Promise<string[]>;
  evaluate: (
    prompt: string,
    testCase: TestCase,
    rubric: RubricCriterion
  ) => Promise<number>;
}

export interface HallOfFame {
  prompts: Prompt[];
  maxSize: number;
  addPrompt: (prompt: Prompt) => void;
  getBest: () => Prompt | null;
  getAll: () => Prompt[];
}

export interface EvolutionStats {
  generation: number;
  bestFitness: number;
  averageFitness: number;
  worstFitness: number;
  diversity: number;
  timestamp: Date;
}

export interface EvolutionResult {
  bestPrompt: Prompt;
  hallOfFame: Prompt[];
  stats: EvolutionStats[];
  totalGenerations: number;
  totalEvaluations: number;
}

export interface LLMOperatorConfig {
  operatorCacheSize: number;
  operatorCacheTTL: number;
  operatorBatchSize: number;
  operatorBatchWindow: number;
  metaSelectionEnabled: boolean;
  operatorTemperature: number;
}

export interface LLMAdaptiveOperator {
  name: string;
  adapt: (
    performance: number,
    generation: number,
    llmProvider: LLMProvider
  ) => Promise<void>;
  getCurrentParameters: () => Record<string, any>;
}

export interface OperatorCache {
  get: (key: string) => string | null;
  set: (key: string, value: string, ttl?: number) => void;
  clear: () => void;
  getStats: () => { hits: number; misses: number; size: number };
}

export interface OperatorBatchRequest {
  id: string;
  type: "crossover" | "mutation" | "selection";
  prompt: string;
  context?: any;
  resolve: (result: string) => void;
  reject: (error: Error) => void;
}
