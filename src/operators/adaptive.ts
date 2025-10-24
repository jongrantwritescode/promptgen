import {
  LLMAdaptiveOperator,
  LLMProvider,
  Prompt,
  MutationOperator,
} from "../types.js";
import { operatorCache } from "../util/operatorCache.js";
import { OperatorBatcher } from "../util/operatorBatcher.js";

class AdaptiveMutationOperator implements LLMAdaptiveOperator {
  name = "llm-adaptive-mutation";
  private currentParams: Record<string, any> = {
    mutationIntensity: 0.5,
    focusAreas: ["clarity", "structure"],
    preferredTypes: ["word", "phrase"],
    reasoning: "Default parameters",
  };

  async adapt(
    performance: number,
    generation: number,
    llmProvider: LLMProvider
  ): Promise<void> {
    const cacheKey = operatorCache.generateKey(
      "adaptive-mutation",
      `${performance}-${generation}`,
      { performance, generation }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      try {
        const params = JSON.parse(cached);
        // Apply cached parameters
        this.currentParams = params;
        return;
      } catch {
        // Invalid cache entry, continue with LLM call
      }
    }

    const adaptationPrompt = `
Based on evolution performance (${performance}) and generation (${generation}), 
suggest improvements to the mutation strategy. 

Current performance: ${performance}
Generation: ${generation}

Should we:
1. Increase mutation intensity?
2. Change mutation focus areas?
3. Adjust mutation types?

Provide specific recommendations in JSON format:
{
  "mutationIntensity": 0.0-1.0,
  "focusAreas": ["clarity", "structure", "specificity"],
  "preferredTypes": ["word", "phrase", "structure", "template"],
  "reasoning": "explanation of recommendations"
}`;

    const batcher = new OperatorBatcher(llmProvider);

    try {
      const result = await batcher.addRequest("mutation", adaptationPrompt);

      // Parse LLM response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const params = JSON.parse(jsonMatch[0]);

        // Cache the result
        operatorCache.set(cacheKey, JSON.stringify(params));

        // Apply parameters
        this.currentParams = params;
      } else {
        console.warn(
          "Failed to parse adaptive mutation parameters from LLM response"
        );
      }
    } catch (error) {
      console.warn(`Adaptive mutation failed: ${error}`);
      // Use default parameters
      this.currentParams = {
        mutationIntensity: 0.5,
        focusAreas: ["clarity", "structure"],
        preferredTypes: ["word", "phrase"],
        reasoning: "Using default parameters due to LLM failure",
      };
    }
  }

  getCurrentParameters(): Record<string, any> {
    return this.currentParams;
  }
}

export const llmAdaptiveMutation = new AdaptiveMutationOperator();

export const llmMetaLearningOperator: MutationOperator = {
  name: "llm-meta-learning",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const hallOfFame = context?.hallOfFame || [];

    if (hallOfFame.length === 0) {
      return prompt; // No learning data available
    }

    const cacheKey = operatorCache.generateKey("meta-learning", prompt, {
      hallOfFameCount: hallOfFame.length,
    });

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const metaPrompt = `
Learn from these successful prompts and improve the given prompt:

Successful Examples:
${hallOfFame
  .slice(0, 3)
  .map((p: Prompt) => `- "${p.text}" (Fitness: ${p.fitness})`)
  .join("\n")}

Prompt to improve: "${prompt}"

Analyze what makes the successful examples effective and apply those principles to improve the given prompt.
Consider:
- Structure and organization
- Clarity and specificity
- Task-specific optimizations
- Prompt engineering techniques

Return only the improved prompt:`;

    const batcher = new OperatorBatcher(llmProvider);

    try {
      const result = await batcher.addRequest("mutation", metaPrompt);

      // Cache the result
      operatorCache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.warn(`Meta-learning mutation failed: ${error}`);
      return prompt; // Fallback to original prompt
    }
  },
};

// Additional adaptive operator for crossover strategies
class AdaptiveCrossoverOperator implements LLMAdaptiveOperator {
  name = "llm-adaptive-crossover";
  private currentParams: Record<string, any> = {
    crossoverRate: 0.8,
    preferredStrategies: ["semantic", "hybrid"],
    parentSelectionBias: "balanced",
    reasoning: "Default parameters",
  };

  async adapt(
    performance: number,
    generation: number,
    llmProvider: LLMProvider
  ): Promise<void> {
    const cacheKey = operatorCache.generateKey(
      "adaptive-crossover",
      `${performance}-${generation}`,
      { performance, generation }
    );

    // Check cache first
    const cached = operatorCache.get(cacheKey);
    if (cached) {
      try {
        const params = JSON.parse(cached);
        this.currentParams = params;
        return;
      } catch {
        // Invalid cache entry, continue with LLM call
      }
    }

    const adaptationPrompt = `
Based on evolution performance (${performance}) and generation (${generation}), 
suggest improvements to the crossover strategy. 

Current performance: ${performance}
Generation: ${generation}

Should we:
1. Change crossover frequency?
2. Adjust crossover strategies?
3. Modify parent selection criteria?

Provide specific recommendations in JSON format:
{
  "crossoverRate": 0.0-1.0,
  "preferredStrategies": ["single-point", "uniform", "semantic", "hybrid"],
  "parentSelectionBias": "fitness" | "diversity" | "balanced",
  "reasoning": "explanation of recommendations"
}`;

    const batcher = new OperatorBatcher(llmProvider);

    try {
      const result = await batcher.addRequest("crossover", adaptationPrompt);

      // Parse LLM response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const params = JSON.parse(jsonMatch[0]);

        // Cache the result
        operatorCache.set(cacheKey, JSON.stringify(params));

        // Apply parameters
        this.currentParams = params;
      } else {
        console.warn(
          "Failed to parse adaptive crossover parameters from LLM response"
        );
      }
    } catch (error) {
      console.warn(`Adaptive crossover failed: ${error}`);
      // Use default parameters
      this.currentParams = {
        crossoverRate: 0.8,
        preferredStrategies: ["semantic", "hybrid"],
        parentSelectionBias: "balanced",
        reasoning: "Using default parameters due to LLM failure",
      };
    }
  }

  getCurrentParameters(): Record<string, any> {
    return this.currentParams;
  }
}

export const llmAdaptiveCrossover = new AdaptiveCrossoverOperator();
