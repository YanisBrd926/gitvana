import git from 'isomorphic-git';
import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';

export async function rmCommand(args: string[], engine: GitEngine): Promise<CommandResult> {
  const cachedOnly = args.includes('--cached');
  const recursive = args.includes('-r') || args.includes('-R') || args.includes('--recursive');

  // Filter out flags to get file paths
  const paths = args.filter((a) => a !== '--cached' && a !== '-r' && a !== '-R' && a !== '--recursive');

  if (paths.length === 0) {
    return {
      output: 'fatal: No pathspec was given. Which files should I remove?',
      success: false,
    };
  }

  const removed: string[] = [];

  for (const filepath of paths) {
    try {
      const stat = await engine.fs.promises.stat(`${engine.dir}/${filepath}`);
      const isDir = stat.isDirectory();

      if (isDir && !recursive) {
        return {
          output: `fatal: not removing '${filepath}' recursively without -r`,
          success: false,
        };
      }

      if (isDir) {
        // Recursively collect all files in the directory
        const files = await collectFiles(engine, `${engine.dir}/${filepath}`, filepath);
        for (const file of files) {
          await removeFile(engine, file, cachedOnly);
          removed.push(file);
        }
      } else {
        await removeFile(engine, filepath, cachedOnly);
        removed.push(filepath);
      }
    } catch {
      // File doesn't exist on disk — try removing from index only
      try {
        await git.remove({ fs: engine.fs, dir: engine.dir, filepath });
        removed.push(filepath);
      } catch {
        return {
          output: `fatal: pathspec '${filepath}' did not match any files`,
          success: false,
        };
      }
    }
  }

  const output = removed.map((f) => `rm '${f}'`).join('\n');
  return { output, success: true };
}

async function removeFile(engine: GitEngine, filepath: string, cachedOnly: boolean): Promise<void> {
  // Remove from the git index
  await git.remove({ fs: engine.fs, dir: engine.dir, filepath });

  // Remove from the working directory unless --cached
  if (!cachedOnly) {
    try {
      await engine.fs.promises.unlink(`${engine.dir}/${filepath}`);
    } catch {
      // File may already be absent from disk — that's fine
    }
  }
}

async function collectFiles(engine: GitEngine, absPath: string, relPath: string): Promise<string[]> {
  const entries = await engine.fs.promises.readdir(absPath) as string[];
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = `${absPath}/${entry}`;
    const rel = `${relPath}/${entry}`;
    const stat = await engine.fs.promises.stat(fullPath);

    if (stat.isDirectory()) {
      const nested = await collectFiles(engine, fullPath, rel);
      files.push(...nested);
    } else {
      files.push(rel);
    }
  }

  return files;
}
