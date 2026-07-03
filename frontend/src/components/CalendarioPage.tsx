import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import DetallePublicacionModal from './DetallePublicacionModal';
import EmptyState from './EmptyState';

const CalendarioPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Detalle
  const [selectedPub, setSelectedPub] = useState<Publicacion | null>(null);

  // Modal de creación rápida en celda
  const [crearCeldaInfo, setCrearCeldaInfo] = useState<{ clienteId: number; fecha: string } | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [creando, setCreando] = useState(false);

  // Obtener fechas de la semana de lunes a domingo para la fecha de referencia
  const obtenerDiasSemana = (refDate: Date) => {
    const d = new Date(refDate);
    const day = d.getDay();
    // Ajustar para que el Lunes sea el día 0, Martes 1, ..., Domingo 6
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    const lunes = new Date(d.setDate(diff));
    
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(lunes);
      dia.setDate(lunes.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const diasSemana = obtenerDiasSemana(fechaReferencia);
  const fechaInicioStr = diasSemana[0].toISOString().split('T')[0];
  const fechaFinStr = diasSemana[6].toISOString().split('T')[0];

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clientesData, publicacionesData] = await Promise.all([
        api.getClientes(),
        api.getPublicaciones({
          fechaInicio: `${fechaInicioStr}T00:00:00.000Z`,
          fechaFin: `${fechaFinStr}T23:59:59.999Z`
        })
      ]);
      setClientes(clientesData);
      setPublicaciones(publicacionesData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de planificación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaReferencia]);

  // Cambiar de semana
  const semanaAnterior = () => {
    const nuevaFecha = new Date(fechaReferencia);
    nuevaFecha.setDate(fechaReferencia.getDate() - 7);
    setFechaReferencia(nuevaFecha);
  };

  const semanaSiguiente = () => {
    const nuevaFecha = new Date(fechaReferencia);
    nuevaFecha.setDate(fechaReferencia.getDate() + 7);
    setFechaReferencia(nuevaFecha);
  };

  const semanaActual = () => {
    setFechaReferencia(new Date());
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetClienteId: number, targetFechaStr: string) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;

    const id = parseInt(idStr);
    if (isNaN(id)) return;

    // Buscar si ya tiene esos datos
    const pub = publicaciones.find((p) => p.id === id);
    if (pub) {
      const pubFechaStr = new Date(pub.fechaProgramada).toISOString().split('T')[0];
      if (pub.clienteId === targetClienteId && pubFechaStr === targetFechaStr) {
        return; 
      }
    }

    // Actualización optimista en interfaz
    setPublicaciones((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          // Obtener el nombre del nuevo cliente
          const nuevoCli = clientes.find((c) => c.id === targetClienteId);
          return {
            ...p,
            clienteId: targetClienteId,
            fechaProgramada: `${targetFechaStr}T12:00:00.000Z`,
            cliente: nuevoCli ? { id: nuevoCli.id, nombre: nuevoCli.nombre } : p.cliente
          };
        }
        return p;
      })
    );

    try {
      await api.updatePublicacion(id, {
        clienteId: targetClienteId,
        fechaProgramada: new Date(`${targetFechaStr}T12:00:00.000Z`).toISOString()
      });
    } catch (err: any) {
      setError(err.message || 'Error al reprogramar la publicación');
      cargarDatos(); // Revertir en caso de fallo
    }
  };

  const handleCrearCelda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !crearCeldaInfo) return;

    setCreando(true);
    setError(null);

    try {
      await api.createPublicacion({
        titulo: nuevoTitulo.trim(),
        clienteId: crearCeldaInfo.clienteId,
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

  const getRangoTexto = () => {
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const inicio = diasSemana[0].toLocaleDateString('es-ES', opciones);
    const fin = diasSemana[6].toLocaleDateString('es-ES', { ...opciones, year: 'numeric' });
    return `Semana del ${inicio} al ${fin}`;
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Programación de Publicaciones (Calendario)</h1>
          <p className="page-subtitle">Visualización semanal por marcas. Arrastra las tarjetas para reprogramar el día o cambiar de marca.</p>
        </div>

        {/* Controles de navegación de fecha */}
        <div className="calendar-controls">
          <button onClick={semanaAnterior} className="btn-secondary btn-nav">
            &larr; Anterior
          </button>
          <button onClick={semanaActual} className="btn-secondary">
            Esta Semana
          </button>
          <button onClick={semanaSiguiente} className="btn-secondary btn-nav">
            Siguiente &rarr;
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '14px', fontWeight: '700', fontSize: '15px', color: 'var(--neon-cyan)', textShadow: '0 0 5px rgba(0, 242, 254, 0.4)', fontFamily: 'Orbitron, sans-serif' }}>
        {getRangoTexto()}
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Cargando matriz de planificación...</div>
      ) : clientes.length === 0 ? (
        <div className="card" style={{ marginTop: '20px' }}>
          <EmptyState
            icon="box"
            title="Sin Marcas Registradas"
            description="Para poder planificar y visualizar la matriz de publicaciones del calendario, primero debes agregar al menos una marca en la pestaña de Marcas / Clientes."
          />
        </div>
      ) : (
        <div className="calendar-scroll-container">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="brand-header">Negocio / Marca</th>
                {diasSemana.map((dia, idx) => {
                  const esHoy = new Date().toDateString() === dia.toDateString();
                  return (
                    <th key={idx} className={esHoy ? 'col-header-today' : ''}>
                      <div className="day-name">
                        {dia.toLocaleDateString('es-ES', { weekday: 'long' })}
                      </div>
                      <div className="day-number">
                        {dia.getDate()} {dia.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td className="brand-cell">
                    <strong>{cliente.nombre}</strong>
                  </td>
                  {diasSemana.map((dia, idx) => {
                    const fechaStr = dia.toISOString().split('T')[0];
                    // Filtrar publicaciones de esta marca y este día específico
                    const publicacionesDia = publicaciones.filter((pub) => {
                      const pubFechaStr = new Date(pub.fechaProgramada).toISOString().split('T')[0];
                      return pub.clienteId === cliente.id && pubFechaStr === fechaStr;
                    });

                    return (
                      <td
                        key={idx}
                        className="calendar-cell"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, cliente.id, fechaStr)}
                        onDoubleClick={() => setCrearCeldaInfo({ clienteId: cliente.id, fecha: fechaStr })}
                      >
                        {publicacionesDia.map((pub) => (
                          <div
                            key={pub.id}
                            className={`calendar-pub-card ${classEstados[pub.estado]}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, pub.id)}
                            onClick={() => setSelectedPub(pub)}
                          >
                            <div className="pub-card-title">{pub.titulo}</div>
                            <div className="pub-card-footer">
                              <span className="pub-badge-state">
                                {pub.estado === 'POR_GRABAR' && '🎥'}
                                {pub.estado === 'EDICION' && '✂️'}
                                {pub.estado === 'TERMINADO' && '✅'}
                                {pub.estado === 'PUBLICADO' && '🚀'}
                              </span>
                              {pub.driveUrl && <span style={{ fontSize: '9px' }}>📂</span>}
                            </div>
                          </div>
                        ))}
                        <div className="cell-quick-add" title="Doble clic para programar">+</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para crear publicación directamente en celda */}
      {crearCeldaInfo && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Programar Publicación</h3>
              <button className="close-btn" onClick={() => setCrearCeldaInfo(null)}>&times;</button>
            </div>
            <form onSubmit={handleCrearCelda} className="form">
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
                Programando para <strong>{clientes.find(c => c.id === crearCeldaInfo.clienteId)?.nombre}</strong> el día{' '}
                <strong>{new Date(`${crearCeldaInfo.fecha}T12:00:00.000Z`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>.
              </p>
              <div className="form-group">
                <label>Título / Descripción</label>
                <input
                  type="text"
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="Ej: reels promocional de calzado"
                  required
                  disabled={creando}
                />
              </div>
              <div className="modal-footer" style={{ marginTop: '20px' }}>
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
