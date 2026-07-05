import React, { useState, useEffect } from 'react';
import { api, Cliente } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [contenido, setContenido] = useState('');
  
  // Modificar/Editar
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editContenido, setEditContenido] = useState('');

  // Estados para ConfirmDialog y paginación
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Estados responsivos móviles
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);
  const [mostrarFormMovil, setMostrarFormMovil] = useState(false);

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getClientes();
      setClientes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
    setPaginaActual(1);
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setError(null);
    setSuccess(null);
    try {
      await api.createCliente(nombre, contenido);
      setNombre('');
      setContenido('');
      setSuccess('Marca registrada correctamente');
      setMostrarFormMovil(false);
      cargarClientes();
    } catch (err: any) {
      setError(err.message || 'Error al registrar marca');
    }
  };

  const handleActualizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCliente || !editNombre.trim()) return;

    setError(null);
    setSuccess(null);
    try {
      await api.updateCliente(editCliente.id, editNombre, editContenido);
      setSuccess('Marca actualizada correctamente');
      setEditCliente(null);
      setEditNombre('');
      setEditContenido('');
      setMostrarFormMovil(false);
      cargarClientes();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar marca');
    }
  };

  const handleEliminarClick = (id: number) => {
    setClienteAEliminar(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteAEliminar) return;
    setShowConfirmDelete(false);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteCliente(clienteAEliminar);
      setSuccess('Marca enviada a la papelera correctamente');
      setClienteAEliminar(null);
      cargarClientes().then(() => {
        const totalItems = clientes.length - 1;
        const maxPagina = Math.ceil(totalItems / itemsPorPagina);
        if (paginaActual > maxPagina && maxPagina > 0) {
          setPaginaActual(maxPagina);
        }
      });
    } catch (err: any) {
      setError(err.message || 'Error al eliminar marca');
      setClienteAEliminar(null);
    }
  };

  const activeList = clientes;
  const totalPaginas = Math.ceil(activeList.length / itemsPorPagina);
  const clientesPaginados = activeList.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Gestión de Clientes (Marcas)</h1>
          <p className="page-subtitle">Registra y edita los nombres de las marcas y negocios con los que trabajas</p>
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

      <div className="split-layout">
        {/* Lista de Marcas */}
        <div className="split-main card">
          <h2 className="card-title">
            Marcas Registradas
          </h2>
          {loading ? (
            <div className="loading-state">Cargando marcas...</div>
          ) : activeList.length === 0 ? (
            <div className="empty-state">
              No hay marcas registradas. ¡Registra la primera {esMovil ? 'presionando el botón +' : 'en el formulario lateral'}!
            </div>
          ) : (
            <>
              {esMovil ? (
                // Vista responsiva de tarjetas compactas para celulares
                <div className="clientes-mobile-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {clientesPaginados.map((c) => (
                    <div 
                      key={c.id} 
                      className="cliente-mobile-card"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(192, 132, 252, 0.12)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#ffffff' }}>{c.nombre}</span>
                        <span style={{ fontSize: '10px', color: 'var(--neon-pink)', fontWeight: '800', backgroundColor: 'rgba(236, 72, 153, 0.12)', border: '1px solid rgba(236, 72, 153, 0.25)', padding: '2px 8px', borderRadius: '20px' }}>#{c.id}</span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '12.5px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {c.contenido || 'Sin contenido especificado'}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditCliente(c);
                            setEditNombre(c.nombre);
                            setEditContenido(c.contenido || '');
                            setMostrarFormMovil(true);
                          }}
                          className="btn-action btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminarClick(c.id)}
                          className="btn-action btn-danger"
                          style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Tabla tradicional para computadoras
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>ID</th>
                      <th style={{ width: '25%' }}>Nombre de la Marca</th>
                      <th>Contenido / Trabajo</th>
                      <th style={{ textAlign: 'right', width: '20%' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesPaginados.map((c) => (
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
                            onClick={() => {
                              setEditCliente(c);
                              setEditNombre(c.nombre);
                              setEditContenido(c.contenido || '');
                            }}
                            className="btn-action btn-secondary"
                            style={{ marginRight: '8px' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleEliminarClick(c.id)}
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

              {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '16px', padding: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
                    disabled={paginaActual === 1}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    &larr; Anterior
                  </button>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Página <strong>{paginaActual}</strong> de {totalPaginas}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaActual === totalPaginas}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Siguiente &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Formulario lateral de escritorio (Solo visible si no es móvil) */}
        {!esMovil && (
          <div className="split-sidebar card">
            {editCliente ? (
              <>
                <h2 className="card-title">Editar Marca</h2>
                <form onSubmit={handleActualizar} className="form">
                  <div className="form-group">
                    <label>Nombre de la marca</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      placeholder="Ej: Gm cell, Hollywood, etc."
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Contenido / Trabajos de la Marca</label>
                    <textarea
                      value={editContenido}
                      onChange={(e) => setEditContenido(e.target.value)}
                      placeholder="Ej: Publicidad de calzado, videos cortos..."
                      rows={4}
                      style={{
                        backgroundColor: '#160e11',
                        border: '1px solid #3b232c',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                      Guardar Cambios
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setEditCliente(null);
                        setEditNombre('');
                        setEditContenido('');
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2 className="card-title">Nueva Marca</h2>
                <form onSubmit={handleCrear} className="form">
                  <div className="form-group">
                    <label>Nombre de la marca</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Arrecifes, Hollywood, etc."
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Contenido / Trabajos de la Marca</label>
                    <textarea
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      placeholder="Describe lo que se trabaja para este negocio..."
                      rows={4}
                      style={{
                        backgroundColor: '#160e11',
                        border: '1px solid #3b232c',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    Registrar Marca
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>

      {/* Formulario en Modal/Bottom Sheet (Exclusivo para móviles) */}
      {esMovil && mostrarFormMovil && (
        <div className="modal-backdrop" onClick={() => { setMostrarFormMovil(false); setEditCliente(null); }}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editCliente ? 'Editar Marca' : 'Nueva Marca'}</h3>
              <button 
                type="button" 
                className="close-btn" 
                onClick={() => { setMostrarFormMovil(false); setEditCliente(null); }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={editCliente ? handleActualizar : handleCrear} className="form" style={{ padding: '16px 20px 24px 20px' }}>
              <div className="form-group">
                <label>Nombre de la marca</label>
                <input
                  type="text"
                  value={editCliente ? editNombre : nombre}
                  onChange={(e) => editCliente ? setEditNombre(e.target.value) : setNombre(e.target.value)}
                  placeholder="Ej: Gm cell, Hollywood, etc."
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Contenido / Trabajos de la Marca</label>
                <textarea
                  value={editCliente ? editContenido : contenido}
                  onChange={(e) => editCliente ? setEditContenido(e.target.value) : setContenido(e.target.value)}
                  placeholder="Describe lo que se trabaja para este negocio..."
                  rows={4}
                  style={{
                    backgroundColor: '#160e11',
                    border: '1px solid #3b232c',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editCliente ? 'Guardar' : 'Registrar'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setMostrarFormMovil(false);
                    setEditCliente(null);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante de Creación (FAB) para celulares */}
      {esMovil && (
        <button
          type="button"
          onClick={() => {
            setEditCliente(null);
            setNombre('');
            setContenido('');
            setMostrarFormMovil(true);
          }}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--neon-pink) 0%, var(--neon-cyan) 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '28px',
            fontWeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(192, 132, 252, 0.4)',
            zIndex: 80,
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          className="mobile-fab"
        >
          +
        </button>
      )}

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Marca / Cliente"
        message="¿Estás seguro de que deseas enviar esta marca a la papelera? Todas las publicaciones asociadas podrían verse afectadas."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setClienteAEliminar(null);
        }}
        variant="danger"
      />
    </div>
  );
};

export default ClientesPage;
