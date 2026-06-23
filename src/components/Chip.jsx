import React from 'react';
import styles from './Chip.module.css';

export default function Chip({ count = 0, color = '#c9a84c', size = 36, label = null }) {
  return (
    <div className={styles.chipStack} title={`${count} chips`}>
      <div
        className={styles.chip}
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 0 3px rgba(255,255,255,0.18), 0 0 0 5px ${color}, 0 3px 10px rgba(0,0,0,0.5)`,
        }}
      >
        <span className={styles.chipInner} style={{ fontSize: size * 0.3 }}>
          {label ?? count}
        </span>
      </div>
    </div>
  );
}
