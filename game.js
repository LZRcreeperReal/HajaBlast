// ── game.js ───────────────────────────────────────────────────────────────────
// Core game state machine

const Game = (() => {

  // ── state ──────────────────────────────────────────────────────────────────
  let state = null;

  const PHASES = {
    SWAP:         'swap',         // players may swap lowest card
    BET_ROLL:     'bet_roll',     // roll to determine chips added to pot
    PLAY_ROLL:    'play_roll',    // roll to determine how many cards played
    PLAY_SELECT:  'play_select',  // human picks cards/double (if roll 4 or 5)
    RESOLVE:      'resolve',      // compare scores, award pot
  };

  // ── init ───────────────────────────────────────────────────────────────────
  function init(numAI) {
    const deck = Deck.shuffle(Deck.build());
    const players = [];

    // Human player (seat 0)
    players.push({
      id:     0,
      name:   'You',
      isAI:   false,
      chips:  25,
      hand:   Deck.draw(deck, 3),
      roll1:  null,  // bet roll
      roll2:  null,  // play roll
      play:   null,  // { played, doubled }
      score:  0,
      active: true,
    });

    // AI players (seats 1-3)
    for (let i = 0; i < numAI; i++) {
      players.push({
        id:     i + 1,
        name:   `AI ${i + 1}`,
        isAI:   true,
        chips:  25,
        hand:   Deck.draw(deck, 3),
        roll1:  null,
        roll2:  null,
        play:   null,
        score:  0,
        active: true,
      });
    }

    state = {
      deck,
      players,
      round:        1,
      phase:        PHASES.SWAP,
      currentSeat:  0,      // whose turn within a phase
      pot:          0,
    };

    Chips.reset();
    return state;
  }

  // ── accessors ──────────────────────────────────────────────────────────────
  function getState()   { return state; }
  function getPhase()   { return state.phase; }
  function getPlayers() { return state.players; }
  function getHuman()   { return state.players[0]; }
  function getActivePlayers() { return state.players.filter(p => p.active); }

  // ── swap phase ─────────────────────────────────────────────────────────────
  /**
   * Execute card swap for a player.
   * Replaces their lowest card with a new draw; costs 1 chip.
   * Returns true if swap succeeded.
   */
  function doSwap(playerIdx) {
    const p = state.players[playerIdx];
    if (!p || p.chips < 1) return false;

    const lowIdx = Deck.lowestIndex(p.hand);
    const discarded = p.hand.splice(lowIdx, 1)[0];
    state.deck.push(discarded); // put back (won't be redrawn immediately)
    Deck.shuffle(state.deck);

    const [newCard] = Deck.draw(state.deck, 1);
    p.hand.splice(lowIdx, 0, newCard);
    p.chips -= 1;
    Chips.add(1);  // cost goes to pot? — house rule: chip cost goes to pot
    Chips.renderPot();
    return true;
  }

  /** Mark that a player passed the swap phase */
  function passSwap(playerIdx) {
    // nothing to do except move along
  }

  // ── bet roll phase ─────────────────────────────────────────────────────────
  function recordBetRoll(playerIdx, value) {
    const p = state.players[playerIdx];
    p.roll1 = value;
    const bet = Math.min(value, p.chips); // can't bet more than you have
    p.chips -= bet;
    state.pot += bet;
    Chips.add(bet);
    Chips.renderPot();
    return bet;
  }

  // ── play roll phase ────────────────────────────────────────────────────────
  function recordPlayRoll(playerIdx, value) {
    const p = state.players[playerIdx];
    p.roll2 = value;
  }

  // ── resolve play ───────────────────────────────────────────────────────────
  /**
   * Set a player's play result.
   * { played: Card[], doubled: Card|null|'both' }
   */
  function setPlay(playerIdx, playResult) {
    const p = state.players[playerIdx];
    p.play = playResult;
    p.score = AI.calcScore(playResult.played, playResult.doubled);
  }

  // ── resolve round ──────────────────────────────────────────────────────────
  /**
   * Compare all players' scores, award pot to winner(s).
   * Returns { winners, scores, pot }
   */
  function resolveRound() {
    const active = getActivePlayers();
    const maxScore = Math.max(...active.map(p => p.score));
    const winners = active.filter(p => p.score === maxScore);

    const share = Math.floor(state.pot / winners.length);
    for (const w of winners) {
      w.chips += share;
    }

    const results = active.map(p => ({
      id:    p.id,
      name:  p.name,
      score: p.score,
      chips: p.chips,
    }));

    return { winners, scores: results, pot: state.pot };
  }

  // ── next round ─────────────────────────────────────────────────────────────
  function nextRound() {
    // Eliminate players at 0 chips
    for (const p of state.players) {
      if (p.chips <= 0) p.active = false;
    }

    // Check if game is over (only 1 or 0 players left)
    const alive = getActivePlayers();
    if (alive.length <= 1) return false; // signal game over

    // Deal fresh hands
    state.deck = Deck.shuffle(Deck.build());
    for (const p of alive) {
      p.hand   = Deck.draw(state.deck, 3);
      p.roll1  = null;
      p.roll2  = null;
      p.play   = null;
      p.score  = 0;
    }

    state.pot   = 0;
    state.round += 1;
    state.phase = PHASES.SWAP;
    state.currentSeat = 0;
    Chips.reset();
    Chips.renderPot();
    return true;
  }

  // ── phase transitions ──────────────────────────────────────────────────────
  function setPhase(phase) {
    state.phase = phase;
  }

  return {
    PHASES,
    init,
    getState,
    getPhase,
    getPlayers,
    getHuman,
    getActivePlayers,
    doSwap,
    passSwap,
    recordBetRoll,
    recordPlayRoll,
    setPlay,
    resolveRound,
    nextRound,
    setPhase,
  };
})();
