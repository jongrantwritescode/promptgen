import { FitnessEvaluator, TestCase } from "../types.js";
import { OpenAI } from "openai";
import { sleep } from "../util/rateLimiter.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class EvaliteFitnessEvaluator implements FitnessEvaluator {
  name = "evalite";
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async evaluate(prompt: string, testCases: TestCase[]): Promise<number> {
    console.log(`    🎯 Running Evalite-based evaluation...`);

    let totalScore = 0;
    let validTests = 0;

    // Use a subset of test cases for efficiency
    const testCasesToUse = testCases.slice(0, 5);

    for (let i = 0; i < testCasesToUse.length; i++) {
      const testCase = testCasesToUse[i];
      if (testCase) {
        console.log(
          `        🧪 Testing case ${i + 1}/${testCasesToUse.length}: "${
            testCase.input
          }" -> "${testCase.expectedOutput}"`
        );

        try {
          // Run the prompt on the test case
          const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: `${prompt}\n\nInput: ${testCase.input}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 50,
          });

          const output = response.choices[0]?.message?.content?.trim() || "";

          // Calculate accuracy score
          const accuracy = this.calculateAccuracy(
            output,
            testCase.expectedOutput
          );

          // Calculate additional quality scores
          const clarityScore = this.calculateClarityScore(prompt);
          const completenessScore = this.calculateCompletenessScore(prompt);
          const concisenessScore = this.calculateConcisenessScore(prompt);

          // Combine scores with weights
          const combinedScore =
            accuracy * 0.4 +
            clarityScore * 0.2 +
            completenessScore * 0.2 +
            concisenessScore * 0.2;

          console.log(
            `        ✅ Test case ${i + 1} score: ${combinedScore.toFixed(
              3
            )} (accuracy: ${accuracy.toFixed(3)})`
          );

          totalScore += combinedScore;
          validTests++;

          // Safety delay between API calls
          if (i < testCasesToUse.length - 1) {
            await sleep(1000);
          }
        } catch (error) {
          console.warn(
            `        ⚠️ Warning: Failed to evaluate test case ${
              i + 1
            }: ${error}`
          );
        }
      }
    }

    const finalScore = validTests > 0 ? totalScore / validTests : 0;
    console.log(
      `        🎯 Evalite evaluation complete: ${finalScore.toFixed(
        3
      )} (${validTests} valid tests)`
    );
    return finalScore;
  }

  private calculateAccuracy(output: string, expected: string): number {
    // Check if the output contains the expected result (case-insensitive)
    const outputLower = output.toLowerCase();
    const expectedLower = expected.toLowerCase();

    // Direct match
    if (outputLower === expectedLower) {
      return 1.0;
    }

    // Partial match (contains expected output)
    if (outputLower.includes(expectedLower)) {
      return 0.8;
    }

    // Check for similar words
    const expectedWords = expectedLower.split(" ");
    const outputWords = outputLower.split(" ");
    const matchingWords = expectedWords.filter((word) =>
      outputWords.some(
        (outputWord) => outputWord.includes(word) || word.includes(outputWord)
      )
    );

    if (matchingWords.length > 0) {
      return 0.6 * (matchingWords.length / expectedWords.length);
    }

    return 0.0;
  }

  private calculateClarityScore(prompt: string): number {
    let score = 0;

    // Check for clarity indicators
    const clarityWords = [
      "clear",
      "precise",
      "specific",
      "exact",
      "accurate",
      "understand",
    ];
    const clarityScore = clarityWords.some((word) =>
      prompt.toLowerCase().includes(word)
    )
      ? 0.3
      : 0;
    score += clarityScore;

    // Check for instruction clarity
    const instructionWords = [
      "classify",
      "categorize",
      "determine",
      "identify",
      "analyze",
    ];
    const instructionScore = instructionWords.some((word) =>
      prompt.toLowerCase().includes(word)
    )
      ? 0.3
      : 0;
    score += instructionScore;

    // Check for output format specification
    const formatWords = ["format", "output", "response", "answer"];
    const formatScore = formatWords.some((word) =>
      prompt.toLowerCase().includes(word)
    )
      ? 0.2
      : 0;
    score += formatScore;

    // Check for category specification
    const categoryWords = ["category", "categories", "class", "type"];
    const categoryScore = categoryWords.some((word) =>
      prompt.toLowerCase().includes(word)
    )
      ? 0.2
      : 0;
    score += categoryScore;

    return Math.min(1, score);
  }

  private calculateCompletenessScore(prompt: string): number {
    let score = 0;

    // Check if prompt mentions the task
    const taskWords = ["classify", "categorize", "intent", "input", "text"];
    const taskScore =
      (taskWords.filter((word) => prompt.toLowerCase().includes(word)).length /
        taskWords.length) *
      0.4;
    score += taskScore;

    // Check if prompt mentions categories
    const categoryMentions = [
      "question",
      "complaint",
      "compliment",
      "request",
      "other",
    ];
    const categoryScore =
      (categoryMentions.filter((category) =>
        prompt.toLowerCase().includes(category)
      ).length /
        categoryMentions.length) *
      0.3;
    score += categoryScore;

    // Check if prompt provides examples or context
    const contextScore =
      prompt.includes(":") || prompt.includes("•") || prompt.includes("-")
        ? 0.3
        : 0;
    score += contextScore;

    return Math.min(1, score);
  }

  private calculateConcisenessScore(prompt: string): number {
    const length = prompt.length;

    // Optimal length range: 50-200 characters
    if (length < 50) return 0.3; // Too short
    if (length > 200) return 0.3; // Too long
    if (length >= 50 && length <= 150) return 1.0; // Optimal
    return 0.7; // Acceptable
  }
}

export const evaliteFitnessEvaluator = new EvaliteFitnessEvaluator();
