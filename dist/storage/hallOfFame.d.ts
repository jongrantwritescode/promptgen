import { Prompt } from "../types.js";
export interface HallOfFameInterface {
    prompts: Prompt[];
    maxSize: number;
    addPrompt: (prompt: Prompt) => void;
    getBest: () => Prompt | null;
    getAll: () => Prompt[];
}
export declare class HallOfFame implements HallOfFameInterface {
    prompts: Prompt[];
    maxSize: number;
    constructor(maxSize?: number);
    addPrompt(prompt: Prompt): void;
    getBest(): Prompt | null;
    getAll(): Prompt[];
    getTop(n: number): Prompt[];
    getAverageFitness(): number;
    getDiversity(): number;
    private calculateSimilarity;
}
//# sourceMappingURL=hallOfFame.d.ts.map