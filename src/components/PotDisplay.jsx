import React from 'react';
import styles from './PotDisplay.module.css';

export default function PotDisplay({ pot, winner = null }) {
  return (
    <div className={styles.pot}>
      <div className={styles.label}>POT</div>
      <div className={styles.amount}>{pot}</div>
      <div className={styles.sublabel}>chips</div>
      {winner && (
        <div className={styles.winnerBanner}>
          🏆 {winner} wins the pot!
        </div>
      )}
    </div>
  );
}
