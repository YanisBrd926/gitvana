import git from 'isomorphic-git';
import type { GitEngine } from '../GitEngine.js';
import type { CommandResult } from '../types.js';
import { resolveRef } from '../ref-resolver.js';

export async function bisectCommand(args: string[], engine: GitEngine): Promise<CommandResult> {
  const subcommand = args[0];

  switch (subcommand) {
    case 'start':
      return bisectStart(engine);
    case 'bad':
      return bisectBad(args.slice(1), engine);
    case 'good':
      return bisectGood(args.slice(1), engine);
    case 'reset':
      return bisectReset(engine);
    default:
      return {
        output: 'usage: git bisect <start|bad|good|reset>',
        success: false,
      };
  }
}

async function bisectStart(engine: GitEngine): Promise<CommandResult> {
  // Check if bisect is already in progress
  try {
    await engine.fs.promises.stat(`${engine.dir}/.git/BISECT_START`);
    return { output: 'fatal: a bisect is already in progress. Use "git bisect reset" first.', success: false };
  } catch { /* not in progress, good */ }

  const currentBranch = await git.currentBranch({ fs: engine.fs, dir: engine.dir }) || 'HEAD';
  const headOid = await git.resolveRef({ fs: engine.fs, dir: engine.dir, ref: 'HEAD' });

  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_START`, currentBranch, 'utf8');
  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_ORIG_HEAD`, headOid, 'utf8');
  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_LOG`, 'git bisect start\n', 'utf8');

  // Clear any previous good/bad markers
  try { await engine.fs.promises.unlink(`${engine.dir}/.git/BISECT_BAD`); } catch { /* ignore */ }
  try { await engine.fs.promises.unlink(`${engine.dir}/.git/BISECT_GOOD`); } catch { /* ignore */ }

  return { output: 'Bisect started. Mark commits with "git bisect good" and "git bisect bad".', success: true };
}

async function bisectBad(args: string[], engine: GitEngine): Promise<CommandResult> {
  // Verify bisect is in progress
  try {
    await engine.fs.promises.stat(`${engine.dir}/.git/BISECT_START`);
  } catch {
    return { output: 'fatal: no bisect in progress. Run "git bisect start" first.', success: false };
  }

  let oid: string;
  if (args[0]) {
    try {
      oid = await resolveRef(args[0], engine);
    } catch {
      return { output: `fatal: bad revision '${args[0]}'`, success: false };
    }
  } else {
    oid = await git.resolveRef({ fs: engine.fs, dir: engine.dir, ref: 'HEAD' });
  }

  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_BAD`, oid, 'utf8');
  await appendBisectLog(engine, `git bisect bad ${oid.slice(0, 7)}`);

  // Try to advance bisect if we have both good and bad
  return tryBisectStep(engine);
}

async function bisectGood(args: string[], engine: GitEngine): Promise<CommandResult> {
  // Verify bisect is in progress
  try {
    await engine.fs.promises.stat(`${engine.dir}/.git/BISECT_START`);
  } catch {
    return { output: 'fatal: no bisect in progress. Run "git bisect start" first.', success: false };
  }

  let oid: string;
  if (args[0]) {
    try {
      oid = await resolveRef(args[0], engine);
    } catch {
      return { output: `fatal: bad revision '${args[0]}'`, success: false };
    }
  } else {
    oid = await git.resolveRef({ fs: engine.fs, dir: engine.dir, ref: 'HEAD' });
  }

  // Store good OID (we support multiple good markers via newline-separated)
  let existing = '';
  try {
    existing = await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_GOOD`, 'utf8') as string;
  } catch { /* no existing */ }

  const goods = existing ? existing.trim().split('\n') : [];
  if (!goods.includes(oid)) {
    goods.push(oid);
  }
  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_GOOD`, goods.join('\n'), 'utf8');
  await appendBisectLog(engine, `git bisect good ${oid.slice(0, 7)}`);

  // Try to advance bisect if we have both good and bad
  return tryBisectStep(engine);
}

