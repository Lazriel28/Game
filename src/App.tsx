/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  Sun, 
  Cpu, 
  Brain, 
  Telescope, 
  Atom, 
  Link, 
  Layers, 
  ShoppingBag, 
  GitBranch, 
  TrendingUp, 
  ChevronRight,
  Lock,
  Sparkles,
  Coins,
  ShieldCheck,
  Activity,
  Dices,
  RotateCcw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CategoryId, 
  SHOP_UPGRADES, 
  GameState, 
  SkillNode
} from './types';
import { SKILL_NODES } from './skills';

const INITIAL_STATE: GameState = {
  energy: 0,
  totalEnergyEarned: 0,
  crystals: 100,
  lastUpdate: Date.now(),
  purchasedSkills: [],
  upgrades: {},
  aiUpgrades: [],
  tiers: Array(12).fill(0), // Omega, Alpha, Nexus, Void, Singularity, Reality, Time, Space, Dimension, Multiverse, Omniverse, Infinity
  permanentMultipliers: 1,
  adBoostEndTime: null,
  chestsOpened: 0,
  isRigged: false,
  casinoChips: 1000,
  lastDailyReset: Date.now(),
  autoMaxBet: false,
  playerPos: { x: 500, y: 500 },
  activeGameId: null,
  personalRecords: [],
  aiAutoGenerate: false,
  aiLastGeneration: Date.now()
};

const CHEST_COST = 50;
const MAX_CLICK_EFFECTS = 20;
const STABILITY_CAP = 1e308;
const CASINO_ENTITIES = [
  { id: 'blackjack', type: 'game', name: 'Blackjack', x: 300, y: 300, color: 'bg-emerald-600' },
  { id: 'roulette', type: 'game', name: 'Roulette', x: 700, y: 300, color: 'bg-indigo-600' },
  { id: 'slots', type: 'game', name: 'Slots', x: 300, y: 700, color: 'bg-gold' },
  { id: 'baccarat', type: 'game', name: 'Baccarat', x: 700, y: 700, color: 'bg-purple-600' },
  { id: 'craps', type: 'game', name: 'Craps', x: 500, y: 200, color: 'bg-red-600' },
  { id: 'poker', type: 'game', name: 'Video Poker', x: 500, y: 800, color: 'bg-blue-600' },
  { id: 'keno', type: 'game', name: 'Keno', x: 200, y: 500, color: 'bg-orange-600' },
  { id: 'wheel', type: 'game', name: 'Wheel of Fortune', x: 800, y: 500, color: 'bg-pink-600' },
  { id: 'coinflip', type: 'game', name: 'Coin Flip', x: 150, y: 150, color: 'bg-yellow-500' },
  { id: 'hilo', type: 'game', name: 'Hi-Lo', x: 850, y: 150, color: 'bg-cyan-500' },
  { id: 'mines', type: 'game', name: 'Mines', x: 150, y: 850, color: 'bg-gray-700' },
  { id: 'crash', type: 'game', name: 'Crash', x: 850, y: 850, color: 'bg-red-500' },
  { id: 'plinko', type: 'game', name: 'Plinko', x: 400, y: 500, color: 'bg-blue-500' },
  { id: 'limbo', type: 'game', name: 'Limbo', x: 600, y: 500, color: 'bg-purple-500' },
  { id: 'dice', type: 'game', name: 'Dice', x: 500, y: 400, color: 'bg-green-500' },
  { id: 'tower', type: 'game', name: 'Tower', x: 500, y: 600, color: 'bg-yellow-600' },
  { id: 'scratch', type: 'game', name: 'Scratch Card', x: 100, y: 400, color: 'bg-teal-500' },
  { id: 'horses', type: 'game', name: 'Horse Racing', x: 900, y: 400, color: 'bg-brown-600' },
  { id: 'diamonds', type: 'game', name: 'Diamonds', x: 100, y: 600, color: 'bg-blue-300' },
  { id: 'keno2', type: 'game', name: 'Keno Pro', x: 900, y: 600, color: 'bg-orange-800' },
  { id: 'npc_bob', type: 'npc', name: 'Dealer Bob', x: 450, y: 450, color: 'bg-white', message: "Welcome to the Nexus! Try not to lose your neural link." },
  { id: 'npc_alice', type: 'npc', name: 'Lucky Alice', x: 550, y: 550, color: 'bg-white', message: "I heard the Roulette wheel is acting strange today... almost like a ghost is moving the chips." },
  { id: 'npc_guard', type: 'npc', name: 'Security Bot', x: 500, y: 100, color: 'bg-white', message: "NO CHEATING. WE ARE WATCHING." },
];

const TIER_NAMES = [
  'Omega Matter', 'Alpha Particles', 'Nexus Points', 'Void Shards', 'Singularity Cores',
  'Reality Fragments', 'Time Crystals', 'Space Dust', 'Dimension Keys', 'Multiverse Seeds',
  'Omniverse Essence', 'Infinity Sparks'
];

const sanitizeState = (s: any): GameState => {
  const state = { ...INITIAL_STATE, ...s };
  
  // Ensure no NaNs or Infinities in core currencies
  if (isNaN(state.energy) || state.energy >= STABILITY_CAP) state.energy = STABILITY_CAP * 0.99;
  if (isNaN(state.totalEnergyEarned)) state.totalEnergyEarned = 0;
  if (isNaN(state.crystals)) state.crystals = 100;
  
  // Sanitize Tiers
  state.tiers = (state.tiers || Array(12).fill(0)).map(t => (isNaN(t) || t >= STABILITY_CAP) ? STABILITY_CAP * 0.99 : t);
  if (state.tiers.length < 12) {
    state.tiers = [...state.tiers, ...Array(12 - state.tiers.length).fill(0)];
  }
  
  // Ensure arrays exist and are valid
  state.purchasedSkills = Array.isArray(state.purchasedSkills) ? state.purchasedSkills : [];
  state.aiUpgrades = Array.isArray(state.aiUpgrades) ? state.aiUpgrades : [];
  state.personalRecords = Array.isArray(state.personalRecords) ? state.personalRecords : [];
  state.aiAutoGenerate = !!state.aiAutoGenerate;
  state.isRigged = !!state.isRigged;
  state.casinoChips = typeof state.casinoChips === 'number' ? state.casinoChips : 1000;
  state.lastDailyReset = state.lastDailyReset || Date.now();
  state.autoMaxBet = !!state.autoMaxBet;
  state.playerPos = state.playerPos || { x: 500, y: 500 };
  state.activeGameId = state.activeGameId || null;
  state.aiLastGeneration = state.aiLastGeneration || Date.now();
  
  // Sanitize Upgrades
  if (typeof state.upgrades !== 'object' || state.upgrades === null) {
    state.upgrades = {};
  } else {
    Object.keys(state.upgrades).forEach(key => {
      if (isNaN(state.upgrades[key])) state.upgrades[key] = 0;
    });
  }

  return state;
};

const formatNumber = (num: number) => {
  if (isNaN(num)) return "0";
  if (num >= STABILITY_CAP * 0.95) return "MAX";
  if (num >= 1e15) return num.toExponential(2);
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return Math.floor(num).toString();
};

const IconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-5 h-5" />,
  Zap: <Zap className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Telescope: <Telescope className="w-5 h-5" />,
  Atom: <Atom className="w-5 h-5" />,
  Link: <Link className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
};

// Pre-index skills for O(1) lookup to prevent lag during spam-buying
const SKILL_MAP = new Map(SKILL_NODES.map(node => [node.id, node]));

