// Polyfills for Node/Bun environment
import 'fake-indexeddb/auto';
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import { test, expect, describe } from 'bun:test';
import { GitEngine } from '../src/lib/engine/git/GitEngine.js';
import { LevelLoader } from '../src/lib/engine/level/LevelLoader.js';
import { LevelValidator } from '../src/lib/engine/level/LevelValidator.js';
import { getLevelSolution } from '../src/lib/engine/shell/solutions.js';
import { parseCommand } from '../src/lib/engine/git/cli-parser.js';
import { runBuiltin } from '../src/lib/engine/shell/builtins.js';
import { act1Levels } from '../src/levels/act1-basics/index.js';
import { act2Levels } from '../src/levels/act2-branching/index.js';
import { act3Levels } from '../src/levels/act3-conflicts/index.js';
import { act4Levels } from '../src/levels/act4-rewriting/index.js';
import { act5Levels } from '../src/levels/act5-recovery/index.js';
import { act6Levels } from '../src/levels/act6-collaboration/index.js';
import type { LevelDefinition } from '../src/levels/schema.js';

const allLevels = [
  ...act1Levels,
  ...act2Levels,
  ...act3Levels,
  ...act4Levels,
  ...act5Levels,
  ...act6Levels,
];

async function runSolution(engine: GitEngine, steps: string[]): Promise<string[]> {
  const outputs: string[] = [];
  for (const step of steps) {
    const parsed = parseCommand(step);
    if (parsed.type === 'git') {
      const result = await engine.execute(parsed.command, parsed.args);
      outputs.push(`$ ${step} → ${result.success ? 'OK' : 'FAIL'}: ${result.output.slice(0, 100)}`);
    } else if (parsed.type === 'builtin') {
      const rawArgs = parsed.command === 'echo'
        ? [step.slice(step.indexOf(' ') + 1)]
        : parsed.args;
      const result = await runBuiltin(parsed.command, rawArgs, engine.fs, engine.dir);
      outputs.push(`$ ${step} → ${result.success ? 'OK' : 'FAIL'}: ${result.output.slice(0, 100)}`);
    } else {
      outputs.push(`$ ${step} → UNKNOWN COMMAND TYPE: ${parsed.type}`);
    }
  }
  return outputs;
}

describe('Level tests', () => {
  for (const level of allLevels) {
    test(`${level.id}: ${level.title}`, async () => {
      const engine = new GitEngine();
      const loader = new LevelLoader(engine);
      const validator = new LevelValidator(engine);

      // 1. Load level
      let loadError: string | null = null;
      try {
        await loader.load(level);
      } catch (err) {
        loadError = err instanceof Error ? err.message : String(err);
      }
      expect(loadError).toBeNull();

      // 2. Check solution exists
      const solution = getLevelSolution(level.id);
      if (solution.length === 0) {
        console.warn(`  ⚠ No solution defined for ${level.id}`);
        return;
      }

      // 3. Run solution steps
      const outputs = await runSolution(engine, solution);

      // 4. Validate
      const result = await validator.validate(level.targetState.validators);

      if (!result.passed) {
        const failed = result.results.filter((r) => !r.passed);
        const failMessages = failed.map((r) => `  ✗ ${r.validator.type}: ${r.message}`).join('\n');
        const stepLog = outputs.join('\n  ');
        console.error(`\n--- ${level.id} FAILED ---`);
        console.error(`Steps:\n  ${stepLog}`);
        console.error(`Failed validators:\n${failMessages}`);
        console.error(`---\n`);
      }

      expect(result.passed).toBe(true);
    });
  }
});
