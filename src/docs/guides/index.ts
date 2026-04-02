import type { GuideDoc } from '../types.js';

export const guides: Record<string, GuideDoc> = {
  'how-git-stores-data': {
    id: 'how-git-stores-data',
    title: 'How Git Actually Works',
    category: 'fundamentals',
    order: 1,
    relatedCommands: ['init', 'log', 'show'],
    content: `## The Content-Addressable Filesystem

At its core, git is not a "version control system" in the way most people imagine. It is a content-addressable filesystem with a version control interface built on top. Understanding this changes everything about how you think about git.

Every piece of data git stores -- every file, every directory listing, every commit -- is identified by a SHA-1 hash of its contents. This means identical content always produces the same hash. Two files with the same bytes are stored as a single object. Rename a file and git doesn't store a "rename event" -- it stores the same blob under a new tree entry.

## The Three Object Types

Git has three core object types:

**Blobs** store file contents. Not filenames, not permissions -- just raw bytes. A blob's hash is computed purely from its content. If two files across your entire repository have identical content, they share one blob.

**Trees** map names to blobs (and other trees). A tree is essentially a directory listing: it says "README.md points to blob abc123, src/ points to tree def456." Trees give structure to the flat world of blobs.

**Commits** point to a tree (the root snapshot) and to parent commit(s). They also store the author, committer, timestamp, and message. The commit hash is computed from ALL of this -- change any detail and you get a different hash.

## The .git Directory

When you run \`git init\`, a \`.git\` directory is created with this structure:

\`\`\`
.git/
  objects/    # all blobs, trees, and commits
  refs/       # branch and tag pointers
  HEAD        # pointer to the current branch
  index       # the staging area
\`\`\`

Everything git knows lives here. Delete this directory and you lose all history. The files in your working directory are just the "checked out" version of one particular commit's tree.

## The Directed Acyclic Graph

Commits form a DAG (directed acyclic graph). Each commit points backward to its parent(s), creating chains of history. A merge commit has two parents. The root commit has none. You can never create a cycle because each commit's hash includes its parents -- you'd need to know the hash before computing it.

This structure is why git operations feel "backward" -- history flows from child to parent, from present to past. When you "walk the log," you're traversing this graph from HEAD backward through parent pointers.

### Why This Matters

Understanding the object model explains everything: why you can't edit a commit (you'd change the hash), why branches are cheap (they're just pointers), why identical files don't waste space (same hash, same blob), and why git is so fast at diffing (it compares hashes before reading content).`,
  },

  'the-three-areas': {
    id: 'the-three-areas',
    title: 'Working Directory, Staging Area, Repository',
    category: 'fundamentals',
    order: 2,
    relatedCommands: ['add', 'commit', 'status', 'diff', 'reset'],
    content: `## The Three Areas of Git

Every git repository has three distinct areas where your files live. Mastering git is largely about understanding how data moves between them.

## Working Directory

This is your actual filesystem -- the files you see and edit. When you open a file in your editor, you're looking at the working directory copy. Git doesn't automatically know or care about changes here until you explicitly tell it.

The working directory is "checked out" from a specific commit. When you switch branches, git replaces the files in your working directory with the snapshot from that branch's latest commit.

## Staging Area (The Index)

The staging area -- also called the "index" -- is the most misunderstood part of git. It is a snapshot you are actively preparing for the next commit.

Here's the critical insight: \`git add\` does not "track" a file. It copies the exact current contents of that file into the staging area. If you modify the file after running \`git add\`, the staging area still has the OLD version. You must \`git add\` again to update it.

\`\`\`
echo "v1" > file.txt
git add file.txt        # staging area has "v1"
echo "v2" > file.txt   # working dir has "v2"
git commit              # commits "v1", NOT "v2"
\`\`\`

This is a feature, not a bug. It lets you commit exactly what you want, even a subset of your current changes.

## Repository (.git)

The repository is the permanent history of snapshots stored in \`.git/objects\`. When you run \`git commit\`, the staging area's contents become a new commit object, linked to the previous commit as its parent.

Once committed, data is extremely safe. Even "destructive" operations like \`reset --hard\` don't delete commit objects immediately -- they become unreachable but persist for weeks in the object store.

## How git status Shows the Differences

\`git status\` compares these three areas pairwise:

- **"Changes to be committed"** = differences between the staging area and the last commit (HEAD). This is what \`git diff --staged\` shows.
- **"Changes not staged for commit"** = differences between the working directory and the staging area. This is what \`git diff\` (with no flags) shows.
- **"Untracked files"** = files in the working directory that don't exist in the staging area at all.

### The Mental Model

Think of it as an assembly line: you edit files (working directory), select what to include (\`git add\` to staging), then package it permanently (\`git commit\` to repository). Each step is deliberate. This three-phase design is what makes git's commits so much cleaner than systems that auto-commit everything.`,
  },

  'what-is-a-commit': {
    id: 'what-is-a-commit',
    title: 'Anatomy of a Commit',
    category: 'fundamentals',
    order: 3,
    relatedCommands: ['commit', 'log', 'show', 'diff'],
    content: `## What Is a Commit?

A commit is not a diff. It is not a "set of changes." A commit is a complete snapshot of your entire repository at a point in time, plus metadata about who created it and why.

## The Five Parts of a Commit

Every commit contains exactly these components:

**1. Tree** -- A pointer to a tree object representing the root directory. This tree recursively contains all files and subdirectories as they existed at the moment of the commit. It is a full snapshot, not a delta.

**2. Parent(s)** -- A pointer to the previous commit(s). A normal commit has one parent. A merge commit has two (or more). The very first commit in a repository -- the root commit -- has no parent at all.

**3. Author** -- The person who wrote the change, with their name, email, and timestamp. In most cases this is you.

**4. Committer** -- The person who applied the change. Usually identical to the author, but differs when someone cherry-picks or rebases your work -- the author stays the same, the committer becomes whoever performed the operation.

**5. Message** -- The human-readable description of why this change was made.

## The SHA-1 Hash

The commit's hash is computed from ALL of these fields: the tree hash, parent hash(es), author info, committer info, and message. Change any single byte -- a different timestamp, a typo fix in the message, a different parent -- and the hash changes completely.

This is why you cannot "edit" a commit. When you run \`git commit --amend\`, git doesn't modify the old commit. It creates an entirely new commit (with a new hash) and moves the branch pointer to it. The old commit still exists in the object store until garbage collection removes it.

\`\`\`
git log --oneline
# a1b2c3d Fix login bug       <-- this commit
# e4f5g6h Add user model      <-- parent of a1b2c3d
\`\`\`

Commit \`a1b2c3d\` contains a pointer to \`e4f5g6h\` as its parent. Together they form a chain. This chain IS your history.

## Parent Pointers Form History

Since each commit points to its parent, commits form a chain stretching back to the root. When you run \`git log\`, git starts at HEAD and follows parent pointers backward. Merge commits -- with two parents -- create a fork in this chain, which is why \`git log --graph\` shows branch-and-merge patterns.

### Snapshots, Not Diffs

Git stores full snapshots but displays diffs. When you see a diff in \`git show\` or \`git log -p\`, git is computing it on the fly by comparing the commit's tree to its parent's tree. This is an important distinction: the storage model (snapshots) differs from the display model (diffs). Git can compute a diff between ANY two commits because every commit has a complete tree.`,
  },

  'refs-and-head': {
    id: 'refs-and-head',
    title: 'Branches, Tags, and HEAD',
    category: 'fundamentals',
    order: 4,
    relatedCommands: ['branch', 'checkout', 'switch', 'tag', 'log'],
    content: `## What Is a Branch, Really?

A branch is a 41-byte text file containing a SHA-1 hash. That's it. There is no "branch object" in git's data model -- a branch is a pointer to a commit stored in \`.git/refs/heads/\`.

\`\`\`
cat .git/refs/heads/main
# e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3
\`\`\`

This is why creating a branch in git is nearly instant and costs almost nothing. It's writing 41 bytes to a file. Compare this to systems that copy entire directory trees.

## How Branches Move

When you make a new commit, git does two things: creates the commit object and moves the current branch pointer forward to the new commit. Nothing else changes. No other branches move. The branch pointer simply gets overwritten with the new commit's hash.

\`\`\`
Before commit:
  main -> commit A

After commit:
  main -> commit B -> commit A
\`\`\`

This is the entire mechanism of "being on a branch." Your branch pointer advances with each commit.

## HEAD: Where Am I?

HEAD is a special pointer that answers the question "where am I right now?" Usually, HEAD is a symbolic reference -- it points to a branch name, not directly to a commit.

\`\`\`
cat .git/HEAD
# ref: refs/heads/main
\`\`\`

This means "I am on the main branch." When you commit, git follows HEAD to find which branch to advance.

## Detached HEAD

When you checkout a specific commit (not a branch), HEAD points directly to a commit hash instead of a branch name:

\`\`\`
git checkout abc1234
cat .git/HEAD
# abc1234def5678...
\`\`\`

In detached HEAD state, you can look around and make experimental commits. But those commits won't belong to any branch. If you switch away without creating a branch, they become unreachable -- they'll exist in the object store temporarily but will eventually be garbage collected.

The fix is simple: create a branch before switching away.

\`\`\`
git checkout -b my-experiment
\`\`\`

Now HEAD points to \`my-experiment\`, which points to your commit. Safe.

## Tags: Branches That Don't Move

A lightweight tag is identical in structure to a branch -- it's a file in \`.git/refs/tags/\` containing a commit hash. The difference is behavioral: tags never move. When you commit, no tag pointer advances.

Annotated tags are actual git objects (like blobs, trees, and commits). They store the tagger's name, email, date, and a message, plus a pointer to the tagged commit. Use annotated tags for releases and lightweight tags for personal bookmarks.

\`\`\`
git tag v1.0              # lightweight: just a pointer
git tag -a v2.0 -m "msg"  # annotated: a full object
\`\`\`

### The Key Insight

Branches, tags, and HEAD are all just pointers to commits. The entire "branch structure" of a repository exists only in these tiny pointer files. The commits themselves know nothing about branches -- they just know their parents. This is why you can delete a branch without losing any commits (as long as another branch or tag still points to them or their descendants).`,
  },

  'merge-vs-rebase': {
    id: 'merge-vs-rebase',
    title: 'Merge vs Rebase: When and Why',
    category: 'branching',
    order: 1,
    relatedCommands: ['merge', 'rebase', 'branch', 'log'],
    content: `## Two Ways to Integrate Changes

When your feature branch has diverged from the main branch, you need to integrate the changes. Git gives you two fundamental strategies: merge and rebase. They produce different history shapes and have different tradeoffs.

## Merge: Preserve History As It Happened

\`git merge feature\` creates a new commit with two parents -- one from each branch. This "merge commit" ties the two histories together.

\`\`\`
Before:
  main:    A - B - C
  feature:     \\ D - E

After git merge feature (on main):
  main:    A - B - C - F (merge commit)
  feature:     \\ D - E /
\`\`\`

The merge commit F has two parents: C and E. The full branching history is preserved -- you can see exactly when the branch was created, what happened on each side, and when they were joined.

**Pros:** Truthful history. Safe -- never rewrites commits. Easy to understand what happened and when.

**Cons:** History gets cluttered with merge commits, especially in active repositories. \`git log --oneline\` becomes a maze.

## Rebase: Rewrite History to Be Linear

\`git rebase main\` (run from the feature branch) takes your feature commits and replays them one by one on top of main's latest commit. Each replayed commit gets a NEW hash because its parent changed.

\`\`\`
Before:
  main:    A - B - C
  feature:     \\ D - E

After git rebase main (on feature):
  main:    A - B - C
  feature:             \\ D' - E'
\`\`\`

D' and E' have the same diffs as D and E, but they're new commits with new hashes and a new parent (C instead of B). The original D and E still exist but become unreachable.

**Pros:** Clean, linear history. Easy to read with \`git log --oneline\`. Bisect works more cleanly on linear history.

**Cons:** Rewrites commit hashes. Dangerous if the original commits were shared.

## The Golden Rule

**Never rebase commits that have been pushed to a shared branch.**

When you rebase, you create new commits that replace old ones. If someone else has based work on the old commits, their history and yours diverge. Merging becomes a nightmare of duplicate commits and confusing conflicts.

Rebase is for YOUR local, unpublished work. Once commits are shared, use merge.

## The Practical Workflow

The most common professional pattern:

1. Create a feature branch from main
2. Work on the feature, making commits
3. Before merging back, rebase onto latest main: \`git rebase main\`
4. This puts your commits cleanly on top, as if you just started
5. Merge the feature into main (now a fast-forward since it's linear)

This gives you the best of both worlds: clean linear history without lying about what happened on shared branches.

### When to Use Which

- **Merge** when integrating a long-running shared branch, when you want an explicit record that a branch existed, or when in doubt.
- **Rebase** when cleaning up your own local work before sharing, when you want a linear history, or when preparing a pull request.`,
  },

  'conflict-resolution': {
    id: 'conflict-resolution',
    title: 'Understanding and Resolving Conflicts',
    category: 'branching',
    order: 2,
    relatedCommands: ['merge', 'rebase', 'add', 'status'],
    content: `## Why Conflicts Happen

A merge conflict occurs when two branches have changed the same lines of the same file. Git can automatically merge changes that are in different files, or even different parts of the same file. But when two branches modify the same line, git cannot decide which version is correct -- that requires human judgment.

Conflicts are normal. They are not errors. They simply mean two people (or two branches of work) touched the same spot.

## The Conflict Markers

When git encounters a conflict during merge or rebase, it writes both versions into the file with special markers:

\`\`\`
function getGreeting() {
<<<<<<< HEAD
  return "Hello, world!";
=======
  return "Greetings, traveler!";
>>>>>>> feature-branch
}
\`\`\`

**\`<<<<<<< HEAD\`** marks the start of YOUR version (the branch you're merging INTO).

**\`=======\`** divides the two versions.

**\`>>>>>>> feature-branch\`** marks the end of THEIR version (the branch being merged).

Everything between \`<<<<<<<\` and \`=======\` is your code. Everything between \`=======\` and \`>>>>>>>\` is theirs.

## Resolution Strategies

You have several options when resolving a conflict:

**Take yours:** Delete their version and the markers, keeping your code.

**Take theirs:** Delete your version and the markers, keeping their code.

**Combine both:** Merge the two versions into something that incorporates both changes.

**Write something new:** Sometimes neither version is correct in light of the other changes. Write a new version that accounts for both.

The key: when you're done, the file should contain no conflict markers. It should be valid, correct code.

## The Resolution Workflow

\`\`\`
git merge feature          # conflict detected!
git status                 # shows conflicted files
# ... edit each conflicted file, remove markers ...
git add resolved-file.txt  # mark as resolved
git commit                 # complete the merge
\`\`\`

\`git add\` after conflict resolution doesn't mean "track this file" -- it means "I've resolved this file, it's ready." This is the staging area at work: you're preparing the resolved version for the merge commit.

## Aborting a Merge

If a merge gets too messy and you want to start over:

\`\`\`
git merge --abort
\`\`\`

This restores your branch to the state before you started the merge. No harm done. You can also abort a rebase with \`git rebase --abort\`.

## Reducing Conflicts

- Merge or rebase from main frequently so your branch doesn't diverge too far
- Keep branches short-lived and focused on one feature
- Communicate with your team about who's working on which files
- Smaller, more frequent commits make conflicts easier to understand

### During Rebase

When rebasing, conflicts can appear at each commit being replayed. You resolve them one at a time: fix the conflict, \`git add\` the file, then \`git rebase --continue\` to move to the next commit. This can be tedious for long branches with many conflicts -- which is another reason to keep branches short.`,
  },

  'rewriting-history': {
    id: 'rewriting-history',
    title: 'Rewriting History Safely',
    category: 'advanced',
    order: 1,
    relatedCommands: ['commit', 'reset', 'rebase', 'cherry-pick'],
    content: `## Why Rewrite History?

History rewriting lets you clean up your work before sharing it. Fix typos in commit messages, combine small "WIP" commits into logical units, or remove a file you shouldn't have committed. The goal is to present a clear, intentional history to your collaborators.

The cardinal rule: **never rewrite commits that have been pushed to a shared branch.** Rewriting changes commit hashes, which causes divergence for anyone who has the original commits.

## commit --amend

The simplest form of rewriting. It replaces the most recent commit with a new one.

\`\`\`
# Fix the commit message
git commit --amend -m "Better message"

# Add a forgotten file to the last commit
git add forgotten-file.ts
git commit --amend --no-edit
\`\`\`

Under the hood, \`--amend\` creates an entirely new commit with the same parent as the old one. The old commit still exists in the object store (reachable via the reflog) but the branch pointer moves to the new commit.

## reset: The Three Flavors

\`git reset\` moves the branch pointer backward, effectively "undoing" commits. The three modes control what happens to the undone changes:

**\`--soft HEAD~N\`** -- Moves the branch pointer back N commits. The changes from those commits remain staged. Use this to squash several commits into one: reset soft, then recommit.

\`\`\`
git reset --soft HEAD~3
git commit -m "Combined three commits into one"
\`\`\`

**\`--mixed HEAD~N\`** (default) -- Moves the branch pointer back and unstages the changes. The files still have the modifications, they're just not staged. Use this when you want to re-organize what goes into which commit.

**\`--hard HEAD~N\`** -- Moves the branch pointer back and discards all changes. The working directory is restored to the target commit's state. This is destructive -- uncommitted work is lost (though committed work can be recovered via the reflog).

## Rebase for Rewriting a Series

While \`reset\` lets you squash or redo recent commits, \`rebase\` can rewrite a sequence of commits further back. Interactive rebase (\`git rebase -i\`) lets you reorder, squash, edit, or drop commits in a range. It's the most powerful history editing tool in git.

Common interactive rebase operations:
- **squash**: combine a commit with the one before it
- **reword**: change a commit message
- **edit**: pause to modify the commit's contents
- **drop**: remove a commit entirely

## cherry-pick: Copy a Specific Commit

\`git cherry-pick <hash>\` takes a single commit from anywhere in the repository and replays its diff onto your current branch, creating a new commit. It's useful for grabbing a specific bugfix from another branch without merging the whole branch.

\`\`\`
git cherry-pick abc1234
\`\`\`

The new commit has the same diff but a different hash (different parent, possibly different timestamp).

### Safety Checklist

Before rewriting: Is it pushed? Don't rewrite. Is it local only? Rewrite freely. Not sure? Run \`git log --oneline origin/main..HEAD\` -- if the commits show up, they're local only and safe to rewrite.`,
  },

  'the-reflog': {
    id: 'the-reflog',
    title: "Git's Safety Net: The Reflog",
    category: 'advanced',
    order: 2,
    relatedCommands: ['reflog', 'reset', 'checkout', 'log'],
    content: `## What Is the Reflog?

The reflog (reference log) records every time HEAD moves. Every commit, checkout, reset, merge, rebase, and cherry-pick creates an entry. It's a chronological diary of your actions in the repository -- not what happened to the code, but what YOU did.

\`\`\`
git reflog
# a1b2c3d HEAD@{0}: commit: Add user auth
# e4f5a6b HEAD@{1}: checkout: moving from feature to main
# c7d8e9f HEAD@{2}: commit: WIP save
# b0a1c2d HEAD@{3}: reset: moving to HEAD~2
\`\`\`

Each entry shows: the commit hash, a positional reference (\`HEAD@{N}\`), the action that caused the move, and a description.

## Why the Reflog Matters

The reflog is your safety net. Even after operations that seem destructive -- \`reset --hard\`, deleting a branch, a botched rebase -- the commits still exist in the object store. The reflog remembers where they are.

This is the fundamental truth of git: **you almost cannot lose committed work.** Uncommitted changes in your working directory, yes -- those can be lost. But once you've committed, the data persists for at least 30 days (the default reflog expiration) regardless of what you do to branches and HEAD.

## The Recovery Pattern

The standard "oh no" recovery workflow:

\`\`\`
# Step 1: See where you've been
git reflog

# Step 2: Find the hash of the state you want
# (look for the entry just before the mistake)

# Step 3: Create a branch there or reset to it
git branch rescue abc1234
# or
git reset --hard abc1234
\`\`\`

### Common Recovery Scenarios

**Accidental \`reset --hard\`:**
\`\`\`
git reflog
# Find the commit before the reset
git reset --hard HEAD@{1}
\`\`\`

**Deleted a branch with unmerged work:**
\`\`\`
git reflog
# Find the last commit on that branch
git branch recovered-branch abc1234
\`\`\`

**Botched rebase:**
\`\`\`
git reflog
# Find the entry "rebase (start)" -- the entry before it is your pre-rebase state
git reset --hard HEAD@{N}
\`\`\`

## HEAD@{N} Syntax

\`HEAD@{N}\` means "the Nth previous position of HEAD." You can use these references anywhere git expects a commit:

\`\`\`
git show HEAD@{3}       # show the commit from 3 moves ago
git diff HEAD@{5} HEAD  # diff between then and now
git checkout HEAD@{2}   # go back to where you were 2 moves ago
\`\`\`

## Expiration

Reflog entries expire after 90 days by default (30 days for unreachable commits). After expiration, \`git gc\` (garbage collection) may remove the unreachable objects. In practice, you have plenty of time -- reflog recovery is for recent mistakes, not archaeology.

### The Takeaway

The reflog transforms git from "a tool where mistakes are catastrophic" into "a tool where mistakes are inconvenient at worst." Commit your work frequently, even WIP saves, and the reflog ensures you can always get back to any state you've been in.`,
  },

  'bisect-debugging': {
    id: 'bisect-debugging',
    title: 'Finding Bugs with Binary Search',
    category: 'advanced',
    order: 3,
    relatedCommands: ['bisect', 'log', 'checkout', 'show'],
    content: `## The Problem

A bug exists in your codebase. It wasn't there last week. Somewhere in the last 500 commits, something broke. Checking each commit sequentially would take 500 steps. Binary search takes about 9.

## How git bisect Works

\`git bisect\` performs a binary search through your commit history. You tell it one commit that's "bad" (has the bug) and one that's "good" (doesn't have the bug). Git checks out the midpoint and asks you to test. Based on your answer, it eliminates half the remaining commits and picks a new midpoint.

The math: log2(N) steps. 1000 commits? About 10 steps. 10,000 commits? About 14.

## The Basic Workflow

\`\`\`
# Start bisecting
git bisect start

# Mark the current commit as bad (it has the bug)
git bisect bad

# Mark a known-good commit (before the bug existed)
git bisect good v1.2.0
# or: git bisect good HEAD~50

# Git checks out the midpoint. Test your code.
# If the bug is present:
git bisect bad

# If the bug is NOT present:
git bisect good

# Repeat until git identifies the exact commit.
# When done:
git bisect reset
\`\`\`

After each \`good\` or \`bad\` answer, git tells you how many revisions are left to test and checks out the next midpoint. Eventually, it prints the first bad commit -- the one that introduced the bug.

## Reading the Output

\`\`\`
Bisecting: 64 revisions left to test after this (roughly 6 steps)
[abc1234] Refactor auth middleware
\`\`\`

Git is telling you: "I checked out commit abc1234. Test it. Tell me good or bad. About 6 steps remain."

## Automated Bisect

If you have a script that can detect the bug (a test case, a build check, any command that exits 0 for good and non-zero for bad), you can automate the entire process:

\`\`\`
git bisect start
git bisect bad HEAD
git bisect good v1.0
git bisect run npm test
\`\`\`

Git will run \`npm test\` at each midpoint and classify commits automatically. You walk away and come back to the answer. This is remarkably powerful for regressions caught by existing test suites.

## Important Notes

- \`git bisect reset\` returns you to where you were before bisecting. Always run it when done.
- During bisect, you're in a detached HEAD state. Don't make commits meant to stay -- they'll be orphaned when you reset.
- If a midpoint commit can't be tested (won't compile, unrelated breakage), use \`git bisect skip\` to skip it. Git will pick a nearby commit instead.
- Bisect works on ANY property, not just bugs. "When did performance degrade?" "When did the binary size increase?" Any yes/no question about a commit.

### Why This Matters

Bisect turns an impossible debugging task into a methodical, bounded process. Instead of reading 500 diffs and guessing, you run a test 9 times and get a definitive answer. It's one of git's most underappreciated features, and in a large repository, it can save hours of detective work.`,
  },
};
