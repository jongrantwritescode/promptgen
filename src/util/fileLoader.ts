import { TestCase, FileBasedEvalConfig, EvolutionResult } from "../types.js";
import fs from "fs/promises";
import path from "path";

/**
 * Load content from a text file
 */
export async function loadInputFile(filePath: string): Promise<string> {
  try {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, "utf-8");
    return content.trim();
  } catch (error) {
    throw new Error(`Failed to load file ${filePath}: ${error}`);
  }
}

/**
 * Convert file-based eval config into TestCase format
 */
export async function loadFileBasedTestCases(config: FileBasedEvalConfig): Promise<TestCase[]> {
  if (config.inputFiles.length !== config.expectedOutputs.length) {
    throw new Error("Number of input files must match number of expected outputs");
  }

  const testCases: TestCase[] = [];

  for (let i = 0; i < config.inputFiles.length; i++) {
    const filePath = config.inputFiles[i];
    const expectedOutput = config.expectedOutputs[i];

    if (!filePath || !expectedOutput) {
      console.warn(`Warning: Skipping incomplete test case at index ${i}`);
      continue;
    }

    try {
      const fileContent = await loadInputFile(filePath);
      
      testCases.push({
        input: fileContent,
        expectedOutput: expectedOutput,
        metadata: {
          filePath: filePath,
          fileName: path.basename(filePath),
          fileIndex: i
        }
      });
    } catch (error) {
      console.warn(`Warning: Skipping file ${filePath} due to error: ${error}`);
    }
  }

  return testCases;
}

/**
 * Save evolution results to timestamped JSON file
 */
export async function saveEvolutionResults(
  evalName: string, 
  results: EvolutionResult,
  outputDir: string = "results"
): Promise<string> {
  // Create results directory if it doesn't exist
  await fs.mkdir(outputDir, { recursive: true });

  // Generate timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `${evalName}-${timestamp}.json`;
  const filePath = path.join(outputDir, fileName);

  // Prepare result data
  const resultData = {
    evalName: evalName,
    timestamp: new Date().toISOString(),
    initialPrompt: {
      text: results.bestPrompt.text,
      score: results.bestPrompt.fitness,
      generation: results.bestPrompt.generation
    },
    hallOfFame: results.hallOfFame.map((prompt: any) => ({
      text: prompt.text,
      score: prompt.fitness,
      generation: prompt.generation,
      id: prompt.id
    })),
    stats: {
      totalGenerations: results.totalGenerations,
      totalEvaluations: results.totalEvaluations,
      finalBestScore: results.bestPrompt.fitness,
      generationStats: results.stats.map((stat: any) => ({
        generation: stat.generation,
        bestFitness: stat.bestFitness,
        averageFitness: stat.averageFitness,
        diversity: stat.diversity,
        timestamp: stat.timestamp
      }))
    }
  };

  // Write to file
  await fs.writeFile(filePath, JSON.stringify(resultData, null, 2), "utf-8");
  
  console.log(`📁 Results saved to: ${filePath}`);
  return filePath;
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    throw new Error(`Failed to get file size for ${filePath}: ${error}`);
  }
}

/**
 * Validate that all input files exist and are readable
 */
export async function validateInputFiles(inputFiles: string[]): Promise<{ valid: string[], invalid: string[] }> {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const filePath of inputFiles) {
    if (await fileExists(filePath)) {
      valid.push(filePath);
    } else {
      invalid.push(filePath);
    }
  }

  return { valid, invalid };
}