async function tryBisectStep(engine: GitEngine): Promise<CommandResult> {
  let badOid: string;
  let goodOids: string[];

  try {
    badOid = (await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_BAD`, 'utf8') as string).trim();
    const goodRaw = (await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_GOOD`, 'utf8') as string).trim();
    goodOids = goodRaw.split('\n').filter(Boolean);
  } catch {
    // We don't have both good and bad yet
    return { output: 'Waiting for both "good" and "bad" commits to be marked.', success: true };
  }

  if (!badOid || goodOids.length === 0) {
    return { output: 'Waiting for both "good" and "bad" commits to be marked.', success: true };
  }

  // Get the commit range between good and bad
  // Walk from bad backwards until we reach a good commit
  const allCommits = await git.log({ fs: engine.fs, dir: engine.dir, ref: badOid });
  const goodSet = new Set(goodOids);

  const range: string[] = [];
  for (const c of allCommits) {
    if (goodSet.has(c.oid)) break;
    range.push(c.oid);
  }

  if (range.length <= 1) {
    // We've found the bad commit
    const foundOid = range[0] || badOid;
    const commit = await git.readCommit({ fs: engine.fs, dir: engine.dir, oid: foundOid });
    await appendBisectLog(engine, `# first bad commit: ${foundOid.slice(0, 7)}`);

    return {
      output: `${foundOid.slice(0, 7)} is the first bad commit\ncommit ${foundOid.slice(0, 7)}\nAuthor: ${commit.commit.author.name}\n\n    ${commit.commit.message.trim()}\n\nBisect complete. Use "git bisect reset" to return to your branch.`,
      success: true,
    };
  }

  // Pick the middle commit
  const midIndex = Math.floor(range.length / 2);
  const midOid = range[midIndex];

  // Checkout the middle commit (detached HEAD)
  await git.checkout({ fs: engine.fs, dir: engine.dir, ref: midOid });

  const remaining = range.length - 1; // approximate revisions left
  const steps = Math.ceil(Math.log2(remaining + 1));

  return {
    output: `Bisecting: ${remaining} revision${remaining !== 1 ? 's' : ''} left to test (roughly ${steps} step${steps !== 1 ? 's' : ''})\n[${midOid.slice(0, 7)}] Checked out for testing.`,
    success: true,
  };
}

async function bisectReset(engine: GitEngine): Promise<CommandResult> {
  let originalBranch: string;
  try {
    originalBranch = (await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_START`, 'utf8') as string).trim();
  } catch {
    return { output: 'fatal: no bisect in progress', success: false };
  }

  // Try to restore original HEAD position
  try {
    const origHead = (await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_ORIG_HEAD`, 'utf8') as string).trim();
    await git.writeRef({
      fs: engine.fs,
      dir: engine.dir,
      ref: `refs/heads/${originalBranch}`,
      value: origHead,
      force: true,
    });
  } catch { /* best effort */ }

  // Checkout the original branch
  try {
    await git.checkout({ fs: engine.fs, dir: engine.dir, ref: originalBranch });
  } catch { /* best effort */ }

  // Clean up all bisect state files
  const filesToRemove = [
    `${engine.dir}/.git/BISECT_START`,
    `${engine.dir}/.git/BISECT_ORIG_HEAD`,
    `${engine.dir}/.git/BISECT_BAD`,
    `${engine.dir}/.git/BISECT_GOOD`,
    `${engine.dir}/.git/BISECT_LOG`,
  ];
  for (const f of filesToRemove) {
    try { await engine.fs.promises.unlink(f); } catch { /* ignore */ }
  }

  return { output: `Bisect reset. Returned to branch '${originalBranch}'.`, success: true };
}

async function appendBisectLog(engine: GitEngine, line: string): Promise<void> {
  let existing = '';
  try {
    existing = await engine.fs.promises.readFile(`${engine.dir}/.git/BISECT_LOG`, 'utf8') as string;
  } catch { /* ignore */ }
  await engine.fs.promises.writeFile(`${engine.dir}/.git/BISECT_LOG`, existing + line + '\n', 'utf8');
}
