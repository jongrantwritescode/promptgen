# PromptGen — "Evolving better prompts, one token at a time."

PromptGen is a **sophisticated genetic algorithm for prompt evolution** powered by LLMs. Each prompt is treated as a genome, and the system uses intelligent selection, crossover, and mutation operators to find higher‑fitness prompts for your chosen task (e.g., intent classification, summarization, or reasoning).

## How It Works

PromptGen uses an advanced genetic algorithm approach with LLM-driven operators:

- **Population initialization** — Creates an initial population of prompt variations
- **LLM-powered fitness evaluation** — Uses LLMs and heuristics to score prompt performance
- **Intelligent meta-selection** — LLM chooses optimal operators based on context and performance
- **Advanced crossover & mutation** — 12+ LLM-driven operators for combining and modifying prompts
- **Adaptive learning** — Operators learn and adapt parameters during evolution
- **Performance optimization** — Batching, caching, and rate limiting for efficient API usage
- **Hall‑of‑Fame persistence** — Tracks and preserves the best-performing prompts with statistics

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

### Traditional Evals (Structured Test Cases)

```bash
npm run start
# or
npx ts-node src/index.ts
```

### File-Based Evals (Evalite Integration)

```bash
npm run start -- --eval=article-summary
# or
npx ts-node src/index.ts --eval=article-summary
```

File-based evals use **Evalite integration** to test prompts against multiple documents, perfect for tasks like summarization, extraction, or analysis of unstructured text. The system automatically:

- Loads test cases from `data/articles/` directory
- Creates structured evaluations with expected outputs
- Saves evolution results with timestamps
- Integrates with Evalite scoring systems

## Configuration

The main configuration file is `src/config/default.config.ts`. You can adjust:

- **Population size** — Number of prompts in each generation
- **Mutation rate** — Probability of mutations occurring
- **Rubric weights** — How different evaluation criteria are weighted
- **Selection method** — Tournament vs roulette wheel selection
- **Crossover rate** — Probability of crossover operations
- **Meta-selection** — Enable intelligent operator selection
- **Operator batching** — Batch size and window for API efficiency
- **Caching** — Cache size and TTL for operator results
- **Rate limiting** — API rate limits and retry policies

### Example Configuration

```typescript
export const defaultConfig: Config = {
  populationSize: 10,
  generations: 5,
  mutationRate: 0.1,
  crossoverRate: 0.8,
  selectionMethod: "tournament",
  tournamentSize: 3,
  eliteSize: 0.1,
  metaSelectionEnabled: true,
  operatorBatchSize: 5,
  operatorBatchWindow: 100,
  operatorCacheSize: 1000,
  operatorCacheTTL: 300000,
  operatorTemperature: 0.7,
  // ... more options
};
```

## Extending PromptGen

### LLM-Driven Operators

PromptGen includes **12+ sophisticated LLM-driven operators**:

#### Mutation Operators (7 types)

- **Word substitution** — Replace words with better alternatives
- **Phrase enhancement** — Improve phrases and expressions
- **Structure reformulation** — Better organization and flow
- **Context-aware** — Task-specific optimizations
- **Template optimization** — Apply prompt engineering techniques
- **Progressive** — Intensity-based improvements
- **Prompt engineering** — Advanced techniques (CoT, few-shot, etc.)

#### Crossover Operators (5 types)

- **Single-point** — Split and swap sections
- **Uniform** — Mix elements throughout
- **Multi-point** — Multiple crossover points
- **Semantic** — Combine based on meaning
- **Hybrid** — Intelligent strategy selection

#### Selection Operators (5 types)

- **Quality-based** — Select by fitness
- **Diversity-aware** — Balance quality and diversity
- **Balanced** — Hybrid approach
- **Rank-based** — Probabilistic ranking
- **Diversity-focused** — Emphasize population diversity

### Creating New Mutation Operators

Add new mutation strategies in `src/operators/mutation.ts`:

