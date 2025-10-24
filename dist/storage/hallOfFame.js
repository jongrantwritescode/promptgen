export class HallOfFame {
    prompts = [];
    maxSize;
    constructor(maxSize = 10) {
        this.maxSize = maxSize;
    }
    addPrompt(prompt) {
        // Check if prompt already exists
        const existingIndex = this.prompts.findIndex((p) => p.id === prompt.id);
        if (existingIndex !== -1) {
            // Update existing prompt if fitness is better
            const existingPrompt = this.prompts[existingIndex];
            if (existingPrompt && prompt.fitness > existingPrompt.fitness) {
                this.prompts[existingIndex] = prompt;
            }
        }
        else {
            // Add new prompt
            this.prompts.push(prompt);
        }
        // Sort by fitness (descending) and maintain max size
        this.prompts.sort((a, b) => b.fitness - a.fitness);
        this.prompts = this.prompts.slice(0, this.maxSize);
    }
    getBest() {
        return this.prompts.length > 0 ? this.prompts[0] || null : null;
    }
    getAll() {
        return [...this.prompts];
    }
    getTop(n) {
        return this.prompts.slice(0, n);
    }
    getAverageFitness() {
        if (this.prompts.length === 0)
            return 0;
        const totalFitness = this.prompts.reduce((sum, prompt) => sum + prompt.fitness, 0);
        return totalFitness / this.prompts.length;
    }
    getDiversity() {
        if (this.prompts.length <= 1)
            return 0;
        const texts = this.prompts.map((p) => p.text);
        let totalSimilarity = 0;
        let comparisons = 0;
        for (let i = 0; i < texts.length; i++) {
            for (let j = i + 1; j < texts.length; j++) {
                const text1 = texts[i];
                const text2 = texts[j];
                if (text1 && text2) {
                    const similarity = this.calculateSimilarity(text1, text2);
                    totalSimilarity += similarity;
                    comparisons++;
                }
            }
        }
        const averageSimilarity = totalSimilarity / comparisons;
        return 1 - averageSimilarity; // Diversity is inverse of similarity
    }
    calculateSimilarity(text1, text2) {
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter((x) => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return union.size > 0 ? intersection.size / union.size : 0;
    }
}
//# sourceMappingURL=hallOfFame.js.map