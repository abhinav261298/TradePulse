import { memo, useEffect, useState } from 'react';
import type { Toast } from '../../hooks/useToast';
import styles from './ToastNotification.module.css';

export interface ToastNotificationProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export const ToastNotification = memo(({
  toast,
  onRemove,
}: ToastNotificationProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger exit animation before removal
    if (toast.duration && toast.duration > 0) {
      const exitTimeout = setTimeout(() => {
        setIsExiting(true);
      }, toast.duration - 300); // Start exit 300ms before removal

      return () => clearTimeout(exitTimeout);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const typeClass = styles[toast.type] || styles.info;
  const exitClass = isExiting ? styles.exiting : '';

  return (
    <div className={`${styles.toast} ${typeClass} ${exitClass}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '✕'}
          {toast.type === 'warning' && '⚠'}
          {toast.type === 'info' && 'ℹ'}
        </div>
        <div className={styles.message}>{toast.message}</div>
      </div>
      <button className={styles.closeBtn} onClick={handleClose}>
        ✕
      </button>
    </div>
  );
});

ToastNotification.displayName = 'ToastNotification';
