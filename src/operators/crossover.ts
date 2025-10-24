import { Prompt, CrossoverOperator, LLMProvider } from "../types.js";
import { v4 as uuidv4 } from "uuid";
import { operatorCache } from "../util/operatorCache.js";
import { OperatorBatcher } from "../util/operatorBatcher.js";

// Helper function to create offspring
function createOffspring(
  parent1: Prompt,
  parent2: Prompt,
  text1: string,
  text2: string,
  operation: string
): Prompt[] {
  const offspring1: Prompt = {
    id: uuidv4(),
    text: text1.trim(),
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    parentIds: [parent1.id, parent2.id],
    mutationHistory: [operation],
  };

  const offspring2: Prompt = {
    id: uuidv4(),
    text: text2.trim(),
    fitness: 0,
    generation: Math.max(parent1.generation, parent2.generation) + 1,
    parentIds: [parent1.id, parent2.id],
    mutationHistory: [operation],
  };

  return [offspring1, offspring2];
}

// Generic LLM crossover function with caching and batching
async function performLLMCrossover(
  parent1: Prompt,
  parent2: Prompt,
  strategy: string,
  llmProvider: LLMProvider,
  batcher: OperatorBatcher
): Promise<Prompt[]> {
  const cacheKey = operatorCache.generateKey(
    `crossover-${strategy}`,
    `${parent1.text}|${parent2.text}`
  );

  // Check cache first
  const cached = operatorCache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return createOffspring(
        parent1,
        parent2,
        parsed.text1,
        parsed.text2,
        `llm-${strategy}-crossover`
      );
    } catch {
      // Invalid cache entry, continue with LLM call
    }
  }

  const crossoverPrompt = `
You are a prompt engineering expert. Combine these two prompts using ${strategy} approach:

Prompt 1: "${parent1.text}"
Prompt 2: "${parent2.text}"

Generate two distinct, effective offspring prompts that:
- Preserve the best elements from both parents
- Use ${strategy} combination strategy
- Are syntactically correct and clear
- Maintain the original task objective

Return exactly two prompts, separated by "---":
`;

  try {
    const result = await batcher.addRequest("crossover", crossoverPrompt);
    const prompts = result
      .split("---")
      .map((p) => p.trim())
      .slice(0, 2);

    if (prompts.length < 2) {
      throw new Error("LLM did not return two prompts");
    }

    // Cache the result
    operatorCache.set(
      cacheKey,
      JSON.stringify({
        text1: prompts[0],
        text2: prompts[1],
      })
    );

    return createOffspring(
      parent1,
      parent2,
      prompts[0]!,
      prompts[1]!,
      `llm-${strategy}-crossover`
    );
  } catch (error) {
    console.warn(`LLM crossover failed, using fallback: ${error}`);
    // Fallback to simple concatenation
    return createOffspring(
      parent1,
      parent2,
      `${parent1.text} ${parent2.text}`,
      `${parent2.text} ${parent1.text}`,
      `fallback-${strategy}-crossover`
    );
  }
}

export const llmSinglePointCrossover: CrossoverOperator = {
  name: "llm-single-point",
  crossover: async (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMCrossover(
      parent1,
      parent2,
      "single-point",
      llmProvider,
      batcher
    );
  },
};

export const llmUniformCrossover: CrossoverOperator = {
  name: "llm-uniform",
  crossover: async (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMCrossover(
      parent1,
      parent2,
      "uniform",
      llmProvider,
      batcher
    );
  },
};

export const llmMultiPointCrossover: CrossoverOperator = {
  name: "llm-multi-point",
  crossover: async (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMCrossover(
      parent1,
      parent2,
      "multi-point",
      llmProvider,
      batcher
    );
  },
};

export const llmSemanticCrossover: CrossoverOperator = {
  name: "llm-semantic",
  crossover: async (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMCrossover(
      parent1,
      parent2,
      "semantic",
      llmProvider,
      batcher
    );
  },
};

export const llmHybridCrossover: CrossoverOperator = {
  name: "llm-hybrid",
  crossover: async (
    parent1: Prompt,
    parent2: Prompt,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const cacheKey = operatorCache.generateKey(
      "crossover-hybrid",
      `${parent1.text}|${parent2.text}`
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return createOffspring(
          parent1,
          parent2,
          parsed.text1,
          parsed.text2,
          "llm-hybrid-crossover"
        );
      } catch {
        // Invalid cache entry, continue with LLM call
      }
    }

    const hybridPrompt = `
Analyze these two prompts and determine the best combination strategy:

Prompt 1: "${parent1.text}"
Prompt 2: "${parent2.text}"

Choose the most appropriate crossover approach:
- Single-point: Split and swap sections
- Uniform: Mix elements throughout
- Multi-point: Multiple crossover points
- Semantic: Combine based on meaning

Generate two offspring using your chosen strategy. Explain your choice briefly, then provide the two prompts separated by "---":
`;

    const batcher = new OperatorBatcher(llmProvider);

    try {
      const result = await batcher.addRequest("crossover", hybridPrompt);
      const prompts = result
        .split("---")
        .map((p) => p.trim())
        .slice(0, 2);

      if (prompts.length < 2) {
        throw new Error("LLM did not return two prompts");
      }

      // Cache the result
      operatorCache.set(
        cacheKey,
        JSON.stringify({
          text1: prompts[0],
          text2: prompts[1],
        })
      );

      return createOffspring(
        parent1,
        parent2,
        prompts[0]!,
        prompts[1]!,
        "llm-hybrid-crossover"
      );
    } catch (error) {
      console.warn(`LLM hybrid crossover failed, using fallback: ${error}`);
      // Fallback to semantic crossover
      return performLLMCrossover(
        parent1,
        parent2,
        "semantic",
        llmProvider,
        batcher
      );
    }
  },
};
