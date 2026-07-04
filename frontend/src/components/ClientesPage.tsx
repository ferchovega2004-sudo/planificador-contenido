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
              No hay marcas registradas. ¡Registra la primera en el formulario lateral!
            </div>
          ) : (
            <>
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

        {/* Formulario lateral */}
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
      </div>

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
