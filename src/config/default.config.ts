import { Config, Rubric, RubricCriterion } from "../types.js";

const defaultRubric: Rubric = {
  criteria: [
    {
      name: "accuracy",
      description: "How accurate is the classification?",
      weight: 0.4,
      evaluator: "llm",
      prompt:
        "Rate the accuracy of this classification prompt on a scale of 0-1. Consider how well it would correctly categorize inputs.",
    },
    {
      name: "clarity",
      description: "How clear and understandable is the prompt?",
      weight: 0.2,
      evaluator: "llm",
      prompt:
        "Rate the clarity of this prompt on a scale of 0-1. Consider how easy it is to understand what is being asked.",
    },
    {
      name: "completeness",
      description: "Does the prompt cover all necessary aspects?",
      weight: 0.2,
      evaluator: "llm",
      prompt:
        "Rate the completeness of this prompt on a scale of 0-1. Consider whether it covers all necessary information for the task.",
    },
    {
      name: "conciseness",
      description: "Is the prompt appropriately concise?",
      weight: 0.1,
      evaluator: "heuristic",
      heuristic: (output: string, expected: string) => {
        const length = output.length;
        if (length < 50) return 0.3; // Too short
        if (length > 200) return 0.3; // Too long
        return 1.0; // Good length
      },
    },
    {
      name: "format",
      description: "Does the prompt specify output format?",
      weight: 0.1,
      evaluator: "heuristic",
      heuristic: (output: string, expected: string) => {
        const formatKeywords = [
          "format",
          "json",
          "list",
          "category",
          "class",
          "type",
        ];
        return formatKeywords.some((keyword) =>
          output.toLowerCase().includes(keyword)
        )
          ? 1.0
          : 0.5;
      },
    },
  ],
  weights: {
    accuracy: 0.4,
    clarity: 0.2,
    completeness: 0.2,
    conciseness: 0.1,
    format: 0.1,
  },
};

export const defaultConfig: Config = {
  populationSize: 10, // Reduced from 50 to 10 for faster testing (stays under 500 req/min)
  generations: 5, // Reduced from 100 to 5 for faster testing (stays under 500 req/min)
  mutationRate: 0.1,
  crossoverRate: 0.8,
  selectionMethod: "tournament",
  tournamentSize: 3,
  eliteSize: 0.1, // Keep top 10% as elite
  seedPrompt:
    "Classify the following text into one of the predefined categories. Provide your answer in a clear, concise format.",
  taskDescription:
    "Intent classification task - categorize user inputs into predefined intent categories",
  rubric: defaultRubric,
  llmProvider: "openai",
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 150,
};

export const intentClassificationConfig: Config = {
  ...defaultConfig,
  seedPrompt:
    "Analyze the following user input and classify it into one of these categories: [question, complaint, compliment, request, other]. Provide only the category name as your response.",
  taskDescription:
    "Classify user inputs into intent categories for customer service automation",
  rubric: {
    ...defaultRubric,
    criteria: [
      ...defaultRubric.criteria,
      {
        name: "category_coverage",
        description: "Does the prompt mention specific categories?",
        weight: 0.15,
        evaluator: "heuristic",
        heuristic: (output: string, expected: string) => {
          const categoryKeywords = [
            "question",
            "complaint",
            "compliment",
            "request",
            "other",
            "category",
          ];
          const matches = categoryKeywords.filter((keyword) =>
            output.toLowerCase().includes(keyword)
          );
          return Math.min(1, matches.length / 3); // Expect at least 3 categories mentioned
        },
      },
    ],
  },
};

export const summarizationConfig: Config = {
  ...defaultConfig,
  seedPrompt:
    "Summarize the following text in 2-3 sentences, capturing the main points and key information.",
  taskDescription: "Create concise summaries of longer texts",
  rubric: {
    criteria: [
      {
        name: "comprehensiveness",
        description: "Does the summary capture all important points?",
        weight: 0.3,
        evaluator: "llm",
        prompt:
          "Rate how well this summarization prompt captures important information on a scale of 0-1.",
      },
      {
        name: "conciseness",
        description: "Is the summary appropriately brief?",
        weight: 0.3,
        evaluator: "llm",
        prompt:
          "Rate how well this prompt encourages concise summaries on a scale of 0-1.",
      },
      {
        name: "clarity",
        description: "Is the summary clear and readable?",
        weight: 0.2,
        evaluator: "llm",
        prompt:
          "Rate the clarity of this summarization prompt on a scale of 0-1.",
      },
      {
        name: "structure",
        description: "Does the prompt specify sentence count or structure?",
        weight: 0.2,
        evaluator: "heuristic",
        heuristic: (output: string, expected: string) => {
          const structureKeywords = [
            "sentence",
            "paragraph",
            "bullet",
            "point",
            "summary",
          ];
          return structureKeywords.some((keyword) =>
            output.toLowerCase().includes(keyword)
          )
            ? 1.0
            : 0.5;
        },
      },
    ],
    weights: {
      comprehensiveness: 0.3,
      conciseness: 0.3,
      clarity: 0.2,
      structure: 0.2,
    },
  },
};
