import { MutationOperator, LLMProvider } from "../types.js";
import { operatorCache } from "../util/operatorCache.js";
import { OperatorBatcher } from "../util/operatorBatcher.js";

// Generic LLM mutation function with caching and batching
async function performLLMMutation(
  prompt: string,
  mutationType: string,
  llmProvider: LLMProvider,
  batcher: OperatorBatcher,
  context?: any
): Promise<string> {
  const cacheKey = operatorCache.generateKey(
    `mutation-${mutationType}`,
    prompt,
    context
  );

  // Check cache first
  const cached = operatorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const mutationPrompts = {
    "word-substitution": `
Improve this prompt by substituting words with better alternatives:
"${prompt}"

Replace words with more precise, clear, or effective synonyms. Keep the same meaning and structure.
Return only the improved prompt:`,

    "phrase-enhancement": `
Enhance this prompt by improving phrases and expressions:
"${prompt}"

Make phrases more clear, professional, or effective. Maintain the original intent.
Return only the enhanced prompt:`,

    "structure-reformulation": `
Reformulate this prompt with better structure and clarity:
"${prompt}"

Improve the organization, flow, and readability while keeping the same task.
Return only the reformulated prompt:`,

    "context-aware": `
Analyze this prompt and improve it based on its apparent task type:
"${prompt}"

Enhance it for better performance on its specific task (classification, summarization, analysis, etc.).
Return only the improved prompt:`,

    "template-optimization": `
Optimize this prompt using proven prompt engineering techniques:
"${prompt}"

Apply techniques like chain-of-thought, few-shot examples, role specification, or constraint definition.
Return only the optimized prompt:`,

    progressive: `
Improve this prompt with intensity level ${context?.intensity || 0.5}:
"${prompt}"

Apply improvements proportional to the intensity level (0.1 = minor changes, 0.9 = major restructuring).
Return only the improved prompt:`,

    "prompt-engineering": `
Apply advanced prompt engineering techniques to improve this prompt:
"${prompt}"

Use techniques like:
- Chain of thought reasoning
- Few-shot examples
- Role-based prompting
- Constraint specification
- Output format specification

Return only the improved prompt:`,
  };

  const mutationPrompt =
    mutationPrompts[mutationType as keyof typeof mutationPrompts];
  if (!mutationPrompt) {
    throw new Error(`Unknown mutation type: ${mutationType}`);
  }

  try {
    const result = await batcher.addRequest("mutation", mutationPrompt);

    // Cache the result
    operatorCache.set(cacheKey, result);

    return result;
  } catch (error) {
    console.warn(`LLM mutation failed, returning original: ${error}`);
    return prompt; // Fallback to original prompt
  }
}

export const llmWordMutation: MutationOperator = {
  name: "llm-word",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "word-substitution",
      llmProvider,
      batcher,
      context
    );
  },
};

export const llmPhraseMutation: MutationOperator = {
  name: "llm-phrase",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "phrase-enhancement",
      llmProvider,
      batcher,
      context
    );
  },
};

export const llmStructureMutation: MutationOperator = {
  name: "llm-structure",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "structure-reformulation",
      llmProvider,
      batcher,
      context
    );
  },
};

export const llmContextAwareMutation: MutationOperator = {
  name: "llm-context-aware",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "context-aware",
      llmProvider,
      batcher,
      context
    );
  },
};

export const llmTemplateMutation: MutationOperator = {
  name: "llm-template",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "template-optimization",
      llmProvider,
      batcher,
      context
    );
  },
};

export const llmProgressiveMutation: MutationOperator = {
  name: "llm-progressive",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    const intensity = context?.intensity || Math.random();
    return performLLMMutation(prompt, "progressive", llmProvider, batcher, {
      intensity,
    });
  },
};

export const llmPromptEngineeringMutation: MutationOperator = {
  name: "llm-prompt-engineering",
  mutate: async (
    prompt: string,
    llmProvider: LLMProvider,
    context?: any
  ): Promise<string> => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "prompt-engineering",
      llmProvider,
      batcher,
      context
    );
  },
};
