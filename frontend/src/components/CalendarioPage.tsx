import React, { useState, useEffect, useRef } from 'react';
import { api, Publicacion, Cliente, Usuario } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';
import EmptyState from './EmptyState';
import ContextMenu from './ContextMenu';

const puedeEditarCalendario = (usr: Usuario | null): boolean => {
  if (!usr) return false;
  if (usr.rol === 'ADMIN' || usr.rol === 'USER') return true;
  // El Acompañante nunca edita directamente
  return false;
};

const CalendarioPage: React.FC = () => {
  const usuarioActual = api.getUsuarioActual();
  const esAcompanante = usuarioActual?.rol === 'ACOMPAÑANTE';
  const puedeVerDetalles = !esAcompanante || usuarioActual?.activo === true;

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtro de marcas y navegación fluida
  const [clienteFiltrado, setClienteFiltrado] = useState<number | 'TODOS'>('TODOS');
  const isFirstMount = useRef(true);

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const anios = [2025, 2026, 2027, 2028];

  // Modal de Detalle
  const [selectedPub, setSelectedPub] = useState<Publicacion | null>(null);

  // Modal de creación rápida en celda
  const [crearCeldaInfo, setCrearCeldaInfo] = useState<{ fecha: string; clienteId?: number } | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteId, setNuevoClienteId] = useState<number | ''>('');
  const [creando, setCreando] = useState(false);
  const [draggedOverDate, setDraggedOverDate] = useState<string | null>(null);

  const platformColors: Record<string, { bg: string; text: string; label: string }> = {
    INSTAGRAM: { bg: 'rgba(219, 144, 251, 0.15)', text: '#ec4899', label: 'Instagram' },
    TIKTOK: { bg: 'rgba(0, 0, 0, 0.3)', text: '#00f2fe', label: 'TikTok' },
    SHORTS: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', label: 'Shorts' },
    FACEBOOK: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', label: 'Facebook' },
    OTRO: { bg: 'rgba(255, 255, 255, 0.08)', text: '#cbd5e1', label: 'Otro' }
  };

  // Mapeo de días de la semana (Domingo a Sábado)
  const diasSemanaNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener fechas para la cuadrícula del mes (Sun to Sat)
  const getMonthGridDates = (refDate: Date) => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    
    // Primer día del mes
    const primerDia = new Date(year, month, 1);
    // Último día del mes
    const ultimoDia = new Date(year, month + 1, 0);
    
    // Cuadrícula inicia en el domingo anterior o el mismo día si es domingo
    const primerDiaSemana = primerDia.getDay();
    const inicioGrid = new Date(primerDia);
    inicioGrid.setDate(primerDia.getDate() - primerDiaSemana);
    
    // Cuadrícula termina en el sábado posterior
    const ultimoDiaSemana = ultimoDia.getDay();
    const finGrid = new Date(ultimoDia);
    finGrid.setDate(ultimoDia.getDate() + (6 - ultimoDiaSemana));
    
    const dias: Date[] = [];
    const curr = new Date(inicioGrid);
    while (curr <= finGrid) {
      dias.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return { dias, inicioGrid, finGrid };
  };

  // Obtener fechas para la vista semanal (Sun to Sat)
  const getWeekGridDates = (refDate: Date) => {
    const d = new Date(refDate);
    const day = d.getDay();
    const inicioGrid = new Date(d);
    inicioGrid.setDate(d.getDate() - day);
    
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioGrid);
      dia.setDate(inicioGrid.getDate() + i);
      dias.push(dia);
    }
    return { dias, inicioGrid, finGrid: dias[6] };
  };

  const { dias: diasGrid, inicioGrid, finGrid } = 
    viewMode === 'month' 
      ? getMonthGridDates(fechaReferencia) 
      : getWeekGridDates(fechaReferencia);

  const cargarDatos = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      setError(null);

      // Calcular rango a consultar según el modo de vista actual
      let fInicio = inicioGrid;
      let fFin = finGrid;

      if (viewMode === 'list') {
        // En vista de lista mostramos todo el mes de la fecha de referencia
        const year = fechaReferencia.getFullYear();
        const month = fechaReferencia.getMonth();
        fInicio = new Date(year, month, 1);
        fFin = new Date(year, month + 1, 0);
      }

      const fechaInicioStr = fInicio.toISOString().split('T')[0];
      const fechaFinStr = fFin.toISOString().split('T')[0];

      const [clientesData, publicacionesData] = await Promise.all([
        api.getClientes(),
        api.getPublicaciones({
          fechaInicio: `${fechaInicioStr}T00:00:00.000Z`,
          fechaFin: `${fechaFinStr}T23:59:59.999Z`
        })
      ]);

      setClientes(clientesData);
      setPublicaciones(publicacionesData);
      
      if (clientesData.length > 0 && !nuevoClienteId) {
        setNuevoClienteId(clientesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de planificación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstMount.current) {
      cargarDatos(false);
      isFirstMount.current = false;
    } else {
      cargarDatos(true);
    }
  }, [fechaReferencia, viewMode]);

  const publicacionesFiltradas = publicaciones.filter((pub) => {
    if (clienteFiltrado === 'TODOS') return true;
    return pub.clienteId === clienteFiltrado;
  });

  // Métricas para los KPIs (Filtradas para el mes y año de la fecha de referencia para no contar los días de los límites de cuadrícula)
  const publicacionesKpisFiltradas = publicacionesFiltradas.filter((pub) => {
    const f = new Date(pub.fechaProgramada);
    return f.getMonth() === fechaReferencia.getMonth() && f.getFullYear() === fechaReferencia.getFullYear();
  });

  const totalKpis = publicacionesKpisFiltradas.length;
  const porGrabarKpis = publicacionesKpisFiltradas.filter(p => p.estado === 'POR_GRABAR').length;
  const enEdicionKpis = publicacionesKpisFiltradas.filter(p => p.estado === 'EDICION').length;
  const terminadasKpis = publicacionesKpisFiltradas.filter(p => p.estado === 'TERMINADO').length;
  const publicadasKpis = publicacionesKpisFiltradas.filter(p => p.estado === 'PUBLICADO').length;

  // Estado para el menú contextual
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pub: Publicacion } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, pub: Publicacion) => {
    const currentUsr = api.getUsuarioActual();
    if (!puedeEditarCalendario(currentUsr)) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, pub });
  };

  const handleMoverSiguienteMes = async (pub: Publicacion) => {
    try {
      const fecha = new Date(pub.fechaProgramada);
      fecha.setMonth(fecha.getMonth() + 1);
      await api.updatePublicacion(pub.id, { fechaProgramada: fecha.toISOString() });
      cargarDatos(true);
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar al siguiente mes');
    }
  };

  const handleCambiarEstado = async (pub: Publicacion, nuevoEstado: typeof pub.estado) => {
    try {
      await api.updatePublicacion(pub.id, { estado: nuevoEstado });
      cargarDatos(true);
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
      cargarDatos(true);
    } catch (err: any) {
      setError(err.message || 'Error al duplicar la publicación');
    }
  };

  const handleEliminarPublicacion = async (pub: Publicacion) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la publicación "${pub.titulo}"?`)) {
      try {
        await api.deletePublicacion(pub.id);
        cargarDatos(true);
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

  // Cambiar navegación de fecha
  const navegarAnterior = () => {
    const nueva = new Date(fechaReferencia);
    if (viewMode === 'month' || viewMode === 'list') {
      nueva.setMonth(fechaReferencia.getMonth() - 1);
    } else {
      nueva.setDate(fechaReferencia.getDate() - 7);
    }
    setFechaReferencia(nueva);
  };

  const navegarSiguiente = () => {
    const nueva = new Date(fechaReferencia);
    if (viewMode === 'month' || viewMode === 'list') {
      nueva.setMonth(fechaReferencia.getMonth() + 1);
    } else {
      nueva.setDate(fechaReferencia.getDate() + 7);
    }
    setFechaReferencia(nueva);
  };

  const navegarHoy = () => {
    setFechaReferencia(new Date());
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetFechaStr: string) => {
    e.preventDefault();
    const currentUsr = api.getUsuarioActual();
    if (!puedeEditarCalendario(currentUsr)) return;

    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;

    const id = parseInt(idStr);
    if (isNaN(id)) return;

    // Buscar si ya tiene esa fecha
    const pub = publicaciones.find((p) => p.id === id);
    if (pub) {
      const pubFechaStr = new Date(pub.fechaProgramada).toISOString().split('T')[0];
      if (pubFechaStr === targetFechaStr) {
        return; 
      }
    }

    // Actualización optimista en interfaz
    setPublicaciones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            fechaProgramada: `${targetFechaStr}T12:00:00.000Z`
          };
        }
        return p;
      })
    );

    try {
      await api.updatePublicacion(id, {
        fechaProgramada: new Date(`${targetFechaStr}T12:00:00.000Z`).toISOString()
      });
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar la publicación');
      cargarDatos(); // Revertir
    }
  };

  const handleCrearCelda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !crearCeldaInfo || !nuevoClienteId) return;

    setCreando(true);
    setError(null);

    try {
      await api.createPublicacion({
        titulo: nuevoTitulo.trim(),
        clienteId: Number(nuevoClienteId),
        fechaProgramada: new Date(`${crearCeldaInfo.fecha}T12:00:00.000Z`).toISOString(),
        estado: 'POR_GRABAR'
      });
      setNuevoTitulo('');
      setCrearCeldaInfo(null);
      cargarDatos();
    } catch (err: any) {
      setError(err.message || 'Error al programar publicación');
    } finally {
      setCreando(false);
    }
  };

  // Mapeo de estados a clases de estilo
  const classEstados: any = {
    'POR_GRABAR': 'card-por-grabar',
    'EDICION': 'card-edicion',
    'TERMINADO': 'card-terminado',
    'PUBLICADO': 'card-publicado'
  };

  const getEncabezadoTitulo = () => {
    return fechaReferencia.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="page-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>Calendario Publicaciones:</h1>
            
            <select
              value={fechaReferencia.getMonth()}
              onChange={(e) => {
                const nueva = new Date(fechaReferencia);
                nueva.setMonth(Number(e.target.value));
                setFechaReferencia(nueva);
              }}
              style={{
                fontSize: '24px',
                fontWeight: '800',
                border: 'none',
                background: 'transparent',
                color: 'var(--neon-pink)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                textTransform: 'capitalize',
                paddingRight: '6px'
              }}
            >
              {mesesNombres.map((m, idx) => (
                <option key={idx} value={idx} style={{ backgroundColor: '#100a0d', color: '#ffffff' }}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={fechaReferencia.getFullYear()}
              onChange={(e) => {
                const nueva = new Date(fechaReferencia);
                nueva.setFullYear(Number(e.target.value));
                setFechaReferencia(nueva);
              }}
              style={{
                fontSize: '24px',
                fontWeight: '800',
                border: 'none',
                background: 'transparent',
                color: 'var(--neon-pink)',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            >
              {anios.map((y) => (
                <option key={y} value={y} style={{ backgroundColor: '#100a0d', color: '#ffffff' }}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <p className="page-subtitle">Gestiona y planifica tus publicaciones mensuales de forma visual.</p>
        </div>

        {/* Controles de navegación y cambio de vista */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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

          {/* Navegación */}
          <div className="calendar-controls">
            <button onClick={navegarAnterior} className="btn-secondary" style={{ padding: '6px 12px' }}>
              &larr;
            </button>
            <button onClick={navegarHoy} className="btn-secondary" style={{ padding: '6px 12px' }}>
              Hoy
            </button>
            <button onClick={navegarSiguiente} className="btn-secondary" style={{ padding: '6px 12px' }}>
              &rarr;
            </button>
          </div>

          {/* Cambiador de vista */}
          <div className="calendar-view-switcher">
            <button
              onClick={() => setViewMode('month')}
              className={`calendar-view-btn ${viewMode === 'month' ? 'active' : ''}`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`calendar-view-btn ${viewMode === 'week' ? 'active' : ''}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`calendar-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              Lista
            </button>
          </div>
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
        <div className="loading-state">Cargando calendario...</div>
      ) : clientes.length === 0 ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <EmptyState
            icon="box"
            title="Sin Marcas Registradas"
            description="Para poder planificar y visualizar publicaciones, primero debes agregar al menos una marca en la pestaña de Marcas / Clientes."
          />
        </div>
      ) : (
        <>
          {/* Vista de Mes y Semana */}
          {(viewMode === 'month' || viewMode === 'week') && (
            <div className="calendar-month-grid">
              {/* Encabezado del Grid: Días de la semana */}
              {diasSemanaNombres.map((dia, idx) => (
                <div key={idx} className="calendar-grid-header-cell">
                  {dia}
                </div>
              ))}

              {/* Celdas de los Días */}
              {diasGrid.map((dia, idx) => {
                const fechaStr = dia.toISOString().split('T')[0];
                const esOtroMes = dia.getMonth() !== fechaReferencia.getMonth() && viewMode === 'month';
                const esHoy = new Date().toDateString() === dia.toDateString();

                // Filtrar publicaciones de este día específico
                const publicacionesDia = publicacionesFiltradas.filter((pub) => {
                  const pubFechaStr = new Date(pub.fechaProgramada).toISOString().split('T')[0];
                  return pubFechaStr === fechaStr;
                });

                return (
                  <div
                    key={idx}
                    className={`calendar-grid-day-cell ${esOtroMes ? 'other-month' : ''} ${esHoy ? 'today' : ''} ${draggedOverDate === fechaStr ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={() => setDraggedOverDate(fechaStr)}
                    onDragLeave={() => setDraggedOverDate(null)}
                    onDrop={(e) => {
                      setDraggedOverDate(null);
                      handleDrop(e, fechaStr);
                    }}
                    onDoubleClick={() => {
                      const usr = api.getUsuarioActual();
                      if (!puedeEditarCalendario(usr)) return;
                      setCrearCeldaInfo({ fecha: fechaStr });
                    }}
                  >
                    <div className="calendar-grid-day-header">
                      <span className="calendar-grid-day-number">{dia.getDate()}</span>
                    </div>

                    <div className="calendar-grid-day-events">
                      {publicacionesDia.map((pub) => (
                        <div
                          key={pub.id}
                          className={`calendar-pub-card ${classEstados[pub.estado]}`}
                          draggable={!esAcompanante && puedeEditarCalendario(api.getUsuarioActual())}
                          onDragStart={(e) => handleDragStart(e, pub.id)}
                          onContextMenu={(e) => {
                            if (esAcompanante) {
                              e.preventDefault();
                              return;
                            }
                            handleContextMenu(e, pub);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!puedeVerDetalles) return;
                            setSelectedPub(pub);
                          }}
                          style={{ cursor: puedeVerDetalles ? 'pointer' : 'default' }}
                        >
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '2px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon-pink)' }}>
                              {pub.cliente.nombre}
                            </span>
                            {pub.plataforma && platformColors[pub.plataforma] && (
                              <span
                                style={{
                                  fontSize: '7px',
                                  fontWeight: '800',
                                  padding: '0px 3px',
                                  borderRadius: '2px',
                                  backgroundColor: platformColors[pub.plataforma].bg,
                                  color: platformColors[pub.plataforma].text,
                                  textTransform: 'uppercase',
                                  border: `1px solid ${platformColors[pub.plataforma].text}22`
                                }}
                              >
                                {pub.plataforma.substring(0, 3)}
                              </span>
                            )}
                          </div>
                          <div className="pub-card-title" style={{ fontSize: '10px', margin: '2px 0 4px', fontWeight: '600', lineHeight: '1.2' }}>
                            {pub.titulo}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{ fontSize: '8px', color: 'var(--neon-cyan)', fontWeight: '700' }}>
                              {pub.horaPublicacion ? `⏰ ${pub.horaPublicacion}` : ''}
                            </span>
                            {pub.responsable && (
                              <div
                                title={`Responsable: ${pub.responsable.nombre}`}
                                style={{
                                  width: '14px',
                                  height: '14px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, var(--cyber-blue) 0%, var(--neon-cyan) 100%)',
                                  color: '#000000',
                                  fontSize: '7px',
                                  fontWeight: '800',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 0 3px rgba(6, 182, 212, 0.4)'
                                }}
                              >
                                {pub.responsable.nombre.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {(() => {
                      const usr = api.getUsuarioActual();
                      if (!puedeEditarCalendario(usr)) return null;
                      return (
                        <div
                          className="cell-quick-add"
                          title="Agregar publicación"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCrearCeldaInfo({ fecha: fechaStr });
                          }}
                        >
                          +
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista de Lista */}
          {viewMode === 'list' && (
            <div className="card">
              <h2 className="card-title">Publicaciones del Mes</h2>
              {publicacionesFiltradas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  No hay publicaciones programadas para este mes.
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Marca / Cliente</th>
                      <th>Título / Descripción</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...publicacionesFiltradas]
                      .sort((a, b) => new Date(a.fechaProgramada).getTime() - new Date(b.fechaProgramada).getTime())
                      .map((pub) => {
                        const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        });
                        return (
                          <tr
                            key={pub.id}
                            style={{ cursor: puedeVerDetalles ? 'pointer' : 'default' }}
                            onContextMenu={(e) => {
                              if (esAcompanante) {
                                e.preventDefault();
                                return;
                              }
                              handleContextMenu(e, pub);
                            }}
                            onClick={() => {
                              if (!puedeVerDetalles) return;
                              setSelectedPub(pub);
                            }}
                          >
                            <td style={{ textTransform: 'capitalize' }}>{fechaFormateada}</td>
                            <td>
                              <strong>{pub.cliente.nombre}</strong>
                            </td>
                            <td>{pub.titulo}</td>
                            <td>
                              <span className={`badge ${
                                pub.estado === 'POR_GRABAR' ? 'badge-admin' : 'badge-user'
                              }`}>
                                {pub.estado === 'POR_GRABAR' && 'Por grabar'}
                                {pub.estado === 'EDICION' && 'Edición'}
                                {pub.estado === 'TERMINADO' && 'Terminado'}
                                {pub.estado === 'PUBLICADO' && 'Publicado'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal para crear publicación directamente en celda */}
      {crearCeldaInfo && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3>Programar Publicación</h3>
              <button className="close-btn" onClick={() => setCrearCeldaInfo(null)}>&times;</button>
            </div>
            <form onSubmit={handleCrearCelda} className="form">
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Programando para el{' '}
                <strong>
                  {new Date(`${crearCeldaInfo.fecha}T12:00:00.000Z`).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </strong>.
              </p>

              <div className="form-group">
                <label>Título / Descripción</label>
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

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCrearCeldaInfo(null)}
                  disabled={creando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creando}>
                  {creando ? 'Programando...' : 'Programar Publicación'}
                </button>
              </div>
            </form>
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
          readOnly={!puedeEditarCalendario(api.getUsuarioActual())}
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

export default CalendarioPage;
