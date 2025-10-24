import { v4 as uuidv4 } from "uuid";
export const singlePointCrossover = {
    name: "single-point",
    crossover: (parent1, parent2) => {
        const text1 = parent1.text;
        const text2 = parent2.text;
        // Find a good crossover point (avoid splitting words)
        const words1 = text1.split(" ");
        const words2 = text2.split(" ");
        const minLength = Math.min(words1.length, words2.length);
        const crossoverPoint = Math.floor(Math.random() * minLength) + 1;
        // Create offspring
        const offspring1Text = words1.slice(0, crossoverPoint).join(" ") +
            " " +
            words2.slice(crossoverPoint).join(" ");
        const offspring2Text = words2.slice(0, crossoverPoint).join(" ") +
            " " +
            words1.slice(crossoverPoint).join(" ");
        const offspring1 = {
            id: uuidv4(),
            text: offspring1Text.trim(),
            fitness: 0,
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parentIds: [parent1.id, parent2.id],
            mutationHistory: ["single-point-crossover"],
        };
        const offspring2 = {
            id: uuidv4(),
            text: offspring2Text.trim(),
            fitness: 0,
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parentIds: [parent1.id, parent2.id],
            mutationHistory: ["single-point-crossover"],
        };
        return [offspring1, offspring2];
    },
};
export const uniformCrossover = {
    name: "uniform",
    crossover: (parent1, parent2) => {
        const words1 = parent1.text.split(" ");
        const words2 = parent2.text.split(" ");
        const maxLength = Math.max(words1.length, words2.length);
        let offspring1Words = [];
        let offspring2Words = [];
        for (let i = 0; i < maxLength; i++) {
            const useParent1 = Math.random() < 0.5;
            if (useParent1) {
                offspring1Words.push(words1[i] || "");
                offspring2Words.push(words2[i] || "");
            }
            else {
                offspring1Words.push(words2[i] || "");
                offspring2Words.push(words1[i] || "");
            }
        }
        const offspring1 = {
            id: uuidv4(),
            text: offspring1Words.join(" ").trim(),
            fitness: 0,
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parentIds: [parent1.id, parent2.id],
            mutationHistory: ["uniform-crossover"],
        };
        const offspring2 = {
            id: uuidv4(),
            text: offspring2Words.join(" ").trim(),
            fitness: 0,
            generation: Math.max(parent1.generation, parent2.generation) + 1,
            parentIds: [parent1.id, parent2.id],
            mutationHistory: ["uniform-crossover"],
        };
        return [offspring1, offspring2];
    },
};
//# sourceMappingURL=crossover.js.map