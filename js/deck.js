// ── deck.js ──────────────────────────────────────────────────────────────────
// Builds, shuffles, and provides card utilities

const Deck = (() => {
  const RANKS  = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const SUITS  = ['♠','♥','♦','♣'];
  const RED_S  = new Set(['♥','♦']);

  /** Numeric value per rank */
  function rankValue(rank) {
    if (['J','Q','K'].includes(rank)) return 11;
    if (rank === 'A') return 12;
    return parseInt(rank, 10);
  }

  /** Build a fresh 52-card deck */
  function build() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit, value: rankValue(rank), red: RED_S.has(suit) });
      }
    }
    return deck;
  }

  /** Fisher-Yates shuffle (in-place) */
  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  /** Draw n cards from the top of deck */
  function draw(deck, n = 1) {
    if (deck.length < n) throw new Error('Deck exhausted');
    return deck.splice(0, n);
  }

  /** Index of the card with the lowest value (first occurrence if tie) */
  function lowestIndex(hand) {
    let minIdx = 0;
    for (let i = 1; i < hand.length; i++) {
      if (hand[i].value < hand[minIdx].value) minIdx = i;
    }
    return minIdx;
  }

  return { build, shuffle, draw, rankValue, lowestIndex };
})();
