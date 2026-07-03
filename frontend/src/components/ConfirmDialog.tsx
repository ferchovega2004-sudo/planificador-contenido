// UX-MEJORA: Componente ConfirmDialog global con seguridad de foco por defecto y escape
import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps): React.JSX.Element | null {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus cancel button for security against accidental confirms
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const titleColor = isDanger ? '#ef4444' : '#f59e0b';
  const confirmBtnBg = isDanger ? '#dc2626' : '#d97706';
  const confirmBtnHoverBg = isDanger ? '#b91c1c' : '#b45309';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(22, 14, 17, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '24px',
        boxSizing: 'border-box'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#1e1317',
          border: '1px solid #3b232c',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          boxSizing: 'border-box'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: titleColor,
            margin: '0 0 12px 0',
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#cbd5e1',
            lineHeight: '1.5',
            margin: '0 0 24px 0',
          }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              borderColor: '#3b232c',
              color: '#cbd5e1',
              background: 'transparent'
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: confirmBtnBg,
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = confirmBtnHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = confirmBtnBg;
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
