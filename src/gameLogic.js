// =====================
// CARD & DECK UTILITIES
// =====================

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export function cardValue(rank) {
  if (['J','Q','K'].includes(rank)) return 11;
  if (rank === 'A') return 12;
  return parseInt(rank, 10);
}

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: cardValue(rank), id: `${rank}${suit}` });
    }
  }
  return shuffle(deck);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

export function isRed(suit) {
  return suit === '♥' || suit === '♦';
}

// ===========================
// PLAY RESOLUTION
// ===========================

/**
 * Given a player's hand and their play-roll result,
 * return the total score and a description of what they played.
 *
 * Roll rules:
 *  1 → play lowest card at face value
 *  2 → play two cards at face value (lowest two)
 *  3 → play all three at face value
 *  4 → pick one card to double (highest), play that only
 *  5 → pick one card to double (highest) + one card at face value (2nd highest)
 *  6 → play two cards both doubled (two highest)
 */
export function resolvePlay(hand, roll) {
  // Sort descending by value
  const sorted = [...hand].sort((a, b) => b.value - a.value);

  switch (roll) {
    case 1: {
      // Play lowest card at face value
      const card = sorted[sorted.length - 1];
      return {
        total: card.value,
        played: [{ card, multiplier: 1 }],
        description: `Played ${card.rank}${card.suit} (×1)`,
      };
    }
    case 2: {
      // Two cards at face value (two lowest)
      const cards = sorted.slice(-2);
      return {
        total: cards.reduce((s, c) => s + c.value, 0),
        played: cards.map(c => ({ card: c, multiplier: 1 })),
        description: `Played ${cards.map(c => c.rank + c.suit).join(' + ')} (×1 each)`,
      };
    }
    case 3: {
      // All three at face value
      return {
        total: sorted.reduce((s, c) => s + c.value, 0),
        played: sorted.map(c => ({ card: c, multiplier: 1 })),
        description: `Played all three at face value`,
      };
    }
    case 4: {
      // Highest card doubled
      const card = sorted[0];
      return {
        total: card.value * 2,
        played: [{ card, multiplier: 2 }],
        description: `Doubled ${card.rank}${card.suit} (×2)`,
      };
    }
    case 5: {
      // Highest card doubled + second card at face value
      const doubled = sorted[0];
      const normal = sorted[1];
      return {
        total: doubled.value * 2 + normal.value,
        played: [
          { card: doubled, multiplier: 2 },
          { card: normal, multiplier: 1 },
        ],
        description: `Doubled ${doubled.rank}${doubled.suit} (×2) + ${normal.rank}${normal.suit} (×1)`,
      };
    }
    case 6: {
      // Two highest cards both doubled
      const cards = sorted.slice(0, 2);
      return {
        total: cards.reduce((s, c) => s + c.value * 2, 0),
        played: cards.map(c => ({ card: c, multiplier: 2 })),
        description: `Doubled ${cards.map(c => c.rank + c.suit).join(' + ')} (×2 each)`,
      };
    }
    default:
      return { total: 0, played: [], description: 'No play' };
  }
}

export function rollDescription(roll) {
  switch (roll) {
    case 1: return '1 card • face value';
    case 2: return '2 cards • face value';
    case 3: return 'All 3 cards • face value';
    case 4: return '1 card • doubled';
    case 5: return '1 card doubled + 1 card';
    case 6: return '2 cards • both doubled';
    default: return '';
  }
}

// ===========================
// GAME PHASE CONSTANTS
// ===========================

export const PHASE = {
  SETUP: 'SETUP',
  SWAP: 'SWAP',
  ANTE_ROLL: 'ANTE_ROLL',
  PLAY_ROLL: 'PLAY_ROLL',
  REVEAL: 'REVEAL',
  GAME_OVER: 'GAME_OVER',
};

export const PLAYER_COLORS = ['#c9a84c', '#2255aa', '#9b1c2e', '#2a7a4b'];
export const PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];
