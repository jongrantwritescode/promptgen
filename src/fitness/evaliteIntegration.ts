import { FitnessEvaluator, TestCase } from "../types.js";
import { OpenAI } from "openai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class EvaliteIntegration implements FitnessEvaluator {
  name = "evalite-integration";
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

    // Use all test cases for comprehensive evaluation
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (testCase) {
        console.log(
          `        🧪 Testing case ${i + 1}/${testCases.length}: "${
            testCase.input
          }" -> "${testCase.expectedOutput}"`
        );

        try {
          // Run the prompt on the test case (same logic as evals)
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

          // Use the same scoring logic as the evals
          const score = this.calculateAccuracy(output, testCase.expectedOutput);

          console.log(
            `        ✅ Test case ${i + 1} score: ${score.toFixed(3)}`
          );

          totalScore += score;
          validTests++;

          // Safety delay between API calls
          if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
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
    // Use the same scoring logic as the evals directory
    const outputStr = typeof output === "string" ? output : String(output);
    const expectedStr = typeof expected === "string" ? expected : String(expected);

    const outputLower = outputStr.toLowerCase();
    const expectedLower = expectedStr.toLowerCase();

    // Direct match
    if (outputLower === expectedLower) {
      return 1.0;
    }

    // Partial match (contains expected output)
    if (outputLower.includes(expectedLower)) {
      return 0.8;
    }

    return 0.0;
  }
}

export const evaliteIntegration = new EvaliteIntegration();
