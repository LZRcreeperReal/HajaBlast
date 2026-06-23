import React from 'react';
import Card from './Card.jsx';
import Chip from './Chip.jsx';
import Dice from './Dice.jsx';
import styles from './PlayerPanel.module.css';
import { PLAYER_COLORS } from '../gameLogic.js';

export default function PlayerPanel({
  player,
  index,
  isActive,
  phase,
  showCards,
  onSwap,
  canSwap,
  playResult,
  anteRoll,
  playRoll,
  rolling,
  eliminated,
}) {
  const color = PLAYER_COLORS[index];
  const chipColors = ['#c9a84c', '#2255aa', '#9b1c2e', '#2a7a4b'];

  return (
    <div
      className={[
        styles.panel,
        isActive ? styles.active : '',
        eliminated ? styles.eliminated : '',
      ].filter(Boolean).join(' ')}
      style={{ '--player-color': color }}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.nameRow}>
          <span className={styles.dot} style={{ background: color }} />
          <span className={styles.name}>{player.name}</span>
          {eliminated && <span className={styles.outBadge}>OUT</span>}
        </div>
        <div className={styles.chipRow}>
          <Chip count={player.chips} color={chipColors[index]} size={28} />
          <span className={styles.chipCount}>{player.chips} chips</span>
        </div>
      </div>

      {/* Cards */}
      <div className={styles.cards}>
        {player.hand.map((card, ci) => {
          const playedEntry = playResult?.played?.find(p => p.card.id === card.id);
          const isPlayed = !!playedEntry;
          const multiplier = playedEntry?.multiplier;
          return (
            <div key={card.id} className={styles.cardWrap}>
              <Card
                card={showCards || phase === 'REVEAL' ? card : null}
                faceDown={!showCards && phase !== 'REVEAL'}
                highlight={isPlayed}
                dimmed={playResult && !isPlayed}
                multiplier={multiplier}
              />
              {canSwap && (
                <button
                  className={styles.swapBtn}
                  onClick={() => onSwap(ci)}
                  disabled={!canSwap}
                >
                  Swap ↺
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Roll results */}
      {(anteRoll || playRoll) && (
        <div className={styles.rollRow}>
          {anteRoll && (
            <div className={styles.rollItem}>
              <span className={styles.rollLabel}>Ante</span>
              <Dice value={anteRoll} rolling={rolling === 'ante'} size={36} />
              <span className={styles.rollNum}>={anteRoll}</span>
            </div>
          )}
          {playRoll && (
            <div className={styles.rollItem}>
              <span className={styles.rollLabel}>Play</span>
              <Dice value={playRoll} rolling={rolling === 'play'} size={36} />
              <span className={styles.rollNum}>={playRoll}</span>
            </div>
          )}
        </div>
      )}

      {/* Play result */}
      {playResult && (
        <div className={styles.resultRow}>
          <span className={styles.resultDesc}>{playResult.description}</span>
          <span className={styles.resultTotal}>{playResult.total} pts</span>
        </div>
      )}
    </div>
  );
}
