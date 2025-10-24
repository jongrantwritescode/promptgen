import { MutationOperator } from "../types.js";

export const wordMutation: MutationOperator = {
  name: "word",
  mutate: async (prompt: string): Promise<string> => {
    const words = prompt.split(" ");
    const wordReplacements: Record<string, string[]> = {
      analyze: ["examine", "study", "investigate", "assess"],
      classify: ["categorize", "sort", "group", "organize"],
      determine: ["identify", "find", "discover", "establish"],
      please: ["kindly", "could you", "would you"],
      you: ["the user", "the system", "the model"],
      input: ["data", "text", "information", "content"],
      output: ["result", "response", "answer", "outcome"],
      task: ["job", "assignment", "work", "operation"],
      help: ["assist", "support", "aid", "guide"],
      understand: ["comprehend", "grasp", "perceive", "recognize"],
    };

    const mutatedWords = words.map((word) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/, "");
      if (wordReplacements[cleanWord]) {
        const replacements = wordReplacements[cleanWord];
        const replacement =
          replacements[Math.floor(Math.random() * replacements.length)];
        if (replacement) {
          return word.replace(
            new RegExp(cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
            replacement
          );
        }
      }
      return word;
    });

    return mutatedWords.join(" ");
  },
};

export const phraseMutation: MutationOperator = {
  name: "phrase",
  mutate: async (prompt: string): Promise<string> => {
    const phraseReplacements: Record<string, string[]> = {
      "please analyze": [
        "kindly examine",
        "carefully study",
        "thoroughly investigate",
      ],
      "classify the": ["categorize the", "sort the", "organize the"],
      "determine the": ["identify the", "find the", "establish the"],
      "given the": ["considering the", "based on the", "using the"],
      "in order to": ["to", "so as to", "for the purpose of"],
      "make sure": ["ensure", "verify", "confirm"],
      "be sure to": ["remember to", "don't forget to", "make certain to"],
      "as follows": ["as shown below", "in the following way", "like this"],
      "for example": ["for instance", "such as", "like"],
      "in other words": ["that is", "namely", "i.e."],
    };

    let mutatedPrompt = prompt;

    for (const [original, replacements] of Object.entries(phraseReplacements)) {
      if (mutatedPrompt.toLowerCase().includes(original.toLowerCase())) {
        const replacement =
          replacements[Math.floor(Math.random() * replacements.length)];
        if (replacement) {
          mutatedPrompt = mutatedPrompt.replace(
            new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
            replacement
          );
          break; // Only replace one phrase per mutation
        }
      }
    }

    return mutatedPrompt;
  },
};

export const structureMutation: MutationOperator = {
  name: "structure",
  mutate: async (prompt: string): Promise<string> => {
    const structures = [
      `Task: ${prompt}`,
      `Given the following input, ${prompt.toLowerCase()}`,
      `${prompt} Be precise and concise.`,
      `${prompt} Provide a clear and accurate response.`,
      `Your task is to ${prompt.toLowerCase()}`,
      `Please ${prompt.toLowerCase()}`,
      `I need you to ${prompt.toLowerCase()}`,
      `${prompt} Make sure to be thorough.`,
      `${prompt} Focus on accuracy and clarity.`,
      `Objective: ${prompt}`,
    ];

    const selectedStructure =
      structures[Math.floor(Math.random() * structures.length)];
    return selectedStructure || prompt;
  },
};
