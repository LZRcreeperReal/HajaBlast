// ── main.js ───────────────────────────────────────────────────────────────────
// Orchestrates the full game flow phase by phase

// ── helpers ───────────────────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

/** Roll the 3D dice and animate; returns the rolled value */
async function animateDice(value) {
  const diceEl = document.getElementById('dice');
  UI.setDiceResult('');
  await DiceEngine.roll(diceEl, value);
  return value;
}

/** Wait for the human to click #btn-roll */
function waitForRollClick() {
  return new Promise(resolve => {
    const btn = document.getElementById('btn-roll');
    btn.onclick = () => {
      btn.classList.add('hidden');
      resolve();
    };
  });
}

/** Wait for human to click a button in #human-actions that has data-resolve */
function waitForAction() {
  return new Promise(resolve => {
    document.getElementById('human-actions').addEventListener('click', e => {
      const btn = e.target.closest('[data-resolve]');
      if (btn) resolve(btn.dataset.resolve);
    }, { once: true });
  });
}

// ── PHASE: SWAP ───────────────────────────────────────────────────────────────
async function phaseSwap() {
  const players = Game.getActivePlayers();
  UI.setPhase('Swap Phase – swap your lowest card for 1 chip?');

  for (const p of players) {
    if (!p.isAI) {
      // Human swap
      const lowIdx = Deck.lowestIndex(p.hand);
      UI.renderHumanHand(p.hand, { selectable: false, lowestIdx: lowIdx });
      UI.setActions(`
        <span class="action-hint">Swap your lowest card (costs 1 chip)?</span>
        <button data-resolve="swap" ${p.chips < 1 ? 'disabled title="Not enough chips"' : ''}>
          Swap Lowest (−1 chip)
        </button>
        <button data-resolve="pass">Keep Hand</button>
      `);
      const choice = await waitForAction();
      UI.clearActions();
      if (choice === 'swap' && p.chips >= 1) {
        Game.doSwap(0);
        UI.log(`You swapped your lowest card.`, true);
      } else {
        UI.log('You kept your hand.');
      }
      UI.renderHumanHand(p.hand);
      UI.renderHumanChips(p.chips);
    } else {
      // AI swap
      if (AI.shouldSwap(p)) {
        Game.doSwap(p.id);
        UI.log(`${p.name} swapped their lowest card.`);
      } else {
        UI.log(`${p.name} kept their hand.`);
      }
      await delay(500);
    }
  }
}

// ── PHASE: BET ROLL ───────────────────────────────────────────────────────────
async function phaseBetRoll() {
  const players = Game.getActivePlayers();
  UI.setPhase('Bet Phase – roll the dice to add chips to the pot');

  for (const p of players) {
    const roll = DiceEngine.randomValue();

    if (!p.isAI) {
      UI.setPhase(`Your turn to bet – roll the dice!`);
      UI.showRollButton(true);
      await waitForRollClick();
    }

    await animateDice(roll);
    const bet = Game.recordBetRoll(p.id, roll);
    UI.setDiceResult(`Rolled ${roll} → bet ${bet} chips`);
    UI.log(`${p.name} rolled ${roll}, bet ${bet} chips.`, !p.isAI);
    UI.renderHumanChips(Game.getHuman().chips);
    await delay(900);
  }

  UI.setDiceResult('');
}

// ── PHASE: PLAY ROLL ──────────────────────────────────────────────────────────
async function phasePlayRoll() {
  const players = Game.getActivePlayers();
  UI.setPhase('Play Phase – roll to see how you play your cards');

  const ROLL_RULES = {
    1: 'Play 1 card at face value',
    2: 'Play 2 cards at face value',
    3: 'Play all 3 cards',
    4: 'Double one card of your choice',
    5: 'Double one card + play another at face value',
    6: 'Play 2 cards both doubled',
  };

  for (const p of players) {
    const roll = DiceEngine.randomValue();
    Game.recordPlayRoll(p.id, roll);

    if (!p.isAI) {
      UI.setPhase(`Your play roll!`);
      UI.showRollButton(true);
      await waitForRollClick();
    }

    await animateDice(roll);
    UI.setDiceResult(`Rolled ${roll} – ${ROLL_RULES[roll]}`);
    UI.log(`${p.name} rolled ${roll}: ${ROLL_RULES[roll]}`, !p.isAI);

    if (!p.isAI) {
      await handleHumanPlay(p, roll);
    } else {
      const result = AI.choosePlay(p.hand, roll);
      Game.setPlay(p.id, result);
      await delay(700);
    }
  }

  UI.setDiceResult('');
}

