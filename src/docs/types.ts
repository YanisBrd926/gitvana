export interface CommandDoc {
  name: string;
  syntax: string;
  description: string;
  options: { flag: string; description: string }[];
  examples: { command: string; explanation: string }[];
  tip: string;
  related: string[];
  advanced?: string;
  seeAlso?: string[]; // guide IDs this command relates to
}

export interface GuideDoc {
  id: string;
  title: string;
  category: 'fundamentals' | 'branching' | 'collaboration' | 'advanced';
  order: number;
  content: string; // markdown-like content with sections
  relatedCommands: string[];
}
