import React, { useState, useEffect, useRef } from 'react';

interface RadialTimePickerProps {
  initialValue: string; // "HH:MM" format
  onClose: () => void;
  onSelect: (time: string) => void;
}

const RadialTimePicker: React.FC<RadialTimePickerProps> = ({ initialValue, onClose, onSelect }) => {
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tempHourInput, setTempHourInput] = useState('');
  const [tempMinuteInput, setTempMinuteInput] = useState('');
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue && initialValue.includes(':')) {
      const [hStr, mStr] = initialValue.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      
      if (isNaN(h)) h = 12;
      
      const p = h >= 12 ? 'PM' : 'AM';
      let displayHour = h % 12;
      if (displayHour === 0) displayHour = 12;

      setHour(displayHour);
      setMinute(isNaN(m) ? 0 : m);
      setPeriod(p);
      setTempHourInput(displayHour.toString().padStart(2, '0'));
      setTempMinuteInput((isNaN(m) ? 0 : m).toString().padStart(2, '0'));
    } else {
      // Default to current time or 12:00 PM
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const p = currentHour >= 12 ? 'PM' : 'AM';
      let displayHour = currentHour % 12;
      if (displayHour === 0) displayHour = 12;
      
      setHour(displayHour);
      setMinute(Math.round(currentMin / 5) * 5 % 60);
      setPeriod(p);
      setTempHourInput(displayHour.toString().padStart(2, '0'));
      setTempMinuteInput((Math.round(currentMin / 5) * 5 % 60).toString().padStart(2, '0'));
    }
  }, [initialValue]);

  const handleClockSelect = (clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = clientX - cx;
    const y = clientY - cy;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      let selectedHour = Math.round(angle / 30);
      if (selectedHour === 0) selectedHour = 12;
      setHour(selectedHour);
      setTempHourInput(selectedHour.toString().padStart(2, '0'));
    } else {
      let selectedMinute = Math.round(angle / 6);
      if (selectedMinute === 60) selectedMinute = 0;
      // Ajustar al múltiplo de 5 más cercano para facilidad del reloj radial
      selectedMinute = Math.round(selectedMinute / 5) * 5;
      if (selectedMinute === 60) selectedMinute = 0;
      setMinute(selectedMinute);
      setTempMinuteInput(selectedMinute.toString().padStart(2, '0'));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleClockSelect(e.clientX, e.clientY);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      handleClockSelect(moveEvent.clientX, moveEvent.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Cambiar automáticamente a minutos después de seleccionar la hora
      if (mode === 'hours') {
        setTimeout(() => {
          setMode('minutes');
        }, 350);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleConfirm = () => {
    let finalHour = hour;
    let finalMinute = minute;

    if (isKeyboardMode) {
      let hInput = parseInt(tempHourInput, 10);
      let mInput = parseInt(tempMinuteInput, 10);
      if (isNaN(hInput) || hInput < 1 || hInput > 12) hInput = 12;
      if (isNaN(mInput) || mInput < 0 || mInput > 59) mInput = 0;
      
      finalHour = hInput;
      finalMinute = mInput;
    }

    let h24 = finalHour % 12;
    if (period === 'PM') h24 += 12;
    if (period === 'AM' && finalHour === 12) h24 = 0;

    const timeStr = `${h24.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`;
    onSelect(timeStr);
  };

  // Renderizar horas del reloj (1 al 12)
  const renderHours = () => {
    const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    return hours.map((h, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = 110 + 82 * Math.cos(angle);
      const y = 110 + 82 * Math.sin(angle);
      const isSelected = hour === h;

      return (
        <div
          key={h}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '28px',
            height: '28px',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: isSelected ? '700' : '500',
            color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.85)',
            backgroundColor: isSelected ? 'var(--neon-cyan)' : 'transparent',
            borderRadius: '50%',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 3,
            transition: 'background-color 0.2s ease, color 0.2s ease'
          }}
        >
          {h}
        </div>
      );
    });
  };

  // Renderizar minutos del reloj (múltiplos de 5)
  const renderMinutes = () => {
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    return minutes.map((m, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = 110 + 82 * Math.cos(angle);
      const y = 110 + 82 * Math.sin(angle);
      const isSelected = minute === m;

      return (
        <div
          key={m}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '28px',
            height: '28px',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: isSelected ? '700' : '500',
            color: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.85)',
            backgroundColor: isSelected ? 'var(--neon-cyan)' : 'transparent',
            borderRadius: '50%',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 3,
            transition: 'background-color 0.2s ease, color 0.2s ease'
          }}
        >
          {m.toString().padStart(2, '0')}
        </div>
      );
    });
  };

  // Calcular rotación de la manecilla
  const handAngle = mode === 'hours' ? (hour % 12) * 30 : minute * 6;

  return (
    <div
      className="tp-backdrop"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        fontFamily: 'Outfit, sans-serif'
      }}
    >
      <div
        className="tp-modal"
        style={{
          width: '280px',
          backgroundColor: '#131124',
          border: '1px solid rgba(192, 132, 252, 0.25)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(192, 132, 252, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Panel de Visualización del Tiempo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            marginBottom: '20px',
            padding: '8px 0',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          {isKeyboardMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                maxLength={2}
                value={tempHourInput}
                onChange={(e) => setTempHourInput(e.target.value.replace(/\D/g, ''))}
                placeholder="12"
                style={{
                  width: '50px',
                  fontSize: '44px',
                  fontWeight: '600',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  padding: '2px 0'
                }}
              />
              <span style={{ fontSize: '44px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.5)' }}>:</span>
              <input
                type="text"
                maxLength={2}
                value={tempMinuteInput}
                onChange={(e) => setTempMinuteInput(e.target.value.replace(/\D/g, ''))}
                placeholder="00"
                style={{
                  width: '50px',
                  fontSize: '44px',
                  fontWeight: '600',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(192, 132, 252, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  outline: 'none',
                  padding: '2px 0'
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                onClick={() => setMode('hours')}
                style={{
                  fontSize: '48px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: mode === 'hours' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  textShadow: mode === 'hours' ? '0 0 10px rgba(192,132,252,0.3)' : 'none'
                }}
              >
                {hour.toString().padStart(2, '0')}
              </span>
              <span style={{ fontSize: '48px', fontWeight: '400', color: 'rgba(255, 255, 255, 0.3)' }}>:</span>
              <span
                onClick={() => setMode('minutes')}
                style={{
                  fontSize: '48px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: mode === 'minutes' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.45)',
                  transition: 'color 0.2s ease',
                  textShadow: mode === 'minutes' ? '0 0 10px rgba(192,132,252,0.3)' : 'none'
                }}
              >
                {minute.toString().padStart(2, '0')}
              </span>
            </div>
          )}

          {/* Selector de AM/PM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '12px' }}>
            <span
              onClick={() => setPeriod('AM')}
              style={{
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                color: period === 'AM' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.35)',
                transition: 'color 0.2s ease'
              }}
            >
              AM
            </span>
            <span
              onClick={() => setPeriod('PM')}
              style={{
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                color: period === 'PM' ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.35)',
                transition: 'color 0.2s ease'
              }}
            >
              PM
            </span>
          </div>
        </div>

        {/* Círculo del Reloj Radial */}
        {!isKeyboardMode && (
          <div
            key={mode}
            ref={clockRef}
            onMouseDown={handleMouseDown}
            className="tp-clock-face-container"
            style={{
              position: 'relative',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              backgroundColor: '#1b1932',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              margin: '10px 0 20px',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
          >
            {/* Punto Central */}
            <div
              style={{
                position: 'absolute',
                left: '110px',
                top: '110px',
                width: '6px',
                height: '6px',
                backgroundColor: 'var(--neon-cyan)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 4
              }}
            />

            {/* Manecilla del Reloj */}
            <div
              style={{
                position: 'absolute',
                left: '110px',
                top: '110px',
                width: '2px',
                height: '82px',
                backgroundColor: 'var(--neon-cyan)',
                transformOrigin: 'top center',
                transform: `translate(-50%, 0) rotate(${handAngle + 180}deg)`,
                zIndex: 2,
                transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
            />

            {/* Render de Números */}
            {mode === 'hours' ? renderHours() : renderMinutes()}
          </div>
        )}

        {/* Pie del Reloj (Acciones y Tipo de Entrada) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '8px'
          }}
        >
          {/* Botón Cambiar Modo Teclado */}
          <button
            type="button"
            onClick={() => setIsKeyboardMode(!isKeyboardMode)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            title={isKeyboardMode ? "Ver selector de reloj" : "Digitar hora manualmente"}
          >
            {isKeyboardMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="6" y1="8" x2="6.01" y2="8"></line>
                <line x1="10" y1="8" x2="10.01" y2="8"></line>
                <line x1="14" y1="8" x2="14.01" y2="8"></line>
                <line x1="18" y1="8" x2="18.01" y2="8"></line>
                <line x1="6" y1="12" x2="6.01" y2="12"></line>
                <line x1="10" y1="12" x2="14.01" y2="12"></line>
                <line x1="18" y1="12" x2="18.01" y2="12"></line>
                <line x1="7" y1="16" x2="17" y2="16"></line>
              </svg>
            )}
          </button>

          {/* Aceptar / Cancelar */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: '700',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--neon-cyan)',
                fontWeight: '700',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '4px',
                transition: 'background 0.2s',
                textShadow: '0 0 10px rgba(192,132,252,0.2)'
              }}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadialTimePicker;
