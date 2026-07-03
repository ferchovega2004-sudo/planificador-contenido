import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, ingresa las credenciales de tripulación');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Credenciales de acceso inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-bg">
      {/* 1. Lado Izquierdo: HUD de Lente de Cámara y Nodos de Producción */}
      <div className="portal-left-hud">
        <div className="portal-camera-hud">
          {/* Anillos concéntricos flotantes */}
          <div className="portal-camera-ring-outer"></div>
          <div className="portal-camera-ring-middle"></div>
          <div className="portal-camera-ring-inner"></div>
          
          {/* Lente principal */}
          <div className="portal-camera-lens">
            <div className="portal-lens-shine"></div>
            <div className="portal-lens-brand">Media Core</div>
          </div>
        </div>

        {/* Nodos de datos de producción flotantes */}
        <div className="portal-hud-nodes">
          <div className="portal-hud-node node-1">
            <div className="portal-node-dot"></div>
            <span>RENDER_OK [1080p]</span>
          </div>
          <div className="portal-hud-node node-2">
            <div className="portal-node-dot"></div>
            <span>AUDIO_SYNC_TRUE</span>
          </div>
          <div className="portal-hud-node node-3">
            <div className="portal-node-dot"></div>
            <span>PLANNING_ONLINE</span>
          </div>
        </div>
      </div>

      {/* 2. Lado Derecho: Tarjeta Hexagonal del Portal de Acceso y Botonera */}
      <div className="portal-card-layout">
        <div className="portal-hex-card">
          <div className="portal-header">
            <h2 className="portal-title">Crew Access Portal</h2>
            <p className="portal-subtitle">Secure Production Environment</p>
          </div>

          {error && (
            <div 
              className="login-error" 
              style={{ 
                marginBottom: '20px', 
                backgroundColor: 'rgba(255, 0, 127, 0.15)', 
                border: '1px solid #ff007f',
                color: '#ff66b2',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Input 1: Usuario */}
            <div className="portal-input-group">
              <label className="portal-label" htmlFor="username">Crew ID / Call Sign</label>
              <div className="portal-input-skew">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your unique identifier..."
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Input 2: Contraseña */}
            <div className="portal-input-group">
              <label className="portal-label" htmlFor="password">Project Keypass</label>
              <div className="portal-input-skew">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Botón de Acceso */}
            <div className="portal-btn-container">
              <span className="portal-btn-label">Authorize</span>
              <button type="submit" className="portal-btn" disabled={loading}>
                {loading ? 'Validating Token...' : 'Enter Workspace'}
              </button>
            </div>
          </form>

          {/* Enlaces inferiores */}
          <div className="portal-links">
            <a href="#" className="portal-link" onClick={(e) => { e.preventDefault(); alert('Por defecto use admin / adminpassword'); }}>
              Forgot Crew ID?
            </a>
            <a href="#" className="portal-link" onClick={(e) => { e.preventDefault(); alert('Acceso restringido a personal de producción'); }}>
              Apply for Crew Position
            </a>
          </div>
        </div>

        {/* 3. Panel de Iconos Laterales de Producción de Video */}
        <div className="portal-side-icons">
          <div className="portal-icon-box" title="Camera Settings">📹</div>
          <div className="portal-icon-box" title="Audio Levels">🎚️</div>
          <div className="portal-icon-box" title="Clapperboard">🎬</div>
          <div className="portal-icon-box" title="H.264 Codec">H.264</div>
          <div className="portal-icon-box" title="ProRes Quality">ProRes</div>
          <div className="portal-icon-box" title="Play Reel">▶️</div>
          <div className="portal-icon-box" title="Color Correction">🎨</div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
