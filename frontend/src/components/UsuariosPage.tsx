import React, { useState, useEffect } from 'react';
import { api, Usuario } from '../services/api';

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para creación
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<'ADMIN' | 'USER'>('USER');
  const [creando, setCreando] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados para cambiar contraseña
  const [cambiarPassUser, setCambiarPassUser] = useState<Usuario | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getUsuarios();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !username || !password || !rol) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setCreando(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.registrarUsuario({ nombre, username, password, rol });
      setNombre('');
      setUsername('');
      setPassword('');
      setRol('USER');
      setSuccessMsg('Usuario creado exitosamente');
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const handleEliminarUsuario = async (id: number | string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? (Soft delete)')) {
      return;
    }

    try {
      setError(null);
      await api.deleteUsuario(id);
      setSuccessMsg('Usuario eliminado correctamente');
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cambiarPassUser || !nuevaContrasena) return;

    setCambiandoPass(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.cambiarPassword(cambiarPassUser.id, nuevaContrasena);
      setSuccessMsg(`Contraseña de ${cambiarPassUser.nombre} actualizada correctamente`);
      setCambiarPassUser(null);
      setNuevaContrasena('');
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setCambiandoPass(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión del Equipo</h1>
          <p className="page-subtitle">Administra los usuarios y los roles de tu equipo de planificación</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <span>{successMsg}</span>
        </div>
      )}

      <div className="split-layout">
        {/* Lista de Usuarios */}
        <div className="split-main card">
          <h2 className="card-title">Usuarios Activos</h2>
          {loading ? (
            <div className="loading-state">Cargando usuarios...</div>
          ) : usuarios.length === 0 ? (
            <div className="empty-state">No hay usuarios registrados</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Nombre de Usuario</th>
                  <th>Rol / Permiso</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usr) => (
                  <tr key={usr.id}>
                    <td>
                      <strong>{usr.nombre}</strong>
                    </td>
                    <td>@{usr.username}</td>
                    <td>
                      <span className={`badge ${usr.rol === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>
                        {usr.rol === 'ADMIN' ? 'Administrador' : 'Usuario Operativo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setCambiarPassUser(usr)}
                        className="btn-action btn-secondary"
                        style={{ marginRight: '8px' }}
                      >
                        Cambiar Contraseña
                      </button>
                      <button
                        onClick={() => handleEliminarUsuario(usr.id)}
                        className="btn-action btn-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulario de Creación */}
        <div className="split-sidebar card">
          <h2 className="card-title">Nuevo Integrante</h2>
          <form onSubmit={handleCrearUsuario} className="form">
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                disabled={creando}
              />
            </div>
            
            <div className="form-group">
              <label>Nombre de Usuario (Login)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: juan.perez"
                required
                disabled={creando}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={creando}
              />
            </div>

            <div className="form-group">
              <label>Rol asignado</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as 'ADMIN' | 'USER')}
                disabled={creando}
              >
                <option value="USER">Operativo (Solo lectura/edición de publicaciones)</option>
                <option value="ADMIN">Administrador (Control total del sistema)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={creando}>
              {creando ? 'Creando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      {cambiarPassUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Cambiar Contraseña</h3>
              <button className="close-btn" onClick={() => setCambiarPassUser(null)}>&times;</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Estás asignando una nueva contraseña para <strong>{cambiarPassUser.nombre}</strong>.
            </p>
            <form onSubmit={handleCambiarPassword} className="form">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="Ingrese nueva contraseña"
                  required
                  disabled={cambiandoPass}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCambiarPassUser(null)}
                  disabled={cambiandoPass}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={cambiandoPass}>
                  {cambiandoPass ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
