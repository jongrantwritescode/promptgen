# PromptGen Repository Completion Guide

This document describes how to **complete and configure** the PromptGen project you downloaded.  
It assumes you are opening it in **Cursor** or another VS Code–style IDE.

---

## 1. Overview

PromptGen is a **genetic algorithm for prompt evolution**. Each prompt is treated as a genome, and the system uses selection, crossover, and mutation to find higher‑fitness prompts for your chosen task (e.g., intent classification, summarization, or reasoning).

The provided ZIP contains:
```
promptgen/
├─ README.md                  ← to fill out with overview + usage
├─ package.json
├─ src/
│  ├─ index.ts                ← entry point
│  ├─ engine.ts               ← main GA loop
│  ├─ types.ts                ← shared types/interfaces
│  ├─ operators/              ← selection, crossover, mutation
│  ├─ fitness/                ← heuristic + LLM evaluation
│  ├─ providers/              ← API wrappers (e.g., OpenAI)
│  ├─ storage/                ← Hall‑of‑Fame logic
│  ├─ config/                 ← default task/rubric configuration
│  └─ util/                   ← helpers
└─ examples/
   └─ classify-intent/
      ├─ task.md
      └─ config.ts
```

---

## 2. Filling in `README.md`

Replace the placeholder content with:

### Sections to Include
1. **Project Summary** — short description of what PromptGen does.
2. **How It Works** — bullet overview of the GA cycle:
   - Population initialization
   - Fitness evaluation via LLMs and heuristics
   - Selection (tournament/roulette)
   - Crossover & mutation
   - Hall‑of‑Fame persistence
3. **Installation**
   ```bash
   npm install
   npm run start
   ```
4. **Environment Setup**
   ```bash
   cp .env.example .env
   # Add your OpenAI API key
   OPENAI_API_KEY=sk-...
   ```
5. **Usage**
   ```bash
   npm run start
   # or
   npx ts-node src/index.ts
   ```
6. **Configuration**
   - Explain each section of `src/config/default.config.ts`.
   - Show how to adjust population size, mutation rate, rubric weights, etc.
7. **Extending**
   - Describe how to create new mutation operators.
   - Mention how to swap models or add new fitness evaluators.
8. **License / Credits**

---

## 3. Completing the Code

The placeholder files (`index.ts`, `engine.ts`, `types.ts`) should be replaced with the **full implementations** provided in the ChatGPT message titled *“Awesome—here’s a clean, batteries-included starter for PromptGen.”*

### Steps

1. **Copy Full Code Blocks**  
   From the ChatGPT response, locate each section (e.g. `src/engine.ts`, `src/types.ts`, etc.) and paste it into the corresponding file.

2. **Recreate Subfolders**  
   Ensure the following folders exist:  
   `operators`, `fitness`, `providers`, `storage`, `config`, and `util`.

3. **Paste the Code Snippets**  
   Each snippet has the full implementation. Make sure you include imports at the top and preserve TypeScript syntax.

4. **Update `package.json` Scripts (Optional)**  
   Add convenient scripts such as:
   ```json
   "scripts": {
     "dev": "ts-node src/index.ts",
     "build": "tsc",
     "start": "node dist/index.js",
     "lint": "eslint . --ext .ts"
   }
   ```

5. **Install Dependencies**
   ```bash
   npm install
   ```

6. **Run the Project**
   ```bash
   npm run start
   ```
   You should see logs like:
   ```
   [gen 1] best fitness=0.34 id=a5f3...
   [gen 2] best fitness=0.42 id=b1d9...
   === HALL OF FAME ===
   #1 fitness=0.87 id=...
   ```

---

## 4. Adapting to Your Use Case

- **Change the seed prompt** in `src/config/default.config.ts` to match your task.
- **Adjust the rubric** to evaluate desired traits (e.g., correctness, JSON validity, tone).
- **Add new mutation operators** in `src/operators/mutation.ts` (e.g., paraphrasing via LLM calls).
- **Use a different evaluator** in `src/fitness/llmEvaluator.ts` (e.g., Claude, Gemini).

---

## 5. Optional Enhancements

| Area | Example Enhancement |
|------|----------------------|
| UI | Build a web dashboard to visualize generations. |
| Storage | Persist Hall‑of‑Fame in SQLite or Supabase. |
| Parallelism | Use worker threads or queueing to score prompts concurrently. |
| Analytics | Log fitness trends to CSV/Chart.js. |

---

## 6. Validation Checklist

✅ Folder structure matches above  
✅ All code pasted into the proper files  
✅ `.env` file created with valid key  
✅ `npm install` succeeds  
✅ `npm run start` prints generation logs

---

Once you’ve filled in the README and code, commit your work and run PromptGen!  
Enjoy evolving smarter prompts. 🧬
