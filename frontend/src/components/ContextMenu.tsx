import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  options: {
    label: string;
    onClick?: () => void;
    className?: string;
    divider?: boolean;
    disabled?: boolean;
    subMenu?: {
      label: string;
      onClick: () => void;
    }[];
  }[];
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, options }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${y}px`,
        left: `${x}px`,
        zIndex: 9999,
        minWidth: '190px',
        backgroundColor: '#0b0a14',
        border: '1px solid rgba(192, 132, 252, 0.25)',
        borderRadius: '6px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(192, 132, 252, 0.1)',
        padding: '4px 0',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        userSelect: 'none'
      }}
    >
      {options.map((opt, idx) => (
        <div key={idx}>
          {opt.divider && <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />}
          {opt.subMenu ? (
            <div className="context-menu-item submenu-parent" style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 14px',
                  color: opt.disabled ? 'var(--text-muted)' : '#ffffff',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  fontWeight: 500
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontSize: '9px', opacity: 0.7 }}>&gt;</span>
              </div>
              {!opt.disabled && (
                <div
                  className="submenu"
                  style={{
                    position: 'absolute',
                    left: '100%',
                    top: '0',
                    backgroundColor: '#0b0a14',
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    borderRadius: '6px',
                    minWidth: '150px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                    display: 'none',
                    padding: '4px 0'
                  }}
                >
                  {opt.subMenu.map((sub, sIdx) => (
                    <div
                      key={sIdx}
                      className="context-menu-item"
                      onClick={() => {
                        sub.onClick();
                        onClose();
                      }}
                      style={{
                        padding: '8px 14px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {sub.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`context-menu-item ${opt.className || ''}`}
              onClick={() => {
                if (!opt.disabled && opt.onClick) {
                  opt.onClick();
                  onClose();
                }
              }}
              style={{
                padding: '8px 14px',
                color: opt.disabled ? 'var(--text-muted)' : opt.className === 'delete' ? '#ef4444' : '#ffffff',
                cursor: opt.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                fontWeight: 500
              }}
            >
              {opt.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
