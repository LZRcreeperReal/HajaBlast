// ── ui.js ─────────────────────────────────────────────────────────────────────
// All DOM rendering helpers

const UI = (() => {

  // ── card HTML ──────────────────────────────────────────────────────────────
  function cardHTML(card, faceUp = true, small = false) {
    const sizeClass = small ? ' small' : '';
    if (!faceUp) return `<div class="card face-down${sizeClass}"></div>`;
    const redClass = card.red ? ' red' : '';
    return `
      <div class="card face-up${redClass}${sizeClass}" data-rank="${card.rank}" data-suit="${card.suit}">
        <span class="card-rank">${card.rank}</span>
        <span class="card-center">${card.suit}</span>
        <span class="card-suit">${card.rank}</span>
      </div>`;
  }

  // ── render AI zones ────────────────────────────────────────────────────────
  function renderAIZones(players) {
    const seats = [
      { el: document.getElementById('ai-top'),   idx: 1 },
      { el: document.getElementById('ai-left'),  idx: 2 },
      { el: document.getElementById('ai-right'), idx: 3 },
    ];

    for (const { el, idx } of seats) {
      if (!el) continue;
      const player = players[idx];
      if (!player || !player.active) {
        el.innerHTML = '';
        continue;
      }
      el.innerHTML = `
        <div class="ai-name">${player.name}</div>
        <div class="ai-chips zone-chip-count">● ${player.chips} chips</div>
        <div class="hand" id="hand-ai-${player.id}">
          ${player.hand.map(c => cardHTML(c, false, true)).join('')}
        </div>`;
    }
  }

  // ── render human hand ──────────────────────────────────────────────────────
  function renderHumanHand(hand, { selectable = false, lowestIdx = -1, selectedIdx = -1 } = {}) {
    const container = document.getElementById('human-hand');
    if (!container) return;

    container.innerHTML = hand.map((card, i) => {
      let extra = '';
      if (selectable) extra += ' selectable';
      if (i === lowestIdx) extra += ' lowest-badge';
      if (i === selectedIdx) extra += ' selected';
      return cardHTML(card).replace('class="card face-up', `class="card face-up${extra}`);
    }).join('');

    return container;
  }

  // ── render human chips ─────────────────────────────────────────────────────
  function renderHumanChips(chips) {
    const el = document.getElementById('human-chips');
    if (el) el.textContent = chips;
  }

  // ── set phase banner ───────────────────────────────────────────────────────
  function setPhase(text) {
    const el = document.getElementById('phase-text');
    if (el) el.textContent = text;
  }

  // ── human action area ──────────────────────────────────────────────────────
  function setActions(html) {
    const el = document.getElementById('human-actions');
    if (el) el.innerHTML = html;
  }

  function clearActions() { setActions(''); }

  // ── dice result text ───────────────────────────────────────────────────────
  function setDiceResult(text) {
    const el = document.getElementById('dice-result');
    if (el) el.textContent = text;
  }

  function showRollButton(show = true) {
    const btn = document.getElementById('btn-roll');
    if (!btn) return;
    btn.classList.toggle('hidden', !show);
  }

  // ── log ────────────────────────────────────────────────────────────────────
  function log(msg, highlight = false) {
    const inner = document.getElementById('log-inner');
    if (!inner) return;
    const div = document.createElement('div');
    div.className = 'log-entry' + (highlight ? ' highlight' : '');
    div.textContent = msg;
    inner.appendChild(div);
    inner.scrollTop = inner.scrollHeight;
  }

  // ── reveal AI hands ────────────────────────────────────────────────────────
  function revealAIHand(player) {
    const hand = document.getElementById(`hand-ai-${player.id}`);
    if (!hand) return;
    hand.innerHTML = player.hand.map(c => cardHTML(c, true, true)).join('');
  }

  // ── show result modal ──────────────────────────────────────────────────────
  function showResultModal({ winners, scores, pot }) {
    const modal    = document.getElementById('modal-result');
    const title    = document.getElementById('result-title');
    const body     = document.getElementById('result-body');
    const scoresEl = document.getElementById('result-scores');

    const winNames = winners.map(w => w.name).join(' & ');
    title.textContent = winners.length > 1 ? 'Tie!' : `${winNames} Wins!`;
    body.textContent  = `Pot of ${pot} chips awarded.`;

    scoresEl.innerHTML = scores.map(s => {
      const isWin = winners.some(w => w.id === s.id);
      return `<div class="score-row${isWin ? ' winner' : ''}">
        <span class="score-name">${s.name} ${isWin ? '👑' : ''}</span>
        <span class="score-val">Score: ${s.score} | Chips: ${s.chips}</span>
      </div>`;
    }).join('');

    modal.classList.remove('hidden');
  }

  function hideResultModal() {
    document.getElementById('modal-result')?.classList.add('hidden');
  }

  // ── show game over modal ───────────────────────────────────────────────────
  function showGameOver(winnerName, chips) {
    const modal = document.getElementById('modal-gameover');
    document.getElementById('gameover-title').textContent = winnerName === 'You' ? 'You Win! 🏆' : `${winnerName} Wins`;
    document.getElementById('gameover-body').textContent  =
      `${winnerName} finished with ${chips} chips. All others busted out.`;
    modal.classList.remove('hidden');
  }

  // ── screen switching ───────────────────────────────────────────────────────
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }

  return {
    cardHTML,
    renderAIZones,
    renderHumanHand,
    renderHumanChips,
    setPhase,
    setActions,
    clearActions,
    setDiceResult,
    showRollButton,
    log,
    revealAIHand,
    showResultModal,
    hideResultModal,
    showGameOver,
    showScreen,
  };
})();
