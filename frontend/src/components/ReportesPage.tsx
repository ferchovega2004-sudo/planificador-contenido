import React, { useState, useEffect } from 'react';
import { api, Cliente } from '../services/api';

const ReportesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | 'TODOS'>('TODOS');
  const [rangoTipo, setRangoTipo] = useState<'semanal' | 'mensual'>('semanal');
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inicializar rango de fechas por defecto según la opción semanal/mensual
  useEffect(() => {
    const hoy = new Date();
    if (rangoTipo === 'semanal') {
      // De lunes a domingo de esta semana
      const day = hoy.getDay();
      const diff = hoy.getDate() - day + (day === 0 ? -6 : 1);
      const lunes = new Date(hoy.setDate(diff));
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      
      setFechaInicio(lunes.toISOString().split('T')[0]);
      setFechaFin(domingo.toISOString().split('T')[0]);
    } else {
      // Del primero al último día de este mes
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      setFechaInicio(primerDia.toISOString().split('T')[0]);
      setFechaFin(ultimoDia.toISOString().split('T')[0]);
    }
  }, [rangoTipo]);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoadingClientes(true);
        const data = await api.getClientes();
        setClientes(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar las marcas para filtros');
      } finally {
        setLoadingClientes(false);
      }
    };
    cargarClientes();
  }, []);

  const handleDescargarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError('Por favor, selecciona las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const filtros: any = {
        fechaInicio: `${fechaInicio}T00:00:00.000Z`,
        fechaFin: `${fechaFin}T23:59:59.999Z`
      };
      
      if (clienteSeleccionado !== 'TODOS') {
        filtros.clienteId = clienteSeleccionado;
      }

      const blob = await api.generarReportePdf(filtros);
      
      // Crear URL de descarga del Blob y disparar la descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `planificacion_contenido_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar recursos
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);

      setSuccess('El archivo PDF del reporte se ha descargado correctamente');
    } catch (err: any) {
      setError(err.message || 'Error al generar el archivo de reporte PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimirReporte = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError('Por favor, selecciona las fechas de inicio y fin');
      return;
    }

    setSuccess(null);
    setError(null);

    const token = localStorage.getItem('token') || '';
    let url = `${api.getApiUrl()}/reportes/html?token=${encodeURIComponent(token)}&fechaInicio=${fechaInicio}T00:00:00.000Z&fechaFin=${fechaFin}T23:59:59.999Z`;
    
    if (clienteSeleccionado !== 'TODOS') {
      url += `&clienteId=${clienteSeleccionado}`;
    }

    window.open(url, '_blank');
    setSuccess('Se ha abierto la vista de impresión en una nueva pestaña.');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Módulo de Reportes e Impresión</h1>
          <p className="page-subtitle">Genera documentos PDF de planificación de contenido limpios, listos para enviar a tus clientes o imprimir.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '16px' }}>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '16px' }}>
          <span>{success}</span>
        </div>
      )}

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="card-title">Filtros de Reporte</h2>
        <form onSubmit={handleDescargarReporte} className="form">
          <div className="form-group">
            <label>Seleccionar Cliente / Marca</label>
            {loadingClientes ? (
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Cargando marcas...</div>
            ) : (
              <select
                value={clienteSeleccionado}
                onChange={(e) => setClienteSeleccionado(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                disabled={loading}
              >
                <option value="TODOS">Todos los clientes (Consolidado)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Período de Planificación</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', fontSize: '12px' }}>
                <input
                  type="radio"
                  name="rangoTipo"
                  checked={rangoTipo === 'semanal'}
                  onChange={() => setRangoTipo('semanal')}
                  disabled={loading}
                />
                Semanal (Esta Semana)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal', fontSize: '12px' }}>
                <input
                  type="radio"
                  name="rangoTipo"
                  checked={rangoTipo === 'mensual'}
                  onChange={() => setRangoTipo('mensual')}
                  disabled={loading}
                />
                Mensual (Este Mes)
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha de Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button 
              type="button" 
              onClick={handleImprimirReporte}
              className="btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} 
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Vista de Impresión / PDF Web
            </button>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></span>
                  Generando Documento...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Descargar PDF (Servidor)
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div style={{ maxWidth: '600px', margin: '20px auto 0', padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', display: 'flex', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <p style={{ fontSize: '11px', color: '#1e3a8a', margin: 0, lineHeight: '1.4' }}>
          El documento PDF exportado contendrá una tabla estructurada de forma horizontal para asegurar la lectura cómoda de títulos, guiones cortos, enlaces de descarga directa de material y notas internas de producción. Es ideal para enviar por WhatsApp o correo a tus clientes para su revisión y aprobación.
        </p>
      </div>
    </div>
  );
};

export default ReportesPage;
