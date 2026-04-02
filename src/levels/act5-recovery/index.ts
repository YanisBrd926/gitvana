import type { LevelDefinition } from '../schema.js';
import level25 from './25-surgical.json';
import level26 from './26-orphan.json';
import level27 from './27-dependency.json';
import level28 from './28-patch.json';
import level29 from './29-time-travel.json';
import level30 from './30-boss.json';

export const act5Levels: LevelDefinition[] = [
  level25 as LevelDefinition,
  level26 as LevelDefinition,
  level27 as LevelDefinition,
  level28 as LevelDefinition,
  level29 as LevelDefinition,
  level30 as LevelDefinition,
];

export const act5Meta = {
  id: 5,
  title: 'Advanced Techniques',
  subtitle: 'Power user workflows',
  description: 'Master advanced Git workflows: surgical staging, orphan branches, dependency chains, patches, time travel, and the open source gauntlet.',
};
