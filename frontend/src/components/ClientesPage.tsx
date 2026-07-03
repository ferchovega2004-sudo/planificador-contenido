import React, { useState, useEffect } from 'react';
import { api, Cliente } from '../services/api';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  
  // Modificar/Editar
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);
  const [editNombre, setEditNombre] = useState('');

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
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setError(null);
    setSuccess(null);
    try {
      await api.createCliente(nombre);
      setNombre('');
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
      await api.updateCliente(editCliente.id, editNombre);
      setSuccess('Marca actualizada correctamente');
      setEditCliente(null);
      setEditNombre('');
      cargarClientes();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar marca');
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta marca? Todas las publicaciones asociadas podrían verse afectadas.')) {
      return;
    }

    setError(null);
    setSuccess(null);
    try {
      await api.deleteCliente(id);
      setSuccess('Marca eliminada correctamente');
      cargarClientes();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar marca');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
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
          <h2 className="card-title">Marcas Registradas</h2>
          {loading ? (
            <div className="loading-state">Cargando marcas...</div>
          ) : clientes.length === 0 ? (
            <div className="empty-state">No hay marcas registradas. ¡Registra la primera en el formulario lateral!</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>ID</th>
                  <th>Nombre de la Marca</th>
                  <th style={{ textAlign: 'right', width: '25%' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>
                      <strong>{c.nombre}</strong>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setEditCliente(c);
                          setEditNombre(c.nombre);
                        }}
                        className="btn-action btn-secondary"
                        style={{ marginRight: '8px' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(c.id)}
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
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Registrar Marca
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientesPage;
