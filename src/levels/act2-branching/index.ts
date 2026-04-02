import type { LevelDefinition } from '../schema.js';
import level07 from './07-detached.json';
import level08 from './08-tags.json';
import level09 from './09-cherry-pick.json';
import level10 from './10-revert.json';
import level11 from './11-stash.json';
import level12 from './12-boss.json';

export const act2Levels: LevelDefinition[] = [
  level07 as LevelDefinition,
  level08 as LevelDefinition,
  level09 as LevelDefinition,
  level10 as LevelDefinition,
  level11 as LevelDefinition,
  level12 as LevelDefinition,
];

export const act2Meta = {
  id: 2,
  title: 'The Middle Path',
  subtitle: 'Real workflows',
  description: 'Master real-world Git workflows: detached HEAD recovery, tagging releases, cherry-picking commits, reverting published changes, stashing work, and triaging a messy repository.',
};
