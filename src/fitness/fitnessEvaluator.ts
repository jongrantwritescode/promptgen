import { FitnessEvaluator, TestCase, RubricCriterion } from "../types.js";
import { OpenAIProvider } from "../providers/openaiProvider.js";
import { sleep, retryWithBackoff, RateLimiter } from "../util/rateLimiter.js";
import OpenAI from "openai";
import { Levenshtein } from "autoevals";

const rateLimiter = new RateLimiter();

export const llmFitnessEvaluator: FitnessEvaluator = {
  name: "llm",
  evaluate: async (prompt: string, testCases: TestCase[]): Promise<number> => {
    let totalScore = 0;
    let validTests = 0;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Reduce API calls: only test 2 cases instead of 5 for efficiency
    const testCasesToUse = testCases.slice(0, 2);

    for (let i = 0; i < testCasesToUse.length; i++) {
      const testCase = testCasesToUse[i];
      if (testCase) {
        console.log(
          `        🧪 Testing case ${i + 1}/${
            testCasesToUse.length
          }: "${testCase.input.substring(0, 50)}..." -> "${
            testCase.expectedOutput
          }"`
        );

        try {
          // Check rate limit before making API call
          await rateLimiter.waitIfNeeded();

          console.log(`        🤖 Running LLM with evolved prompt...`);

          // Run the LLM with the evolved prompt
          const response = await retryWithBackoff(async () => {
            return await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "user",
                  content: `${prompt}\n\nInput:\n${testCase.input}`,
                },
              ],
              temperature: 0.3,
              max_tokens: 100,
            });
          });

          const actualOutput =
            response.choices[0]?.message?.content?.trim() || "";
          console.log(`        📝 LLM output: "${actualOutput}"`);

          // Score the output against expected using Levenshtein distance
          const levenshteinResult = await Levenshtein({
            output: actualOutput,
            expected: testCase.expectedOutput,
          });

          const score = levenshteinResult.score || 0;
          console.log(
            `        ✅ Test case ${i + 1} score: ${score.toFixed(3)}`
          );

          totalScore += score;
          validTests++;

          // Additional safety delay between API calls
          if (i < testCasesToUse.length - 1) {
            console.log(`        ⏳ Safety delay: waiting 1 second...`);
            await sleep(1000);
          }
        } catch (error) {
          console.warn(
            `        ⚠️ Warning: Failed to evaluate test case ${
              i + 1
            } after all retries: ${error}`
          );
        }
      }
    }

    const finalScore = validTests > 0 ? totalScore / validTests : 0;
    console.log(
      `        🎯 LLM evaluation complete: ${finalScore.toFixed(
        3
      )} (${validTests} valid tests)`
    );
    return finalScore;
  },
};

export const heuristicFitnessEvaluator: FitnessEvaluator = {
  name: "heuristic",
  evaluate: async (prompt: string, testCases: TestCase[]): Promise<number> => {
    let score = 0;

    // Length appropriateness (not too short, not too long)
    const lengthScore = Math.max(0, 1 - Math.abs(prompt.length - 100) / 200);
    score += lengthScore * 0.2;

    // Clarity indicators
    const clarityWords = ["clear", "precise", "specific", "exact", "accurate"];
    const clarityScore = clarityWords.some((word) =>
      prompt.toLowerCase().includes(word)
    )
      ? 0.2
      : 0;
    score += clarityScore;

    // Structure indicators
    const structureScore =
      prompt.includes(":") || prompt.includes("•") || prompt.includes("-")
        ? 0.1
        : 0;
    score += structureScore;

    // Politeness (not too demanding)
    const politenessScore =
      prompt.toLowerCase().includes("please") ||
      prompt.toLowerCase().includes("kindly")
        ? 0.1
        : 0;
    score += politenessScore;

    // Specificity (mentions specific criteria)
    const specificityScore =
      prompt.toLowerCase().includes("classify") ||
      prompt.toLowerCase().includes("categorize") ||
      prompt.toLowerCase().includes("determine")
        ? 0.2
        : 0;
    score += specificityScore;

    // Output format (mentions expected format)
    const formatScore =
      prompt.toLowerCase().includes("format") ||
      prompt.toLowerCase().includes("json") ||
      prompt.toLowerCase().includes("list")
        ? 0.1
        : 0;
    score += formatScore;

    return Math.min(1, score);
  },
};
