import OpenAI from "openai";
export class OpenAIProvider {
    name = "openai";
    client;
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY environment variable is required");
        }
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generate(prompt, config = {}) {
        try {
            const response = await this.client.chat.completions.create({
                model: config.modelName || "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 150,
            });
            return response.choices[0]?.message?.content || "";
        }
        catch (error) {
            console.error("OpenAI API error:", error);
            throw error;
        }
    }
    async evaluate(prompt, testCase, rubric) {
        try {
            console.log(`          📡 Sending evaluation request to OpenAI...`);
            const evaluationPrompt = `
You are evaluating a prompt's performance on a test case.

Test Case:
Input: "${testCase.input}"
Expected Output: "${testCase.expectedOutput}"

Prompt to evaluate: "${prompt}"

${rubric.prompt || "Rate the quality of this prompt on a scale of 0-1."}

Respond with only a number between 0 and 1 (e.g., 0.85).
`;
            const response = await this.client.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: evaluationPrompt,
                    },
                ],
                temperature: 0.1,
                max_tokens: 10,
            });
            const scoreText = response.choices[0]?.message?.content || "0";
            const score = parseFloat(scoreText);
            // Validate score is between 0 and 1
            if (isNaN(score) || score < 0 || score > 1) {
                console.warn(`          ⚠️ Invalid score from LLM: ${scoreText}, using 0.5`);
                return 0.5;
            }
            console.log(`          ✅ OpenAI response: ${scoreText} -> ${score.toFixed(3)}`);
            return score;
        }
        catch (error) {
            console.error(`          ❌ Evaluation error:`, error);
            // Handle rate limiting specifically - check for various rate limit indicators
            if (error instanceof Error &&
                (error.message.includes("rate") ||
                    error.message.includes("429") ||
                    error.message.includes("quota") ||
                    error.message.includes("too many requests") ||
                    error.message.includes("rate_limit_exceeded") ||
                    error.message.includes("insufficient_quota"))) {
                console.log(`          ⏳ Rate limit detected, throwing rate limit error...`);
                throw new Error("Rate limit exceeded");
            }
            return 0.5; // Default score on error
        }
    }
}
//# sourceMappingURL=openaiProvider.js.map