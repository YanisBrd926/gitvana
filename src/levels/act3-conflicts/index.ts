import type { LevelDefinition } from '../schema.js';
import level13 from './13-amend.json';
import level14 from './14-squash.json';
import level15 from './15-rebase.json';
import level16 from './16-rebase-conflict.json';
import level17 from './17-secret-purge.json';
import level18 from './18-boss.json';

export const act3Levels: LevelDefinition[] = [
  level13 as LevelDefinition,
  level14 as LevelDefinition,
  level15 as LevelDefinition,
  level16 as LevelDefinition,
  level17 as LevelDefinition,
  level18 as LevelDefinition,
];

export const act3Meta = {
  id: 3,
  title: 'Rewriting Reality',
  subtitle: 'History manipulation',
  description: 'Master the art of rewriting Git history: amending commits, squashing, rebasing, resolving rebase conflicts, purging secrets, and performing full branch cleanup.',
};
