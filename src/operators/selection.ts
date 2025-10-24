import { Prompt, Config, SelectionOperator, LLMProvider } from "../types.js";
import { operatorCache } from "../util/operatorCache.js";
import { OperatorBatcher } from "../util/operatorBatcher.js";

// Helper function to calculate similarity between two prompts
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Generic LLM selection function with caching and batching
async function performLLMSelection(
  population: Prompt[],
  count: number,
  strategy: string,
  llmProvider: LLMProvider,
  batcher: OperatorBatcher,
  config: Config
): Promise<Prompt[]> {
  if (population.length === 0) {
    return [];
  }

  if (population.length <= count) {
    return [...population];
  }

  const cacheKey = operatorCache.generateKey(
    `selection-${strategy}`,
    JSON.stringify(population.map((p) => ({ id: p.id, fitness: p.fitness }))),
    { count, strategy }
  );

  // Check cache first
  const cached = operatorCache.get(cacheKey);
  if (cached) {
    try {
      const selectedIds = JSON.parse(cached);
      return population.filter((p) => selectedIds.includes(p.id));
    } catch {
      // Invalid cache entry, continue with LLM call
    }
  }

  const selectionPrompts = {
    "quality-assessment": `
Evaluate these prompts and select the ${count} best ones:

${population
  .map((p, i) => `${i + 1}. "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Select the ${count} prompts that are most likely to perform well. Consider clarity, specificity, and effectiveness.
Return only the numbers of selected prompts (e.g., "1, 3, 5"):`,

    "diversity-aware": `
Select ${count} diverse and high-quality prompts from this population:

${population
  .map((p, i) => `${i + 1}. "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Choose prompts that are both effective AND different from each other in approach or style.
Return only the numbers of selected prompts:`,

    "balanced-selection": `
Select ${count} prompts that balance quality and diversity:

${population
  .map((p, i) => `${i + 1}. "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Choose a mix of high-performing prompts and diverse approaches.
Return only the numbers of selected prompts:`,

    "rank-selection": `
Rank these prompts by quality and select the top ${count}:

${population
  .map((p, i) => `${i + 1}. "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Consider both fitness scores and prompt quality. Select the best ${count} prompts.
Return only the numbers of selected prompts:`,
  };

  const selectionPrompt =
    selectionPrompts[strategy as keyof typeof selectionPrompts];
  if (!selectionPrompt) {
    throw new Error(`Unknown selection strategy: ${strategy}`);
  }

  try {
    const result = await batcher.addRequest("selection", selectionPrompt);
    const selectedIndices =
      result.match(/\d+/g)?.map((n) => parseInt(n) - 1) || [];

    const selected = selectedIndices
      .slice(0, count)
      .map((i) => population[i])
      .filter((p): p is Prompt => p !== undefined);

    // Cache the result
    operatorCache.set(cacheKey, JSON.stringify(selected.map((p) => p.id)));

    return selected;
  } catch (error) {
    console.warn(`LLM selection failed, using fallback: ${error}`);
    // Fallback to fitness-based selection
    return population.sort((a, b) => b.fitness - a.fitness).slice(0, count);
  }
}

export const llmQualitySelection: SelectionOperator = {
  name: "llm-quality",
  select: async (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMSelection(
      population,
      count,
      "quality-assessment",
      llmProvider,
      batcher,
      config
    );
  },
};

export const llmDiversitySelection: SelectionOperator = {
  name: "llm-diversity",
  select: async (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMSelection(
      population,
      count,
      "diversity-aware",
      llmProvider,
      batcher,
      config
    );
  },
};

export const llmBalancedSelection: SelectionOperator = {
  name: "llm-balanced",
  select: async (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMSelection(
      population,
      count,
      "balanced-selection",
      llmProvider,
      batcher,
      config
    );
  },
};

export const llmRankSelection: SelectionOperator = {
  name: "llm-rank",
  select: async (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMSelection(
      population,
      count,
      "rank-selection",
      llmProvider,
      batcher,
      config
    );
  },
};

export const llmDiversityAwareSelection: SelectionOperator = {
  name: "llm-diversity-aware",
  select: async (
    population: Prompt[],
    count: number,
    config: Config,
    llmProvider: LLMProvider
  ): Promise<Prompt[]> => {
    if (population.length === 0) {
      return [];
    }

    if (population.length <= count) {
      return [...population];
    }

    const cacheKey = operatorCache.generateKey(
      "selection-diversity-aware",
      JSON.stringify(population.map((p) => ({ id: p.id, fitness: p.fitness }))),
      { count }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      try {
        const selectedIds = JSON.parse(cached);
        return population.filter((p) => selectedIds.includes(p.id));
      } catch {
        // Invalid cache entry, continue with LLM call
      }
    }

    const selected: Prompt[] = [];
    const used = new Set<string>();

    // First, select the best individual
    const best = population.reduce((max, current) =>
      current.fitness > max.fitness ? current : max
    );
    selected.push(best);
    used.add(best.id);

    // Then select diverse individuals using LLM
    const batcher = new OperatorBatcher(llmProvider);

    while (selected.length < count && selected.length < population.length) {
      const remaining = population.filter((p) => !used.has(p.id));

      if (remaining.length === 0) break;

      const diversityPrompt = `
From these remaining prompts, select the one that is most different from the already selected prompts:

Already selected:
${selected.map((p, i) => `${i + 1}. "${p.text}"`).join("\n")}

Remaining candidates:
${remaining
  .map((p, i) => `${i + 1}. "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Choose the prompt that adds the most diversity to the selection. Consider both quality and uniqueness.
Return only the number of the selected prompt:`;

      try {
        const result = await batcher.addRequest("selection", diversityPrompt);
        const selectedIndex = parseInt(result.match(/\d+/)?.[0] || "1") - 1;
        const candidate = remaining[selectedIndex];

        if (candidate) {
          selected.push(candidate);
          used.add(candidate.id);
        } else {
          // Fallback to highest fitness remaining
          const fallback = remaining.reduce((max, current) =>
            current.fitness > max.fitness ? current : max
          );
          selected.push(fallback);
          used.add(fallback.id);
        }
      } catch (error) {
        console.warn(
          `LLM diversity selection failed, using fallback: ${error}`
        );
        // Fallback to highest fitness remaining
        const fallback = remaining.reduce((max, current) =>
          current.fitness > max.fitness ? current : max
        );
        selected.push(fallback);
        used.add(fallback.id);
      }
    }

    // Cache the result
    operatorCache.set(cacheKey, JSON.stringify(selected.map((p) => p.id)));

    return selected;
  },
};
