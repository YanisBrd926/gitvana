export interface Stage {
  id: number;
  name: string;
  minLevels: number;
  color: string;
  glowColor: string;
  description: string;
}

export const stages: Stage[] = [
  { id: 1,  name: 'Lost',          minLevels: 0,  color: '#5f574f', glowColor: '#7a7268', description: 'You just arrived at the monastery. You smell like git blame.' },
  { id: 2,  name: 'Curious',       minLevels: 1,  color: '#6a5a7e', glowColor: '#8a7a9e', description: 'You made your first commit. The monks noticed.' },
  { id: 3,  name: 'Wanderer',      minLevels: 2,  color: '#7a5a8e', glowColor: '#9a7aae', description: 'A faint path appears. Try not to git lost.' },
  { id: 4,  name: 'Seeker',        minLevels: 3,  color: '#7a5a9e', glowColor: '#9a7abe', description: 'You can see the mountain. It looks... steep.' },
  { id: 5,  name: 'Initiate',      minLevels: 4,  color: '#7a5aae', glowColor: '#9a7ace', description: 'The Head Monk gave you a robe. It\'s itchy.' },
  { id: 6,  name: 'Student',       minLevels: 5,  color: '#29506e', glowColor: '#3a7a9e', description: 'You know what staging means. Most people never get here.' },
  { id: 7,  name: 'Apprentice',    minLevels: 7,  color: '#29607e', glowColor: '#3a8aae', description: 'Climbing through the forest of branches.' },
  { id: 8,  name: 'Practitioner',  minLevels: 9,  color: '#295a8e', glowColor: '#3a7abe', description: 'Above the treeline. You can see the merge conflicts from here.' },
  { id: 9,  name: 'Adept',         minLevels: 11, color: '#2a6a5e', glowColor: '#3a9a7e', description: 'The air thins. Your commits are getting cleaner.' },
  { id: 10, name: 'Artisan',       minLevels: 13, color: '#3a7a5e', glowColor: '#4aaa7e', description: 'You craft commits like a monk crafts silence.' },
  { id: 11, name: 'Journeyman',    minLevels: 15, color: '#4a8a4e', glowColor: '#5aba6e', description: 'Halfway up. The clouds are below you now.' },
  { id: 12, name: 'Specialist',    minLevels: 17, color: '#6a8a3e', glowColor: '#8aba5e', description: 'The path narrows. You don\'t even flinch.' },
  { id: 13, name: 'Expert',        minLevels: 19, color: '#8a8a2e', glowColor: '#baba4e', description: 'Other monks ask you for directions. Terrifying.' },
  { id: 14, name: 'Mentor',        minLevels: 22, color: '#aa7a2e', glowColor: '#daa04e', description: 'You see patterns in the chaos of merge conflicts.' },
  { id: 15, name: 'Sage',          minLevels: 25, color: '#ba6a2e', glowColor: '#ea8a4e', description: 'The mountain hums. Or maybe that\'s the CI pipeline.' },
  { id: 16, name: 'Oracle',        minLevels: 28, color: '#ca5a2e', glowColor: '#fa7a4e', description: 'You sense conflicts before they arise. Spooky.' },
  { id: 17, name: 'Mystic',        minLevels: 30, color: '#da4a3e', glowColor: '#fa6a5e', description: 'The commit graph speaks to you. You speak back.' },
  { id: 18, name: 'Transcendent',  minLevels: 32, color: '#ea4a5e', glowColor: '#fa6a7e', description: 'You interactive rebase without fear. Legend.' },
  { id: 19, name: 'Awakened',      minLevels: 34, color: '#fa5a8e', glowColor: '#fa7aae', description: 'The peak is within reach. Don\'t look down at your git log.' },
  { id: 20, name: 'Enlightened',   minLevels: 35, color: '#ffa300', glowColor: '#ffcc00', description: 'Pure radiance. You ARE the repo. Gitvana achieved.' },
];

export const TOTAL_LEVELS = 35;

export function getStage(completedLevels: number): Stage {
  let current = stages[0];
  for (const stage of stages) {
    if (completedLevels >= stage.minLevels) {
      current = stage;
    } else {
      break;
    }
  }
  return current;
}

export function getNextStage(completedLevels: number): Stage | null {
  for (const stage of stages) {
    if (completedLevels < stage.minLevels) {
      return stage;
    }
  }
  return null;
}
