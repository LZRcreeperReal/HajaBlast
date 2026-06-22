// ── ai.js ─────────────────────────────────────────────────────────────────────
// AI decision-making for each phase

const AI = (() => {

  /**
   * Decide whether the AI should swap its lowest card.
   * Strategy: swap if lowest card value < 6 and chips > 1.
   */
  function shouldSwap(player) {
    if (player.chips < 1) return false;
    const minVal = Math.min(...player.hand.map(c => c.value));
    return minVal < 7; // swap if lowest card is below a 7
  }

  /**
   * Given a roll result, decide which cards to play and which to double.
   * Returns { played: Card[], doubled: Card|null }
   *
   * Roll rules:
   *   1 → play 1 card (choose highest value)
   *   2 → play 2 cards (choose 2 highest)
   *   3 → play all 3
   *   4 → double one card (choose highest), play only that
   *   5 → double one card (choose highest) + play one more at face value (choose next highest)
   *   6 → play 2 cards both doubled (choose 2 highest)
   */
  function choosePlay(hand, roll) {
    // sort by value descending
    const sorted = [...hand].sort((a, b) => b.value - a.value);

    switch (roll) {
      case 1:
        return { played: [sorted[0]], doubled: null, doublerIdx: null };

      case 2:
        return { played: [sorted[0], sorted[1]], doubled: null, doublerIdx: null };

      case 3:
        return { played: [...hand], doubled: null, doublerIdx: null };

      case 4:
        // double the highest card only
        return { played: [sorted[0]], doubled: sorted[0], doublerIdx: 0 };

      case 5:
        // double highest, play next at face value
        return {
          played:      [sorted[0], sorted[1]],
          doubled:     sorted[0],
          doublerIdx:  0,
        };

      case 6:
        // play 2 highest both doubled
        return {
          played:     [sorted[0], sorted[1]],
          doubled:    'both',
          doublerIdx: null,
        };

      default:
        return { played: [sorted[0]], doubled: null, doublerIdx: null };
    }
  }

  /**
   * Calculate the total score for a play result.
   * doublerIdx: index in played[] that gets doubled (or 'both')
   */
  function calcScore(played, doubled) {
    if (!played || played.length === 0) return 0;
    return played.reduce((sum, card, idx) => {
      let val = card.value;
      if (doubled === 'both') val *= 2;
      else if (doubled && card === doubled) val *= 2;
      return sum + val;
    }, 0);
  }

  return { shouldSwap, choosePlay, calcScore };
})();
