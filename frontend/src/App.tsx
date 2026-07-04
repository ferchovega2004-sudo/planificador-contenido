import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import CalendarioPage from './components/CalendarioPage';
import KanbanPage from './components/KanbanPage';
import ClientesPage from './components/ClientesPage';
import UsuariosPage from './components/UsuariosPage';
import ReportesPage from './components/ReportesPage';
import { api, Usuario } from './services/api';
import logo from './assets/logo.jpg';

function App(): React.JSX.Element {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<'calendario' | 'kanban' | 'clientes' | 'usuarios' | 'reportes'>('calendario');

  const verificarSesion = () => {
    const usr = api.getUsuarioActual();
    const token = localStorage.getItem('token');
    if (usr && token) {
      setUsuario(usr);
      // Redireccionar al tab correspondiente según rol
      if (usr.rol === 'EDITOR') {
        setActiveTab('kanban');
      } else {
        setActiveTab('calendario');
      }
    } else {
      setUsuario(null);
    }
  };

  useEffect(() => {
    verificarSesion();
  }, []);

  const handleLoginSuccess = () => {
    verificarSesion();
  };

  const handleLogout = () => {
    api.logout();
    setUsuario(null);
  };

  // Si no está autenticado, cargar pantalla de Login
  if (!usuario) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', padding: '20px 14px' }}>
          <img
            src={logo}
            alt="Logo Gara Digital"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              boxShadow: '0 0 10px rgba(192, 132, 252, 0.4)',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="sidebar-title" style={{ fontSize: '13px', fontWeight: '800', lineHeight: '1.2' }}>GARA DIGITAL</span>
            <span className="sidebar-subtitle" style={{ fontSize: '8px', marginTop: '2px' }}>PLANIFICADOR</span>
          </div>
        </div>

        {/* Info del usuario logueado */}
        <div className="user-profile-badge">
          <div className="user-avatar">
            {usuario.nombre.substring(0, 2).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{usuario.nombre}</span>
            <span className="user-role">
              {usuario.rol === 'ADMIN' ? 'Administrador' : 'Operativo'}
            </span>
          </div>
        </div>
        
        <nav className="sidebar-menu">
          {(usuario.rol === 'ADMIN' || usuario.rol === 'USER' || usuario.rol === 'ACOMPAÑANTE') && (
            <div
              className={`sidebar-item ${activeTab === 'calendario' ? 'active' : ''}`}
              onClick={() => setActiveTab('calendario')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Calendario Publicaciones
            </div>
          )}

          {(usuario.rol === 'ADMIN' || usuario.rol === 'USER' || usuario.rol === 'EDITOR') && (
            <div
              className={`sidebar-item ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveTab('kanban')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
              </svg>
              Flujo de Publicaciones
            </div>
          )}
          
          {(usuario.rol === 'ADMIN' || usuario.rol === 'USER') && (
            <div
              className={`sidebar-item ${activeTab === 'clientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('clientes')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Marcas / Clientes
            </div>
          )}

          {(usuario.rol === 'ADMIN' || usuario.rol === 'USER') && (
            <div
              className={`sidebar-item ${activeTab === 'reportes' ? 'active' : ''}`}
              onClick={() => setActiveTab('reportes')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Reportes PDF
            </div>
          )}

          {/* Gestión de usuarios del equipo (Solo visible para ADMIN) */}
          {usuario.rol === 'ADMIN' && (
            <div
              className={`sidebar-item ${activeTab === 'usuarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('usuarios')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Equipo (Usuarios)
            </div>
          )}
        </nav>
        
        <div className="sidebar-footer" style={{ borderTop: '1px solid #3b232c', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleLogout} className="btn-logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar Sesión
          </button>
          <span style={{ fontSize: '10px', color: '#8b6e79' }}>Escritorio v2.0.0</span>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="main-content">
        {activeTab === 'calendario' && <CalendarioPage />}
        {activeTab === 'kanban' && <KanbanPage />}
        {activeTab === 'clientes' && <ClientesPage />}
        {activeTab === 'usuarios' && usuario.rol === 'ADMIN' && <UsuariosPage />}
        {activeTab === 'reportes' && <ReportesPage />}
      </main>
    </div>
  );
}

export default App;