```typescript
export const customMutation: MutationOperator = {
  name: "custom",
  mutate: async (prompt: string, llmProvider: LLMProvider, context?: any) => {
    const batcher = new OperatorBatcher(llmProvider);
    return performLLMMutation(
      prompt,
      "custom-strategy",
      llmProvider,
      batcher,
      context
    );
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

### Advanced Features

#### Meta-Selection System

The `LLMOperatorSelector` intelligently chooses optimal operators based on:

- Current generation and population state
- Historical performance statistics
- Task-specific requirements
- Population diversity metrics

#### Adaptive Operators

Operators that learn and adapt during evolution:

- **Adaptive Mutation** — Adjusts intensity and focus areas
- **Adaptive Crossover** — Modifies strategies based on performance
- **Meta-Learning** — Learns from Hall of Fame examples

#### Performance Optimizations

- **Operator Batching** — Groups API requests for efficiency
- **Intelligent Caching** — MD5-based caching with TTL and LRU eviction
- **Rate Limiting** — Automatic retry with exponential backoff
- **Statistics Tracking** — Performance monitoring and recommendations

#### Storage & Persistence

- **Hall of Fame** — Fitness-based ranking of best prompts
- **Operator Statistics** — Performance tracking and recommendations
- **Results Persistence** — JSON export with timestamps
- **Configuration Management** — Multiple task-specific presets

### Using Different Models

Swap the LLM provider in `src/providers/` to use Claude, Gemini, or other models.

## Project Structure

```
promptgen/
├─ README.md                  ← Project overview and usage
├─ package.json              ← Dependencies and scripts
├─ src/
│  ├─ index.ts                ← Entry point
│  ├─ engine.ts               ← Main GA loop with meta-selection
│  ├─ types.ts                ← Shared types/interfaces
│  ├─ operators/              ← LLM-driven selection, crossover, mutation
│  │  ├─ adaptive.ts          ← Adaptive learning operators
│  │  ├─ crossover.ts         ← 5 LLM crossover strategies
│  │  ├─ metaSelector.ts      ← Intelligent operator selection
│  │  ├─ mutation.ts          ← 7 LLM mutation strategies
│  │  └─ selection.ts         ← 5 LLM selection strategies
│  ├─ fitness/                ← Heuristic + LLM evaluation
│  ├─ providers/              ← API wrappers (OpenAI, etc.)
│  ├─ storage/                ← Hall‑of‑Fame + operator statistics
│  ├─ config/                 ← Task/rubric configurations
│  ├─ util/                   ← Performance optimizations
│  │  ├─ operatorBatcher.ts   ← API request batching
│  │  ├─ operatorCache.ts      ← Intelligent caching system
│  │  ├─ rateLimiter.ts       ← Rate limiting and retries
│  │  └─ testCaseLoader.ts    ← Dynamic test case loading
│  └─ evaliteRunner.ts        ← Evalite integration
├─ evals/                     ← Evaluation configurations
│  ├─ README.md               ← Evals documentation
│  ├─ article-summary/        ← File-based summarization eval
│  └─ intent-classification/   ← Structured classification eval
├─ data/                      ← Test data for file-based evals
│  └─ articles/                ← Sample articles for testing
└─ eval-results/              ← Evolution results with timestamps
```

## Evals Architecture

PromptGen uses **Evalite integration** for structured evaluation:

### `evals/` - Evaluation Logic (Single Source of Truth)

- **Purpose**: Evaluation logic used by both genetic algorithm AND manual testing
- **Content**: Test cases, scoring functions, evaluation logic, Evalite configurations
- **Usage**:
  - `npm run start -- --eval=<name>` (genetic algorithm training)
  - `npm run eval` (manual evaluation with Evalite)
- **Output**: Performance metrics, scores, and evolution results

### File-Based Evaluation Workflow

1. **Create** eval file in `evals/<name>/<name>.eval.ts`
2. **Specify** input files in `data/` directory and expected outputs
3. **Run** evolution: `npm run start -- --eval=<name>`
4. **Review** results in `eval-results/<name>-<timestamp>.json`
5. **Iterate** by adjusting evaluation method or test files

### Available Evaluations

- **`article-summary`** — File-based summarization using articles from `data/articles/`
- **`intent-classification`** — Structured classification with predefined categories

## License

MIT License - see LICENSE file for details.

## Credits

Built with TypeScript, OpenAI API, Evalite integration, and advanced genetic algorithm principles featuring LLM-driven operators, intelligent meta-selection, and performance optimizations.
