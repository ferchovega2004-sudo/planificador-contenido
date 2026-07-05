import React, { useState, useEffect } from 'react';
import { api, Usuario, Cliente } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para creación
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Usuario['rol']>('USER');
  const [creando, setCreando] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password visibility & strength states
  const [showPassword, setShowPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Estados para cambiar contraseña
  const [cambiarPassUser, setCambiarPassUser] = useState<Usuario | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);

  // Estados para ConfirmDialog
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<number | string | null>(null);

  // Estados para marcas asignadas y Acompañante
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState<number[]>([]);
  const [marcasPermitidasMap, setMarcasPermitidasMap] = useState<Record<string, string[]>>({});
  const [gestionarMarcasUser, setGestionarMarcasUser] = useState<Usuario | null>(null);
  const [gestionarMarcasSeleccionadas, setGestionarMarcasSeleccionadas] = useState<number[]>([]);
  const [guardandoMarcas, setGuardandoMarcas] = useState(false);



  const getPasswordStrength = (pass: string) => {
    if (pass.length < 6) return { label: 'Muy corta', color: '#ef4444' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNums = /\d/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    
    let score = 0;
    if (pass.length >= 8) score++;
    if (hasLetters) score++;
    if (hasNums) score++;
    if (hasSpecial) score++;
    
    if (score <= 1) return { label: 'Débil ⚠️', color: '#f59e0b' };
    if (score === 2 || score === 3) return { label: 'Media 👍', color: '#3b82f6' };
    return { label: 'Fuerte 💪', color: '#10b981' };
  };

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usrData, clientesData, asociaciones] = await Promise.all([
        api.getUsuarios(),
        api.getClientes(),
        api.getAsociacionesUsuarioClientes()
      ]);
      
      setUsuarios(usrData);
      setClientes(clientesData);
      
      const map: Record<string, string[]> = {};
      asociaciones.forEach((asc) => {
        if (!map[asc.usuarioId]) {
          map[asc.usuarioId] = [];
        }
        map[asc.usuarioId].push(asc.clienteNombre);
      });
      setMarcasPermitidasMap(map);
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
      const nuevoUsr = await api.registrarUsuario({ nombre, username, password, rol });
      if (rol !== 'ADMIN' && marcasSeleccionadas.length > 0) {
        await api.asignarMarcasAUsuario(nuevoUsr.id, marcasSeleccionadas);
      }
      setNombre('');
      setUsername('');
      setPassword('');
      setRol('USER');
      setMarcasSeleccionadas([]);
      setShowPassword(false);
      setSuccessMsg('Usuario creado exitosamente');
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const handleGestionarMarcasClick = async (usr: Usuario) => {
    setGestionarMarcasUser(usr);
    try {
      const marcas = await api.getMarcasPermitidasPorUsuario(usr.id);
      setGestionarMarcasSeleccionadas(marcas);
    } catch (err: any) {
      setError(err.message || 'Error al cargar marcas del usuario');
    }
  };

  const handleGuardarMarcasAsignadas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestionarMarcasUser) return;
    setGuardandoMarcas(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.asignarMarcasAUsuario(gestionarMarcasUser.id, gestionarMarcasSeleccionadas);
      setSuccessMsg(`Marcas de ${gestionarMarcasUser.nombre} actualizadas correctamente`);
      setGestionarMarcasUser(null);
      setGestionarMarcasSeleccionadas([]);
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar asignaciones de marca');
    } finally {
      setGuardandoMarcas(false);
    }
  };

  const handleEliminarClick = (id: number | string) => {
    setUsuarioAEliminar(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!usuarioAEliminar) return;
    setShowConfirmDelete(false);
    try {
      setError(null);
      await api.deleteUsuario(usuarioAEliminar);
      setSuccessMsg('Usuario enviado a la papelera correctamente');
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar usuario');
      setUsuarioAEliminar(null);
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
      setShowChangePassword(false);
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setCambiandoPass(false);
    }
  };

  const listToRender = usuarios;

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <h2 className="card-title">
            Usuarios Activos
          </h2>
          {loading ? (
            <div className="loading-state">Cargando usuarios...</div>
          ) : listToRender.length === 0 ? (
            <div className="empty-state">
              No hay usuarios registrados
            </div>
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
                {listToRender.map((usr) => (
                  <tr key={usr.id}>
                    <td>
                      <strong>{usr.nombre}</strong>
                      {usr.rol !== 'ADMIN' && (
                        <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', marginTop: '4px' }}>
                          Marcas: {marcasPermitidasMap[usr.id]?.join(', ') || 'Ninguna asignada'}
                          {usr.rol === 'ACOMPAÑANTE' && (
                            <span style={{ color: usr.activo === true ? '#10b981' : '#f59e0b', marginLeft: '8px', fontWeight: 'bold' }}>
                              ({usr.activo === true ? '✍️ Puede Editar' : '👁️ Solo Lectura'})
                            </span>
                          )}
                        </div>
                      )}
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
                      {usr.rol === 'ACOMPAÑANTE' && (
                        <button
                          onClick={async () => {
                            try {
                              const nuevoEstado = !usr.activo;
                              await api.toggleAccesoUsuario(usr.id, nuevoEstado);
                              setSuccessMsg(`Permiso de edición de ${usr.nombre} ${nuevoEstado ? 'habilitado' : 'deshabilitado'}`);
                              cargarUsuarios();
                            } catch (err: any) {
                              setError(err.message || 'Error al cambiar permiso');
                            }
                          }}
                          className={`btn-action ${usr.activo === true ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ marginRight: '8px', fontSize: '11px', border: usr.activo === true ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(192, 132, 252, 0.4)' }}
                        >
                          {usr.activo === true ? '🔒 Restringir a Solo Lectura' : '🔓 Permitir Edición'}
                        </button>
                      )}
                      {usr.rol !== 'ADMIN' && (
                        <button
                          onClick={() => handleGestionarMarcasClick(usr)}
                          className="btn-action btn-secondary"
                          style={{ marginRight: '8px', color: 'var(--neon-cyan)', borderColor: 'rgba(192, 132, 252, 0.4)' }}
                        >
                          Asignar Marcas
                        </button>
                      )}
                      <button
                        onClick={() => setCambiarPassUser(usr)}
                        className="btn-action btn-secondary"
                        style={{ marginRight: '8px' }}
                      >
                        Cambiar Contraseña
                      </button>
                      <button
                        onClick={() => handleEliminarClick(usr.id)}
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
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  disabled={creando}
                  style={{ paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    padding: 0
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: '6px', fontSize: '10.5px' }}>
                  Fuerza: <span style={{ fontWeight: '700', color: getPasswordStrength(password).color }}>
                    {getPasswordStrength(password).label}
                  </span>
                </div>
              )}
            </div>

             <div className="form-group">
              <label>Rol asignado</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
                disabled={creando}
              >
                <option value="USER">Operativo (Lectura/edición de publicaciones)</option>
                <option value="ADMIN">Administrador (Control total del sistema)</option>
                <option value="EDITOR">Editor (Acceso exclusivo a Flujo Kanban)</option>
                <option value="ACOMPAÑANTE">Acompañante (Acceso exclusivo a Calendario de Marcas seleccionadas)</option>
              </select>
            </div>

            {rol !== 'ADMIN' && (
              <div className="form-group" style={{ marginTop: '10px', marginBottom: '14px' }}>
                <label>Marcas Asignadas</label>
                <div style={{
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #3b232c',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: '#160e11'
                }}>
                  {clientes.map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: '#cbd5e1' }}>
                      <input
                        type="checkbox"
                        checked={marcasSeleccionadas.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMarcasSeleccionadas([...marcasSeleccionadas, c.id]);
                          } else {
                            setMarcasSeleccionadas(marcasSeleccionadas.filter((id) => id !== c.id));
                          }
                        }}
                      />
                      {c.nombre}
                    </label>
                  ))}
                  {clientes.length === 0 && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No hay marcas registradas.</span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Solo verá las marcas seleccionadas. Si no selecciona ninguna, no tendrá acceso a contenido.
                </span>
              </div>
            )}

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
              <button className="close-btn" onClick={() => {
                setCambiarPassUser(null);
                setNuevaContrasena('');
                setShowChangePassword(false);
              }}>&times;</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Estás asignando una nueva contraseña para <strong>{cambiarPassUser.nombre}</strong>.
            </p>
            <form onSubmit={handleCambiarPassword} className="form">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showChangePassword ? "text" : "password"}
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                    placeholder="Ingrese nueva contraseña"
                    required
                    disabled={cambiandoPass}
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(!showChangePassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '14px',
                      padding: 0
                    }}
                  >
                    {showChangePassword ? '👁️' : '🙈'}
                  </button>
                </div>
                {nuevaContrasena && (
                  <div style={{ marginTop: '6px', fontSize: '10.5px' }}>
                    Fuerza: <span style={{ fontWeight: '700', color: getPasswordStrength(nuevaContrasena).color }}>
                      {getPasswordStrength(nuevaContrasena).label}
                    </span>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setCambiarPassUser(null);
                    setNuevaContrasena('');
                    setShowChangePassword(false);
                  }}
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

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Integrante de Equipo"
        message="¿Estás seguro de que deseas desactivar este usuario? Se enviará a la papelera y perderá el acceso temporalmente."
        confirmLabel="Desactivar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setUsuarioAEliminar(null);
        }}
        variant="danger"
      />

      {gestionarMarcasUser && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Gestionar Marcas Permitidas</h3>
              <button className="close-btn" onClick={() => {
                setGestionarMarcasUser(null);
                setGestionarMarcasSeleccionadas([]);
              }}>&times;</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Selecciona las marcas que <strong>{gestionarMarcasUser.nombre}</strong> puede visualizar y gestionar.
            </p>
            <form onSubmit={handleGuardarMarcasAsignadas} className="form">
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #3b232c',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: '#160e11',
                marginBottom: '16px'
              }}>
                {clientes.map((c) => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={gestionarMarcasSeleccionadas.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGestionarMarcasSeleccionadas([...gestionarMarcasSeleccionadas, c.id]);
                        } else {
                          setGestionarMarcasSeleccionadas(gestionarMarcasSeleccionadas.filter(id => id !== c.id));
                        }
                      }}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setGestionarMarcasUser(null);
                    setGestionarMarcasSeleccionadas([]);
                  }}
                  disabled={guardandoMarcas}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardandoMarcas}>
                  {guardandoMarcas ? 'Guardando...' : 'Guardar Cambios'}
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
