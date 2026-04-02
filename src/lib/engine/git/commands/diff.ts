import git from 'isomorphic-git';
import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';

export async function diffCommand(args: string[], engine: GitEngine): Promise<CommandResult> {
  const staged = args.includes('--staged') || args.includes('--cached');

  const matrix = await git.statusMatrix({ fs: engine.fs, dir: engine.dir });
  const lines: string[] = [];

  for (const [filepath, head, workdir, stage] of matrix) {
    const hasChange = staged
      ? head !== stage
      : stage !== workdir;

    if (!hasChange) continue;

    lines.push(`diff --git a/${filepath} b/${filepath}`);

    try {
      let oldContent = '';
      let newContent = '';

      if (staged) {
        // Compare HEAD vs staging
        if (head !== 0) {
          const headOid = await git.resolveRef({ fs: engine.fs, dir: engine.dir, ref: 'HEAD' });
          const { blob } = await git.readBlob({
            fs: engine.fs,
            dir: engine.dir,
            oid: headOid,
            filepath,
          });
          oldContent = new TextDecoder().decode(blob);
        }
        if (stage !== 0) {
          newContent = await engine.fs.promises.readFile(`${engine.dir}/${filepath}`, 'utf8') as string;
        }
      } else {
        // Compare staging vs working dir
        if (workdir !== 0) {
          newContent = await engine.fs.promises.readFile(`${engine.dir}/${filepath}`, 'utf8') as string;
        }
        // For unstaged diff, old is the staged version (approximated as working dir content before edit)
        oldContent = '';
      }

      if (head === 0) {
        lines.push('--- /dev/null');
      } else {
        lines.push(`--- a/${filepath}`);
      }
      lines.push(`+++ b/${filepath}`);

      const oldLines = oldContent.split('\n');
      const newLines = newContent.split('\n');

      lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
      for (const l of oldLines) {
        if (l) lines.push(`-${l}`);
      }
      for (const l of newLines) {
        if (l) lines.push(`+${l}`);
      }
    } catch {
      lines.push('(binary file or unreadable)');
    }

    lines.push('');
  }

  if (lines.length === 0) {
    return { output: '', success: true };
  }

  return { output: lines.join('\n'), success: true };
}
