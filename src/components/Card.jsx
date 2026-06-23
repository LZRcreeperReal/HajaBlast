import React from 'react';
import { isRed } from '../gameLogic.js';
import styles from './Card.module.css';

export default function Card({ card, faceDown = false, highlight = false, dimmed = false, multiplier = null, small = false }) {
  const red = card && isRed(card.suit);

  return (
    <div
      className={[
        styles.card,
        faceDown ? styles.faceDown : '',
        highlight ? styles.highlight : '',
        dimmed ? styles.dimmed : '',
        small ? styles.small : '',
        red ? styles.red : styles.black,
      ].filter(Boolean).join(' ')}
    >
      {faceDown ? (
        <div className={styles.back}>
          <span className={styles.backPattern}>HR</span>
        </div>
      ) : card ? (
        <>
          <div className={styles.corner}>
            <span className={styles.rank}>{card.rank}</span>
            <span className={styles.suit}>{card.suit}</span>
          </div>
          <div className={styles.center}>{card.suit}</div>
          <div className={[styles.corner, styles.cornerBL].join(' ')}>
            <span className={styles.rank}>{card.rank}</span>
            <span className={styles.suit}>{card.suit}</span>
          </div>
          {multiplier && multiplier > 1 && (
            <div className={styles.multiplierBadge}>×{multiplier}</div>
          )}
        </>
      ) : null}
    </div>
  );
}
