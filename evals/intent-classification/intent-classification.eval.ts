import { evalite } from "evalite";
import { OpenAI } from "openai";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test cases for intent classification
const testCases = [
  {
    input: "What are your business hours?",
    expected: "question",
  },
  {
    input: "I'm not happy with my recent purchase",
    expected: "complaint",
  },
  {
    input: "Your customer service is excellent!",
    expected: "compliment",
  },
  {
    input: "Can you help me reset my password?",
    expected: "request",
  },
  {
    input: "The weather is nice today",
    expected: "other",
  },
  {
    input: "How do I return an item?",
    expected: "question",
  },
  {
    input: "This product is defective",
    expected: "complaint",
  },
  {
    input: "Thank you for your help!",
    expected: "compliment",
  },
  {
    input: "I need to update my address",
    expected: "request",
  },
  {
    input: "Have a great day!",
    expected: "other",
  },
  {
    input: "Do you have this in a different color?",
    expected: "question",
  },
  {
    input: "The delivery was late",
    expected: "complaint",
  },
  {
    input: "Amazing product quality!",
    expected: "compliment",
  },
  {
    input: "Please cancel my order",
    expected: "request",
  },
  {
    input: "Just checking in",
    expected: "other",
  },
];

evalite("Intent Classification", {
  data: testCases,
  task: async (input) => {
    // This will be replaced with the actual prompt from the genetic algorithm
    const prompt =
      "Classify the following text into one of these categories: question, complaint, compliment, request, other. Provide only the category name as your response.";

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nInput: ${input.input}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 50,
    });

    return response.choices[0]?.message?.content?.trim() || "";
  },
  scorers: [
    {
      name: "accuracy",
      scorer: (output, expected) => {
        // Handle different output types
        const outputStr = typeof output === "string" ? output : String(output);
        const expectedStr =
          typeof expected === "string" ? expected : String(expected);

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
      },
    },
  ],
});
