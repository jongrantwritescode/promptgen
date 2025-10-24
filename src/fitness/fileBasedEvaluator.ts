import { FitnessEvaluator, TestCase, FileBasedEvalConfig } from "../types.js";
import { OpenAI } from "openai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

export class FileBasedEvaluator implements FitnessEvaluator {
  name = "file-based";
  private openai: OpenAI;
  private evaluationMethod: "semantic-similarity" | "llm-judge" | "exact-match";

  constructor(evaluationMethod: "semantic-similarity" | "llm-judge" | "exact-match" = "semantic-similarity") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.evaluationMethod = evaluationMethod;
  }

  async evaluate(prompt: string, testCases: TestCase[]): Promise<number> {
    console.log(`    🎯 Running file-based evaluation (${this.evaluationMethod})...`);

    let totalScore = 0;
    let validTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      if (testCase) {
        const fileName = testCase.metadata?.fileName || `file-${i + 1}`;
        console.log(
          `        📄 Testing file ${i + 1}/${testCases.length}: ${fileName}`
        );

        try {
          // Inject file content into prompt
          const fullPrompt = `${prompt}\n\nDocument:\n${testCase.input}`;
          
          // Get LLM response
          const response = await this.openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: fullPrompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 200,
          });

          const output = response.choices[0]?.message?.content?.trim() || "";

          // Evaluate based on selected method
          let score: number;
          switch (this.evaluationMethod) {
            case "semantic-similarity":
              score = await this.evaluateWithSemanticSimilarity(output, testCase.expectedOutput);
              break;
            case "llm-judge":
              score = await this.evaluateWithLLMJudge(output, testCase.expectedOutput);
              break;
            case "exact-match":
              score = this.evaluateWithExactMatch(output, testCase.expectedOutput);
              break;
            default:
              score = this.evaluateWithExactMatch(output, testCase.expectedOutput);
          }

          console.log(
            `        ✅ File ${i + 1} score: ${score.toFixed(3)} (${this.evaluationMethod})`
          );

          totalScore += score;
          validTests++;

          // Safety delay between API calls
          if (i < testCases.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.warn(
            `        ⚠️ Warning: Failed to evaluate file ${i + 1}: ${error}`
          );
        }
      }
    }

    const finalScore = validTests > 0 ? totalScore / validTests : 0;
    console.log(
      `        🎯 File-based evaluation complete: ${finalScore.toFixed(
        3
      )} (${validTests} valid tests)`
    );
    return finalScore;
  }

  private async evaluateWithSemanticSimilarity(output: string, expected: string): Promise<number> {
    try {
      // Use OpenAI embeddings to calculate semantic similarity
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: [output, expected],
      });

      const embedding1 = response.data[0]?.embedding;
      const embedding2 = response.data[1]?.embedding;
      
      if (!embedding1 || !embedding2) {
        throw new Error("Failed to get embeddings");
      }

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(embedding1, embedding2);
      
      // Convert to 0-1 scale (cosine similarity is -1 to 1)
      return Math.max(0, (similarity + 1) / 2);
    } catch (error) {
      console.warn(`Semantic similarity evaluation failed: ${error}`);
      // Fallback to exact match
      return this.evaluateWithExactMatch(output, expected);
    }
  }

  private async evaluateWithLLMJudge(output: string, expected: string): Promise<number> {
    try {
      const judgePrompt = `You are evaluating how well an AI's output matches the expected result.

Expected Output: "${expected}"
Actual Output: "${output}"

Rate the quality of the actual output on a scale of 0.0 to 1.0, where:
- 1.0 = Perfect match or equivalent quality
- 0.8-0.9 = Very good, minor differences
- 0.6-0.7 = Good, some differences but captures main points
- 0.4-0.5 = Fair, partially correct
- 0.2-0.3 = Poor, mostly incorrect
- 0.0-0.1 = Very poor or completely wrong

Respond with only a number between 0.0 and 1.0.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: judgePrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const scoreText = response.choices[0]?.message?.content?.trim() || "0";
      const score = parseFloat(scoreText);
      
      // Ensure score is between 0 and 1
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.warn(`LLM judge evaluation failed: ${error}`);
      // Fallback to exact match
      return this.evaluateWithExactMatch(output, expected);
    }
  }

  private evaluateWithExactMatch(output: string, expected: string): number {
    const outputLower = output.toLowerCase().trim();
    const expectedLower = expected.toLowerCase().trim();

    // Direct match
    if (outputLower === expectedLower) {
      return 1.0;
    }

    // Partial match (contains expected output)
    if (outputLower.includes(expectedLower)) {
      return 0.8;
    }

    // Check for similar words
    const expectedWords = expectedLower.split(/\s+/);
    const outputWords = outputLower.split(/\s+/);
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

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i] || 0;
      const bVal = b[i] || 0;
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

export const createFileBasedEvaluator = (evaluationMethod: "semantic-similarity" | "llm-judge" | "exact-match") => {
  return new FileBasedEvaluator(evaluationMethod);
};
