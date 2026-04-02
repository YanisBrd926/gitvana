import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';

export function reflogCommand(_args: string[], engine: GitEngine): Promise<CommandResult> {
  if (engine.reflogEntries.length === 0) {
    return Promise.resolve({ output: 'fatal: no reflog entries', success: false });
  }

  const lines = engine.reflogEntries.map((entry, i) => {
    const shortOid = entry.oid.slice(0, 7);
    return `${shortOid} HEAD@{${i}}: ${entry.action}: ${entry.message}`;
  });

  return Promise.resolve({ output: lines.join('\n'), success: true });
}
