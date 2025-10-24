# PromptGen — "Evolving better prompts, one token at a time."

PromptGen is a **genetic algorithm for prompt evolution**. Each prompt is treated as a genome, and the system uses selection, crossover, and mutation to find higher‑fitness prompts for your chosen task (e.g., intent classification, summarization, or reasoning).

## How It Works

PromptGen uses a genetic algorithm approach to evolve better prompts:

- **Population initialization** — Creates an initial population of prompt variations
- **Fitness evaluation** — Uses LLMs and heuristics to score prompt performance
- **Selection** — Tournament or roulette wheel selection to choose parents
- **Crossover & mutation** — Combines and modifies prompts to create offspring
- **Hall‑of‑Fame persistence** — Tracks and preserves the best-performing prompts

## Installation

```bash
npm install
npm run start
```

## Environment Setup

```bash
cp .env.example .env
# Add your OpenAI API key
OPENAI_API_KEY=sk-...
```

## Usage

```bash
npm run start
# or
npx ts-node src/index.ts
```

## Configuration

The main configuration file is `src/config/default.config.ts`. You can adjust:

- **Population size** — Number of prompts in each generation
- **Mutation rate** — Probability of mutations occurring
- **Rubric weights** — How different evaluation criteria are weighted
- **Selection method** — Tournament vs roulette wheel selection
- **Crossover rate** — Probability of crossover operations

### Example Configuration

```typescript
export const defaultConfig: Config = {
  populationSize: 50,
  generations: 100,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  selectionMethod: "tournament",
  tournamentSize: 3,
  // ... more options
};
```

## Extending PromptGen

### Creating New Mutation Operators

Add new mutation strategies in `src/operators/mutation.ts`:

```typescript
export const paraphraseMutation: MutationOperator = {
  name: "paraphrase",
  mutate: async (prompt: string) => {
    // Use LLM to paraphrase the prompt
    return await llmProvider.paraphrase(prompt);
  },
};
```

### Adding New Fitness Evaluators

Create custom evaluators in `src/fitness/`:

```typescript
export const customEvaluator: FitnessEvaluator = {
  name: "custom",
  evaluate: async (prompt: string, testCases: TestCase[]) => {
    // Your custom evaluation logic
    return score;
  },
};
```

### Using Different Models

Swap the LLM provider in `src/providers/` to use Claude, Gemini, or other models.

## Project Structure

```
promptgen/
├─ README.md                  ← Project overview and usage
├─ package.json              ← Dependencies and scripts
├─ src/
│  ├─ index.ts                ← Entry point
│  ├─ engine.ts               ← Main GA loop
│  ├─ types.ts                ← Shared types/interfaces
│  ├─ operators/              ← Selection, crossover, mutation
│  ├─ fitness/                ← Heuristic + LLM evaluation
│  ├─ providers/              ← API wrappers (e.g., OpenAI)
│  ├─ storage/                ← Hall‑of‑Fame logic
│  ├─ config/                 ← Default task/rubric configuration
│  └─ util/                   ← Helper functions
├─ examples/                  ← Training configurations
│  ├─ README.md               ← Examples documentation
│  └─ classify-intent/        ← Intent classification training
│     ├─ config.ts            ← Test cases and GA config
│     └─ task.md              ← Task documentation
└─ evals/                     ← Evaluation configurations
   ├─ README.md               ← Evals documentation
   └─ intent-classification/  ← Intent classification evaluation
      └─ intent-classification.eval.ts ← Evalite configuration
```

## Examples vs Evals

PromptGen uses two complementary directories:

### `examples/` - Training Configuration

- **Purpose**: Configuration and test cases for genetic algorithm training
- **Content**: Test cases, GA configuration, task documentation
- **Usage**: `npm run start` (runs genetic algorithm training)
- **Output**: Evolved prompts with improved performance

### `evals/` - Evaluation Logic (Single Source of Truth)

- **Purpose**: Evaluation logic used by both genetic algorithm AND manual testing
- **Content**: Test cases, scoring functions, evaluation logic
- **Usage**: 
  - `npm run eval` (manual evaluation)
  - Genetic algorithm automatically uses this logic during training
- **Output**: Performance metrics and scores

### Workflow

1. **Configure** training in `examples/` directory
2. **Define** evaluation logic in `evals/` directory  
3. **Train** prompts using genetic algorithm (uses evals logic automatically)
4. **Evaluate** manually using `npm run eval` (same logic as training)
5. **Iterate** by refining evaluation criteria in `evals/`

## License

MIT License - see LICENSE file for details.

## Credits

Built with TypeScript, OpenAI API, and genetic algorithm principles.
