import React, { useState, useCallback } from 'react';
import {
  createDeck, shuffle, rollDie, resolvePlay, rollDescription,
  PHASE, PLAYER_NAMES, PLAYER_COLORS,
} from './gameLogic.js';
import PlayerPanel from './components/PlayerPanel.jsx';
import PotDisplay from './components/PotDisplay.jsx';
import Dice from './components/Dice.jsx';
import styles from './App.module.css';

const STARTING_CHIPS = 25;
const HAND_SIZE = 3;

// ─── helpers ─────────────────────────────────────────────────────────────────

function dealHands(deck, playerCount) {
  const hands = [];
  let d = [...deck];
  for (let i = 0; i < playerCount; i++) {
    hands.push(d.splice(0, HAND_SIZE));
  }
  return { hands, deck: d };
}

function initPlayers(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: PLAYER_NAMES[i],
    chips: STARTING_CHIPS,
    hand: [],
    hasSwapped: false,
    anteRoll: null,
    playRoll: null,
    playResult: null,
    eliminated: false,
  }));
}

// ─── component ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('title'); // 'title' | 'game'
  const [playerCount, setPlayerCount] = useState(2);
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [pot, setPot] = useState(0);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState([]);
  const [winner, setWinner] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null);
  const [rollingState, setRollingState] = useState(null); // null | 'ante' | 'play'
  const [showAllCards, setShowAllCards] = useState(false);

  // ── log helper ──────────────────────────────────────────────────────────────
  const addLog = useCallback((msg) => {
    setLog(prev => [{ msg, id: Date.now() + Math.random() }, ...prev].slice(0, 30));
  }, []);

  // ── START GAME ──────────────────────────────────────────────────────────────
  function startGame() {
    const freshDeck = createDeck();
    const ps = initPlayers(playerCount);
    const { hands, deck: remaining } = dealHands(freshDeck, playerCount);
    ps.forEach((p, i) => { p.hand = hands[i]; });
    setPlayers(ps);
    setDeck(remaining);
    setPot(0);
    setRound(1);
    setLog([]);
    setWinner(null);
    setRoundWinner(null);
    setShowAllCards(true); // show your own cards during swap
    setPhase(PHASE.SWAP);
    setScreen('game');
    addLog('New game started — swap phase begins');
  }

  // ── SWAP ────────────────────────────────────────────────────────────────────
  function handleSwap(playerIndex, cardIndex) {
    const p = players[playerIndex];
    if (p.hasSwapped || p.chips < 1) return;

    // find the lowest card
    const lowestIndex = p.hand.reduce((minI, c, i, arr) =>
      c.value < arr[minI].value ? i : minI, 0);

    if (cardIndex !== lowestIndex) {
      addLog(`${p.name}: can only swap the lowest card (${p.hand[lowestIndex].rank}${p.hand[lowestIndex].suit})`);
      return;
    }

    const newCard = deck[0];
    const newDeck = deck.slice(1);
    const newHand = [...p.hand];
    const old = newHand[cardIndex];
    newHand[cardIndex] = newCard;

    addLog(`${p.name} swapped ${old.rank}${old.suit} → ${newCard.rank}${newCard.suit} (−1 chip)`);

    setPlayers(prev => prev.map((pl, i) =>
      i === playerIndex ? { ...pl, hand: newHand, chips: pl.chips - 1, hasSwapped: true } : pl
    ));
    setDeck(newDeck);
  }

  // ── PROCEED SWAP → ANTE ROLL ─────────────────────────────────────────────────
  function proceedToAnte() {
    setPhase(PHASE.ANTE_ROLL);
    setShowAllCards(false);
    addLog('Ante phase — everyone rolls for chips into the pot');
    // Auto-roll all players
    doAnteRolls();
  }

  function doAnteRolls() {
    setRollingState('ante');
    setTimeout(() => {
      setPlayers(prev => {
        const updated = prev.map(p => {
          if (p.eliminated) return p;
          const roll = rollDie();
          const paid = Math.min(roll, p.chips);
          return { ...p, anteRoll: roll, chips: p.chips - paid, _antePaid: paid };
        });
        const totalAnte = updated.reduce((s, p) => s + (p._antePaid || 0), 0);
        setPot(prev => prev + totalAnte);

        updated.forEach(p => {
          if (!p.eliminated) addLog(`${p.name} rolled ${p.anteRoll} → paid ${p._antePaid} chip(s) into pot`);
        });

        return updated;
      });
      setRollingState(null);
      setPhase(PHASE.PLAY_ROLL);
      addLog('Play phase — everyone rolls to determine their hand');
      setTimeout(doPlayRolls, 600);
    }, 900);
  }

  // ── PLAY ROLL ────────────────────────────────────────────────────────────────
  function doPlayRolls() {
    setRollingState('play');
    setTimeout(() => {
      setPlayers(prev => {
        const updated = prev.map(p => {
          if (p.eliminated) return p;
          const roll = rollDie();
          const result = resolvePlay(p.hand, roll);
          return { ...p, playRoll: roll, playResult: result };
        });
        updated.forEach(p => {
          if (!p.eliminated)
            addLog(`${p.name} rolled ${p.playRoll}: ${rollDescription(p.playRoll)} → ${p.playResult.total} pts`);
        });
        return updated;
      });
      setRollingState(null);
      setPhase(PHASE.REVEAL);
      setShowAllCards(true);
      setTimeout(resolveRound, 400);
    }, 900);
  }

  // ── RESOLVE ROUND ─────────────────────────────────────────────────────────────
  function resolveRound() {
    setPlayers(prev => {
      const active = prev.filter(p => !p.eliminated && p.playResult);
      if (active.length === 0) return prev;

      const maxScore = Math.max(...active.map(p => p.playResult.total));
      const winners = active.filter(p => p.playResult.total === maxScore);

      // Split pot if tie
      const share = Math.floor(pot / winners.length);
      const remainder = pot - share * winners.length;

      const winnerNames = winners.map(w => w.name).join(' & ');
      addLog(`─── Round ${round} result: ${winnerNames} wins with ${maxScore} pts ───`);
      if (winners.length > 1) addLog(`Pot split: ${share} chips each${remainder > 0 ? `, ${remainder} left in pot` : ''}`);

      setRoundWinner(winnerNames);

      const updated = prev.map(p => {
        if (winners.find(w => w.id === p.id)) {
          return { ...p, chips: p.chips + share };
        }
        return p;
      });

      // Set new pot remainder
      setPot(remainder);

      // Check eliminations
      const afterElim = updated.map(p => ({
        ...p,
        eliminated: p.eliminated || p.chips === 0,
      }));

      // Check overall winner
      const surviving = afterElim.filter(p => !p.eliminated);
      if (surviving.length === 1) {
        setWinner(surviving[0].name);
        setPhase(PHASE.GAME_OVER);
        addLog(`🏆 ${surviving[0].name} wins the whole game!`);
      } else {
        setPhase(PHASE.REVEAL);
      }

      return afterElim;
    });
  }

  // ── NEXT ROUND ────────────────────────────────────────────────────────────────
  function nextRound() {
    const newRound = round + 1;
    setRound(newRound);
    setRoundWinner(null);
    addLog(`── Round ${newRound} begins ──`);

    // Re-deal new hands
    let freshDeck = createDeck();
    const activePlayers = players.filter(p => !p.eliminated);

    setPlayers(prev => {
      const updated = prev.map(p => {
        if (p.eliminated) return p;
        const hand = freshDeck.splice(0, HAND_SIZE);
        return {
          ...p,
          hand,
          hasSwapped: false,
          anteRoll: null,
          playRoll: null,
          playResult: null,
          _antePaid: undefined,
        };
      });
      return updated;
    });
    setDeck(freshDeck);
    setShowAllCards(true);
    setPhase(PHASE.SWAP);
    addLog('Swap phase — spend 1 chip to swap your lowest card');
  }

  // ── RESET ─────────────────────────────────────────────────────────────────────
  function resetGame() {
    setScreen('title');
    setPhase(PHASE.SETUP);
    setPlayers([]);
    setDeck([]);
    setPot(0);
    setRound(1);
    setLog([]);
    setWinner(null);
    setRoundWinner(null);
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  if (screen === 'title') {
    return (
      <div className={styles.titleScreen}>
        <div className={styles.titleCard}>
          <div className={styles.titleSuit}>♠ ♥ ♦ ♣</div>
          <h1 className={styles.titleText}>Haja<br />Rumble</h1>
          <p className={styles.titleSub}>A game of cards, dice &amp; nerve</p>
          <div className={styles.playerSelect}>
            <label className={styles.selectLabel}>Number of Players</label>
            <div className={styles.selectButtons}>
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  className={[styles.selectBtn, playerCount === n ? styles.selectBtnActive : ''].join(' ')}
                  onClick={() => setPlayerCount(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button className={styles.startBtn} onClick={startGame}>
            Deal the Cards
          </button>
          <div className={styles.rulesSummary}>
            <p>Each player starts with 25 chips &amp; 3 cards.</p>
            <p>Roll to ante, roll to play. Highest total wins the pot.</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME SCREEN ─────────────────────────────────────────────────────────────

  const activePlayers = players.filter(p => !p.eliminated);
  const phaseLabel = {
    [PHASE.SWAP]: 'SWAP PHASE',
    [PHASE.ANTE_ROLL]: 'ANTE ROLL',
    [PHASE.PLAY_ROLL]: 'PLAY ROLL',
    [PHASE.REVEAL]: 'REVEAL',
    [PHASE.GAME_OVER]: 'GAME OVER',
  }[phase] ?? phase;

  return (
    <div className={styles.gameScreen}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.logo}>Haja Rumble</span>
        <div className={styles.headerCenter}>
          <span className={styles.phasePill}>{phaseLabel}</span>
          <span className={styles.roundBadge}>Round {round}</span>
        </div>
        <button className={styles.resetBtn} onClick={resetGame}>New Game</button>
      </header>

      {/* Main arena */}
      <main className={styles.arena}>
        {/* Players grid */}
        <div className={[styles.playersGrid, `players${players.length}`].join(' ')}>
          {players.map((player, i) => (
            <PlayerPanel
              key={player.id}
              player={player}
              index={i}
              isActive={!player.eliminated}
              phase={phase}
              showCards={showAllCards}
              canSwap={phase === PHASE.SWAP && !player.hasSwapped && !player.eliminated && player.chips >= 1}
              onSwap={(cardIdx) => handleSwap(i, cardIdx)}
              playResult={phase === PHASE.REVEAL || phase === PHASE.GAME_OVER ? player.playResult : null}
              anteRoll={player.anteRoll}
              playRoll={player.playRoll}
              rolling={rollingState}
              eliminated={player.eliminated}
            />
          ))}
        </div>

        {/* Center controls */}
        <div className={styles.centerPanel}>
          <div className={styles.potWrap}>
            <PotDisplay pot={pot} winner={roundWinner} />
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            {phase === PHASE.SWAP && (
              <button className={styles.actionBtn} onClick={proceedToAnte}>
                {players.some(p => !p.eliminated && !p.hasSwapped)
                  ? 'Skip Swaps & Roll'
                  : 'Roll the Dice →'}
              </button>
            )}
            {(phase === PHASE.REVEAL) && !winner && (
              <button className={styles.actionBtn} onClick={nextRound}>
                Next Round →
              </button>
            )}
            {phase === PHASE.GAME_OVER && (
              <div className={styles.gameOverPanel}>
                <div className={styles.trophyIcon}>🏆</div>
                <div className={styles.winnerText}>{winner}</div>
                <div className={styles.winnerSub}>wins Haja Rumble!</div>
                <button className={styles.actionBtn} onClick={resetGame}>
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Phase hint */}
          {phase === PHASE.SWAP && (
            <div className={styles.hint}>
              <em>Each player may swap their lowest card for a new one — costs 1 chip. One swap per round.</em>
            </div>
          )}
          {phase === PHASE.REVEAL && (
            <div className={styles.rollKey}>
              <div className={styles.rollKeyTitle}>Roll Reference</div>
              <div className={styles.rollKeyGrid}>
                <span>1</span><span>1 card • face value</span>
                <span>2</span><span>2 cards • face value</span>
                <span>3</span><span>All 3 cards • face value</span>
                <span>4</span><span>1 card doubled</span>
                <span>5</span><span>1 doubled + 1 normal</span>
                <span>6</span><span>2 cards both doubled</span>
              </div>
            </div>
          )}
        </div>

        {/* Log */}
        <div className={styles.logPanel}>
          <div className={styles.logTitle}>Event Log</div>
          <div className={styles.logList}>
            {log.map(entry => (
              <div key={entry.id} className={styles.logEntry}>{entry.msg}</div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
