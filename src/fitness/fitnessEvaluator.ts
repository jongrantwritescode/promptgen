import { FitnessEvaluator, TestCase, RubricCriterion } from "../types.js";
import { OpenAIProvider } from "../providers/openaiProvider.js";
import { sleep, retryWithBackoff, RateLimiter } from "../util/rateLimiter.js";

const rateLimiter = new RateLimiter();

export const llmFitnessEvaluator: FitnessEvaluator = {
  name: "llm",
  evaluate: async (prompt: string, testCases: TestCase[]): Promise<number> => {
    let totalScore = 0;
    let validTests = 0;

    // Create OpenAI provider instance here to ensure env vars are loaded
    const openaiProvider = new OpenAIProvider();

    // Reduce API calls: only test 2 cases instead of 5 for efficiency
    const testCasesToUse = testCases.slice(0, 2);

    for (let i = 0; i < testCasesToUse.length; i++) {
      const testCase = testCasesToUse[i];
      if (testCase) {
        console.log(
          `        🧪 Testing case ${i + 1}/${testCasesToUse.length}: "${
            testCase.input
          }" -> "${testCase.expectedOutput}"`
        );

        try {
          const rubric: RubricCriterion = {
            name: "accuracy",
            description: "How accurate is the response?",
            weight: 1.0,
            evaluator: "llm",
            prompt: `Rate the accuracy of this response on a scale of 0-1. Consider correctness, relevance, and completeness.`,
          };

          // Check rate limit before making API call
          await rateLimiter.waitIfNeeded();

          console.log(`        🤖 Calling OpenAI API...`);
          const score = await retryWithBackoff(async () => {
            return await openaiProvider.evaluate(prompt, testCase, rubric);
          });
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
