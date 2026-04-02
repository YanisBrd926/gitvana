import type { LevelDefinition } from '../schema.js';
import level19 from './19-reflog.json';
import level20 from './20-force-push.json';
import level21 from './21-blame.json';
import level22 from './22-bisect.json';
import level23 from './23-diff-detective.json';
import level24 from './24-boss.json';

export const act4Levels: LevelDefinition[] = [
  level19 as LevelDefinition,
  level20 as LevelDefinition,
  level21 as LevelDefinition,
  level22 as LevelDefinition,
  level23 as LevelDefinition,
  level24 as LevelDefinition,
];

export const act4Meta = {
  id: 4,
  title: 'The Safety Net',
  subtitle: 'Recovery and investigation',
  description: 'Learn to recover from disasters and investigate bugs: reflog recovery, force-push survival, git blame, bisect debugging, diff comparison, and full cold-case investigations.',
};
