import { LucideIcon } from 'lucide-react';

export type CategoryId = 'energy' | 'automation' | 'research' | 'quantum' | 'stellar' | 'void';

export interface SkillNode {
  id: string;
  categoryId: CategoryId;
  name: string;
  description: string;
  icon: string;
  cost: number;
  parents: string[]; // IDs of required skills
  effect: {
    type: 'click_mult' | 'passive_mult' | 'global_mult';
    value: number;
  };
}

export interface GameState {
  energy: number;
  totalEnergyEarned: number;
  crystals: number;
  lastUpdate: number;
  
  // Skill Tree
  purchasedSkills: string[];
  
  // Shop Upgrades
  upgrades: Record<string, number>;

  // AI Generated Upgrades
  aiUpgrades: {
    id: string;
    name: string;
    description: string;
    level: number;
    cost: number;
    multiplier: number;
  }[];
  aiAutoGenerate: boolean;
  aiLastGeneration: number;

  // Multi-Tier Prestige
  // tiers[0] = Omega Matter, tiers[1] = Alpha Particles, tiers[2] = Nexus Points, etc.
  tiers: number[];
  
  // Gambling & Ads
  permanentMultipliers: number;
  adBoostEndTime: number | null;
  chestsOpened: number;
  isRigged: boolean;
  casinoChips: number;
  lastDailyReset: number;
  autoMaxBet: boolean;
  playerPos: { x: number; y: number };
  activeGameId: string | null;
  
  // Personal Leaderboard
  personalRecords: {
    timestamp: number;
    energy: number;
    highestTier: number;
  }[];
}

// SKILL_NODES moved to skills.ts

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  costMultiplier: number;
  effect: (level: number) => number;
  type: 'click' | 'passive' | 'multiplier' | 'prestige_click' | 'prestige_passive';
  currencyTier?: number; // 0 = Energy, 1 = Omega Matter, 2 = Alpha Particles, etc.
  category?: 'core' | 'standard';
}

