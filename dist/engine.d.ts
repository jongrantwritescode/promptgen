import { Config, EvolutionResult, TestCase } from "./types.js";
export declare class PromptGenEngine {
    private config;
    private hallOfFame;
    private testCases;
    private stats;
    private totalEvaluations;
    constructor(config: Config, testCases: TestCase[]);
    evolve(): Promise<EvolutionResult>;
    private initializePopulation;
    private generateInitialVariation;
    private evaluatePopulation;
    private evaluateFitness;
    private updateHallOfFame;
    private calculateStats;
    private logProgress;
    private hasConverged;
    private createNextGeneration;
    private generateOffspring;
    private selectParent;
    private getCrossoverOperator;
    private getMutationOperator;
}
//# sourceMappingURL=engine.d.ts.map