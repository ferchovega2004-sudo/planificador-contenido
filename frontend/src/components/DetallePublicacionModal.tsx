import React, { useState, useEffect, useRef } from 'react';
import { api, Publicacion, Cliente } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

interface DetallePublicacionModalProps {
  publicacion: Publicacion;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  clientesList: Cliente[];
}

const DetallePublicacionModal: React.FC<DetallePublicacionModalProps> = ({
  publicacion,
  onClose,
  onSave,
  onDelete,
  clientesList,
}) => {
  const [titulo, setTitulo] = useState(publicacion.titulo);
  const [fecha, setFecha] = useState('');
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
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Formatear fecha para el input datetime-local o date (YYYY-MM-DD)
    if (publicacion.fechaProgramada) {
      const d = new Date(publicacion.fechaProgramada);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFecha(`${year}-${month}-${day}`);
    }
  }, [publicacion]);

  // Inicializar contenido del editor de guion una sola vez
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = publicacion.guion || '';
    }
  }, [publicacion.id]);

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

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !fecha) {
      setError('El título y la fecha son campos obligatorios');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      await api.updatePublicacion(publicacion.id, {
        titulo: titulo.trim(),
        fechaProgramada: new Date(fecha).toISOString(),
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

        <form onSubmit={handleGuardar} className="modal-form-grid">
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
                disabled={guardando}
              />
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Marca / Negocio</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(Number(e.target.value))}
                  disabled={guardando}
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
                  disabled={guardando}
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

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fecha de Publicación</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  disabled={guardando}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Hora de Publicación</label>
                <input
                  type="time"
                  value={horaPublicacion}
                  onChange={(e) => setHoraPublicacion(e.target.value)}
                  disabled={guardando}
                />
              </div>
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
                  disabled={guardando}
                >
                  <option value="POR_GRABAR">Por grabar</option>
                  <option value="EDICION">En proceso de edición</option>
                  <option value="TERMINADO">Terminado</option>
                  <option value="PUBLICADO">Publicado</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Responsable</label>
                <select
                  value={responsableId}
                  onChange={(e) => setResponsableId(e.target.value)}
                  disabled={guardando}
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

            <div className="form-group">
              <label>Enlace de Google Drive (Material / Video Crudo)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="url"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  disabled={guardando}
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
              <label>Miniatura del Video (URL de Imagen)</label>
              <input
                type="url"
                value={miniaturaUrl}
                onChange={(e) => setMiniaturaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... o enlace de Drive"
                disabled={guardando}
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
                disabled={guardando}
              />
            </div>
          </div>

          {/* Columna Derecha: Editor de Guion / Copy */}
          <div className="form-column-right">
            <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <label>Guión / Texto del Post (Rich Editor)</label>
              
              {/* Barra de herramientas simulada para el editor de texto enriquecido */}
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

              {/* Contenedor editable para simular el Rich Text Editor */}
              <div
                ref={editorRef}
                className="rich-editor-content"
                contentEditable={!guardando}
                suppressContentEditableWarning
                data-placeholder="Escribe el gancho, desarrollo y llamado a la acción..."
                onInput={(e) => setGuion(e.currentTarget.innerHTML)}
                onBlur={(e) => setGuion(e.currentTarget.innerHTML)}
                style={{
                  flex: 1,
                  minHeight: '220px'
                }}
              />

              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'Outfit, sans-serif' }}>
                {guion ? guion.replace(/<[^>]*>/g, '').length : 0} caracteres
              </div>
            </div>
          </div>
        </form>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowConfirmDelete(true)}
            disabled={guardando || eliminando}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar Publicación'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={guardando || eliminando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
              disabled={guardando || eliminando}
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
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
    </div>
  );
};

export default DetallePublicacionModal;
