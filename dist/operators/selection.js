export const tournamentSelection = {
    name: "tournament",
    select: (population, count, config) => {
        const selected = [];
        const tournamentSize = config.tournamentSize || 3;
        if (population.length === 0) {
            return selected;
        }
        for (let i = 0; i < count; i++) {
            // Randomly select tournament participants
            const tournament = [];
            for (let j = 0; j < tournamentSize; j++) {
                const randomIndex = Math.floor(Math.random() * population.length);
                const participant = population[randomIndex];
                if (participant) {
                    tournament.push(participant);
                }
            }
            // Select the best from tournament
            if (tournament.length > 0) {
                const winner = tournament.reduce((best, current) => current.fitness > best.fitness ? current : best);
                selected.push(winner);
            }
            else {
                // Fallback to first population member
                selected.push(population[0]);
            }
        }
        return selected;
    },
};
export const rouletteSelection = {
    name: "roulette",
    select: (population, count, config) => {
        const selected = [];
        if (population.length === 0) {
            return selected;
        }
        // Calculate total fitness
        const totalFitness = population.reduce((sum, prompt) => sum + prompt.fitness, 0);
        if (totalFitness === 0) {
            // If all fitnesses are 0, select randomly
            for (let i = 0; i < count; i++) {
                const randomIndex = Math.floor(Math.random() * population.length);
                const randomPrompt = population[randomIndex];
                if (randomPrompt) {
                    selected.push(randomPrompt);
                }
            }
            return selected;
        }
        // Select individuals based on fitness proportion
        for (let i = 0; i < count; i++) {
            const randomValue = Math.random() * totalFitness;
            let cumulativeFitness = 0;
            for (const prompt of population) {
                cumulativeFitness += prompt.fitness;
                if (cumulativeFitness >= randomValue) {
                    selected.push(prompt);
                    break;
                }
            }
            // Fallback if no prompt was selected
            if (selected.length === i) {
                const randomIndex = Math.floor(Math.random() * population.length);
                const fallbackPrompt = population[randomIndex];
                if (fallbackPrompt) {
                    selected.push(fallbackPrompt);
                }
                else if (population.length > 0) {
                    selected.push(population[0]);
                }
            }
        }
        return selected;
    },
};
//# sourceMappingURL=selection.js.map