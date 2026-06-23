import React, { useEffect, useState } from 'react';
import styles from './Dice.module.css';

const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

export default function Dice({ value, rolling = false, size = 64 }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (rolling) {
      setSpinning(true);
      let count = 0;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 10) {
          clearInterval(interval);
          setDisplayValue(value);
          setSpinning(false);
        }
      }, 80);
      return () => clearInterval(interval);
    } else {
      setDisplayValue(value || 1);
    }
  }, [rolling, value]);

  const dots = DOT_POSITIONS[displayValue] || [];

  return (
    <div className={[styles.dice, spinning ? styles.spinning : ''].filter(Boolean).join(' ')} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <rect
          x="4" y="4" width="92" height="92" rx="18"
          fill="#f4eedc"
          stroke="#c9a84c"
          strokeWidth="3"
        />
        {dots.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="8" fill="#1a1a1a" />
        ))}
      </svg>
    </div>
  );
}
