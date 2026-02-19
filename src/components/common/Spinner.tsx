import { memo } from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white';
}

export const Spinner = memo(({
  size = 'md',
  color = 'primary',
}: SpinnerProps) => {
  return (
    <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
      <div className={styles.ring}></div>
    </div>
  );
});

Spinner.displayName = 'Spinner';
