import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';
import ContextMenu from './ContextMenu';

const KanbanPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteFiltrado, setClienteFiltrado] = useState<number | 'TODOS'>('TODOS');
  
  // Filtros de mes, año y semana
  const [mesFiltrado, setMesFiltrado] = useState<number | 'TODOS'>(new Date().getMonth());
  const [anioFiltrado, setAnioFiltrado] = useState<number>(new Date().getFullYear());
  const [semanaFiltrada, setSemanaFiltrada] = useState<number | 'TODOS'>('TODOS');

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

  // Obtener semanas del mes para filtro dinámico
  const getSemanasDelMes = (mes: number, anio: number) => {
    const semanas = [];
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    let actual = new Date(primerDia);
    const dayOfWeek = actual.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    actual.setDate(actual.getDate() + diffToMonday);

    while (actual <= ultimoDia) {
      const inicioSemana = new Date(actual);
      const finSemana = new Date(actual);
      finSemana.setDate(finSemana.getDate() + 6);

      semanas.push({
        inicio: inicioSemana,
        fin: finSemana,
        label: `Semana del ${inicioSemana.getDate()} de ${mesesNombres[inicioSemana.getMonth()].substring(0, 3)} al ${finSemana.getDate()} de ${mesesNombres[finSemana.getMonth()].substring(0, 3)}`
      });

      actual.setDate(actual.getDate() + 7);
    }

    return semanas;
  };

  // Filtrado de publicaciones
  const publicacionesFiltradas = publicaciones.filter((pub) => {
    // Filtrar por cliente
    if (clienteFiltrado !== 'TODOS' && pub.clienteId !== clienteFiltrado) return false;
    
    // Filtrar por mes y año
    const fecha = new Date(pub.fechaProgramada);
    if (mesFiltrado !== 'TODOS' && fecha.getMonth() !== mesFiltrado) return false;
    if (fecha.getFullYear() !== anioFiltrado) return false;

    // Filtrar por semana
    if (semanaFiltrada !== 'TODOS' && mesFiltrado !== 'TODOS') {
      const semanas = getSemanasDelMes(Number(mesFiltrado), anioFiltrado);
      const sem = semanas[semanaFiltrada];
      if (sem) {
        const fComp = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime();
        const iniComp = new Date(sem.inicio.getFullYear(), sem.inicio.getMonth(), sem.inicio.getDate()).getTime();
        const finComp = new Date(sem.fin.getFullYear(), sem.fin.getMonth(), sem.fin.getDate()).getTime();
        
        if (fComp < iniComp || fComp > finComp) return false;
      }
    }
    
    return true;
  });

  // Métricas para los KPIs
  const totalKpis = publicacionesFiltradas.length;
  const porGrabarKpis = publicacionesFiltradas.filter(p => p.estado === 'POR_GRABAR').length;
  const enEdicionKpis = publicacionesFiltradas.filter(p => p.estado === 'EDICION').length;
  const terminadasKpis = publicacionesFiltradas.filter(p => p.estado === 'TERMINADO').length;
  const publicadasKpis = publicacionesFiltradas.filter(p => p.estado === 'PUBLICADO').length;

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

  // Estado para el menú contextual
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pub: Publicacion } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, pub: Publicacion) => {
    const currentUsr = api.getUsuarioActual();
    if (currentUsr?.rol === 'ACOMPAÑANTE') return; // Acompañante no puede modificar
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pub });
  };

  const handleMoverSiguienteMes = async (pub: Publicacion) => {
    try {
      const fecha = new Date(pub.fechaProgramada);
      fecha.setMonth(fecha.getMonth() + 1);
      await api.updatePublicacion(pub.id, { fechaProgramada: fecha.toISOString() });
      cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar al siguiente mes');
    }
  };

  const handleCambiarEstado = async (pub: Publicacion, nuevoEstado: typeof pub.estado) => {
    try {
      await api.updatePublicacion(pub.id, { estado: nuevoEstado });
      cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado');
    }
  };

  const handleDuplicarPublicacion = async (pub: Publicacion) => {
    try {
      await api.createPublicacion({
        titulo: `${pub.titulo} (Copia)`,
        clienteId: pub.clienteId,
        fechaProgramada: pub.fechaProgramada,
        estado: pub.estado,
        guion: pub.guion || '',
        driveUrl: pub.driveUrl || '',
        notas: pub.notas || '',
      });
      cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al duplicar la publicación');
    }
  };

  const handleEliminarPublicacion = async (pub: Publicacion) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la publicación "${pub.titulo}"?`)) {
      try {
        await api.deletePublicacion(pub.id);
        cargarDatos();
      } catch (err: any) {
        setError(err.message || 'Error al eliminar la publicación');
      }
    }
  };

  const contextMenuOptions = contextMenu ? [
    {
      label: 'Mover al Siguiente Mes',
      onClick: () => handleMoverSiguienteMes(contextMenu.pub)
    },
    {
      label: 'Cambiar Estado',
      subMenu: [
        { label: 'Por Grabar', onClick: () => handleCambiarEstado(contextMenu.pub, 'POR_GRABAR') },
        { label: 'En Edición', onClick: () => handleCambiarEstado(contextMenu.pub, 'EDICION') },
        { label: 'Terminado', onClick: () => handleCambiarEstado(contextMenu.pub, 'TERMINADO') },
        { label: 'Publicado', onClick: () => handleCambiarEstado(contextMenu.pub, 'PUBLICADO') }
      ]
    },
    {
      label: 'Duplicar Publicación',
      onClick: () => handleDuplicarPublicacion(contextMenu.pub)
    },
    {
      label: 'Eliminar Publicación',
      className: 'delete',
      divider: true,
      onClick: () => handleEliminarPublicacion(contextMenu.pub)
    }
  ] : [];

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
              onChange={(e) => {
                setMesFiltrado(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value));
                setSemanaFiltrada('TODOS');
              }}
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
              onChange={(e) => {
                setAnioFiltrado(Number(e.target.value));
                setSemanaFiltrada('TODOS');
              }}
            >
              {anios.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Semana */}
          {mesFiltrado !== 'TODOS' && (
            <div className="filter-select">
              <select
                value={semanaFiltrada}
                onChange={(e) => setSemanaFiltrada(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              >
                <option value="TODOS">Todas las semanas</option>
                {getSemanasDelMes(Number(mesFiltrado), anioFiltrado).map((sem, idx) => (
                  <option key={idx} value={idx}>
                    {sem.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button onClick={() => setMostrarCrear(true)} className="btn-primary">
            + Programar Publicación
          </button>
        </div>
      </div>

      {/* Fila de Métricas / KPIs */}
      <div className="kpi-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="kpi-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Planificadas</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff' }}>{totalKpis}</span>
        </div>
        <div className="kpi-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Por Grabar</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{porGrabarKpis}</span>
        </div>
        <div className="kpi-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderLeft: '4px solid #06b6d4',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>En Edición</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#06b6d4' }}>{enEdicionKpis}</span>
        </div>
        <div className="kpi-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderLeft: '4px solid #10b981',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terminadas</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{terminadasKpis}</span>
        </div>
        <div className="kpi-card" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderLeft: '4px solid #ec4899',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Publicadas</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#ec4899' }}>{publicadasKpis}</span>
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
                        className={`kanban-card card-${pub.estado.toLowerCase().replace('_', '-')}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pub.id)}
                        onContextMenu={(e) => handleContextMenu(e, pub)}
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
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          options={contextMenuOptions}
        />
      )}
    </div>
  );
};

export default KanbanPage;
