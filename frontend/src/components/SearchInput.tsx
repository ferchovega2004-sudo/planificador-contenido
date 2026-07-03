// UX-MEJORA: Componente SearchInput global con atajo visual "/"
import React, { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  placeholder: string;
  value: string;
  onSearch: (value: string) => void;
  style?: React.CSSProperties;
}

export default function SearchInput({ placeholder, value, onSearch, style }: SearchInputProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const badgeOpacity = focused || value ? 0.3 : 1;

  return (
    <div className="search-bar" style={{ position: 'relative', display: 'flex', alignItems: 'center', ...style }}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8b6e79"
        strokeWidth="2"
        style={{ marginRight: '8px', flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        style={{ fontSize: '13px', width: '100%', paddingRight: '48px' }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onSearch('')}
          style={{
            position: 'absolute',
            right: focused || value ? '32px' : '32px',
            background: 'none',
            border: 'none',
            color: '#8b6e79',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}
          title="Limpiar"
        >
          ✕
        </button>
      )}
      <kbd
        style={{
          position: 'absolute',
          right: '8px',
          backgroundColor: 'rgba(216, 27, 96, 0.15)',
          border: '1px solid rgba(216, 27, 96, 0.4)',
          borderRadius: '4px',
          padding: '2px 5px',
          fontSize: '10px',
          color: '#d81b60',
          pointerEvents: 'none',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          opacity: badgeOpacity,
          transition: 'opacity 0.2s ease',
          userSelect: 'none'
        }}
      >
        /
      </kbd>
    </div>
  );
}
