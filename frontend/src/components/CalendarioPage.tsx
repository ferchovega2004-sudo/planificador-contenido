import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';
import EmptyState from './EmptyState';

const CalendarioPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Detalle
  const [selectedPub, setSelectedPub] = useState<Publicacion | null>(null);

  // Modal de creación rápida en celda
  const [crearCeldaInfo, setCrearCeldaInfo] = useState<{ fecha: string; clienteId?: number } | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoClienteId, setNuevoClienteId] = useState<number | ''>('');
  const [creando, setCreando] = useState(false);

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

  const cargarDatos = async () => {
    try {
      setLoading(true);
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
    cargarDatos();
  }, [fechaReferencia, viewMode]);

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
          <h1 className="page-title" style={{ textTransform: 'capitalize' }}>
            {getEncabezadoTitulo()}
          </h1>
          <p className="page-subtitle">Gestiona y planifica tus publicaciones mensuales de forma visual.</p>
        </div>

        {/* Controles de navegación y cambio de vista */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
                const publicacionesDia = publicaciones.filter((pub) => {
                  const pubFechaStr = new Date(pub.fechaProgramada).toISOString().split('T')[0];
                  return pubFechaStr === fechaStr;
                });

                return (
                  <div
                    key={idx}
                    className={`calendar-grid-day-cell ${esOtroMes ? 'other-month' : ''} ${esHoy ? 'today' : ''}`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, fechaStr)}
                    onDoubleClick={() => setCrearCeldaInfo({ fecha: fechaStr })}
                  >
                    <div className="calendar-grid-day-header">
                      <span className="calendar-grid-day-number">{dia.getDate()}</span>
                    </div>

                    <div className="calendar-grid-day-events">
                      {publicacionesDia.map((pub) => (
                        <div
                          key={pub.id}
                          className={`calendar-pub-card ${classEstados[pub.estado]}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, pub.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPub(pub);
                          }}
                        >
                          <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--neon-pink)', marginBottom: '2px' }}>
                            {pub.cliente.nombre}
                          </div>
                          <div className="pub-card-title" style={{ fontSize: '11px', margin: 0 }}>
                            {pub.titulo}
                          </div>
                        </div>
                      ))}
                    </div>

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
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista de Lista */}
          {viewMode === 'list' && (
            <div className="card">
              <h2 className="card-title">Publicaciones del Mes</h2>
              {publicaciones.length === 0 ? (
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
                    {[...publicaciones]
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
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedPub(pub)}
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
        />
      )}
    </div>
  );
};

export default CalendarioPage;