// ── human card selection for play ─────────────────────────────────────────────
async function handleHumanPlay(player, roll) {
  const hand = player.hand;

  // Helper: let human click a card to select it
  function pickCard(prompt, exclude = []) {
    return new Promise(resolve => {
      const handEl = document.getElementById('human-hand');
      UI.setActions(`<span class="action-hint">${prompt}</span>`);
      const cards = [...handEl.querySelectorAll('.card')];
      for (const [i, cardEl] of cards.entries()) {
        if (exclude.includes(i)) continue;
        cardEl.classList.add('selectable');
        cardEl.onclick = () => {
          cards.forEach(c => c.classList.remove('selectable', 'selected'));
          cardEl.classList.add('selected');
          resolve(i);
        };
      }
    });
  }

  switch (roll) {
    case 1: {
      const idx = await pickCard('Click the card you want to play.');
      Game.setPlay(0, { played: [hand[idx]], doubled: null });
      UI.log(`You played ${hand[idx].rank}${hand[idx].suit} (face value: ${hand[idx].value}).`, true);
      break;
    }
    case 2: {
      const idx1 = await pickCard('Click your first card to play.');
      const idx2 = await pickCard('Click your second card to play.', [idx1]);
      Game.setPlay(0, { played: [hand[idx1], hand[idx2]], doubled: null });
      UI.log(`You played two cards. Score: ${Game.getHuman().score}`, true);
      break;
    }
    case 3: {
      Game.setPlay(0, { played: [...hand], doubled: null });
      UI.log(`You played all three cards. Score: ${Game.getHuman().score}`, true);
      UI.setActions('');
      break;
    }
    case 4: {
      const idx = await pickCard('Pick one card to DOUBLE its value. Only this card plays.');
      Game.setPlay(0, { played: [hand[idx]], doubled: hand[idx] });
      UI.log(`You doubled ${hand[idx].rank}${hand[idx].suit} → value: ${hand[idx].value * 2}.`, true);
      break;
    }
    case 5: {
      const dblIdx = await pickCard('Pick one card to DOUBLE.');
      const faceIdx = await pickCard('Pick a second card at face value.', [dblIdx]);
      Game.setPlay(0, {
        played:  [hand[dblIdx], hand[faceIdx]],
        doubled: hand[dblIdx],
      });
      UI.log(`You doubled ${hand[dblIdx].rank}${hand[dblIdx].suit} + played ${hand[faceIdx].rank}${hand[faceIdx].suit}. Score: ${Game.getHuman().score}`, true);
      break;
    }
    case 6: {
      const i1 = await pickCard('Pick your FIRST card to double.');
      const i2 = await pickCard('Pick your SECOND card to double.', [i1]);
      Game.setPlay(0, {
        played:  [hand[i1], hand[i2]],
        doubled: 'both',
      });
      UI.log(`You played two doubled cards. Score: ${Game.getHuman().score}`, true);
      break;
    }
  }
  UI.setActions('');
}

// ── PHASE: RESOLVE ────────────────────────────────────────────────────────────
async function phaseResolve() {
  UI.setPhase('Revealing hands…');

  // Reveal all AI hands
  for (const p of Game.getActivePlayers()) {
    if (p.isAI) {
      UI.revealAIHand(p);
      await delay(300);
    }
  }

  await delay(600);

  const result = Game.resolveRound();
  UI.showResultModal(result);
}

// ── ONE FULL ROUND ────────────────────────────────────────────────────────────
async function playRound() {
  const state = Game.getState();
  UI.renderAIZones(state.players);
  UI.renderHumanHand(Game.getHuman().hand);
  UI.renderHumanChips(Game.getHuman().chips);
  Chips.renderPot();
  UI.log(`── Round ${state.round} ──`, true);

  await phaseSwap();
  await phaseBetRoll();
  await phasePlayRoll();
  await phaseResolve();
}

// ── LOBBY SETUP ───────────────────────────────────────────────────────────────
function setupLobby() {
  let numAI = 3;
  const countEl = document.getElementById('ai-count');
  const labelEl = document.getElementById('ai-label');
  const totalEl = document.getElementById('total-label');

  function updateLabels() {
    countEl.textContent = numAI;
    labelEl.textContent = `${numAI} AI`;
    totalEl.textContent = `${numAI + 1} players`;
  }

  document.getElementById('ai-minus').onclick = () => {
    if (numAI > 1) { numAI--; updateLabels(); }
  };
  document.getElementById('ai-plus').onclick = () => {
    if (numAI < 3) { numAI++; updateLabels(); }
  };

  document.getElementById('btn-start').onclick = async () => {
    Game.init(numAI);
    UI.showScreen('screen-game');
    await playRound();
  };
}

// ── MODAL BUTTONS ─────────────────────────────────────────────────────────────
document.getElementById('btn-next-round').onclick = async () => {
  UI.hideResultModal();
  const continues = Game.nextRound();
  if (!continues) {
    const alive = Game.getActivePlayers();
    const winner = alive[0] || Game.getHuman();
    UI.showGameOver(winner.name, winner.chips);
  } else {
    await playRound();
  }
};

document.getElementById('btn-end-game').onclick = () => {
  UI.hideResultModal();
  const alive = Game.getActivePlayers();
  const top = [...alive].sort((a, b) => b.chips - a.chips)[0];
  UI.showGameOver(top.name, top.chips);
};

document.getElementById('btn-play-again').onclick = () => {
  document.getElementById('modal-gameover').classList.add('hidden');
  UI.showScreen('screen-lobby');
  UI.log('');
  document.getElementById('log-inner').innerHTML = '';
};

// ── BOOT ──────────────────────────────────────────────────────────────────────
setupLobby();
