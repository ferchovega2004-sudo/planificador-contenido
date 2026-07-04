import React, { useState, useEffect } from 'react';
import { api, Cliente, Usuario } from '../services/api';

const PapeleraTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'marcas' | 'usuarios'>('marcas');
  const [clientesEliminados, setClientesEliminados] = useState<Cliente[]>([]);
  const [usuariosEliminados, setUsuariosEliminados] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cargarClientesEliminados = async () => {
    try {
      const data = await api.getClientesEliminados();
      setClientesEliminados(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las marcas eliminadas');
    }
  };

  const cargarUsuariosEliminados = async () => {
    try {
      const data = await api.getUsuariosEliminados();
      setUsuariosEliminados(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios desactivados');
    }
  };

  const cargarTodo = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([cargarClientesEliminados(), cargarUsuariosEliminados()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  const handleRestaurarCliente = async (id: number, nombre: string) => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await api.restaurarCliente(id);
      setSuccess(`Marca "${nombre}" restaurada correctamente`);
      await cargarClientesEliminados();
    } catch (err: any) {
      setError(err.message || 'Error al restaurar la marca');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurarUsuario = async (id: string | number, nombre: string) => {
    setError(null);
    setSuccess(null);
    try {
      setLoading(true);
      await api.restaurarUsuario(id);
      setSuccess(`Usuario "${nombre}" restaurado correctamente`);
      await cargarUsuariosEliminados();
    } catch (err: any) {
      setError(err.message || 'Error al restaurar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Papelera de Recuperación</h1>
          <p className="page-subtitle">Restaura marcas o integrantes del equipo que fueron eliminados lógicamente</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
        </div>
      )}

      {/* Sub-tabs switchers */}
      <div className="calendar-view-switcher" style={{ width: 'fit-content', marginBottom: '16px' }}>
        <button
          onClick={() => {
            setActiveSubTab('marcas');
            setSuccess(null);
            setError(null);
          }}
          className={`calendar-view-btn ${activeSubTab === 'marcas' ? 'active' : ''}`}
          style={{ padding: '8px 24px', fontSize: '13px' }}
        >
          Marcas / Clientes 🏢
        </button>
        <button
          onClick={() => {
            setActiveSubTab('usuarios');
            setSuccess(null);
            setError(null);
          }}
          className={`calendar-view-btn ${activeSubTab === 'usuarios' ? 'active' : ''}`}
          style={{ padding: '8px 24px', fontSize: '13px' }}
        >
          Integrantes de Equipo 👤
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">Cargando elementos eliminados...</div>
        ) : activeSubTab === 'marcas' ? (
          <>
            <h2 className="card-title">Marcas Eliminadas</h2>
            {clientesEliminados.length === 0 ? (
              <div className="empty-state">No hay marcas eliminadas en la papelera.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>ID</th>
                    <th style={{ width: '30%' }}>Nombre de la Marca</th>
                    <th>Contenido / Trabajo</th>
                    <th style={{ textAlign: 'right', width: '20%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesEliminados.map((c) => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td>
                        <strong>{c.nombre}</strong>
                      </td>
                      <td className="text-muted" style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                        {c.contenido || 'Sin contenido especificado'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleRestaurarCliente(c.id, c.nombre)}
                          className="btn-action"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <>
            <h2 className="card-title">Integrantes de Equipo Desactivados</h2>
            {usuariosEliminados.length === 0 ? (
              <div className="empty-state">No hay usuarios desactivados en la papelera.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Nombre Completo</th>
                    <th style={{ width: '25%' }}>Nombre de Usuario</th>
                    <th>Rol / Permiso</th>
                    <th style={{ textAlign: 'right', width: '20%' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosEliminados.map((usr) => (
                    <tr key={usr.id}>
                      <td>
                        <strong>{usr.nombre}</strong>
                      </td>
                      <td>@{usr.username}</td>
                      <td>
                        <span className={`badge ${
                          usr.rol === 'ADMIN' 
                            ? 'badge-admin' 
                            : usr.rol === 'EDITOR'
                            ? 'badge-pending'
                            : usr.rol === 'ACOMPAÑANTE'
                            ? 'badge-ready'
                            : 'badge-user'
                        }`}>
                          {usr.rol === 'ADMIN' && 'Administrador'}
                          {usr.rol === 'USER' && 'Usuario Operativo'}
                          {usr.rol === 'EDITOR' && 'Editor (Kanban)'}
                          {usr.rol === 'ACOMPAÑANTE' && 'Acompañante'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleRestaurarUsuario(usr.id, usr.nombre)}
                          className="btn-action"
                          style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                        >
                          Restaurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PapeleraTab;
