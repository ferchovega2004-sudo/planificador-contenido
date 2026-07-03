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
        {/* Líneas de conexión vectoriales SVG */}
        <svg className="portal-connectors">
          {/* Línea a tarjeta 1 (superior derecha) */}
          <path d="M 250 250 L 350 150 L 450 150" className="portal-line-cyan" fill="none" />
          {/* Línea a tarjeta 2 (inferior izquierda) */}
          <path d="M 250 250 L 150 350 L 50 350" className="portal-line-pink" fill="none" />
          {/* Línea a tarjeta 3 (inferior derecha) */}
          <path d="M 250 250 L 330 330 L 410 390" className="portal-line-cyan" fill="none" />
          {/* Línea a tarjeta 4 (superior izquierda) */}
          <path d="M 250 250 L 160 160 L 80 80" className="portal-line-pink" fill="none" />
        </svg>

        <div className="portal-camera-hud">
          {/* Telemetrías de cámara del HUD */}
          <div className="lens-telemetry telemetry-top-left">
            REC 🔴<br />
            [24 FPS]
          </div>
          <div className="lens-telemetry telemetry-top-right">
            TC 02:41:09:12<br />
            RENDER STATUS: OK
          </div>
          <div className="lens-telemetry telemetry-bottom-left">
            F/2.8<br />
            ISO 800
          </div>
          <div className="lens-telemetry telemetry-bottom-right">
            50mm<br />
            AUTO_FOC
          </div>

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

        {/* Nodos de datos de producción (Tarjetas de miniaturas realistas) */}
        <div className="portal-hud-nodes">
          {/* Tarjeta 1 */}
          <div className="portal-media-card m-card-1">
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #1e1b4b 0%, #311042 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, border: '1px solid rgba(0,242,254,0.15)', borderRadius: 4 }}></div>
              <div className="portal-media-card-play">▶</div>
              <div className="portal-media-title">B-Roll_08.mp4</div>
            </div>
          </div>

          {/* Tarjeta 2 */}
          <div className="portal-media-card m-card-2">
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #0f172a 0%, #1e3a8a 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, border: '1px solid rgba(255,0,128,0.15)', borderRadius: 4 }}></div>
              <div className="portal-media-card-play">▶</div>
              <div className="portal-media-title">A-Roll_01.mp4</div>
            </div>
          </div>

          {/* Tarjeta 3 */}
          <div className="portal-media-card m-card-3">
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #022c22 0%, #065f46 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, border: '1px solid rgba(0,242,254,0.15)', borderRadius: 4 }}></div>
              <div className="portal-media-card-play">♬</div>
              <div className="portal-media-title">Audio_Mix.wav</div>
            </div>
          </div>

          {/* Tarjeta 4 */}
          <div className="portal-media-card m-card-4">
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(45deg, #450a0a 0%, #7f1d1d 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 4, left: 4, right: 4, bottom: 4, border: '1px solid rgba(255,0,128,0.15)', borderRadius: 4 }}></div>
              <div className="portal-media-card-play">▼</div>
              <div className="portal-media-title">Grade.cube</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lado Derecho: Tarjeta Hexagonal del Portal de Acceso y Botonera */}
      <div className="portal-card-layout">
        <div className="portal-hex-card">
          {/* Esquineros Cyber Brackets */}
          <div className="portal-bracket bracket-tl"></div>
          <div className="portal-bracket bracket-tr"></div>
          <div className="portal-bracket bracket-bl"></div>
          <div className="portal-bracket bracket-br"></div>

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
                <div className="portal-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
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
                <div className="portal-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
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
