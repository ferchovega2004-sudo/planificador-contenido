import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';

const KanbanPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteFiltrado, setClienteFiltrado] = useState<number | 'TODOS'>('TODOS');
  
  // Filtros de mes y año
  const [mesFiltrado, setMesFiltrado] = useState<number | 'TODOS'>(new Date().getMonth());
  const [anioFiltrado, setAnioFiltrado] = useState<number>(new Date().getFullYear());

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const anios = [2025, 2026, 2027, 2028];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Detalle
  const [selectedPub, setSelectedPub] = useState<Publicacion | null>(null);

  // Formulario rápido para crear tarea
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteId, setNuevoClienteId] = useState<number | ''>('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [creando, setCreando] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [clientesData, publicacionesData] = await Promise.all([
        api.getClientes(),
        api.getPublicaciones()
      ]);
      
      setClientes(clientesData);
      setPublicaciones(publicacionesData);

      if (clientesData.length > 0 && !nuevoClienteId) {
        setNuevoClienteId(clientesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado de publicaciones
  const publicacionesFiltradas = publicaciones.filter((pub) => {
    // Filtrar por cliente
    if (clienteFiltrado !== 'TODOS' && pub.clienteId !== clienteFiltrado) return false;
    
    // Filtrar por mes y año
    const fecha = new Date(pub.fechaProgramada);
    if (mesFiltrado !== 'TODOS' && fecha.getMonth() !== mesFiltrado) return false;
    if (fecha.getFullYear() !== anioFiltrado) return false;
    
    return true;
  });

  // Agrupar publicaciones por estado
  const columnas = {
    POR_GRABAR: {
      titulo: 'Por grabar',
      items: publicacionesFiltradas.filter((p) => p.estado === 'POR_GRABAR')
    },
    EDICION: {
      titulo: 'En proceso de edición',
      items: publicacionesFiltradas.filter((p) => p.estado === 'EDICION')
    },
    TERMINADO: {
      titulo: 'Terminado',
      items: publicacionesFiltradas.filter((p) => p.estado === 'TERMINADO')
    },
    PUBLICADO: {
      titulo: 'Publicado',
      items: publicacionesFiltradas.filter((p) => p.estado === 'PUBLICADO')
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permitir soltar
  };

  const handleDrop = async (e: React.DragEvent, nuevoEstado: 'POR_GRABAR' | 'EDICION' | 'TERMINADO' | 'PUBLICADO') => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;

    const id = parseInt(idStr);
    if (isNaN(id)) return;

    // Buscar si ya tiene ese estado para ahorrar consulta
    const pub = publicaciones.find((p) => p.id === id);
    if (pub && pub.estado === nuevoEstado) return;

    // Actualización optimista
    setPublicaciones((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: nuevoEstado } : p))
    );

    try {
      await api.updatePublicacion(id, { estado: nuevoEstado });
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado de la tarea');
      // Revertir en caso de error
      cargarDatos();
    }
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoClienteId || !nuevaFecha) {
      setError('Todos los campos son requeridos para crear una tarea');
      return;
    }

    setCreando(true);
    setError(null);

    try {
      await api.createPublicacion({
        titulo: nuevoTitulo.trim(),
        clienteId: Number(nuevoClienteId),
        fechaProgramada: new Date(nuevaFecha).toISOString(),
        estado: 'POR_GRABAR'
      });
      setNuevoTitulo('');
      setNuevaFecha('');
      setMostrarCrear(false);
      cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al crear la publicación');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Flujo de Publicaciones</h1>
          <p className="page-subtitle">Arrastra y suelta las publicaciones para actualizar su estado de producción</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Filtro por marca */}
          <div className="filter-select">
            <select
              value={clienteFiltrado}
              onChange={(e) => setClienteFiltrado(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
            >
              <option value="TODOS">Todas las marcas</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Mes */}
          <div className="filter-select">
            <select
              value={mesFiltrado}
              onChange={(e) => setMesFiltrado(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
            >
              <option value="TODOS">Todos los meses</option>
              {mesesNombres.map((m, idx) => (
                <option key={idx} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Año */}
          <div className="filter-select">
            <select
              value={anioFiltrado}
              onChange={(e) => setAnioFiltrado(Number(e.target.value))}
            >
              {anios.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => setMostrarCrear(true)} className="btn-primary">
            + Programar Publicación
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Cargando tablero...</div>
      ) : (
        <div className="kanban-board">
          {Object.entries(columnas).map(([estadoKey, col]) => (
            <div
              key={estadoKey}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, estadoKey as any)}
            >
              <div className="kanban-column-header">
                <h3 className="kanban-column-title">{col.titulo}</h3>
                <span className="kanban-badge">{col.items.length}</span>
              </div>
              <div className="kanban-column-body">
                {col.items.length === 0 ? (
                  <div className="kanban-empty-zone">Arrastra aquí</div>
                ) : (
                  col.items.map((pub) => {
                    const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    });
                    return (
                      <div
                        key={pub.id}
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, pub.id)}
                        onClick={() => setSelectedPub(pub)}
                      >
                        <span className="kanban-card-tag">{pub.cliente.nombre}</span>
                        <h4 className="kanban-card-title">{pub.titulo}</h4>
                        <div className="kanban-card-footer">
                          <span className="kanban-card-date">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            {fechaFormateada}
                          </span>
                          {pub.driveUrl && (
                            <span className="kanban-card-link-icon" title="Tiene link a Drive" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para programar publicación rápida */}
      {mostrarCrear && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Programar Nueva Publicación</h3>
              <button className="close-btn" onClick={() => setMostrarCrear(false)}>&times;</button>
            </div>
            {clientes.length === 0 ? (
              <p className="text-muted" style={{ padding: '10px 0' }}>
                Primero debes registrar al menos una marca en la pestaña <strong>Clientes</strong>.
              </p>
            ) : (
              <form onSubmit={handleCrearTarea} className="form">
                <div className="form-group">
                  <label>Título / Descripción del Post</label>
                  <input
                    type="text"
                    value={nuevoTitulo}
                    onChange={(e) => setNuevoTitulo(e.target.value)}
                    placeholder="Ej: Promo de calzado deportivo"
                    required
                    disabled={creando}
                  />
                </div>

                <div className="form-group">
                  <label>Marca / Cliente</label>
                  <select
                    value={nuevoClienteId}
                    onChange={(e) => setNuevoClienteId(Number(e.target.value))}
                    required
                    disabled={creando}
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha Programada</label>
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={(e) => setNuevaFecha(e.target.value)}
                    required
                    disabled={creando}
                  />
                </div>

                <div className="modal-footer" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setMostrarCrear(false)}
                    disabled={creando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={creando}>
                    {creando ? 'Programando...' : 'Programar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalle de Producción */}
      {selectedPub && (
        <DetallePublicacionModal
          publicacion={selectedPub}
          clientesList={clientes}
          onClose={() => setSelectedPub(null)}
          onSave={() => {
            setSelectedPub(null);
            cargarDatos();
          }}
          onDelete={() => {
            setSelectedPub(null);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};

export default KanbanPage;