export const SHOP_UPGRADES: Upgrade[] = [
  {
    id: 'passive_omega',
    name: 'Omega Condenser',
    description: 'Passively generates Omega Matter.',
    cost: 1e30,
    costMultiplier: 100,
    effect: (level) => level * 0.1,
    type: 'prestige_passive',
    currencyTier: 0,
    category: 'core'
  },
  {
    id: 'passive_alpha',
    name: 'Alpha Reactor',
    description: 'Passively generates Alpha Particles.',
    cost: 5000,
    costMultiplier: 200,
    effect: (level) => level * 0.01,
    type: 'prestige_passive',
    currencyTier: 1,
    category: 'core'
  },
  {
    id: 'nexus_core_omega',
    name: 'Nexus Core: Omega Link',
    description: 'Converts a portion of click energy into Omega Matter.',
    cost: 1e25,
    costMultiplier: 50,
    effect: (level) => level * 0.01,
    type: 'prestige_click',
    currencyTier: 0,
    category: 'core'
  },
  {
    id: 'nexus_core_alpha',
    name: 'Nexus Core: Alpha Link',
    description: 'Converts a portion of click energy into Alpha Particles.',
    cost: 1000,
    costMultiplier: 100,
    effect: (level) => level * 0.001,
    type: 'prestige_click',
    currencyTier: 1,
    category: 'core'
  },
  {
    id: 'nexus_core_nexus',
    name: 'Nexus Core: Nexus Link',
    description: 'Converts a portion of click energy into Nexus Points.',
    cost: 100,
    costMultiplier: 200,
    effect: (level) => level * 0.0001,
    type: 'prestige_click',
    currencyTier: 2,
    category: 'core'
  },
  {
    id: 'nexus_core_void',
    name: 'Nexus Core: Void Link',
    description: 'Converts a portion of click energy into Void Shards.',
    cost: 10,
    costMultiplier: 500,
    effect: (level) => level * 0.00001,
    type: 'prestige_click',
    currencyTier: 3,
    category: 'core'
  },
  {
    id: 'passive_void',
    name: 'Void Extractor',
    description: 'Passively generates Void Shards.',
    cost: 100,
    costMultiplier: 1000,
    effect: (level) => level * 0.000001,
    type: 'prestige_passive',
    currencyTier: 3,
    category: 'core'
  },
  {
    id: 'nexus_core_singularity',
    name: 'Nexus Core: Singularity Link',
    description: 'Converts a portion of click energy into Singularity Cores.',
    cost: 10,
    costMultiplier: 1000,
    effect: (level) => level * 0.0000001,
    type: 'prestige_click',
    currencyTier: 4,
    category: 'core'
  },
  {
    id: 'passive_singularity',
    name: 'Singularity Forge',
    description: 'Passively generates Singularity Cores.',
    cost: 1000,
    costMultiplier: 5000,
    effect: (level) => level * 0.00000001,
    type: 'prestige_passive',
    currencyTier: 4,
    category: 'core'
  },
  {
    id: 'click_power',
    name: 'Manual Overdrive',
    description: 'Increase energy per click.',
    cost: 10,
    costMultiplier: 1.5,
    effect: (level) => Math.pow(1.2, level),
    type: 'click',
    currencyTier: 0,
    category: 'standard'
  },
  {
    id: 'passive_gen',
    name: 'Core Generator',
    description: 'Generate energy passively.',
    cost: 50,
    costMultiplier: 1.6,
    effect: (level) => level * 2,
    type: 'passive',
    currencyTier: 0,
    category: 'standard'
  },
  {
    id: 'global_mult',
    name: 'Efficiency Matrix',
    description: 'A global multiplier to all energy gains.',
    cost: 500,
    costMultiplier: 2.5,
    effect: (level) => 1 + (level * 0.1),
    type: 'multiplier',
    currencyTier: 0,
    category: 'standard'
  },
  {
    id: 'click_power_2',
    name: 'Neural Impulse',
    description: 'Advanced click power using Energy.',
    cost: 1e15,
    costMultiplier: 1.8,
    effect: (level) => Math.pow(1.5, level),
    type: 'click',
    currencyTier: 0,
    category: 'standard'
  },
  {
    id: 'click_power_3',
    name: 'Singularity Tap',
    description: 'Harness the power of a singularity for infinite-ish clicks.',
    cost: 1e100,
    costMultiplier: 5,
    effect: (level) => Math.pow(10, level),
    type: 'click',
    currencyTier: 0,
    category: 'standard'
  },
  {
    id: 'omega_click',
    name: 'Omega Resonance',
    description: 'Uses Omega Matter to boost click power exponentially.',
    cost: 100,
    costMultiplier: 2,
    effect: (level) => Math.pow(2, level),
    type: 'click',
    currencyTier: 1,
    category: 'standard'
  },
  {
    id: 'alpha_passive',
    name: 'Alpha Synthesis',
    description: 'Uses Alpha Particles to boost passive generation.',
    cost: 10,
    costMultiplier: 3,
    effect: (level) => Math.pow(5, level),
    type: 'passive',
    currencyTier: 2,
    category: 'standard'
  },
  {
    id: 'omega_click_2',
    name: 'Omega Surge',
    description: 'A massive boost to click power using Omega Matter.',
    cost: 1000,
    costMultiplier: 2.2,
    effect: (level) => Math.pow(3, level),
    type: 'click',
    currencyTier: 1,
    category: 'standard'
  },
  {
    id: 'nexus_global',
    name: 'Nexus Harmony',
    description: 'Uses Nexus Points to multiply all energy gains.',
    cost: 1,
    costMultiplier: 10,
    effect: (level) => Math.pow(10, level),
    type: 'multiplier',
    currencyTier: 3,
    category: 'standard'
  },
  // Higher Tier Core Upgrades
  {
    id: 'nexus_core_reality',
    name: 'Nexus Core: Reality Link',
    description: 'Converts a portion of click energy into Reality Fragments.',
    cost: 10,
    costMultiplier: 2000,
    effect: (level) => level * 0.000000001,
    type: 'prestige_click',
    currencyTier: 5,
    category: 'core'
  },
  {
    id: 'passive_reality',
    name: 'Reality Siphon',
    description: 'Passively generates Reality Fragments.',
    cost: 1000,
    costMultiplier: 10000,
    effect: (level) => level * 0.0000000001,
    type: 'prestige_passive',
    currencyTier: 5,
    category: 'core'
  },
  {
    id: 'nexus_core_time',
    name: 'Nexus Core: Time Link',
    description: 'Converts a portion of click energy into Time Crystals.',
    cost: 10,
    costMultiplier: 5000,
    effect: (level) => level * 0.00000000001,
    type: 'prestige_click',
    currencyTier: 6,
    category: 'core'
  },
  {
    id: 'passive_time',
    name: 'Chronal Well',
    description: 'Passively generates Time Crystals.',
    cost: 1000,
    costMultiplier: 20000,
    effect: (level) => level * 0.000000000001,
    type: 'prestige_passive',
    currencyTier: 6,
    category: 'core'
  },
  {
    id: 'nexus_core_space',
    name: 'Nexus Core: Space Link',
    description: 'Converts a portion of click energy into Space Dust.',
    cost: 10,
    costMultiplier: 10000,
    effect: (level) => level * 0.0000000000001,
    type: 'prestige_click',
    currencyTier: 7,
    category: 'core'
  },
  {
    id: 'passive_space',
    name: 'Spatial Harvester',
    description: 'Passively generates Space Dust.',
    cost: 1000,
    costMultiplier: 50000,
    effect: (level) => level * 0.00000000000001,
    type: 'prestige_passive',
    currencyTier: 7,
    category: 'core'
  },
  {
    id: 'nexus_core_dimension',
    name: 'Nexus Core: Dimension Link',
    description: 'Converts a portion of click energy into Dimension Keys.',
    cost: 10,
    costMultiplier: 25000,
    effect: (level) => level * 1e-15,
    type: 'prestige_click',
    currencyTier: 8,
    category: 'core'
  },
  {
    id: 'passive_dimension',
    name: 'Dimensional Rift',
    description: 'Passively generates Dimension Keys.',
    cost: 1000,
    costMultiplier: 100000,
    effect: (level) => level * 1e-16,
    type: 'prestige_passive',
    currencyTier: 8,
    category: 'core'
  },
  {
    id: 'nexus_core_multiverse',
    name: 'Nexus Core: Multiverse Link',
    description: 'Converts a portion of click energy into Multiverse Seeds.',
    cost: 10,
    costMultiplier: 50000,
    effect: (level) => level * 1e-18,
    type: 'prestige_click',
    currencyTier: 9,
    category: 'core'
  },
  {
    id: 'passive_multiverse',
    name: 'Multiverse Nursery',
    description: 'Passively generates Multiverse Seeds.',
    cost: 1000,
    costMultiplier: 250000,
    effect: (level) => level * 1e-19,
    type: 'prestige_passive',
    currencyTier: 9,
    category: 'core'
  },
  {
    id: 'nexus_core_omniverse',
    name: 'Nexus Core: Omniverse Link',
    description: 'Converts a portion of click energy into Omniverse Essence.',
    cost: 10,
    costMultiplier: 100000,
    effect: (level) => level * 1e-21,
    type: 'prestige_click',
    currencyTier: 10,
    category: 'core'
  },
  {
    id: 'passive_omniverse',
    name: 'Omniverse Font',
    description: 'Passively generates Omniverse Essence.',
    cost: 1000,
    costMultiplier: 500000,
    effect: (level) => level * 1e-22,
    type: 'prestige_passive',
    currencyTier: 10,
    category: 'core'
  },
  {
    id: 'nexus_core_infinity',
    name: 'Nexus Core: Infinity Link',
    description: 'Converts a portion of click energy into Infinity Sparks.',
    cost: 10,
    costMultiplier: 250000,
    effect: (level) => level * 1e-24,
    type: 'prestige_click',
    currencyTier: 11,
    category: 'core'
  },
  {
    id: 'passive_infinity',
    name: 'Infinity Sparker',
    description: 'Passively generates Infinity Sparks.',
    cost: 1000,
    costMultiplier: 1000000,
    effect: (level) => level * 1e-25,
    type: 'prestige_passive',
    currencyTier: 11,
    category: 'core'
  }
];