export default function App() {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('nexus_idle_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeState({ ...parsed, lastUpdate: Date.now() });
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [activeTab, setActiveTab] = useState<'core' | 'skills' | 'shop' | 'premium' | 'ai' | 'leaderboard' | 'gambling'>('core');
  const [buyAmount, setBuyAmount] = useState<1 | 10 | 100 | 'MAX'>(1);
  const [customChestAmount, setCustomChestAmount] = useState<string>("10");
  const [customCrystalAmount, setCustomCrystalAmount] = useState<string>("1000");
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [devCode, setDevCode] = useState("");

  // Gambling States
  const [bjBet, setBjBet] = useState(100);
  const [bjPlayerHand, setBjPlayerHand] = useState<{suit: string, rank: string, value: number}[]>([]);
  const [bjDealerHand, setBjDealerHand] = useState<{suit: string, rank: string, value: number}[]>([]);
  const [bjStatus, setBjStatus] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
  const [bjMessage, setBjMessage] = useState("");

  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [rouletteBallAngle, setRouletteBallAngle] = useState(0);
  const [ghostHandPos, setGhostHandPos] = useState<{ x: number; y: number } | null>(null);
  const [rouletteBet, setRouletteBet] = useState<{type: 'number' | 'color', value: string | number, amount: number} | null>(null);

  const [slotsSpinning, setSlotsSpinning] = useState(false);
  const [slotsReels, setSlotsReels] = useState(['🍒', '🍒', '🍒']);
  const [slotsBet, setSlotsBet] = useState(100);

  const getCard = (forceValue?: number) => {
    const suits = ['♠', '♣', '♥', '♦'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    let rankIndex = Math.floor(Math.random() * ranks.length);
    
    if (forceValue !== undefined) {
      // Find a rank that matches the forceValue
      // 2-10 are values 2-10. J,Q,K are 10. A is 11 (simplified)
      if (forceValue >= 2 && forceValue <= 9) {
        rankIndex = forceValue - 2;
      } else if (forceValue === 10) {
        rankIndex = 8 + Math.floor(Math.random() * 4); // 10, J, Q, K
      } else if (forceValue === 11 || forceValue === 1) {
        rankIndex = 12; // Ace
      } else {
        rankIndex = 0; // Default to 2 if something weird happens
      }
    }

    const rank = ranks[rankIndex];
    let value = rankIndex + 2;
    if (rankIndex >= 9 && rankIndex <= 11) value = 10;
    if (rankIndex === 12) value = 11;

    return { suit, rank, value };
  };

  const calculateHandValue = (hand: {value: number, rank: string}[]) => {
    let value = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter(card => card.rank === 'A').length;
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    return value;
  };

  const startBlackjack = () => {
    if (state.casinoChips < bjBet) return;
    setState(prev => ({ ...prev, casinoChips: prev.casinoChips - bjBet }));
    const p1 = getCard();
    const p2 = getCard();
    const d1 = getCard();
    const d2 = getCard();
    const initialPlayerHand = [p1, p2];
    setBjPlayerHand(initialPlayerHand);
    setBjDealerHand([d1, d2]);
    setBjStatus('playing');
    setBjMessage("");

    if (calculateHandValue(initialPlayerHand) === 21) {
      standBlackjack(initialPlayerHand);
    }
  };

  const hitBlackjack = () => {
    let currentVal = calculateHandValue(bjPlayerHand);
    let needed = 21 - currentVal;
    let card;

    if (state.isRigged && needed > 0) {
      // Rigged: always give a card that doesn't bust, ideally reaching 21
      const forceVal = Math.min(Math.floor(Math.random() * 11) + 1, needed);
      card = getCard(forceVal);
    } else {
      card = getCard();
    }

    const newHand = [...bjPlayerHand, card];
    setBjPlayerHand(newHand);
    const newVal = calculateHandValue(newHand);
    if (newVal > 21) {
      setBjStatus('gameOver');
      setBjMessage("BUST! Dealer Wins.");
    } else if (newVal === 21) {
      standBlackjack(newHand);
    }
  };

  const standBlackjack = (finalPlayerHand?: {suit: string, rank: string, value: number}[]) => {
    setBjStatus('dealerTurn');
    let currentDealerHand = [...bjDealerHand];
    let dealerVal = calculateHandValue(currentDealerHand);
    
    const playDealer = () => {
      if (dealerVal < 17) {
        const card = getCard();
        currentDealerHand.push(card);
        setBjDealerHand([...currentDealerHand]);
        dealerVal = calculateHandValue(currentDealerHand);
        playDealer();
      } else {
        const playerVal = calculateHandValue(finalPlayerHand || bjPlayerHand);
        if (dealerVal > 21 || playerVal > dealerVal) {
          setBjMessage("YOU WIN!");
          setState(prev => ({ ...prev, casinoChips: prev.casinoChips + bjBet * 2 }));
        } else if (playerVal === dealerVal) {
          setBjMessage("PUSH");
          setState(prev => ({ ...prev, casinoChips: prev.casinoChips + bjBet }));
        } else {
          setBjMessage("DEALER WINS");
        }
        setBjStatus('gameOver');
      }
    };
    playDealer();
  };

  const spinRoulette = () => {
    if (!rouletteBet || state.casinoChips < rouletteBet.amount || rouletteSpinning) return;
    setState(prev => ({ ...prev, casinoChips: prev.casinoChips - rouletteBet.amount }));
    setRouletteSpinning(true);
    setRouletteResult(null);
    setGhostHandPos(null);
    
    // Animate ball
    let ballAngle = 0;
    const ballInterval = setInterval(() => {
      ballAngle += 20;
      setRouletteBallAngle(ballAngle % 360);
    }, 20);

    setTimeout(() => {
      clearInterval(ballInterval);
      const result = Math.floor(Math.random() * 37);
      
      // Check if player would lose
      let won = false;
      let multiplier = 0;
      if (rouletteBet.type === 'number' && result === rouletteBet.value) {
        won = true;
        multiplier = 35;
      } else if (rouletteBet.type === 'color') {
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
        const isRed = redNumbers.includes(result);
        if ((rouletteBet.value === 'red' && isRed) || (rouletteBet.value === 'black' && !isRed && result !== 0)) {
          won = true;
          multiplier = 2;
        }
      }

      if (state.isRigged && !won) {
        // Ghost Hand moves the chips!
        setGhostHandPos({ x: Math.random() * 100, y: Math.random() * 100 }); // Visual trigger
        setTimeout(() => {
          setRouletteResult(result);
          setRouletteSpinning(false);
          setGhostHandPos(null);
          // Force win logic
          let finalMult = rouletteBet.type === 'number' ? 35 : 2;
          setState(prev => ({ ...prev, casinoChips: prev.casinoChips + rouletteBet.amount * finalMult }));
        }, 500);
      } else {
        setRouletteResult(result);
        setRouletteSpinning(false);
        if (won) {
          setState(prev => ({ ...prev, casinoChips: prev.casinoChips + rouletteBet.amount * multiplier }));
        }
      }
    }, 2000);
  };

  const spinSlots = () => {
    if (state.casinoChips < slotsBet || slotsSpinning) return;
    setState(prev => ({ ...prev, casinoChips: prev.casinoChips - slotsBet }));
    setSlotsSpinning(true);
    
    const symbols = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
    
    setTimeout(() => {
      let result: string[];
      if (state.isRigged) {
        const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        result = [winSymbol, winSymbol, winSymbol];
      } else {
        result = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
      }
      
      setSlotsReels(result);
      setSlotsSpinning(false);
      
      if (result[0] === result[1] && result[1] === result[2]) {
        let mult = 10;
        if (result[0] === '7️⃣') mult = 100;
        if (result[0] === '💎') mult = 50;
        setState(prev => ({ ...prev, casinoChips: prev.casinoChips + slotsBet * mult }));
      } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
        setState(prev => ({ ...prev, casinoChips: prev.casinoChips + slotsBet * 2 }));
      }
    }, 100); // Reduced delay for slots
  };

  const exchangeChips = (type: 'energy' | 'crystals', amount: number) => {
    if (type === 'energy') {
      const cost = amount * 1e6; // 1M energy per chip
      if (state.energy < cost) return;
      setState(prev => ({
        ...prev,
        energy: prev.energy - cost,
        casinoChips: prev.casinoChips + amount
      }));
    } else {
      const cost = amount / 10; // 1 crystal = 10 chips
      if (state.crystals < cost) return;
      setState(prev => ({
        ...prev,
        crystals: prev.crystals - cost,
        casinoChips: prev.casinoChips + amount
      }));
    }
  };

  const setMaxBet = (game: 'bj' | 'roulette' | 'slots' | 'generic') => {
    setState(prev => ({ ...prev, autoMaxBet: !prev.autoMaxBet }));
  };

  // Auto Max Bet Effect
  useEffect(() => {
    if (state.autoMaxBet) {
      const max = state.casinoChips;
      setBjBet(max);
      setSlotsBet(max);
      setGenericGameBet(max);
      if (rouletteBet) setRouletteBet(prev => prev ? { ...prev, amount: max } : null);
    }
  }, [state.autoMaxBet, state.casinoChips]);
  const [nearbyNpc, setNearbyNpc] = useState<string | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  // NPC Proximity Effect
  useEffect(() => {
    const checkProximity = () => {
      const npcs = CASINO_ENTITIES.filter(e => e.type === 'npc');
      let found = null;
      for (const npc of npcs) {
        const dist = Math.sqrt(Math.pow(state.playerPos.x - npc.x, 2) + Math.pow(state.playerPos.y - npc.y, 2));
        if (dist < 80) {
          found = npc.id;
          break;
        }
      }
      setNearbyNpc(found);
    };
    checkProximity();
  }, [state.playerPos]);
  const [genericGameBet, setGenericGameBet] = useState(100);
  const [genericGameResult, setGenericGameResult] = useState<string | null>(null);
  const [isGenericSpinning, setIsGenericSpinning] = useState(false);
  const [npcDialogue, setNpcDialogue] = useState<{ name: string; message: string } | null>(null);

  const playGenericGame = (gameId: string) => {
    if (state.casinoChips < genericGameBet || isGenericSpinning) return;
    setIsGenericSpinning(true);
    setGenericGameResult(null);
    
    setState(prev => ({ ...prev, casinoChips: prev.casinoChips - genericGameBet }));

    setTimeout(() => {
      let won = Math.random() > 0.55; // House edge
      if (state.isRigged) won = true;
      
      let multiplier = 2;
      let message = "";

      switch(gameId) {
        case 'crash':
          multiplier = 1.1 + Math.random() * 10;
          won = Math.random() > 0.3; // Higher win rate but multiplier varies
          message = won ? `CASHED OUT AT ${multiplier.toFixed(2)}x` : "CRASHED AT 1.00x";
          break;
        case 'mines':
          multiplier = 2.5;
          message = won ? "CLEARED THE FIELD!" : "BOOM! HIT A MINE.";
          break;
        case 'plinko':
          const slots = [0, 0.2, 0.5, 1, 1.5, 2, 5, 10];
          multiplier = slots[Math.floor(Math.random() * slots.length)];
          won = multiplier > 1;
          message = won ? `LANDED IN ${multiplier}x SLOT` : "LANDED IN 0x SLOT";
          break;
        case 'limbo':
          multiplier = 1.01 + Math.random() * 100;
          won = Math.random() > 0.5;
          message = won ? `LIMIT REACHED: ${multiplier.toFixed(2)}x` : "TOO LOW!";
          break;
        case 'dice':
          multiplier = 1.95;
          message = won ? "ROLLED OVER 50!" : "ROLLED UNDER 50.";
          break;
        case 'tower':
          multiplier = 3.5;
          message = won ? "REACHED THE TOP!" : "FELL OFF THE TOWER.";
          break;
        case 'scratch':
          multiplier = Math.random() > 0.9 ? 50 : 2;
          message = won ? "MATCHED THREE!" : "NO MATCH.";
          break;
        case 'horses':
          multiplier = 6;
          message = won ? "YOUR HORSE WON BY A NOSE!" : "YOUR HORSE STUMBLED.";
          break;
        case 'diamonds':
          multiplier = 4;
          message = won ? "FOUND THE DIAMOND!" : "JUST COAL.";
          break;
        case 'keno':
        case 'keno2':
          multiplier = 10;
          message = won ? "JACKPOT NUMBERS!" : "NO NUMBERS MATCHED.";
          break;
        case 'coinflip':
          multiplier = 1.9;
          message = won ? "HEADS! YOU WIN." : "TAILS! YOU LOSE.";
          break;
        case 'hilo':
          multiplier = 1.8;
          message = won ? "CORRECT GUESS!" : "WRONG GUESS.";
          break;
        case 'wheel':
          multiplier = [0, 0, 2, 5, 10, 50][Math.floor(Math.random() * 6)];
          won = multiplier > 0;
          message = won ? `WHEEL STOPPED AT ${multiplier}x` : "WHEEL STOPPED AT BANKRUPT";
          break;
        case 'baccarat':
          multiplier = 2;
          message = won ? "PLAYER WINS!" : "BANKER WINS.";
          break;
        case 'craps':
          multiplier = 2.5;
          message = won ? "NATURAL 7!" : "CRAPS! YOU LOSE.";
          break;
        case 'poker':
          multiplier = 4;
          message = won ? "FULL HOUSE!" : "NOTHING.";
          break;
        default:
          multiplier = 2;
          message = won ? "YOU WON!" : "YOU LOST.";
      }

      if (state.isRigged) {
        won = true;
        if (multiplier < 2) multiplier = 2;
      }

      setIsGenericSpinning(false);
      if (won) {
        setGenericGameResult(`${message} (+${formatNumber(genericGameBet * multiplier)})`);
        setState(prev => ({ ...prev, casinoChips: prev.casinoChips + genericGameBet * multiplier }));
      } else {
        setGenericGameResult(message);
      }
    }, 1000);
  };
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [chestReward, setChestReward] = useState<string | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adTimeLeft, setAdTimeLeft] = useState(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const nextEffectId = useRef(0);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save game
  useEffect(() => {
    localStorage.setItem('nexus_idle_save', JSON.stringify(state));
  }, [state]);

  // Calculate Multipliers
  const getMultipliers = useCallback(() => {
    let clickMult = 1;
    let passiveBase = 0;
    let globalMult = state.permanentMultipliers || 1;
    let prestigeClickGains = [0, 0, 0, 0, 0];
    let prestigePassiveGains = [0, 0, 0, 0, 0];

    // Ad Boost
    if (state.adBoostEndTime && state.adBoostEndTime > Date.now()) {
      globalMult *= 2;
    }

    // Shop Upgrades
    Object.entries(state.upgrades).forEach(([id, level]) => {
      const upgrade = SHOP_UPGRADES.find(u => u.id === id);
      if (!upgrade) return;
      const lvl = level as number;
      if (upgrade.type === 'click') clickMult *= upgrade.effect(lvl);
      if (upgrade.type === 'passive') passiveBase += upgrade.effect(lvl);
      if (upgrade.type === 'multiplier') globalMult *= upgrade.effect(lvl);
      if (upgrade.type === 'prestige_click') {
        const targetTier = upgrade.currencyTier || 0;
        prestigeClickGains[targetTier] += upgrade.effect(lvl);
      }
      if (upgrade.type === 'prestige_passive') {
        const targetTier = upgrade.currencyTier || 0;
        prestigePassiveGains[targetTier] += upgrade.effect(lvl);
      }
    });

    // Skill Tree Nodes
    (state.purchasedSkills || []).forEach(skillId => {
      const node = SKILL_MAP.get(skillId);
      if (!node) return;
      if (node.effect.type === 'click_mult') clickMult *= node.effect.value;
      if (node.effect.type === 'passive_mult') passiveBase *= node.effect.value;
      if (node.effect.type === 'global_mult') globalMult *= node.effect.value;
    });

    // AI Upgrades
    (state.aiUpgrades || []).forEach(upgrade => {
      globalMult *= (1 + (upgrade.multiplier - 1) * upgrade.level);
    });

    return { clickMult, passiveBase, globalMult, prestigeClickGains, prestigePassiveGains };
  }, [state.upgrades, state.purchasedSkills, state.permanentMultipliers, state.adBoostEndTime, state.aiUpgrades]);

  const { clickMult, passiveBase, globalMult, prestigeClickGains, prestigePassiveGains } = getMultipliers();
  const energyPerClick = 1 * clickMult * globalMult;
  const energyPerSecond = passiveBase * globalMult;

  // Ad Timer
  useEffect(() => {
    if (state.adBoostEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((state.adBoostEndTime! - Date.now()) / 1000));
        setAdTimeLeft(remaining);
        if (remaining === 0) {
          setState(prev => ({ ...prev, adBoostEndTime: null }));
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.adBoostEndTime]);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();

        // Daily Reset Logic
        const lastResetDate = new Date(prev.lastDailyReset).setHours(0, 0, 0, 0);
        const currentDate = new Date(now).setHours(0, 0, 0, 0);
        
        let updatedChips = prev.casinoChips;
        let updatedResetTime = prev.lastDailyReset;

        if (currentDate > lastResetDate) {
          if (updatedChips < 1000) {
            updatedChips = 1000;
          }
          updatedResetTime = now;
        }

        const delta = (now - prev.lastUpdate) / 1000;
        const gained = energyPerSecond * delta;
        
        if (delta > 0) {
          let newEnergy = prev.energy + gained;
          let newTiers = [...prev.tiers];

          // Apply Passive Prestige Generation
          prestigePassiveGains.forEach((gainPerSec, idx) => {
            if (gainPerSec > 0) {
              newTiers[idx] = Math.min(STABILITY_CAP, newTiers[idx] + (gainPerSec * globalMult * delta));
            }
          });

          // Auto-Stabilization Loop
          // If Energy > Cap, convert to Tier 0
          if (newEnergy >= STABILITY_CAP) {
            const overflow = newEnergy / STABILITY_CAP;
            const gain = Math.floor(Math.log10(overflow) + 1);
            newTiers[0] = Math.min(STABILITY_CAP, newTiers[0] + gain);
            newEnergy = STABILITY_CAP * 0.99;
          }

          // If Tier N > Cap, convert to Tier N+1
          for (let i = 0; i < newTiers.length - 1; i++) {
            if (newTiers[i] >= STABILITY_CAP) {
              const overflow = newTiers[i] / STABILITY_CAP;
              const gain = Math.floor(Math.log10(overflow) + 1);
              newTiers[i+1] = Math.min(STABILITY_CAP, newTiers[i+1] + gain);
              newTiers[i] = STABILITY_CAP * 0.99;
            }
          }

          // Final NaN check for all currencies
          if (isNaN(newEnergy)) newEnergy = STABILITY_CAP * 0.99;
          newTiers = newTiers.map(t => isNaN(t) ? STABILITY_CAP * 0.99 : t);

          // AI Shop Expansion: Unlock next tier core upgrades
          let newUpgrades = { ...prev.upgrades };
          for (let i = 0; i < newTiers.length; i++) {
            if (newTiers[i] > 0 || (i === 0 && newEnergy > 1e10)) {
              // If tier i is active, ensure tier i+1 core upgrades are potentially visible
              // We'll handle visibility in the UI, but we could also auto-add them here if they were dynamic
            }
          }

          // AI Auto-Generation
          let newAiUpgrades = [...prev.aiUpgrades];
          let newAiLastGeneration = prev.aiLastGeneration;
          if (prev.aiAutoGenerate && now - prev.aiLastGeneration > 60000) { // Every 60 seconds
            const prefixes = ['Quantum', 'Void', 'Stellar', 'Infinite', 'Cyber', 'Nexus', 'Omega', 'Alpha'];
            const suffixes = ['Matrix', 'Core', 'Engine', 'Pulse', 'Node', 'Grid', 'Array', 'Link'];
            const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
            
            newAiUpgrades.push({
              id: `ai_${now}`,
              name,
              description: `An AI-hallucinated upgrade that boosts global efficiency.`,
              level: 0,
              cost: 1e10 * Math.pow(10, newAiUpgrades.length),
              multiplier: 1.5 + (Math.random() * 2)
            });
            newAiLastGeneration = now;
          }

          return {
            ...prev,
            energy: newEnergy,
            tiers: newTiers,
            aiUpgrades: newAiUpgrades,
            aiLastGeneration: newAiLastGeneration,
            casinoChips: updatedChips,
            lastDailyReset: updatedResetTime,
            totalEnergyEarned: isNaN(prev.totalEnergyEarned + gained) ? prev.totalEnergyEarned : prev.totalEnergyEarned + gained,
            lastUpdate: now
          };
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [energyPerSecond]);

  const handleManualClick = (e: React.MouseEvent) => {
    const gained = energyPerClick;
    const pGains = prestigeClickGains.map(pct => gained * pct);

    setState(prev => {
      const newTiers = [...prev.tiers];
      pGains.forEach((amount, idx) => {
        if (amount > 0) {
          newTiers[idx] = Math.min(STABILITY_CAP, newTiers[idx] + amount);
        }
      });

      return {
        ...prev,
        energy: prev.energy + gained,
        totalEnergyEarned: prev.totalEnergyEarned + gained,
        tiers: newTiers
      };
    });

    const id = nextEffectId.current++;
    setClickEffects(prev => {
      let effectValue = `+${formatNumber(gained)}`;
      pGains.forEach((amount, idx) => {
        if (amount > 0) {
          effectValue += `\n+${formatNumber(amount)} ${TIER_NAMES[idx].split(' ')[0]}`;
        }
      });

      const newEffects = [...prev, { id, x: e.clientX, y: e.clientY, value: effectValue }];
      if (newEffects.length > MAX_CLICK_EFFECTS) {
        return newEffects.slice(newEffects.length - MAX_CLICK_EFFECTS);
      }
      return newEffects;
    });
    setTimeout(() => {
      setClickEffects(prev => prev.filter(eff => eff.id !== id));
    }, 800);
  };

  const buySkill = (skillId: string) => {
    const node = SKILL_MAP.get(skillId);
    if (!node || state.purchasedSkills.includes(skillId)) return;
    
    if (state.energy >= node.cost) {
      setState(prev => ({
        ...prev,
        energy: prev.energy - node.cost,
        purchasedSkills: [...prev.purchasedSkills, skillId]
      }));
    }
  };

  const buyMaxSkills = () => {
    let currentEnergy = state.energy;
    let newPurchased = [...state.purchasedSkills];
    let changed = false;

    // We need to iterate multiple times because unlocking one skill might reveal another
    let foundAny = true;
    while (foundAny) {
      foundAny = false;
      const purchasedSet = new Set(newPurchased);
      
      // Look for skills we can afford and meet prerequisites
      for (let i = 0; i < SKILL_NODES.length; i++) {
        const node = SKILL_NODES[i];
        if (purchasedSet.has(node.id)) continue;
        
        if (currentEnergy >= node.cost && node.parents.every(pId => purchasedSet.has(pId))) {
          currentEnergy -= node.cost;
          newPurchased.push(node.id);
          purchasedSet.add(node.id);
          foundAny = true;
          changed = true;
        }
      }
    }

    if (changed) {
      setState(prev => ({
        ...prev,
        energy: currentEnergy,
        purchasedSkills: newPurchased
      }));
    }
  };

  const convertToOmegaMatter = () => {
    if (state.energy < STABILITY_CAP * 0.1) return;
    
    const gain = Math.floor(Math.log10(state.energy / 1e10) + 1);
    setState(prev => {
      const newTiers = [...prev.tiers];
      newTiers[0] = Math.min(STABILITY_CAP, newTiers[0] + gain);
      
      return {
        ...prev,
        energy: STABILITY_CAP * 0.99,
        tiers: newTiers,
        personalRecords: [
          ...prev.personalRecords,
          { timestamp: Date.now(), energy: prev.energy, highestTier: 0 }
        ].slice(-10)
      };
    });
    alert(`Energy stabilized! Converted to ${gain} Omega Matter.`);
  };

  const generateAiUpgrade = () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);

    setTimeout(() => {
      const prefixes = ['Quantum', 'Void', 'Stellar', 'Infinite', 'Cyber', 'Nexus', 'Omega', 'Alpha'];
      const suffixes = ['Matrix', 'Core', 'Engine', 'Pulse', 'Node', 'Grid', 'Array', 'Link'];
      const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
      
      const newUpgrade = {
        id: `ai_${Date.now()}`,
        name,
        description: `An AI-hallucinated upgrade that boosts global efficiency.`,
        level: 0,
        cost: 1e10 * Math.pow(10, state.aiUpgrades.length),
        multiplier: 1.5 + (Math.random() * 2)
      };

      setState(prev => ({
        ...prev,
        aiUpgrades: [...prev.aiUpgrades, newUpgrade]
      }));
      setIsAiGenerating(false);
    }, 1500);
  };

  const buyAiUpgrade = (id: string) => {
    const upgrade = state.aiUpgrades.find(u => u.id === id);
    if (!upgrade || state.energy < upgrade.cost) return;

    setState(prev => ({
      ...prev,
      energy: prev.energy - upgrade.cost,
      aiUpgrades: prev.aiUpgrades.map(u => u.id === id ? { ...u, level: u.level + 1, cost: u.cost * 2.5 } : u)
    }));
  };

  const aiStabilizeReality = () => {
    setState(prev => {
      const sanitized = sanitizeState(prev);
      
      // AI Calculation: If the state was broken, convert the "lost" potential into prestige
      let newTiers = [...sanitized.tiers];
      
      // Check if we were in a broken state
      const wasBroken = isNaN(prev.energy) || prev.energy >= STABILITY_CAP || isNaN(prev.crystals);
      
      if (wasBroken) {
        // AI grants a "Reality Glitch" bonus
        newTiers[0] = Math.min(STABILITY_CAP, (newTiers[0] || 0) + 5000);
        newTiers[1] = Math.min(STABILITY_CAP, (newTiers[1] || 0) + 100);
      }

      return {
        ...sanitized,
        energy: STABILITY_CAP * 0.99,
        tiers: newTiers,
        crystals: Math.max(100, sanitized.crystals),
        lastUpdate: Date.now()
      };
    });
    
    setIsOpeningChest(false);
    setChestReward(null);
    setIsAiGenerating(false);
    
    // Force a UI refresh by toggling a tab or just letting React handle the state change
    setActiveTab('core');
    
    console.log("AI RECOVERY: Reality stabilized. Neural link re-established.");
  };

  const useDevCode = () => {
    const code = devCode.trim().toLowerCase();
    
    if (code === "stabilize" || code === "fix" || code === "ai_reset") {
      aiStabilizeReality();
      setShowDevConsole(false);
      setDevCode("");
      return;
    }

    // Handle crystals suffix
    if (code.endsWith("crystals")) {
      const valStr = code.replace("crystals", "");
      const numericValue = Number(valStr);
      if (!isNaN(numericValue)) {
        setState(prev => ({
          ...prev,
          crystals: prev.crystals + numericValue
        }));
        setShowDevConsole(false);
        setDevCode("");
        return;
      }
    }

    if (code === "rigged") {
      setState(prev => ({ ...prev, isRigged: !prev.isRigged }));
      setShowDevConsole(false);
      setDevCode("");
      alert(`CASINO RIGGING: ${!state.isRigged ? 'ENABLED' : 'DISABLED'}`);
      return;
    }

    if (code === "chips") {
      setState(prev => ({ ...prev, casinoChips: prev.casinoChips + 1000000 }));
      setShowDevConsole(false);
      setDevCode("");
      alert("1,000,000 Casino Chips added!");
      return;
    }

    // Handle numeric or scientific notation codes
    const numericValue = Number(devCode);
    if (!isNaN(numericValue) && devCode.trim() !== "") {
      // Cap dev console input to prevent NaN/Infinity
      const safeValue = Math.min(STABILITY_CAP, numericValue);
      setState(prev => ({
        ...prev,
        energy: Math.min(STABILITY_CAP, prev.energy + safeValue)
      }));
      setShowDevConsole(false);
      setDevCode("");
      return;
    }

    if (devCode === "nexus_god") {
      setState(prev => ({
        ...prev,
        energy: prev.energy + 1000000000,
        crystals: prev.crystals + 10000
      }));
      alert("God mode activated!");
      setShowDevConsole(false);
      setDevCode("");
    } else if (devCode === "rich") {
      setState(prev => ({
        ...prev,
        energy: prev.energy + 1000000
      }));
      setShowDevConsole(false);
      setDevCode("");
    } else {
      alert("Invalid code");
    }
  };

  const availableSkills = React.useMemo(() => {
    // Optimization: Since skills are roughly sequential, we can start searching from a reasonable offset
    // based on how many skills are already purchased.
    const purchasedCount = state.purchasedSkills.length;
    const searchStart = Math.max(0, purchasedCount - 50); 
    
    const results: SkillNode[] = [];
    const purchasedSet = new Set(state.purchasedSkills);

    // We only need to show a few available skills at a time
    for (let i = 0; i < SKILL_NODES.length; i++) {
      const node = SKILL_NODES[i];
      if (purchasedSet.has(node.id)) continue;
      
      if (node.parents.every(pId => purchasedSet.has(pId))) {
        results.push(node);
        if (results.length >= 24) break;
      }
    }
    return results;
  }, [state.purchasedSkills]);

  const openChest = (amount: number = 1) => {
    // Cap chest opening to prevent browser hang
    const safeAmount = Math.min(amount, 10000);
    const totalCost = CHEST_COST * safeAmount;
    if (state.crystals < totalCost || isOpeningChest || safeAmount <= 0) return;

    setIsOpeningChest(true);
    setChestReward(null);
    
    setState(prev => ({ 
      ...prev, 
      crystals: prev.crystals - totalCost,
      chestsOpened: (prev.chestsOpened || 0) + safeAmount
    }));

    // RNG Logic
    setTimeout(() => {
      let totalEnergyGain = 0;
      let totalCrystalGain = 0;
      let totalMultGain = 0;

      for (let i = 0; i < safeAmount; i++) {
        const roll = Math.random() * 100;
        if (roll < 70) { // Common
          if (safeAmount === 1) {
            totalEnergyGain += energyPerSecond * 600;
          }
        } else if (roll < 90) { // Rare
          totalEnergyGain += energyPerSecond * 3600;
          totalCrystalGain += 10;
        } else if (roll < 99) { // Epic
          totalEnergyGain += energyPerSecond * 18000;
          totalCrystalGain += 50;
        } else { // Legendary
          const volatileMult = Math.random() < 0.1 ? 5.0 : (0.01 + Math.random() * 0.99);
          totalMultGain += volatileMult;
        }
      }

      if (safeAmount === 1) {
        if (totalMultGain > 0) {
          setChestReward(`LEGENDARY: +${totalMultGain.toFixed(2)}x Mult!`);
        } else if (totalCrystalGain > 0) {
          setChestReward(`RARE/EPIC: +${totalCrystalGain} Crystals!`);
        } else if (totalEnergyGain > 0) {
          setChestReward(`COMMON: ${formatNumber(totalEnergyGain)} Energy`);
        } else {
          setChestReward(`EMPTY... (+0)`);
        }
      } else {
        setChestReward(`Opened ${safeAmount} Chests! +${totalMultGain.toFixed(2)}x Mult!`);
      }

      setState(prev => ({
        ...prev,
        energy: Math.min(STABILITY_CAP, prev.energy + totalEnergyGain),
        crystals: prev.crystals + totalCrystalGain,
        permanentMultipliers: (prev.permanentMultipliers || 1) + totalMultGain
      }));
      setIsOpeningChest(false);
    }, 500); 
  };

  const watchAd = () => {
    setIsWatchingAd(true);
    // Simulate 5 second ad
    setTimeout(() => {
      setIsWatchingAd(false);
      setState(prev => ({
        ...prev,
        adBoostEndTime: Date.now() + (60 * 1000 * 2) // 2 minutes boost
      }));
      alert("Ad complete! Enjoy 2x Energy for 2 minutes.");
    }, 5000);
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = SHOP_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const currentLevel = state.upgrades[upgradeId] || 0;
    
    const tier = upgrade.currencyTier || 0;
    const getCurrency = () => {
      if (tier === 0) return state.energy;
      return state.tiers[tier - 1] || 0;
    };

    let totalCost = 0;
    let levelsToBuy = 0;
    const maxToBuy = buyAmount === 'MAX' ? 1000 : buyAmount;
    
    for (let i = 0; i < maxToBuy; i++) {
      let nextLevelCost = upgrade.cost * Math.pow(upgrade.costMultiplier, currentLevel + i);
      // Cap cost to allow purchasing even at extreme levels
      if (nextLevelCost >= STABILITY_CAP * 0.9) nextLevelCost = STABILITY_CAP * 0.9;
      
      if (getCurrency() >= totalCost + nextLevelCost) {
        totalCost += nextLevelCost;
        levelsToBuy++;
      } else {
        break;
      }
    }

    if (levelsToBuy > 0) {
      setState(prev => {
        const newState = { ...prev };
        if (tier === 0) {
          newState.energy -= totalCost;
        } else {
          const newTiers = [...prev.tiers];
          newTiers[tier - 1] -= totalCost;
          newState.tiers = newTiers;
        }
        newState.upgrades = {
          ...prev.upgrades,
          [upgradeId]: currentLevel + levelsToBuy
        };
        return newState;
      });
    }
  };

  const fullReset = () => {
    setState(INITIAL_STATE);
    localStorage.removeItem('nexus_idle_save');
    setActiveTab('core');
    setShowResetConfirm(false);
  };

  const buyCrystals = (amount: number, cost: number) => {
    // Simulated micro-transaction
    alert(`Simulating purchase of ${amount} crystals for $${cost}...`);
    setState(prev => ({ ...prev, crystals: prev.crystals + amount }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-gold/30 bg-casino-grid">
      {/* Cosmic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-900/5 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gold/10 bg-black/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center shadow-[0_0_30px_rgba(255,215,0,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 gold-gradient rounded-xl flex items-center justify-center shadow-lg shadow-gold/20 animate-float">
            <Coins className="text-black w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase italic text-glow-gold">NEXUS CASINO</h1>
            <p className="text-[9px] text-gold font-mono tracking-[0.3em] uppercase opacity-70">The Infinite Gamble</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Bankroll</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-2xl font-mono font-bold text-glow-emerald">{formatNumber(state.energy)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">VIP Credits</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-2xl font-mono font-bold text-gold text-glow-gold">{state.crystals}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 flex flex-wrap justify-center gap-3 p-6">
        {[
          { id: 'core', label: 'THE PIT', icon: Zap },
          { id: 'skills', label: 'STRATEGY', icon: GitBranch },
          { id: 'shop', label: 'MARKET', icon: ShoppingBag },
          { id: 'ai', label: 'AI DEALER', icon: Cpu },
          { id: 'gambling', label: 'HIGH STAKES', icon: Coins },
          { id: 'leaderboard', label: 'HALL OF FAME', icon: Activity },
          { id: 'premium', label: 'VIP LOUNGE', icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all border
              ${activeTab === tab.id 
                ? 'bg-gold text-black border-gold shadow-[0_0_20px_rgba(255,215,0,0.3)] scale-105' 
                : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/30 hover:text-gold'}
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'core' && (
            <motion.div
              key="core"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start"
            >
              {/* Main Core Section */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-12 bg-white/5 rounded-[40px] border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-casino-grid opacity-20" />
                
                <div className="relative z-10 text-center mb-12">
                  <h2 className="text-4xl font-bold tracking-tighter uppercase italic mb-2 text-glow-gold">THE NEXUS CORE</h2>
                  <p className="text-xs text-white/40 uppercase tracking-[0.4em]">Tap the core to generate wealth</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95, rotate: -5 }}
                  onClick={handleManualClick}
                  className="w-72 h-72 rounded-full gold-gradient p-1 shadow-[0_0_80px_rgba(255,215,0,0.3)] relative group cursor-pointer"
                >
                  <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gold/10 animate-pulse" />
                    <Zap className="w-24 h-24 text-gold relative z-10 animate-float" />
                    
                    {/* Inner spinning ring */}
                    <div className="absolute inset-4 border-2 border-dashed border-gold/20 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-8 border border-gold/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  </div>
                </motion.button>

                <div className="mt-16 grid grid-cols-2 gap-16 text-center relative z-10">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 border-glow-gold">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Payout Per Click</p>
                    <p className="text-3xl font-mono font-bold text-emerald-400 text-glow-emerald">+{formatNumber(energyPerClick)}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 border-glow-gold">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Passive Revenue</p>
                    <p className="text-3xl font-mono font-bold text-gold text-glow-gold">+{formatNumber(energyPerSecond)}</p>
                  </div>
                </div>
              </div>

              {/* Stats Sidebar */}
              <div className="space-y-6">
                {/* Prestige Tiers */}
                {state.tiers.map((val, idx) => val > 0 && (
                  <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Atom className="w-4 h-4 text-purple-400" />
                      {TIER_NAMES[idx]}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/40 text-sm">Stored {TIER_NAMES[idx].split(' ')[0]}</span>
                        <span className="font-mono font-bold text-purple-400">{formatNumber(val)}</span>
                      </div>
                      {idx < state.tiers.length - 1 && val >= STABILITY_CAP * 0.1 && (
                        <div className="text-[10px] text-white/20 text-center uppercase tracking-tighter">
                          Approaching {TIER_NAMES[idx+1]} Threshold
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Session Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-sm">Total Earned</span>
                      <span className="font-mono font-bold">{formatNumber(state.totalEnergyEarned)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-sm">Global Multiplier</span>
                      <span className="font-mono font-bold text-emerald-400">x{globalMult.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-sm">Click Multiplier</span>
                      <span className="font-mono font-bold text-indigo-400">x{clickMult.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-500" />
                    Active Skills
                  </h3>
                  <div className="space-y-3">
                    {state.purchasedSkills.slice(-5).reverse().map(skillId => {
                      const skill = SKILL_NODES.find(s => s.id === skillId);
                      return (
                        <div key={skillId} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            {IconMap[skill?.icon || 'Zap']}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold">{skill?.name}</p>
                            <p className="text-[10px] text-white/40">{skill?.categoryId}</p>
                          </div>
                        </div>
                      );
                    })}
                    {state.purchasedSkills.length === 0 && (
                      <p className="text-xs text-white/20 italic text-center py-4">No skills purchased yet</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold mb-4 tracking-tight">THE INFINITE TREE</h2>
                <p className="text-white/40 mb-6">Unlock nodes to reveal deeper paths. Future upgrades remain hidden until prerequisites are met.</p>
                <button
                  onClick={buyMaxSkills}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-purple-500/20"
                >
                  Buy Max Afforded Skills
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableSkills.map((node) => {
                  const canAfford = state.energy >= node.cost;

                  return (
                    <div 
                      key={node.id}
                      className="p-6 rounded-3xl border transition-all relative overflow-hidden bg-white/5 border-white/10 hover:border-emerald-500/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 text-white">
                          {IconMap[node.icon] || <Zap className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold">{node.name}</h4>
                          <p className="text-xs text-white/40 mb-4">{node.description}</p>
                          
                          <button
                            onClick={() => buySkill(node.id)}
                            disabled={!canAfford}
                            className={`
                              w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                              ${canAfford 
                                ? 'bg-white text-black hover:bg-emerald-400' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'}
                            `}
                          >
                            Unlock ({formatNumber(node.cost)})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-12"
            >
              <div className="flex justify-center gap-4">
                {[1, 10, 100, 'MAX'].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBuyAmount(amount as 1 | 10 | 100 | 'MAX')}
                    className={`px-6 py-2 rounded-xl font-bold transition-all border ${buyAmount === amount ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                  >
                    {amount === 'MAX' ? 'MAX' : `x${amount}`}
                  </button>
                ))}
              </div>

              {/* Nexus Core Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-purple-500/50" />
                  <h3 className="text-xl font-bold tracking-[0.3em] uppercase text-purple-400 flex items-center gap-3">
                    <Cpu className="w-6 h-6" />
                    Nexus Core
                  </h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-purple-500/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SHOP_UPGRADES.filter(u => u.category === 'core').map((upgrade) => {
                    const level = state.upgrades[upgrade.id] || 0;
                    let totalCost = 0;
                    let levelsToBuy = 0;
                    const maxToBuy = buyAmount === 'MAX' ? 1000 : buyAmount;
                    const tier = upgrade.currencyTier || 0;
                    const getCurrency = () => {
                      if (tier === 0) return state.energy;
                      return state.tiers[tier - 1] || 0;
                    };
                    for (let i = 0; i < maxToBuy; i++) {
                      let nextLevelCost = upgrade.cost * Math.pow(upgrade.costMultiplier, level + i);
                      if (nextLevelCost >= STABILITY_CAP * 0.9) nextLevelCost = STABILITY_CAP * 0.9;
                      if (getCurrency() >= totalCost + nextLevelCost) {
                        totalCost += nextLevelCost;
                        levelsToBuy++;
                      } else if (i === 0) {
                        totalCost = nextLevelCost;
                        break;
                      } else {
                        break;
                      }
                    }
                    const currencyName = tier === 0 ? 'E' : TIER_NAMES[tier - 1].split(' ')[0][0];
                    const currencyColor = tier === 0 ? 'text-emerald-400' : 'text-purple-400';
                    const canAfford = getCurrency() >= totalCost;
                    return (
                      <div key={upgrade.id} className="bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col group hover:border-purple-500/30 transition-all relative">
                        <div className="absolute top-4 right-4">
                          <span className={`bg-white/5 ${currencyColor} text-[10px] font-bold px-2 py-1 rounded-full border border-white/10`}>
                            {formatNumber(totalCost)} {currencyName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-colors">
                            <Brain className="w-6 h-6" />
                          </div>
                          <div className="text-right pr-16">
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Sync</p>
                            <p className="text-xl font-mono font-bold">{level}</p>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{upgrade.name}</h3>
                        <p className="text-xs text-white/40 mb-6 flex-1">{upgrade.description}</p>
                        <button
                          onClick={() => buyUpgrade(upgrade.id)}
                          disabled={!canAfford}
                          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${canAfford ? 'bg-white text-black hover:bg-purple-400 shadow-lg shadow-white/5' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                          {canAfford ? `Upgrade ${levelsToBuy > 1 ? levelsToBuy : ''} (${formatNumber(totalCost)})` : `Insufficient Funds`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Standard Upgrades Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500/50" />
                  <h3 className="text-xl font-bold tracking-[0.3em] uppercase text-emerald-400 flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6" />
                    Standard Modules
                  </h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500/50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SHOP_UPGRADES.filter(u => u.category === 'standard').map((upgrade) => {
                    const level = state.upgrades[upgrade.id] || 0;
                    let totalCost = 0;
                    let levelsToBuy = 0;
                    const maxToBuy = buyAmount === 'MAX' ? 1000 : buyAmount;
                    const tier = upgrade.currencyTier || 0;
                    const getCurrency = () => {
                      if (tier === 0) return state.energy;
                      return state.tiers[tier - 1] || 0;
                    };
                    for (let i = 0; i < maxToBuy; i++) {
                      let nextLevelCost = upgrade.cost * Math.pow(upgrade.costMultiplier, level + i);
                      if (nextLevelCost >= STABILITY_CAP * 0.9) nextLevelCost = STABILITY_CAP * 0.9;
                      if (getCurrency() >= totalCost + nextLevelCost) {
                        totalCost += nextLevelCost;
                        levelsToBuy++;
                      } else if (i === 0) {
                        totalCost = nextLevelCost;
                        break;
                      } else {
                        break;
                      }
                    }
                    const currencyName = tier === 0 ? 'E' : TIER_NAMES[tier - 1].split(' ')[0][0];
                    const currencyColor = tier === 0 ? 'text-emerald-400' : 'text-purple-400';
                    const canAfford = getCurrency() >= totalCost;
                    return (
                      <div key={upgrade.id} className="bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col group hover:border-emerald-500/30 transition-all relative">
                        <div className="absolute top-4 right-4">
                          <span className={`bg-white/5 ${currencyColor} text-[10px] font-bold px-2 py-1 rounded-full border border-white/10`}>
                            {formatNumber(totalCost)} {currencyName}
                          </span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            {upgrade.type === 'click' ? <Zap className="w-6 h-6" /> : upgrade.type === 'passive' ? <Cpu className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                          </div>
                          <div className="text-right pr-16">
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Level</p>
                            <p className="text-xl font-mono font-bold">{level}</p>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{upgrade.name}</h3>
                        <p className="text-xs text-white/40 mb-6 flex-1">{upgrade.description}</p>
                        <button
                          onClick={() => buyUpgrade(upgrade.id)}
                          disabled={!canAfford}
                          className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all ${canAfford ? 'bg-white text-black hover:bg-emerald-400 shadow-lg shadow-white/5' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                          {canAfford ? `Buy ${levelsToBuy > 1 ? levelsToBuy : ''} (${formatNumber(totalCost)})` : `Insufficient Funds`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold mb-4 tracking-tight">AI EVOLUTION CORE</h2>
                <p className="text-white/40 mb-8">The AI analyzes your energy patterns to hallucinate new upgrades. These upgrades are unique to your timeline.</p>
                
                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={generateAiUpgrade}
                    disabled={isAiGenerating || state.energy < 1e10}
                    className={`
                      px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-xl
                      ${!isAiGenerating && state.energy >= 1e10 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20' 
                        : 'bg-white/5 text-white/20 cursor-not-allowed'}
                    `}
                  >
                    {isAiGenerating ? 'ANALYZING PATTERNS...' : 'GENERATE AI UPGRADE (10.00B Energy)'}
                  </button>

                  <button
                    onClick={() => setState(prev => ({ ...prev, aiAutoGenerate: !prev.aiAutoGenerate }))}
                    className={`
                      px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                      ${state.aiAutoGenerate ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border border-white/10'}
                    `}
                  >
                    Constant Analysis: {state.aiAutoGenerate ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.aiUpgrades.map((upgrade) => (
                  <div key={upgrade.id} className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-xl font-bold text-emerald-400">{upgrade.name}</h4>
                      <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold">LVL {upgrade.level}</span>
                    </div>
                    <p className="text-sm text-white/40 mb-6">{upgrade.description}</p>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xs text-white/20 uppercase tracking-widest">Efficiency</span>
                      <span className="font-mono font-bold text-emerald-400">+{((upgrade.multiplier - 1) * upgrade.level * 100).toFixed(0)}%</span>
                    </div>
                    <button
                      onClick={() => buyAiUpgrade(upgrade.id)}
                      disabled={state.energy < upgrade.cost}
                      className={`
                        w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all
                        ${state.energy >= upgrade.cost 
                          ? 'bg-white text-black hover:bg-emerald-400' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed'}
                      `}
                    >
                      Upgrade ({formatNumber(upgrade.cost)})
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'gambling' && (
            <motion.div
              key="gambling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`relative overflow-hidden bg-black/60 rounded-[2rem] md:rounded-[3rem] border border-white/10 ${isMobile ? 'h-[600px]' : 'h-[800px]'}`}
              onClick={(e) => {
                if (activeGameId) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Scale coordinates if mobile
                const scaleX = isMobile ? 800 / rect.width : 1;
                const scaleY = isMobile ? 600 / rect.height : 1;
                
                setState(prev => ({ ...prev, playerPos: { x: x * (isMobile ? 1000/rect.width : 1), y: y * (isMobile ? 800/rect.height : 1) } }));
              }}
            >
              <div className={`absolute inset-0 transition-transform duration-500 ${isMobile ? 'scale-[0.7] origin-top' : ''}`}>
                {/* Casino Floor Grid */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-10 grid-rows-10 opacity-5">
                    {[...Array(100)].map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>

                {/* Entities (Games & NPCs) */}
                {CASINO_ENTITIES.map(entity => (
                  <motion.div
                    key={entity.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    className={`absolute w-16 h-16 md:w-20 md:h-20 ${entity.color} rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl border-2 border-white/20 z-10 group`}
                    style={{ left: entity.x - (isMobile ? 32 : 40), top: entity.y - (isMobile ? 32 : 40) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (entity.type === 'game') {
                        setActiveGameId(entity.id);
                      } else if (entity.type === 'npc') {
                        setNpcDialogue({ name: entity.name || 'NPC', message: entity.message || '...' });
                      }
                    }}
                  >
                    {/* NPC Speech Bubble */}
                    <AnimatePresence>
                      {nearbyNpc === entity.id && entity.type === 'npc' && (
                        <motion.div
                          initial={{ opacity: 0, y: 0, scale: 0.8 }}
                          animate={{ opacity: 1, y: -80, scale: 1 }}
                          exit={{ opacity: 0, y: 0, scale: 0.8 }}
                          className="absolute left-1/2 -translate-x-1/2 bg-white text-black px-4 py-2 rounded-2xl text-[10px] font-bold w-48 text-center shadow-2xl z-[60] after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white"
                        >
                          {entity.message}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 uppercase tracking-widest">
                      {entity.name}
                    </div>
                    <span className="text-[10px] font-black text-center uppercase leading-tight px-2 drop-shadow-md">{entity.name.split(' ')[0]}</span>
                  </motion.div>
                ))}

                {/* Player Character */}
                <motion.div
                  animate={{ x: state.playerPos.x - 24, y: state.playerPos.y - 24 }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                  className="absolute w-10 h-10 md:w-12 md:h-12 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.6)] z-50 flex items-center justify-center border-4 border-black"
                >
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-black rounded-full animate-pulse" />
                </motion.div>
              </div>

              {/* Rigged Sign */}
              {state.isRigged && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 px-6 py-2 md:px-10 md:py-4 bg-red-600 text-white font-black italic tracking-[0.4em] rounded-full shadow-[0_0_50px_rgba(220,38,38,0.7)] z-[60] border-4 border-white text-sm md:text-xl"
                >
                  RIGGED
                </motion.div>
              )}

              {/* Stats Overlay */}
              <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 flex justify-between items-end pointer-events-none z-[70]">
                <div className="bg-black/80 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 flex items-center gap-4 md:gap-6 pointer-events-auto">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-emerald-500/30">
                      <Coins className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/40">Chips</p>
                      <p className="text-lg md:text-2xl font-mono font-bold text-emerald-400">{formatNumber(state.casinoChips)}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-white/20 text-[8px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.5em] font-bold hidden sm:block">
                  {isMobile ? 'Tap to move' : 'Click to move • Click games to play'}
                </div>
              </div>

              {/* Active Game Modal */}
              <AnimatePresence>
                {activeGameId && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12"
                  >
                    <div className="w-full max-w-5xl bg-zinc-900 rounded-[4rem] border border-white/10 p-8 md:p-12 relative max-h-full overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                      <button 
                        onClick={() => setActiveGameId(null)}
                        className="absolute top-8 right-8 w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 hover:scale-110 active:scale-95"
                      >
                        <X className="w-8 h-8" />
                      </button>

                      {activeGameId === 'blackjack' && (
                        <div className="space-y-12">
                          <div className="flex justify-between items-end">
                            <div>
                              <h3 className="text-5xl font-black text-emerald-400 tracking-tighter">BLACKJACK</h3>
                              <p className="text-white/40 uppercase tracking-widest text-xs mt-2">Beat the dealer to 21</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Bet</p>
                              <p className="text-3xl font-mono font-bold text-emerald-400">{formatNumber(bjBet)}</p>
                            </div>
                          </div>

                          <div className="aspect-video bg-emerald-900/10 rounded-[3rem] border-4 border-emerald-500/20 p-12 flex flex-col justify-between relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]" />
                            
                            {/* Dealer */}
                            <div className="flex flex-col items-center gap-4 relative z-10">
                              <span className="text-xs uppercase tracking-[0.3em] text-white/30 font-bold">Dealer Hand ({calculateHandValue(bjDealerHand)})</span>
                              <div className="flex gap-4 h-32">
                                {bjDealerHand.map((card, i) => (
                                  <motion.div 
                                    key={i}
                                    initial={{ y: -100, opacity: 0, rotate: -10 }}
                                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                                    className={`w-20 h-32 bg-white rounded-xl flex flex-col items-center justify-center text-black font-bold shadow-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}
                                  >
                                    <span className="text-sm self-start ml-2 mt-1">{card.rank}</span>
                                    <span className="text-4xl my-auto">{card.suit}</span>
                                    <span className="text-sm self-end mr-2 mb-1 rotate-180">{card.rank}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>

                            {/* Message Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                              <AnimatePresence>
                                {bjMessage && (
                                  <motion.div 
                                    initial={{ scale: 0.5, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 1.5, opacity: 0 }}
                                    className="bg-black/90 backdrop-blur-xl px-12 py-6 rounded-3xl border-2 border-white/20 text-4xl font-black text-white shadow-[0_0_50px_rgba(0,0,0,0.5)] uppercase italic tracking-widest"
                                  >
                                    {bjMessage}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {/* Player */}
                            <div className="flex flex-col items-center gap-4 relative z-10">
                              <div className="flex gap-4 h-32">
                                {bjPlayerHand.map((card, i) => (
                                  <motion.div 
                                    key={i}
                                    initial={{ y: 100, opacity: 0, rotate: 10 }}
                                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                                    className={`w-20 h-32 bg-white rounded-xl flex flex-col items-center justify-center text-black font-bold shadow-2xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'}`}
                                  >
                                    <span className="text-sm self-start ml-2 mt-1">{card.rank}</span>
                                    <span className="text-4xl my-auto">{card.suit}</span>
                                    <span className="text-sm self-end mr-2 mb-1 rotate-180">{card.rank}</span>
                                  </motion.div>
                                ))}
                              </div>
                              <span className="text-xs uppercase tracking-[0.3em] text-white/30 font-bold">Your Hand ({calculateHandValue(bjPlayerHand)})</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <button 
                              onClick={() => setMaxBet('bj')} 
                              className={`py-6 rounded-3xl font-black transition-all uppercase tracking-widest text-xs border ${state.autoMaxBet ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/30'}`}
                            >
                              {state.autoMaxBet ? 'AUTO MAX ON' : 'MAX BET'}
                            </button>
                            <button 
                              onClick={startBlackjack} 
                              disabled={bjStatus === 'playing' || bjStatus === 'dealerTurn'}
                              className="py-6 bg-emerald-500 text-black font-black rounded-3xl hover:bg-emerald-400 transition-all uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                              DEAL
                            </button>
                            <button 
                              onClick={hitBlackjack} 
                              disabled={bjStatus !== 'playing'}
                              className="py-6 bg-white/10 hover:bg-white/20 rounded-3xl font-black transition-all uppercase tracking-widest text-xs border border-white/10 disabled:opacity-50"
                            >
                              HIT
                            </button>
                            <button 
                              onClick={() => standBlackjack()} 
                              disabled={bjStatus !== 'playing'}
                              className="py-6 bg-indigo-500 hover:bg-indigo-400 rounded-3xl font-black transition-all uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                              STAND
                            </button>
                          </div>
                        </div>
                      )}

                      {activeGameId === 'roulette' && (
                        <div className="space-y-12">
                          <div className="flex justify-between items-end">
                            <div>
                              <h3 className="text-5xl font-black text-indigo-400 tracking-tighter">NEON ROULETTE</h3>
                              <p className="text-white/40 uppercase tracking-widest text-xs mt-2">Predict the landing</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Wager</p>
                              <p className="text-3xl font-mono font-bold text-indigo-400">{formatNumber(rouletteBet?.amount || 0)}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            {/* Wheel Visual */}
                            <div className="flex flex-col items-center gap-12 relative">
                              <div className="relative w-80 h-80 rounded-full border-[12px] border-white/10 flex items-center justify-center shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                                <motion.div 
                                  animate={rouletteSpinning ? { rotate: 3600 } : { rotate: 0 }}
                                  transition={{ duration: 2, ease: "circOut" }}
                                  className="absolute inset-0 bg-[conic-gradient(from_0deg,#ef4444_0deg_18deg,#111_18deg_36deg,#ef4444_36deg_54deg,#111_54deg_72deg,#ef4444_72deg_90deg,#111_90deg_108deg,#ef4444_108deg_126deg,#111_126deg_144deg,#ef4444_144deg_162deg,#111_162deg_180deg,#ef4444_180deg_198deg,#111_198deg_216deg,#ef4444_216deg_234deg,#111_234deg_252deg,#ef4444_252deg_270deg,#111_270deg_288deg,#ef4444_288deg_306deg,#111_306deg_324deg,#ef4444_324deg_342deg,#10b981_342deg_360deg)] rounded-full"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-full pointer-events-none" />
                                
                                {/* Ball Animation */}
                                <motion.div
                                  animate={{ rotate: rouletteBallAngle }}
                                  transition={{ duration: 2, ease: "circOut" }}
                                  className="absolute inset-0 z-20"
                                >
                                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] border-2 border-black/20" />
                                </motion.div>

                                <div className="z-10 text-7xl font-black font-mono text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
                                  {rouletteResult !== null ? rouletteResult : '?'}
                                </div>
                              </div>

                              {/* Ghost Hand Visual */}
                              <AnimatePresence>
                                {ghostHandPos && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 200, scale: 2 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -200 }}
                                    className="absolute bottom-0 z-[110] text-[120px] pointer-events-none drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                                  >
                                    🖐️
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="flex gap-4 w-full">
                                <button 
                                  onClick={() => setMaxBet('roulette')} 
                                  className={`px-8 py-6 rounded-3xl font-black transition-all uppercase tracking-widest text-xs border ${state.autoMaxBet ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/30'}`}
                                >
                                  {state.autoMaxBet ? 'AUTO MAX ON' : 'MAX BET'}
                                </button>
                                <button 
                                  onClick={spinRoulette}
                                  disabled={rouletteSpinning || !rouletteBet || state.casinoChips < rouletteBet.amount}
                                  className="flex-1 py-6 bg-indigo-500 text-white font-black rounded-3xl hover:bg-indigo-400 transition-all uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                                >
                                  {rouletteSpinning ? 'SPINNING...' : 'SPIN WHEEL'}
                                </button>
                              </div>
                            </div>

                            {/* Betting Board */}
                            <div className="space-y-8">
                              <div className="grid grid-cols-6 gap-3">
                                {[...Array(37)].map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setRouletteBet({ type: 'number', value: i, amount: rouletteBet?.amount || 100 })}
                                    className={`aspect-square rounded-xl font-mono text-sm font-black transition-all border-2
                                      ${i === 0 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 
                                        [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(i) 
                                        ? 'bg-red-500/20 border-red-500/50 text-red-400' 
                                        : 'bg-zinc-800 border-white/5 text-white/20'}
                                      ${rouletteBet?.type === 'number' && rouletteBet.value === i ? 'ring-4 ring-white scale-110 z-10 bg-white text-black border-white' : 'hover:border-white/20'}
                                    `}
                                  >
                                    {i}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => setRouletteBet({ type: 'color', value: 'red', amount: rouletteBet?.amount || 100 })}
                                  className={`flex-1 py-6 rounded-3xl bg-red-500/20 border-2 border-red-500/50 text-red-400 font-black uppercase tracking-widest text-xs transition-all
                                    ${rouletteBet?.type === 'color' && rouletteBet.value === 'red' ? 'ring-4 ring-white scale-105 bg-red-500 text-white' : 'hover:bg-red-500/30'}
                                  `}
                                >
                                  RED (2x)
                                </button>
                                <button 
                                  onClick={() => setRouletteBet({ type: 'color', value: 'black', amount: rouletteBet?.amount || 100 })}
                                  className={`flex-1 py-6 rounded-3xl bg-zinc-800 border-2 border-white/10 text-white/40 font-black uppercase tracking-widest text-xs transition-all
                                    ${rouletteBet?.type === 'color' && rouletteBet.value === 'black' ? 'ring-4 ring-white scale-105 bg-white text-black' : 'hover:bg-white/5'}
                                  `}
                                >
                                  BLACK (2x)
                                </button>
                              </div>
                              
                              <div className="space-y-4">
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Quick Bet Amounts</p>
                                <div className="flex flex-wrap gap-2">
                                  {[100, 1000, 10000, 100000, 1000000].map(amt => (
                                    <button
                                      key={amt}
                                      onClick={() => setRouletteBet(prev => prev ? { ...prev, amount: amt } : { type: 'color', value: 'red', amount: amt })}
                                      className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border-2 ${rouletteBet?.amount === amt ? 'bg-white text-black border-white' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                                    >
                                      {formatNumber(amt)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeGameId !== 'blackjack' && activeGameId !== 'roulette' && (
                        <div className="space-y-12">
                          <div className="flex justify-between items-end">
                            <div>
                              <h3 className="text-5xl font-black uppercase tracking-tighter">{activeGameId?.replace('_', ' ')}</h3>
                              <p className="text-white/40 uppercase tracking-widest text-xs mt-2">High Stakes Gaming</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Current Wager</p>
                              <p className="text-3xl font-mono font-bold text-emerald-400">{formatNumber(genericGameBet)}</p>
                            </div>
                          </div>

                          <div className="aspect-video bg-white/5 rounded-[4rem] flex flex-col items-center justify-center gap-12 border-4 border-white/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                            
                            {isGenericSpinning ? (
                              <motion.div 
                                animate={{ 
                                  rotate: 360,
                                  scale: [1, 1.2, 1],
                                  filter: ['blur(0px)', 'blur(4px)', 'blur(0px)']
                                }} 
                                transition={{ repeat: Infinity, duration: 0.5 }} 
                                className="text-[120px] drop-shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                              >
                                🎰
                              </motion.div>
                            ) : (
                              <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-6xl font-black text-center px-12 py-6 rounded-3xl border-2 ${genericGameResult?.includes('WON') ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/20'}`}
                              >
                                {genericGameResult || "PLACE YOUR BET"}
                              </motion.div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex gap-4">
                              <button 
                                onClick={() => setMaxBet('generic')} 
                                className={`px-10 py-6 rounded-3xl font-black transition-all uppercase tracking-widest text-xs border ${state.autoMaxBet ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/30'}`}
                              >
                                {state.autoMaxBet ? 'AUTO MAX ON' : 'MAX BET'}
                              </button>
                              <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 flex items-center px-8">
                                <Coins className="w-6 h-6 text-emerald-400 mr-4" />
                                <input 
                                  type="number" 
                                  value={genericGameBet}
                                  onChange={(e) => setGenericGameBet(Math.max(1, Number(e.target.value)))}
                                  className="bg-transparent font-mono font-bold text-2xl w-full focus:outline-none"
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => playGenericGame(activeGameId!)} 
                              disabled={isGenericSpinning || state.casinoChips < genericGameBet}
                              className="py-6 bg-white text-black font-black rounded-3xl hover:bg-emerald-400 transition-all uppercase tracking-widest text-lg shadow-2xl disabled:opacity-50"
                            >
                              {isGenericSpinning ? 'GAMBLING...' : `PLAY ROUND`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 tracking-tight">PERSONAL TIMELINE</h2>
                <p className="text-white/40">Your greatest achievements across all realities. This data is stored locally in your neural link.</p>
              </div>

              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-white/40">Date</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-white/40">Highest Energy</th>
                      <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-white/40">Highest Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.personalRecords?.length > 0 ? (
                      [...state.personalRecords].sort((a, b) => b.energy - a.energy).map((record, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6 font-mono text-sm text-white/60">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-8 py-6 font-mono font-bold text-emerald-400">
                            {formatNumber(record.energy)}
                          </td>
                          <td className="px-8 py-6 font-mono text-purple-400">
                            {TIER_NAMES[record.highestTier]}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-white/20 italic">No records found. Stabilize your energy to record a timeline.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'premium' && (
            <motion.div
              key="premium"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              {/* Currency Exchange Section */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-emerald-500/50" />
                  <h3 className="text-xl font-bold tracking-[0.3em] uppercase text-emerald-400 flex items-center gap-3">
                    <Coins className="w-6 h-6" />
                    Currency Exchange
                  </h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-emerald-500/50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Energy to Chips */}
                  <div className="bg-white/5 rounded-3xl border border-white/10 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold">Energy → Chips</h4>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Rate: 1M E = 1 Chip</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[100, 1000, 10000, 100000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => exchangeChips('energy', amt)}
                          disabled={state.energy < amt * 1e6}
                          className={`py-4 rounded-2xl font-bold transition-all border ${state.energy >= amt * 1e6 ? 'bg-white text-black hover:bg-emerald-400 border-white' : 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed'}`}
                        >
                          Get {formatNumber(amt)} Chips
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crystals to Chips */}
                  <div className="bg-white/5 rounded-3xl border border-white/10 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold">Crystals → Chips</h4>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest">Rate: 1 C = 10 Chips</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => exchangeChips('crystals', amt)}
                          disabled={state.crystals < amt / 10}
                          className={`py-4 rounded-2xl font-bold transition-all border ${state.crystals >= amt / 10 ? 'bg-indigo-500 text-white hover:bg-indigo-400 border-indigo-500' : 'bg-white/5 text-white/20 border-white/10 cursor-not-allowed'}`}
                        >
                          Get {formatNumber(amt)} Chips
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ad Section */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-3xl border border-white/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2">
                  <span className="bg-white/10 text-[8px] px-2 py-0.5 rounded uppercase tracking-tighter">Sponsored</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Rewarded Transmission</h3>
                    <p className="text-sm text-white/40">Watch a short transmission to double your energy output for 2 minutes.</p>
                    {adTimeLeft > 0 && (
                      <p className="text-emerald-400 font-mono text-xs mt-2 font-bold">BOOST ACTIVE: {adTimeLeft}s</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={watchAd}
                  disabled={isWatchingAd || adTimeLeft > 0}
                  className={`
                    px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all
                    ${isWatchingAd || adTimeLeft > 0 
                      ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                      : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'}
                  `}
                >
                  {isWatchingAd ? 'Transmitting...' : adTimeLeft > 0 ? 'Boost Active' : 'Watch Ad (+2x Energy)'}
                </button>
              </div>

              {/* Gambling / Chest Section */}
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4 tracking-tight flex items-center justify-center gap-3">
                  <Sparkles className="text-indigo-400" />
                  VOID CHESTS
                  <Sparkles className="text-indigo-400" />
                </h2>
                <p className="text-white/40 mb-8">Test your luck. Open a Void Chest for a chance at legendary permanent multipliers.</p>
                
                <div className="flex flex-col items-center gap-8">
                  <div className="relative">
                    <motion.div
                      animate={isOpeningChest ? { 
                        rotate: [0, -5, 5, -5, 5, 0],
                        scale: [1, 1.1, 1],
                        filter: ["brightness(1)", "brightness(2)", "brightness(1)"]
                      } : {}}
                      transition={{ duration: 0.5, repeat: isOpeningChest ? Infinity : 0 }}
                      className={`
                        w-48 h-48 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl flex items-center justify-center shadow-2xl relative z-10
                        ${isOpeningChest ? 'shadow-indigo-500/50' : 'shadow-black'}
                      `}
                    >
                      <ShoppingBag className="w-24 h-24 text-white/80" />
                      {isOpeningChest && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-white/20 blur-xl rounded-full"
                        />
                      )}
                    </motion.div>
                    
                    <AnimatePresence>
                      {chestReward && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5, y: 0 }}
                          animate={{ opacity: 1, scale: 1, y: -120 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center z-20"
                        >
                          <div className="bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl whitespace-nowrap border-4 border-indigo-500">
                            {chestReward}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-4 w-full max-w-xs">
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="number"
                        value={customChestAmount}
                        onChange={(e) => setCustomChestAmount(e.target.value)}
                        className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500/50"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => openChest(parseInt(customChestAmount) || 1)}
                        disabled={state.crystals < CHEST_COST * (parseInt(customChestAmount) || 1) || isOpeningChest}
                        className="flex-1 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-all disabled:opacity-50"
                      >
                        Open Custom
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[1, 10, 100, 'MAX'].map(amount => {
                        const actualAmount = amount === 'MAX' ? Math.floor(state.crystals / CHEST_COST) : amount as number;
                        return (
                          <button
                            key={amount}
                            onClick={() => openChest(actualAmount)}
                            disabled={state.crystals < CHEST_COST * (actualAmount || 1) || isOpeningChest || actualAmount === 0}
                            className={`
                              py-3 rounded-xl font-bold text-xs transition-all
                              ${state.crystals >= CHEST_COST * (actualAmount || 1) && !isOpeningChest && actualAmount > 0
                                ? 'bg-white/10 text-white hover:bg-white/20' 
                                : 'bg-white/5 text-white/20 cursor-not-allowed'}
                            `}
                          >
                            {amount === 'MAX' ? 'MAX' : `x${amount}`}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => openChest(1)}
                      disabled={state.crystals < CHEST_COST || isOpeningChest}
                      className={`
                        w-full py-5 rounded-2xl font-bold uppercase tracking-widest text-lg transition-all
                        ${state.crystals >= CHEST_COST && !isOpeningChest
                          ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-xl shadow-indigo-500/20' 
                          : 'bg-white/5 text-white/20 cursor-not-allowed'}
                      `}
                    >
                      {isOpeningChest ? 'Opening...' : `Open Chest (${CHEST_COST} Crystals)`}
                    </button>
                    <p className="text-[10px] text-white/20 uppercase tracking-widest">Odds: 70% Common | 20% Rare | 9% Epic | 1% Legendary</p>
                  </div>
                </div>
              </div>

              {/* Premium Packs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/5 rounded-3xl border border-white/10 p-8 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-1">Custom Pack</h3>
                  <div className="mb-6 w-full">
                    <input 
                      type="number"
                      value={customCrystalAmount}
                      onChange={(e) => setCustomCrystalAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center font-mono text-indigo-400 focus:outline-none focus:border-indigo-500/50"
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    onClick={() => buyCrystals(parseInt(customCrystalAmount) || 0, (parseInt(customCrystalAmount) || 0) * 0.05)}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Buy Custom
                  </button>
                </div>

                {[
                  { amount: 50, cost: 4.99, label: 'Crystal Pouch', icon: Sparkles },
                  { amount: 150, cost: 9.99, label: 'Crystal Crate', icon: ShoppingBag, popular: true },
                  { amount: 500, cost: 24.99, label: 'Crystal Vault', icon: Coins },
                ].map((pack) => (
                  <div 
                    key={pack.amount}
                    className={`
                      bg-white/5 rounded-3xl border p-8 flex flex-col items-center text-center relative overflow-hidden
                      ${pack.popular ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10'}
                    `}
                  >
                    {pack.popular && (
                      <div className="absolute top-4 right-[-35px] bg-indigo-500 text-white text-[10px] font-bold px-10 py-1 rotate-45 uppercase tracking-widest">
                        Popular
                      </div>
                    )}
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                      <pack.icon className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{pack.label}</h3>
                    <p className="text-indigo-400 font-mono font-bold text-2xl mb-6">{pack.amount} Crystals</p>
                    
                    <button
                      onClick={() => buyCrystals(pack.amount, pack.cost)}
                      className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white rounded-2xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-500/20"
                    >
                      ${pack.cost}
                    </button>
                  </div>
                ))}
              </div>

              {/* Settings Section */}
              <div className="bg-white/5 rounded-3xl border border-white/10 p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-red-400" />
                  DANGER ZONE
                </h3>
                <p className="text-white/40 text-sm mb-8">These actions are permanent and cannot be reversed. Use with extreme caution. This will wipe all energy, tiers, and upgrades.</p>
                
                <button
                  onClick={aiStabilizeReality}
                  className="w-full px-8 py-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 hover:text-white transition-all mb-4"
                >
                  Stabilize Reality (Fix Glitches)
                </button>

                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="px-8 py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all"
                  >
                    Initiate Neural Wipe
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-red-400 font-bold text-xs animate-pulse">CONFIRM DATA WIPE?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={fullReset}
                        className="px-8 py-4 rounded-2xl bg-red-500 text-white font-bold uppercase tracking-widest text-xs hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
                      >
                        YES, WIPE EVERYTHING
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-8 py-4 rounded-2xl bg-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-all"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Click Effects */}
      <AnimatePresence>
        {clickEffects.map(eff => (
          <motion.div
            key={eff.id}
            initial={{ opacity: 1, y: eff.y, x: eff.x }}
            animate={{ opacity: 0, y: eff.y - 100 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none text-emerald-400 font-mono font-bold z-50 text-xl"
            style={{ left: 0, top: 0 }}
          >
            {eff.value}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Dev Console Modal */}
      <AnimatePresence>
        {showDevConsole && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-emerald-500" />
                DEVELOPER ACCESS
              </h2>
              <p className="text-white/40 text-sm mb-6">Enter authorization code to modify reality.</p>
              
              <div className="mb-6">
                <input 
                  type="text"
                  value={devCode}
                  onChange={(e) => setDevCode(e.target.value)}
                  placeholder="AUTHORIZATION_CODE"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-2 font-mono text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && useDevCode()}
                  autoFocus
                />
                {!isNaN(Number(devCode)) && devCode.trim() !== "" && (
                  <div className="space-y-1 px-2">
                    <div className="text-[10px] font-mono text-emerald-500/60">
                      PREVIEW: +{formatNumber(Number(devCode))} Energy
                    </div>
                    <div className="text-[10px] font-mono text-emerald-500/40">
                      NEW TOTAL: {formatNumber(state.energy + Number(devCode))} Energy
                    </div>
                  </div>
                )}
                {devCode.trim().toLowerCase().endsWith("crystals") && !isNaN(Number(devCode.trim().toLowerCase().replace("crystals", ""))) && (
                  <div className="space-y-1 px-2">
                    <div className="text-[10px] font-mono text-indigo-500/60">
                      PREVIEW: +{formatNumber(Number(devCode.trim().toLowerCase().replace("crystals", "")))} Crystals
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDevConsole(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-all"
                >
                  CANCEL
                </button>
                <button 
                  onClick={useDevCode}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold hover:bg-emerald-400 transition-all"
                >
                  AUTHORIZE
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/5 bg-black/80 backdrop-blur-md px-6 py-2 flex justify-between items-center text-[10px] uppercase tracking-widest text-white/40 z-20">
        <div className="flex gap-4">
          <span>Version 1.1.0-beta</span>
          <button onClick={() => setShowDevConsole(true)} className="hover:text-white transition-colors">Dev Console</button>
        </div>
        <div className="flex gap-4">
          <span>Auto-save: Active</span>
          <span className="text-emerald-500/60 font-bold">Nexus Online</span>
        </div>
      </footer>
    </div>
  );
}
