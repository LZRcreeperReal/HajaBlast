// ── chips.js ──────────────────────────────────────────────────────────────────
// Pot management and chip visual rendering

const Chips = (() => {

  let pot = 0;

  function reset()        { pot = 0; }
  function add(n)         { pot += n; }
  function getPot()       { return pot; }

  /**
   * Render stacked chip discs into #pot-chips-visual.
   * Uses red (5), blue (10), white (1) breakdown.
   */
  function renderPot() {
    const el = document.getElementById('pot-chips-visual');
    if (!el) return;
    el.innerHTML = '';
    const amount = document.getElementById('pot-amount');
    if (amount) amount.textContent = pot;

    if (pot === 0) return;

    // breakdown into denominations
    let remaining = pot;
    const stacks = [];
    const denoms = [
      { val: 10, cls: 'blue'  },
      { val: 5,  cls: 'red'   },
      { val: 1,  cls: 'white' },
    ];
    for (const d of denoms) {
      const count = Math.floor(remaining / d.val);
      remaining -= count * d.val;
      if (count > 0) stacks.push({ count: Math.min(count, 8), cls: d.cls });
    }

    for (const s of stacks) {
      const stackEl = document.createElement('div');
      stackEl.className = 'pot-chip-stack';
      for (let i = 0; i < s.count; i++) {
        const chip = document.createElement('div');
        chip.className = `chip-disc ${s.cls}`;
        chip.style.animationDelay = `${i * 0.04}s`;
        stackEl.appendChild(chip);
      }
      el.appendChild(stackEl);
    }
  }

  return { reset, add, getPot, renderPot };
})();
