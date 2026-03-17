import { SkillNode, CategoryId } from './types';

const CATEGORIES: CategoryId[] = ['energy', 'automation', 'research', 'quantum', 'stellar', 'void'];
const ICONS = ['Sun', 'Zap', 'Cpu', 'Telescope', 'Layers', 'Atom', 'Star', 'Moon', 'Orbit', 'Activity'];

const generateSkills = (count: number): SkillNode[] => {
  const skills: SkillNode[] = [];
  
  // Initial base skills
  skills.push(
    { id: 'e1', categoryId: 'energy', name: 'Solar Flare', description: 'Passive +20%', icon: 'Sun', cost: 100, parents: [], effect: { type: 'passive_mult', value: 1.2 } },
    { id: 'e2', categoryId: 'energy', name: 'Kinetic Pulse', description: 'Click +50%', icon: 'Zap', cost: 100, parents: [], effect: { type: 'click_mult', value: 1.5 } },
    { id: 'a1', categoryId: 'automation', name: 'Logic Gates', description: 'Global +10%', icon: 'Cpu', cost: 200, parents: [], effect: { type: 'global_mult', value: 1.1 } },
    { id: 'r1', categoryId: 'research', name: 'Lens Polish', description: 'Global +20%', icon: 'Telescope', cost: 300, parents: [], effect: { type: 'global_mult', value: 1.2 } }
  );

  for (let i = 0; i < count - 4; i++) {
    const id = `s${i}`;
    const categoryId = CATEGORIES[i % CATEGORIES.length];
    const icon = ICONS[i % ICONS.length];
    
    // Pick 1-2 random parents from previously created skills to ensure a tree structure
    // To make it 100,000 skills, we should probably have a more structured approach
    // so it doesn't become a single long line.
    
    // Let's make it so each skill has a parent from roughly i/10 to i
    const parentIndex = Math.max(0, Math.floor(i - Math.random() * 20));
    const parentId = i < 10 ? skills[i % 4].id : `s${parentIndex}`;
    
    const cost = Math.floor(500 * Math.pow(1.05, Math.floor(i / 10)));
    const value = 1 + (Math.random() * 0.1) + (i / 10000);
    
    const effectTypes: ('click_mult' | 'passive_mult' | 'global_mult')[] = ['click_mult', 'passive_mult', 'global_mult'];
    const effectType = effectTypes[Math.floor(Math.random() * effectTypes.length)];

    skills.push({
      id,
      categoryId,
      name: `${categoryId.toUpperCase()} Node ${i}`,
      description: `${effectType.replace('_', ' ')} +${((value - 1) * 100).toFixed(1)}%`,
      icon,
      cost,
      parents: [parentId],
      effect: {
        type: effectType,
        value
      }
    });
  }

  return skills;
};

export const SKILL_NODES = generateSkills(100000);
