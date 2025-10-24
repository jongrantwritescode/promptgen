# Intent Classification Task

This example demonstrates how to use PromptGen to evolve better prompts for intent classification tasks.

## Task Description

The goal is to create prompts that can accurately classify user inputs into predefined intent categories:

- **question**: User is asking for information
- **complaint**: User is expressing dissatisfaction
- **compliment**: User is expressing satisfaction or praise
- **request**: User is asking for action to be taken
- **other**: User input that doesn't fit other categories

## Test Cases

The task includes 15 test cases covering various domains and scenarios:

- Business inquiries
- Product complaints
- Service compliments
- Technical requests
- General conversation

## Expected Evolution

The genetic algorithm should evolve prompts that:

1. Clearly specify the classification task
2. Mention the available categories
3. Provide clear instructions for output format
4. Handle edge cases appropriately
5. Are concise but comprehensive

## Running the Example

```bash
npm run start
```

The system will evolve prompts over 100 generations, tracking fitness improvements and maintaining a hall of fame of the best-performing prompts.
