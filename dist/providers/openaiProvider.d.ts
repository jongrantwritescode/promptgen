import { LLMProvider, TestCase, RubricCriterion } from "../types.js";
export declare class OpenAIProvider implements LLMProvider {
    name: string;
    private client;
    constructor();
    generate(prompt: string, config?: Partial<any>): Promise<string>;
    evaluate(prompt: string, testCase: TestCase, rubric: RubricCriterion): Promise<number>;
}
//# sourceMappingURL=openaiProvider.d.ts.map