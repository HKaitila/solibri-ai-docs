'use client';

import { useState, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            backgroundColor:
              toast.type === 'success'
                ? '#10b981'
                : toast.type === 'error'
                ? '#ef4444'
                : '#3b82f6',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            marginBottom: '10px',
            minWidth: '250px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 0 0 10px',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}