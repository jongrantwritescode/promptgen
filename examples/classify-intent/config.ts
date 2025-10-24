import { TestCase } from "../../src/types.js";

export const intentClassificationTestCases: TestCase[] = [
  {
    input: "What are your business hours?",
    expectedOutput: "question",
    metadata: { category: "question", domain: "business" },
  },
  {
    input: "I'm not happy with my recent purchase",
    expectedOutput: "complaint",
    metadata: { category: "complaint", domain: "sales" },
  },
  {
    input: "Your customer service is excellent!",
    expectedOutput: "compliment",
    metadata: { category: "compliment", domain: "service" },
  },
  {
    input: "Can you help me reset my password?",
    expectedOutput: "request",
    metadata: { category: "request", domain: "technical" },
  },
  {
    input: "The weather is nice today",
    expectedOutput: "other",
    metadata: { category: "other", domain: "general" },
  },
  {
    input: "How do I return an item?",
    expectedOutput: "question",
    metadata: { category: "question", domain: "returns" },
  },
  {
    input: "This product is defective",
    expectedOutput: "complaint",
    metadata: { category: "complaint", domain: "product" },
  },
  {
    input: "Thank you for your help!",
    expectedOutput: "compliment",
    metadata: { category: "compliment", domain: "service" },
  },
  {
    input: "I need to update my address",
    expectedOutput: "request",
    metadata: { category: "request", domain: "account" },
  },
  {
    input: "Have a great day!",
    expectedOutput: "other",
    metadata: { category: "other", domain: "general" },
  },
  {
    input: "Do you have this in a different color?",
    expectedOutput: "question",
    metadata: { category: "question", domain: "product" },
  },
  {
    input: "The delivery was late",
    expectedOutput: "complaint",
    metadata: { category: "complaint", domain: "shipping" },
  },
  {
    input: "Amazing product quality!",
    expectedOutput: "compliment",
    metadata: { category: "compliment", domain: "product" },
  },
  {
    input: "Please cancel my order",
    expectedOutput: "request",
    metadata: { category: "request", domain: "orders" },
  },
  {
    input: "Just checking in",
    expectedOutput: "other",
    metadata: { category: "other", domain: "general" },
  },
];
