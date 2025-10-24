import { evalite } from "evalite";
import { OpenAI } from "openai";
import { Levenshtein } from "autoevals";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Load article files and expected outputs
const articlesDir = "data/articles";
const articleFiles = [
  "climate-change.txt",
  "nutrition-guide.txt",
  "travel-tips.txt",
  "financial-advice.txt",
  "health-wellness.txt",
];

const expectedSummaries = [
  "Climate patterns are changing globally, affecting weather and ecosystems",
  "Balanced diet with whole foods, lean proteins, and vegetables promotes health",
  "Research destinations, book early, pack light, and embrace local culture",
  "Save regularly, diversify investments, and plan for long-term goals",
  "Regular exercise, good sleep, and stress management are key to wellness",
];

// Create test cases by loading files
export const testCases = articleFiles.map((filename, index) => {
  const filePath = path.join(articlesDir, filename);
  const content = fs.readFileSync(filePath, "utf-8");

  return {
    input: content,
    expected: expectedSummaries[index],
    metadata: { filename },
  };
});

// Export the seed prompt for the genetic algorithm
export const seedPrompt =
  "Summarize the main point of this article in one sentence";
export const taskDescription = "Create concise summaries of longer texts";

evalite("Article Summary", {
  data: testCases,
  task: async (input) => {
    // This prompt will be evolved by the genetic algorithm
    const prompt = seedPrompt;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nArticle:\n${input}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  },
  scorers: [
    {
      name: "levenshtein",
      scorer: async ({ output, expected }) => {
        const result = await Levenshtein({ output, expected });
        return result.score || 0;
      },
    },
  ],
});
