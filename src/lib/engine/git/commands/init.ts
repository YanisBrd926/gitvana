import git from 'isomorphic-git';
import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';

export async function initCommand(_args: string[], engine: GitEngine): Promise<CommandResult> {
  await git.init({ fs: engine.fs, dir: engine.dir, defaultBranch: 'main' });
  return {
    output: `Initialized empty Git repository in ${engine.dir}/.git/`,
    success: true,
  };
}
