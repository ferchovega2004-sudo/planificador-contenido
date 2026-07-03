// UX-MEJORA: Componente EmptyState global reutilizable
import React from 'react';

interface EmptyStateProps {
  icon: 'box' | 'user' | 'file' | 'document' | 'calendar';
  title: string;
  description: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  secondaryCtaLabel?: string;
  secondaryCtaAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaAction,
  secondaryCtaLabel,
  secondaryCtaAction,
}: EmptyStateProps): React.JSX.Element {
  
  // Render deterministic SVG icon based on the icon prop
  const renderIcon = (): React.ReactNode => {
    const strokeColor = '#8b6e79';
    switch (icon) {
      case 'user':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'file':
      case 'document':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'calendar':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        );
      case 'box':
      default:
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
        {renderIcon()}
      </div>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#ffffff',
          margin: '0 0 8px 0',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#cbd5e1',
          maxWidth: '440px',
          margin: '0 0 24px 0',
          lineHeight: '1.5',
        }}
      >
        {description}
      </p>

      {(ctaLabel || secondaryCtaLabel) && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {secondaryCtaLabel && secondaryCtaAction && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={secondaryCtaAction}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                borderColor: '#3b232c',
                color: '#cbd5e1',
                background: 'transparent'
              }}
            >
              {secondaryCtaLabel}
            </button>
          )}
          {ctaLabel && ctaAction && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={ctaAction}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
              }}
            >
              {ctaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
