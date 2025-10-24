import { FileBasedEvalConfig } from "../../src/types.js";

export const articleSummaryEval: FileBasedEvalConfig = {
  name: "Article Summary",
  inputFiles: [
    "data/articles/climate-change.txt",
    "data/articles/nutrition-guide.txt", 
    "data/articles/travel-tips.txt",
    "data/articles/financial-advice.txt",
    "data/articles/health-wellness.txt"
  ],
  expectedOutputs: [
    "Climate patterns are changing globally, affecting weather and ecosystems",
    "Balanced diet with whole foods, lean proteins, and vegetables promotes health",
    "Research destinations, book early, pack light, and embrace local culture",
    "Save regularly, diversify investments, and plan for long-term goals",
    "Regular exercise, good sleep, and stress management are key to wellness"
  ],
  initialPrompt: "Summarize the main point of this article in one sentence",
  evaluationMethod: "semantic-similarity",
  outputDir: "results"
};
