import type { LevelDefinition } from '../schema.js';
import level01 from './01-spark.json';
import level02 from './02-ledger.json';
import level03 from './03-tea-leaves.json';
import level04 from './04-undo.json';
import level05 from './05-branching.json';
import level06 from './06-boss.json';

export const act1Levels: LevelDefinition[] = [
  level01 as LevelDefinition,
  level02 as LevelDefinition,
  level03 as LevelDefinition,
  level04 as LevelDefinition,
  level05 as LevelDefinition,
  level06 as LevelDefinition,
];

export const act1Meta = {
  id: 1,
  title: 'Awakening',
  subtitle: 'Git fundamentals',
  description: 'Learn the fundamental building blocks of Git: initializing repos, staging selectively, navigating history, undoing mistakes, branching, and surviving your first merge conflict.',
};
