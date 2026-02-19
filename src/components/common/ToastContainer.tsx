import { memo } from 'react';
import type { Toast } from '../../hooks/useToast';
import { ToastNotification } from './ToastNotification';
import styles from './ToastContainer.module.css';

export interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer = memo(({
  toasts,
  onRemove,
}: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';
