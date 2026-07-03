import React, { useState, useEffect } from 'react';
import { api, Publicacion, Cliente } from '../services/api';

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
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      });
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente esta publicación de la planificación?')) {
      return;
    }

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
                <label>Fecha de Publicación</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                  disabled={guardando}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Estado de Producción</label>
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

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Enlace de Google Drive (Material / Video Crudo)</label>
                {driveUrl && (
                  <button
                    type="button"
                    onClick={handleOpenDrive}
                    className="link-btn"
                    style={{ fontSize: '11px', color: 'var(--neon-cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Abrir enlace externo
                  </button>
                )}
              </div>
              <input
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                disabled={guardando}
              />
            </div>

            <div className="form-group">
              <label>Notas de Producción</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Escribe comentarios, pautas del cliente o indicaciones para el editor..."
                rows={4}
                disabled={guardando}
              />
            </div>
          </div>

          {/* Columna Derecha: Editor de Guion / Copy */}
          <div className="form-column-right">
            <div className="form-group" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Guión / Texto del Post (Rich Editor)</span>
                <span className="text-muted" style={{ fontSize: '10px' }}>Escribe el gancho, desarrollo y llamado a la acción</span>
              </label>
              
              {/* Barra de herramientas simulada para el editor de texto enriquecido */}
              <div className="rich-editor-toolbar">
                <button type="button" title="Negrita" onClick={() => document.execCommand('bold', false)} style={{ fontWeight: 'bold' }}>B</button>
                <button type="button" title="Cursiva" onClick={() => document.execCommand('italic', false)} style={{ fontStyle: 'italic' }}>I</button>
                <button type="button" title="Subrayado" onClick={() => document.execCommand('underline', false)} style={{ textDecoration: 'underline' }}>U</button>
                <button type="button" title="Listas" onClick={() => document.execCommand('insertUnorderedList', false)}>• List</button>
                <span style={{ flex: 1 }}></span>
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>Edición Directa</span>
              </div>

              {/* Contenedor editable para simular el Rich Text Editor */}
              <div
                className="rich-editor-content"
                contentEditable={!guardando}
                suppressContentEditableWarning
                onBlur={(e) => setGuion(e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: publicacion.guion || '' }}
                style={{
                  flex: 1,
                  minHeight: '220px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0 0 6px 6px',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  overflowY: 'auto',
                  fontFamily: 'inherit',
                  color: '#374151'
                }}
              />
            </div>
          </div>
        </form>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            className="btn-danger"
            onClick={handleEliminar}
            disabled={guardando || eliminando}
          >
            {eliminando ? 'Eliminando...' : 'Eliminar Publicación'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={guardando || eliminando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleGuardar}
              disabled={guardando || eliminando}
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallePublicacionModal;
