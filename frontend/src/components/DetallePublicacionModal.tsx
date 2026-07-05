import React, { useState, useEffect, useRef } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import RadialTimePicker from './RadialTimePicker';

interface DetallePublicacionModalProps {
  publicacion: Publicacion;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  clientesList: Cliente[];
  readOnly?: boolean;
}

const DetallePublicacionModal: React.FC<DetallePublicacionModalProps> = ({
  publicacion,
  onClose,
  onSave,
  onDelete,
  clientesList,
  readOnly = false,
}) => {
  const [titulo, setTitulo] = useState(publicacion.titulo);
  const [fecha, setFecha] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [fechaPublicacion, setFechaPublicacion] = useState('');
  const [estado, setEstado] = useState(publicacion.estado);
  const [guion, setGuion] = useState(publicacion.guion || '');
  const [driveUrl, setDriveUrl] = useState(publicacion.driveUrl || '');
  const [notas, setNotas] = useState(publicacion.notas || '');
  const [clienteId, setClienteId] = useState(publicacion.clienteId);
  const [plataforma, setPlataforma] = useState(publicacion.plataforma || '');
  const [responsableId, setResponsableId] = useState(publicacion.responsableId || '');
  const [horaPublicacion, setHoraPublicacion] = useState(publicacion.horaPublicacion || '');
  const [miniaturaUrl, setMiniaturaUrl] = useState(publicacion.miniaturaUrl || '');

  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Estados responsivos móviles
  const [esMovil, setEsMovil] = useState(window.innerWidth <= 768);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'guion' | 'recursos'>('general');

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Formatear fecha para el input datetime-local o date (YYYY-MM-DD)
    if (publicacion.fechaProgramada) {
      const d = new Date(publicacion.fechaProgramada);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFecha(`${year}-${month}-${day}`);
    }

    // Mapear fechaEntrega
    if (publicacion.fechaEntrega) {
      const d = new Date(publicacion.fechaEntrega);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFechaEntrega(`${year}-${month}-${day}`);
    } else if (publicacion.fechaProgramada) {
      const d = new Date(publicacion.fechaProgramada);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFechaEntrega(`${year}-${month}-${day}`);
    }

    // Mapear fechaPublicacion
    if (publicacion.fechaPublicacion) {
      const d = new Date(publicacion.fechaPublicacion);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFechaPublicacion(`${year}-${month}-${day}`);
    } else if (publicacion.fechaProgramada) {
      const d = new Date(publicacion.fechaProgramada);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFechaPublicacion(`${year}-${month}-${day}`);
    }
  }, [publicacion]);

  // Inicializar contenido del editor de guion al cambiar de pestaña o de publicación
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = guion || '';
    }
  }, [publicacion.id, activeModalTab]);

  // Cargar lista de usuarios del equipo
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const list = await api.getUsuarios();
        setUsuarios(list);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
      }
    };
    cargarUsuarios();
  }, []);

  const formatTimeDisplay = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) return '';
    const p = h >= 12 ? 'PM' : 'AM';
    let displayHour = h % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${p}`;
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    const usrActual = api.getUsuarioActual();
    const esEditor = usrActual?.rol === 'EDITOR';

    if (!titulo.trim()) {
      setError('El título es un campo obligatorio');
      return;
    }
    if (esEditor && !fechaEntrega) {
      setError('La fecha de entrega es obligatoria');
      return;
    }
    if (!esEditor && (!fechaEntrega || !fechaPublicacion)) {
      setError('La fecha de entrega y la fecha de publicación son obligatorias');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const fProg = esEditor
        ? new Date(fechaEntrega).toISOString()
        : new Date(fechaPublicacion).toISOString();

      await api.updatePublicacion(publicacion.id, {
        titulo: titulo.trim(),
        fechaProgramada: fProg,
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega).toISOString() : null,
        fechaPublicacion: fechaPublicacion ? new Date(fechaPublicacion).toISOString() : null,
        estado,
        guion: guion.trim(),
        driveUrl: driveUrl.trim(),
        notas: notas.trim(),
        clienteId,
        plataforma: plataforma || null,
        responsableId: responsableId || null,
        horaPublicacion: horaPublicacion || null,
        miniaturaUrl: miniaturaUrl || null,
      });
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDelete(false);
    setEliminando(true);
    setError(null);

    try {
      await api.deletePublicacion(publicacion.id);
      onDelete();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar publicación');
      setEliminando(false);
    }
  };

  const applyFormat = (command: 'bold' | 'italic' | 'underline' | 'list') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let parent: Node | null = selection.anchorNode;
    let isInsideEditor = false;
    while (parent) {
      if (parent === editorRef.current) {
        isInsideEditor = true;
        break;
      }
      parent = parent.parentNode;
    }
    if (!isInsideEditor) return;

    const range = selection.getRangeAt(0);

    if (command === 'list') {
      if (range.collapsed) {
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        ul.appendChild(li);
        range.insertNode(ul);

        const newRange = document.createRange();
        newRange.setStart(li, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        const ul = document.createElement('ul');
        const li = document.createElement('li');
        li.appendChild(range.extractContents());
        ul.appendChild(li);
        range.insertNode(ul);
      }
    } else {
      const tagMap = {
        bold: 'strong',
        italic: 'em',
        underline: 'u'
      };
      const tagName = tagMap[command];

      if (range.collapsed) {
        const el = document.createElement(tagName);
        el.innerHTML = '&#8203;';
        range.insertNode(el);

        const newRange = document.createRange();
        newRange.setStart(el.firstChild!, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        const el = document.createElement(tagName);
        el.appendChild(range.extractContents());
        range.insertNode(el);
      }
    }

    if (editorRef.current) {
      setGuion(editorRef.current.innerHTML);
    }
  };

  // Helper para abrir link de Drive en el navegador externo de Electron
  const handleOpenDrive = () => {
    if (!driveUrl) return;
    // Si estamos en Electron, podemos abrirlo con shell.openExternal (a través de preload),
    // sino, simplemente lo abrimos en una nueva pestaña del navegador.
    if ((window as any).electron && (window as any).electron.ipcRenderer) {
      // Si el script de precarga lo expone, o si no lo abrimos con target="_blank"
      window.open(driveUrl, '_blank');
    } else {
      window.open(driveUrl, '_blank');
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-large">
        <div className="modal-header">
          <h3>Detalle de Producción</h3>
          <button className="close-btn" onClick={onClose} disabled={guardando || eliminando}>&times;</button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '16px' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Barra de pestañas horizontal visible solo en celular */}
        {esMovil && (
          <div className="modal-mobile-tabs" style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '16px',
            overflowX: 'auto',
            gap: '4px',
            padding: '0 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}>
            <button
              type="button"
              className={`modal-mobile-tab-btn ${activeModalTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveModalTab('general')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: activeModalTab === 'general' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: '12px 8px',
                borderBottom: activeModalTab === 'general' ? '2.5px solid var(--neon-cyan)' : '2.5px solid transparent',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              💼 Datos
            </button>
            <button
              type="button"
              className={`modal-mobile-tab-btn ${activeModalTab === 'guion' ? 'active' : ''}`}
              onClick={() => setActiveModalTab('guion')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: activeModalTab === 'guion' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: '12px 8px',
                borderBottom: activeModalTab === 'guion' ? '2.5px solid var(--neon-cyan)' : '2.5px solid transparent',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              ✍️ Guión
            </button>
            <button
              type="button"
              className={`modal-mobile-tab-btn ${activeModalTab === 'recursos' ? 'active' : ''}`}
              onClick={() => setActiveModalTab('recursos')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: activeModalTab === 'recursos' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                fontWeight: '800',
                fontSize: '11px',
                textTransform: 'uppercase',
                padding: '12px 8px',
                borderBottom: activeModalTab === 'recursos' ? '2.5px solid var(--neon-cyan)' : '2.5px solid transparent',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              🔗 Recursos
            </button>
          </div>
        )}

        <form onSubmit={handleGuardar} className="modal-form-grid" style={{ display: esMovil ? 'block' : undefined }}>
          {esMovil ? (
            /* ==========================================
               VISTA MÓVIL PESTAÑIZADA (Una sección a la vez)
               ========================================== */
            <>
              {activeModalTab === 'general' && (
                <div className="mobile-tab-content">
                  <div className="form-group">
                    <label>Título del Video / Publicación</label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej: Video de reels promocional"
                      required
                      disabled={guardando || readOnly}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Marca / Negocio</label>
                      <select
                        value={clienteId}
                        onChange={(e) => setClienteId(Number(e.target.value))}
                        disabled={guardando || readOnly}
                      >
                        {clientesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Plataforma</label>
                      <select
                        value={plataforma}
                        onChange={(e) => setPlataforma(e.target.value)}
                        disabled={guardando || readOnly}
                      >
                        <option value="">Plataforma</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="YOUTUBE">YouTube Shorts</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="OTRO">Otro / Web</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const usrActual = api.getUsuarioActual();
                    const esEditor = usrActual?.rol === 'EDITOR';

                    return (
                      <>
                        <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Fecha de Entrega</label>
                            <input
                              type="date"
                              value={fechaEntrega}
                              onChange={(e) => setFechaEntrega(e.target.value)}
                              required
                              disabled={guardando || readOnly}
                            />
                          </div>

                          {!esEditor && (
                            <div className="form-group" style={{ flex: 1 }}>
                              <label>Fecha de Pub.</label>
                              <input
                                type="date"
                                value={fechaPublicacion}
                                onChange={(e) => setFechaPublicacion(e.target.value)}
                                required
                                disabled={guardando || readOnly}
                              />
                            </div>
                          )}
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                          {!esEditor && (
                            <div className="form-group" style={{ flex: 1 }}>
                              <label>Hora de Publicación</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type="text"
                                  value={formatTimeDisplay(horaPublicacion)}
                                  onClick={() => !guardando && !readOnly && setShowTimePicker(true)}
                                  readOnly
                                  placeholder="--:--"
                                  disabled={guardando || readOnly}
                                  style={{ cursor: readOnly ? 'default' : 'pointer', paddingRight: '36px' }}
                                />
                                <span
                                  onClick={() => !guardando && !readOnly && setShowTimePicker(true)}
                                  style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: readOnly ? 'default' : 'pointer',
                                    color: 'var(--text-muted)',
                                    fontSize: '13px',
                                    userSelect: 'none'
                                  }}
                                >
                                  🕒
                                </span>
                              </div>
                            </div>
                          )}
                          {esEditor && <div className="form-group" style={{ flex: 1 }}></div>}
                        </div>

                        <div className="form-row" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <label style={{ margin: 0 }}>Estado</label>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: estado === 'POR_GRABAR' ? '#c084fc' : estado === 'EDICION' ? '#6366f1' : estado === 'TERMINADO' ? '#10b981' : '#22d3ee',
                                boxShadow: `0 0 8px ${estado === 'POR_GRABAR' ? '#c084fc' : estado === 'EDICION' ? '#6366f1' : estado === 'TERMINADO' ? '#10b981' : '#22d3ee'}`,
                                display: 'inline-block',
                                transition: 'all 0.3s ease'
                              }} />
                            </div>
                            <select
                              value={estado}
                              onChange={(e) => setEstado(e.target.value as any)}
                              disabled={guardando || readOnly}
                            >
                              <option value="POR_GRABAR">Por grabar</option>
                              <option value="EDICION">En edición</option>
                              <option value="TERMINADO">Terminado</option>
                              {!esEditor && <option value="PUBLICADO">Publicado</option>}
                            </select>
                          </div>

                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Responsable</label>
                            <select
                              value={responsableId}
                              onChange={(e) => setResponsableId(e.target.value)}
                              disabled={guardando || readOnly}
                            >
                              <option value="">Miembro</option>
                              {usuarios.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.nombre}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {activeModalTab === 'guion' && (
                <div className="mobile-tab-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '320px' }}>
                  <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label>Guión / Texto del Post (Rich Editor)</label>

                    {!readOnly && (
                      <div className="rich-editor-toolbar">
                        <button
                          type="button"
                          title="Negrita"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormat('bold')}
                          style={{ fontWeight: 'bold' }}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          title="Cursiva"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormat('italic')}
                          style={{ fontStyle: 'italic' }}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          title="Subrayado"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormat('underline')}
                          style={{ textDecoration: 'underline' }}
                        >
                          U
                        </button>
                        <button
                          type="button"
                          title="Listas"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyFormat('list')}
                        >
                          • List
                        </button>
                        <span style={{ flex: 1 }}></span>
                      </div>
                    )}

                    <div
                      ref={editorRef}
                      className="rich-editor-content"
                      contentEditable={!guardando && !readOnly}
                      suppressContentEditableWarning
                      data-placeholder="Escribe el gancho, desarrollo y llamado a la acción..."
                      onInput={(e) => setGuion(e.currentTarget.innerHTML)}
                      onBlur={(e) => setGuion(e.currentTarget.innerHTML)}
                      style={{
                        flex: 1,
                        minHeight: '220px',
                        outline: readOnly ? 'none' : undefined,
                        cursor: readOnly ? 'default' : 'text'
                      }}
                    />

                    <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      {guion ? guion.replace(/<[^>]*>/g, '').length : 0} caracteres
                    </div>
                  </div>
                </div>
              )}

              {activeModalTab === 'recursos' && (
                <div className="mobile-tab-content">
                  <div className="form-group">
                    <label>Google Drive (Material / Video Crudo)</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={driveUrl}
                        onChange={(e) => setDriveUrl(e.target.value)}
                        placeholder="Enlace de Drive"
                        disabled={guardando || readOnly}
                        style={{ flex: 1 }}
                      />
                      {driveUrl && (
                        <button
                          type="button"
                          onClick={handleOpenDrive}
                          className="btn btn-secondary"
                          style={{ padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '11px' }}
                        >
                          Abrir
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Enlace De Publicacion Final</label>
                    <input
                      type="url"
                      value={miniaturaUrl}
                      onChange={(e) => setMiniaturaUrl(e.target.value)}
                      placeholder="Enlace del post finalizado"
                      disabled={guardando || readOnly}
                    />
                  </div>

                  <div className="form-group">
                    <label>Notas de Producción</label>
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Comentarios, pautas del cliente o indicaciones..."
                      rows={4}
                      disabled={guardando || readOnly}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ==========================================
               VISTA DE ESCRITORIO TRADICIONAL (Fija a 2 columnas)
               ========================================== */
            <>
              {/* Columna Izquierda: Información Básica */}
              <div className="form-column-left">
                <div className="form-group">
                  <label>Título del Video / Publicación</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: Video de reels promocional"
                    required
                    disabled={guardando || readOnly}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Marca / Negocio</label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(Number(e.target.value))}
                      disabled={guardando || readOnly}
                    >
                      {clientesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Plataforma</label>
                    <select
                      value={plataforma}
                      onChange={(e) => setPlataforma(e.target.value)}
                      disabled={guardando || readOnly}
                    >
                      <option value="">Seleccionar plataforma</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="TIKTOK">TikTok</option>
                      <option value="YOUTUBE">YouTube Shorts</option>
                      <option value="FACEBOOK">Facebook</option>
                      <option value="OTRO">Otro / Web</option>
                    </select>
                  </div>
                </div>

                {(() => {
                  const usrActual = api.getUsuarioActual();
                  const esEditor = usrActual?.rol === 'EDITOR';

                  return (
                    <>
                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Fecha de Entrega</label>
                          <input
                            type="date"
                            value={fechaEntrega}
                            onChange={(e) => setFechaEntrega(e.target.value)}
                            required
                            disabled={guardando || readOnly}
                          />
                        </div>

                        {!esEditor && (
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Fecha de Publicación</label>
                            <input
                              type="date"
                              value={fechaPublicacion}
                              onChange={(e) => setFechaPublicacion(e.target.value)}
                              required
                              disabled={guardando || readOnly}
                            />
                          </div>
                        )}
                      </div>

                      <div className="form-row">
                        {!esEditor && (
                          <div className="form-group" style={{ flex: 1 }}>
                            <label>Hora de Publicación</label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={formatTimeDisplay(horaPublicacion)}
                                onClick={() => !guardando && !readOnly && setShowTimePicker(true)}
                                readOnly
                                placeholder="--:--"
                                disabled={guardando || readOnly}
                                style={{ cursor: readOnly ? 'default' : 'pointer', paddingRight: '36px' }}
                              />
                              <span
                                onClick={() => !guardando && !readOnly && setShowTimePicker(true)}
                                style={{
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  cursor: readOnly ? 'default' : 'pointer',
                                  color: 'var(--text-muted)',
                                  fontSize: '13px',
                                  userSelect: 'none'
                                }}
                              >
                                🕒
                              </span>
                            </div>
                          </div>
                        )}
                        {esEditor && <div className="form-group" style={{ flex: 1 }}></div>}
                      </div>

                      <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <label style={{ margin: 0 }}>Estado de Producción</label>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: estado === 'POR_GRABAR' ? '#c084fc' : estado === 'EDICION' ? '#6366f1' : estado === 'TERMINADO' ? '#10b981' : '#22d3ee',
                              boxShadow: `0 0 8px ${estado === 'POR_GRABAR' ? '#c084fc' : estado === 'EDICION' ? '#6366f1' : estado === 'TERMINADO' ? '#10b981' : '#22d3ee'}`,
                              display: 'inline-block',
                              transition: 'all 0.3s ease'
                            }} />
                          </div>
                          <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value as any)}
                            disabled={guardando || readOnly}
                          >
                            <option value="POR_GRABAR">Por grabar</option>
                            <option value="EDICION">En proceso de edición</option>
                            <option value="TERMINADO">Terminado</option>
                            {!esEditor && <option value="PUBLICADO">Publicado</option>}
                          </select>
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Responsable</label>
                          <select
                            value={responsableId}
                            onChange={(e) => setResponsableId(e.target.value)}
                            disabled={guardando || readOnly}
                          >
                            <option value="">Asignar miembro del equipo</option>
                            {usuarios.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="form-group">
                  <label>Enlace de Google Drive (Material / Video Crudo)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      disabled={guardando || readOnly}
                      style={{ flex: 1 }}
                    />
                    {driveUrl && (
                      <button
                        type="button"
                        onClick={handleOpenDrive}
                        className="btn btn-secondary"
                        style={{ padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '12px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Abrir Drive
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Enlace De Publicacion Final</label>
                  <input
                    type="url"
                    value={miniaturaUrl}
                    onChange={(e) => setMiniaturaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... o enlace de Drive"
                    disabled={guardando || readOnly}
                  />
                  {miniaturaUrl && miniaturaUrl.startsWith('http') && (
                    <div style={{ marginTop: '8px', border: '1px solid rgba(192, 132, 252, 0.25)', borderRadius: '8px', overflow: 'hidden', width: '130px', height: '73px', background: '#000000', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                      <img
                        src={miniaturaUrl}
                        alt="Miniatura Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Notas de Producción</label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Escribe comentarios, pautas del cliente o indicaciones para el editor..."
                    rows={3}
                    disabled={guardando || readOnly}
                  />
                </div>
              </div>

              {/* Columna Derecha: Editor de Guion / Copy */}
              <div className="form-column-right">
                <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <label>Guión / Texto del Post (Rich Editor)</label>

                  {!readOnly && (
                    <div className="rich-editor-toolbar">
                      <button
                        type="button"
                        title="Negrita"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormat('bold')}
                        style={{ fontWeight: 'bold' }}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        title="Cursiva"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormat('italic')}
                        style={{ fontStyle: 'italic' }}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        title="Subrayado"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormat('underline')}
                        style={{ textDecoration: 'underline' }}
                      >
                        U
                      </button>
                      <button
                        type="button"
                        title="Listas"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyFormat('list')}
                      >
                        • List
                      </button>
                      <span style={{ flex: 1 }}></span>
                      <span style={{ fontSize: '10px', color: '#9ca3af' }}>Edición Directa</span>
                    </div>
                  )}

                  <div
                    ref={editorRef}
                    className="rich-editor-content"
                    contentEditable={!guardando && !readOnly}
                    suppressContentEditableWarning
                    data-placeholder="Escribe el gancho, desarrollo y llamado a la acción..."
                    onInput={(e) => setGuion(e.currentTarget.innerHTML)}
                    onBlur={(e) => setGuion(e.currentTarget.innerHTML)}
                    style={{
                      flex: 1,
                      minHeight: '220px',
                      outline: readOnly ? 'none' : undefined,
                      cursor: readOnly ? 'default' : 'text'
                    }}
                  />

                  <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'Outfit, sans-serif' }}>
                    {guion ? guion.replace(/<[^>]*>/g, '').length : 0} caracteres
                  </div>
                </div>
              </div>
            </>
          )}
        </form>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {!readOnly ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowConfirmDelete(true)}
              disabled={guardando || eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar Publicación'}
            </button>
          ) : (
            <span style={{ flex: 1 }}></span>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={guardando || eliminando}
            >
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!readOnly && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGuardar}
                disabled={guardando || eliminando}
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Eliminar Publicación"
        message="¿Estás seguro de que deseas eliminar permanentemente esta publicación de la planificación? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
        variant="danger"
      />

      {showTimePicker && (
        <RadialTimePicker
          initialValue={horaPublicacion}
          onClose={() => setShowTimePicker(false)}
          onSelect={(timeStr) => {
            setHoraPublicacion(timeStr);
            setShowTimePicker(false);
          }}
        />
      )}
    </div>
  );
};

export default DetallePublicacionModal;
