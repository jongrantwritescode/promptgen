# Results Directory

This directory contains timestamped results from file-based evaluations.

## File Format

Results are saved as JSON files with the naming pattern:
`<eval-name>-<timestamp>.json`

Example: `article-summary-2024-01-15T10-30-45.json`

## Result Structure

```json
{
  "evalName": "article-summary",
  "timestamp": "2024-01-15T10:30:45Z",
  "initialPrompt": {
    "text": "Summarize the main point of this article in one sentence",
    "score": 0.45,
    "generation": 0
  },
  "hallOfFame": [
    {
      "text": "Extract the core message from this document",
      "score": 0.89,
      "generation": 47,
      "id": "prompt-uuid"
    }
  ],
  "stats": {
    "totalGenerations": 100,
    "totalEvaluations": 5000,
    "finalBestScore": 0.89,
    "generationStats": [...]
  }
}
```

## Usage

Results are automatically generated when running file-based evals:

```bash
npm run start -- --eval=article-summary
```

The results will be saved to this directory with a timestamped filename.
