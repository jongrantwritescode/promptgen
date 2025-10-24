# Examples Directory

This directory contains example configurations and test cases for training prompts using the PromptGen genetic algorithm.

## Purpose

The `examples/` directory is used for **training and evolving prompts** through genetic algorithms. Each example includes:

- Test cases with expected outputs
- Configuration for the genetic algorithm
- Documentation explaining the task

## Directory Structure

```
examples/
├── README.md                    # This file
└── classify-intent/
    ├── config.ts               # Test cases and configuration
    └── task.md                 # Task documentation
```

## How Examples Work with Evals

The `examples/` directory works in conjunction with the `evals/` directory:

1. **Training Phase** (`examples/`): Use genetic algorithms to evolve better prompts
2. **Evaluation Phase** (`evals/`): Test the evolved prompts using Evalite framework

### Workflow

```mermaid
graph LR
    A[examples/config.ts] --> B[Genetic Algorithm Training]
    B --> C[Evolved Prompts]
    C --> D[evals/eval.ts]
    D --> E[Performance Evaluation]
```

## Running Examples

To run an example:

```bash
# Navigate to the example directory
cd examples/classify-intent

# Run the genetic algorithm training
npm run start
```

## Adding New Examples

To add a new example:

1. Create a new directory under `examples/`
2. Add a `config.ts` file with test cases
3. Add a `task.md` file with documentation
4. Create a corresponding eval in `evals/` directory

## Test Case Format

Test cases should follow this format:

```typescript
export const testCases: TestCase[] = [
  {
    input: "User input text",
    expectedOutput: "expected category",
    metadata: { category: "category", domain: "domain" },
  },
  // ... more test cases
];
```

## Integration with Evals

The test cases in `examples/` should align with those in `evals/` to ensure consistent evaluation. Both directories use the same test data but serve different purposes:

- **Examples**: Training data for genetic algorithm
- **Evals**: Evaluation data for performance testing
