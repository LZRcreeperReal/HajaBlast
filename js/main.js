// ── main.js ───────────────────────────────────────────────────────────────────
// Round orchestration — updated for new UI API

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitForRollClick() {
  return new Promise(resolve => {
    const btn = document.getElementById('btn-roll');
    btn.onclick = () => { btn.classList.add('hidden'); resolve(); };
  });
}

function waitForAction() {
  return new Promise(resolve => {
    document.getElementById('human-actions').addEventListener('click', e => {
      const btn = e.target.closest('[data-resolve]');
      if (btn) resolve(btn.dataset.resolve);
    }, { once: true });
  });
}

// ── animate dice then show result msg ─────────────────────────────────────────
async function doRoll(value) {
  UI.setDiceMsg('');
  await DiceEngine.roll(value);
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: SWAP
// ─────────────────────────────────────────────────────────────────────────────
async function phaseSwap() {
  UI.setPhase('Swap Phase — exchange your lowest card for 1 chip?');

  for (const p of Game.getActivePlayers()) {
    if (!p.isAI) {
      const lowIdx = Deck.lowestIndex(p.hand);
      UI.renderHumanHand(p.hand, { lowestIdx: lowIdx });
      UI.setActions(`
        <span class="act-hint">Swap lowest card for 1 chip?</span>
        <button class="act-btn primary" data-resolve="swap"
          ${p.chips < 1 ? 'disabled' : ''}>Swap (−1 chip)</button>
        <button class="act-btn" data-resolve="pass">Keep Hand</button>
      `);
      const choice = await waitForAction();
      UI.clearActions();
      if (choice === 'swap' && p.chips >= 1) {
        Game.doSwap(0);
        UI.log('You swapped your lowest card.', true);
        UI.renderHumanHand(p.hand);
        UI.renderSelfChips(p.chips);
      } else {
        UI.log('You kept your hand.');
      }
    } else {
      if (AI.shouldSwap(p)) {
        Game.doSwap(p.id);
        UI.log(`${p.name} swapped their lowest card.`);
        UI.updateOpponentChips(p);
      } else {
        UI.log(`${p.name} kept their hand.`);
      }
      await delay(400);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: BET ROLL
// ─────────────────────────────────────────────────────────────────────────────
async function phaseBetRoll() {
  for (const p of Game.getActivePlayers()) {
    const roll = DiceEngine.randomValue();
    if (!p.isAI) {
      UI.setPhase('Bet Phase — roll the dice!');
      UI.showRollBtn(true);
      await waitForRollClick();
    } else {
      UI.setPhase(`${p.name} is betting…`);
    }
    await doRoll(roll);
    const bet = Game.recordBetRoll(p.id, roll);
    UI.setDiceMsg(`Rolled ${roll} → bet ${bet} chips`);
    UI.log(`${p.name} rolled ${roll}, bet ${bet} chips`, !p.isAI);
    Chips.render();
    UI.renderSelfChips(Game.getHuman().chips);
    if (p.isAI) UI.updateOpponentChips(p);
    await delay(1000);
  }
  UI.setDiceMsg('');
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: PLAY ROLL
// ─────────────────────────────────────────────────────────────────────────────
const ROLL_RULES = {
  1: 'Play 1 card',
  2: 'Play 2 cards',
  3: 'Play all 3 cards',
  4: 'Double 1 card (play only that)',
  5: 'Double 1 card + play 1 more at face value',
  6: 'Play 2 cards both doubled',
};

async function phasePlayRoll() {
  for (const p of Game.getActivePlayers()) {
    const roll = DiceEngine.randomValue();
    Game.recordPlayRoll(p.id, roll);

    if (!p.isAI) {
      UI.setPhase('Play Phase — roll for your play!');
      UI.showRollBtn(true);
      await waitForRollClick();
    } else {
      UI.setPhase(`${p.name} is playing…`);
    }

    await doRoll(roll);
    UI.setDiceMsg(`${roll} — ${ROLL_RULES[roll]}`);
    UI.log(`${p.name} rolled ${roll}: ${ROLL_RULES[roll]}`, !p.isAI);

    if (!p.isAI) {
      await handleHumanPlay(p, roll);
    } else {
      const result = AI.choosePlay(p.hand, roll);
      Game.setPlay(p.id, result);
      await delay(700);
    }
  }
  UI.setDiceMsg('');
}

// ── human card pick helper ────────────────────────────────────────────────────
function pickCard(hand, prompt, exclude = []) {
  return new Promise(resolve => {
    UI.setActions(`<span class="act-hint">${prompt}</span>`);
    const container = document.getElementById('human-hand');
    const cards = [...container.querySelectorAll('.card')];
    cards.forEach((cardEl, i) => {
      if (exclude.includes(i)) return;
      cardEl.classList.add('selectable');
      cardEl.onclick = () => {
        cards.forEach(c => { c.classList.remove('selectable', 'selected'); c.onclick = null; });
        cardEl.classList.add('selected');
        resolve(i);
      };
    });
  });
}

async function handleHumanPlay(player, roll) {
  const h = player.hand;
  switch (roll) {
    case 1: {
      const i = await pickCard(h, 'Tap a card to play it.');
      Game.setPlay(0, { played: [h[i]], doubled: null });
      UI.log(`You played ${h[i].rank}${h[i].suit} (${h[i].value} pts)`, true);
      break;
    }
    case 2: {
      const i1 = await pickCard(h, 'Tap your 1st card.');
      const i2 = await pickCard(h, 'Tap your 2nd card.', [i1]);
      Game.setPlay(0, { played: [h[i1], h[i2]], doubled: null });
      UI.log(`You played 2 cards. Score: ${Game.getHuman().score}`, true);
      break;
    }
    case 3: {
      Game.setPlay(0, { played: [...h], doubled: null });
      UI.log(`You played all 3 cards. Score: ${Game.getHuman().score}`, true);
      break;
    }
    case 4: {
      const i = await pickCard(h, 'Tap the card to DOUBLE.');
      Game.setPlay(0, { played: [h[i]], doubled: h[i] });
      UI.log(`You doubled ${h[i].rank}${h[i].suit} → ${h[i].value * 2} pts`, true);
      break;
    }
    case 5: {
      const di = await pickCard(h, 'Tap the card to DOUBLE.');
      const fi = await pickCard(h, 'Tap a 2nd card at face value.', [di]);
      Game.setPlay(0, { played: [h[di], h[fi]], doubled: h[di] });
      UI.log(`Doubled ${h[di].rank} + played ${h[fi].rank}. Score: ${Game.getHuman().score}`, true);
      break;
    }
    case 6: {
      const i1 = await pickCard(h, 'Tap 1st card to double.');
      const i2 = await pickCard(h, 'Tap 2nd card to double.', [i1]);
      Game.setPlay(0, { played: [h[i1], h[i2]], doubled: 'both' });
      UI.log(`Two doubled cards. Score: ${Game.getHuman().score}`, true);
      break;
    }
  }
  UI.clearActions();
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE: RESOLVE
// ─────────────────────────────────────────────────────────────────────────────
async function phaseResolve() {
  UI.setPhase('Revealing hands…');
  for (const p of Game.getActivePlayers()) {
    if (p.isAI) { UI.revealOpponentHand(p); await delay(300); }
  }
  await delay(500);
  const result = Game.resolveRound();
  Chips.render();
  UI.showResultModal(result);
}

// ─────────────────────────────────────────────────────────────────────────────
// ONE ROUND
// ─────────────────────────────────────────────────────────────────────────────
async function playRound() {
  const state = Game.getState();
  UI.renderOpponents(state.players);
  UI.renderHumanHand(Game.getHuman().hand);
  UI.renderSelfChips(Game.getHuman().chips);
  Chips.render();
  UI.log(`── Round ${state.round} ──`, true);

  await phaseSwap();
  await phaseBetRoll();
  await phasePlayRoll();
  await phaseResolve();
}

// ─────────────────────────────────────────────────────────────────────────────
// LOBBY
// ─────────────────────────────────────────────────────────────────────────────
function setupLobby() {
  let numAI = 3;
  const countEl   = document.getElementById('ai-count');
  const summaryEl = document.getElementById('player-summary');

  function update() {
    countEl.textContent   = numAI;
    summaryEl.textContent = `You + ${numAI} AI = ${numAI + 1} players`;
  }

  document.getElementById('ai-minus').onclick = () => { if (numAI > 1) { numAI--; update(); } };
  document.getElementById('ai-plus').onclick  = () => { if (numAI < 3) { numAI++; update(); } };

  document.getElementById('btn-start').onclick = async () => {
    Game.init(numAI);
    UI.showScreen('screen-game');
    await playRound();
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL BUTTONS
// ─────────────────────────────────────────────────────────────────────────────
document.getElementById('btn-next-round').onclick = async () => {
  UI.hideResultModal();
  const goes = Game.nextRound();
  if (!goes) {
    const alive = Game.getActivePlayers();
    const top   = [...alive].sort((a, b) => b.chips - a.chips)[0] || Game.getHuman();
    UI.showGameOver(top.name, top.chips);
  } else {
    await playRound();
  }
};

document.getElementById('btn-end-game').onclick = () => {
  UI.hideResultModal();
  const top = [...Game.getActivePlayers()].sort((a, b) => b.chips - a.chips)[0];
  UI.showGameOver(top.name, top.chips);
};

document.getElementById('btn-play-again').onclick = () => {
  document.getElementById('modal-gameover').classList.add('hidden');
  document.getElementById('log-inner').innerHTML = '';
  UI.showScreen('screen-lobby');
};

// ─────────────────────────────────────────────────────────────────────────────
setupLobby();
