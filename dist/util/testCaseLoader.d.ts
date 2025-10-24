import { TestCase } from "../types.js";
export declare function loadTestCases(): Promise<TestCase[]>;
export declare function generateRandomId(): string;
export declare function calculateDiversity(prompts: string[]): number;
export declare function calculateSimilarity(text1: string, text2: string): number;
export declare function formatFitness(fitness: number): string;
export declare function truncateText(text: string, maxLength?: number): string;
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=testCaseLoader.d.ts.map