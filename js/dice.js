// ── dice.js ──────────────────────────────────────────────────────────────────
// Handles dice roll logic and drives the 3-D CSS animation

const DiceEngine = (() => {

  // Final CSS transforms that put each face value towards the camera
  // (matches the face layout in HTML: front=1, top=2, left=3, right=4, bottom=5, back=6)
  const FACE_TRANSFORMS = {
    1: 'rotateX(0deg)    rotateY(0deg)',    // front face
    2: 'rotateX(-90deg)  rotateY(0deg)',    // top face
    3: 'rotateX(0deg)    rotateY(90deg)',   // left face
    4: 'rotateX(0deg)    rotateY(-90deg)',  // right face
    5: 'rotateX(90deg)   rotateY(0deg)',    // bottom face
    6: 'rotateX(0deg)    rotateY(180deg)',  // back face
  };

  /**
   * Animate the dice and resolve with the rolled value after animation.
   * @param {HTMLElement} diceEl  – the .dice element
   * @param {number}       value  – 1-6
   * @returns {Promise<number>}
   */
  function roll(diceEl, value) {
    return new Promise(resolve => {
      // set the CSS variable for where to land
      diceEl.style.setProperty('--dice-final-transform', FACE_TRANSFORMS[value]);

      // trigger animation
      diceEl.classList.remove('rolling');
      // force reflow so re-adding the class triggers
      void diceEl.offsetWidth;
      diceEl.classList.add('rolling');

      diceEl.addEventListener('animationend', () => {
        diceEl.classList.remove('rolling');
        // lock the die on the final face
        diceEl.style.transform = FACE_TRANSFORMS[value];
        resolve(value);
      }, { once: true });
    });
  }

  /** Random 1–6 */
  function randomValue() {
    return Math.floor(Math.random() * 6) + 1;
  }

  return { roll, randomValue };
})();
