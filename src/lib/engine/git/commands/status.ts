import git from 'isomorphic-git';
import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';

export async function statusCommand(_args: string[], engine: GitEngine): Promise<CommandResult> {
  const branch = await git.currentBranch({ fs: engine.fs, dir: engine.dir });
  const lines: string[] = [`On branch ${branch || '(no branch)'}`];

  let matrix: [string, number, number, number][];
  try {
    matrix = await git.statusMatrix({ fs: engine.fs, dir: engine.dir });
  } catch {
    // No commits yet — list files manually as untracked
    const entries = await engine.fs.promises.readdir(engine.dir) as string[];
    const untracked = entries.filter((e: string) => e !== '.git');
    if (untracked.length > 0) {
      lines.push('');
      lines.push('No commits yet');
      lines.push('');
      lines.push('Untracked files:');
      lines.push('  (use "git add <file>..." to include in what will be committed)');
      for (const f of untracked) {
        lines.push(`\t${f}`);
      }
    } else {
      lines.push('');
      lines.push('No commits yet');
      lines.push('');
      lines.push('nothing to commit (create/copy files and use "git add" to track)');
    }
    return { output: lines.join('\n'), success: true };
  }

  const staged: string[] = [];
  const unstaged: string[] = [];
  const untracked: string[] = [];

  for (const [filepath, head, workdir, stage] of matrix) {
    if (head === 0 && workdir === 2 && stage === 0) {
      untracked.push(filepath);
    } else if (head === 0 && workdir === 2 && stage === 2) {
      staged.push(`\tnew file:   ${filepath}`);
    } else if (head === 1 && workdir === 2 && stage === 2) {
      staged.push(`\tmodified:   ${filepath}`);
    } else if (head === 1 && workdir === 2 && stage === 1) {
      unstaged.push(`\tmodified:   ${filepath}`);
    } else if (head === 1 && workdir === 0 && stage === 0) {
      staged.push(`\tdeleted:    ${filepath}`);
    } else if (head === 1 && workdir === 0 && stage === 1) {
      unstaged.push(`\tdeleted:    ${filepath}`);
    }
  }

  if (staged.length > 0) {
    lines.push('');
    lines.push('Changes to be committed:');
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    lines.push(...staged);
  }

  if (unstaged.length > 0) {
    lines.push('');
    lines.push('Changes not staged for commit:');
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push(...unstaged);
  }

  if (untracked.length > 0) {
    lines.push('');
    lines.push('Untracked files:');
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    for (const f of untracked) {
      lines.push(`\t${f}`);
    }
  }

  if (staged.length === 0 && unstaged.length === 0 && untracked.length === 0) {
    lines.push('');
    lines.push('nothing to commit, working tree clean');
  }

  return { output: lines.join('\n'), success: true };
}
