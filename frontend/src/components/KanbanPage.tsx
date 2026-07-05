import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';
import ContextMenu from './ContextMenu';

const renderPlatformIcon = (plataforma: string) => {
  switch (plataforma) {
    case 'INSTAGRAM':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      );
    case 'TIKTOK':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
        </svg>
      );
    case 'SHORTS':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      );
    case 'FACEBOOK':
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      );
    default:
      return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      );
  }
};

const KanbanPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteFiltrado, setClienteFiltrado] = useState<number | 'TODOS'>('TODOS');
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const platformColors: Record<string, { bg: string; text: string; label: string }> = {
    INSTAGRAM: { bg: 'rgba(219, 144, 251, 0.15)', text: '#ec4899', label: 'Instagram' },
    TIKTOK: { bg: 'rgba(0, 0, 0, 0.3)', text: '#00f2fe', label: 'TikTok' },
    SHORTS: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Shorts' },
    FACEBOOK: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Facebook' },
    OTRO: { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', label: 'Otro' }
  };

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

    // Filtrar por búsqueda de texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitulo = pub.titulo.toLowerCase().includes(term);
      const matchNotas = pub.notas ? pub.notas.toLowerCase().includes(term) : false;
      if (!matchTitulo && !matchNotas) return false;
    }
    
    return true;
  });

  // Métricas para los KPIs
  const totalKpis = publicacionesFiltradas.length;
  const porGrabarKpis = publicacionesFiltradas.filter(p => p.estado === 'POR_GRABAR').length;
  const enEdicionKpis = publicacionesFiltradas.filter(p => p.estado === 'EDICION').length;
  const terminadasKpis = publicacionesFiltradas.filter(p => p.estado === 'TERMINADO').length;
  const publicadasKpis = publicacionesFiltradas.filter(p => p.estado === 'PUBLICADO').length;

  const usrActual = api.getUsuarioActual();
  const esEditor = usrActual?.rol === 'EDITOR';

  // Agrupar publicaciones por estado
  const columnas: any = {
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
    }
  };

  if (!esEditor) {
    columnas.PUBLICADO = {
      titulo: 'Publicado',
      items: publicacionesFiltradas.filter((p) => p.estado === 'PUBLICADO')
    };
  }

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
        ...(!esEditor ? [{ label: 'Publicado', onClick: () => handleCambiarEstado(contextMenu.pub, 'PUBLICADO') }] : [])
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
    setDraggedOverCol(null);
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;

    const id = parseInt(idStr);
    if (isNaN(id)) return;

    if (esEditor && nuevoEstado === 'PUBLICADO') return;

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

          {/* Búsqueda de publicaciones */}
          <div className="search-bar" style={{ width: '220px', padding: '6px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título..."
              style={{ fontSize: '12px' }}
            />
            {searchTerm && (
              <span 
                onClick={() => setSearchTerm('')} 
                style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', marginLeft: '4px', fontWeight: 'bold' }}
                title="Limpiar búsqueda"
              >
                &times;
              </span>
            )}
          </div>

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
        {!esEditor && (
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
        )}
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
          {Object.entries(columnas).map(([estadoKey, col]) => {
            const colAccentColors: Record<string, string> = {
              POR_GRABAR: '#f59e0b',
              EDICION: '#06b6d4',
              TERMINADO: '#10b981',
              PUBLICADO: '#ec4899'
            };
            const isDraggedOver = draggedOverCol === estadoKey;

            return (
              <div
                key={estadoKey}
                className={`kanban-column ${isDraggedOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={() => setDraggedOverCol(estadoKey)}
                onDragLeave={() => setDraggedOverCol(null)}
                onDrop={(e) => handleDrop(e, estadoKey as any)}
              >
                <div 
                  className="kanban-column-header" 
                  style={{ 
                    borderTop: `3px solid ${colAccentColors[estadoKey]}`,
                    borderBottom: '1.5px solid rgba(192, 132, 252, 0.15)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <h3 className="kanban-column-title" style={{ fontSize: '13px', fontWeight: '800', margin: 0, textTransform: 'uppercase', color: colAccentColors[estadoKey] }}>
                    {col.titulo}
                  </h3>
                  <span 
                    className="kanban-badge" 
                    style={{ 
                      backgroundColor: `${colAccentColors[estadoKey]}15`,
                      color: colAccentColors[estadoKey],
                      border: `1px solid ${colAccentColors[estadoKey]}33`,
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}
                  >
                    {col.items.length}
                  </span>
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
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span className="kanban-card-tag">{pub.cliente.nombre}</span>
                            {pub.plataforma && platformColors[pub.plataforma] && (
                              <span
                                style={{
                                  fontSize: '9px',
                                  fontWeight: '800',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: platformColors[pub.plataforma].bg,
                                  color: platformColors[pub.plataforma].text,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  border: `1px solid ${platformColors[pub.plataforma].text}33`,
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                {renderPlatformIcon(pub.plataforma)}
                                {platformColors[pub.plataforma].label}
                              </span>
                            )}
                          </div>
                          <h4 className="kanban-card-title">{pub.titulo}</h4>
                          <div className="kanban-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <span className="kanban-card-date">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              {fechaFormateada}
                              {pub.horaPublicacion && (
                                <span style={{ marginLeft: '6px', color: 'var(--neon-cyan)', fontWeight: '700' }}>
                                  ⏰ {pub.horaPublicacion}
                                </span>
                              )}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {pub.driveUrl && (
                                <a
                                  href={pub.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="kanban-card-link-icon"
                                  title="Abrir carpeta de Drive"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    color: 'var(--neon-cyan)',
                                    transition: 'color 0.2s ease',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                  </svg>
                                </a>
                              )}
                              {pub.responsable && (
                                <div
                                  title={`Responsable: ${pub.responsable.nombre}`}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--cyber-blue) 0%, var(--neon-cyan) 100%)',
                                    color: '#000000',
                                    fontSize: '8px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 0 5px rgba(6, 182, 212, 0.4)'
                                  }}
                                >
                                  {pub.responsable.nombre.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
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
          readOnly={api.getUsuarioActual()?.rol === 'ACOMPAÑANTE'}
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
