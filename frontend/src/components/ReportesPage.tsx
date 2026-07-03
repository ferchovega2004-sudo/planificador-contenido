import React, { useState, useEffect } from 'react';
import { api, Cliente } from '../services/api';

const ReportesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<number | 'TODOS'>('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [rangoTipo, setRangoTipo] = useState<'semanal' | 'mensual'>('semanal');
  
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calcular las fechas por defecto al cargar o cambiar el tipo de rango
  useEffect(() => {
    const hoy = new Date();
    
    if (rangoTipo === 'semanal') {
      // Obtener el lunes de la semana actual
      const diaSemana = hoy.getDay();
      const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      const lunes = new Date(hoy.setDate(diff));
      
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      
      setFechaInicio(lunes.toISOString().split('T')[0]);
      setFechaFin(domingo.toISOString().split('T')[0]);
    } else {
      // Obtener el primer y último día del mes actual
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      setFechaInicio(primerDia.toISOString().split('T')[0]);
      setFechaFin(ultimoDia.toISOString().split('T')[0]);
    }
  }, [rangoTipo]);

  // Cargar lista de clientes (marcas) para el selector
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        setLoadingClientes(true);
        const data = await api.getClientes();
        setClientes(data);
      } catch (err: any) {
        setError(err.message || 'Error al obtener marcas de clientes');
      } finally {
        setLoadingClientes(false);
      }
    };
    cargarClientes();
  }, []);

  const handleImprimirReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError('Por favor, selecciona las fechas de inicio y fin');
      return;
    }

    setSuccess(null);
    setError(null);
    setLoading(true);

    try {
      const filtros: any = {
        fechaInicio: `${fechaInicio}T00:00:00.000Z`,
        fechaFin: `${fechaFin}T23:59:59.999Z`
      };
      
      if (clienteSeleccionado !== 'TODOS') {
        filtros.clienteId = Number(clienteSeleccionado);
      }

      // Obtener datos directamente de Supabase
      const publicaciones = await api.getPublicaciones(filtros);

      let clienteNombre = 'Todos los clientes';
      if (clienteSeleccionado !== 'TODOS' && publicaciones.length > 0) {
        clienteNombre = publicaciones[0].cliente.nombre;
      }

      const rangoTexto = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;

      const mapeoEstados: any = {
        'POR_GRABAR': 'Por grabar',
        'EDICION': 'En proceso de edición',
        'TERMINADO': 'Terminado',
        'PUBLICADO': 'Publicado'
      };

      const filasHTML = publicaciones.map((pub: any) => {
        const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });

        const tituloSafe = pub.titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const estadoTexto = mapeoEstados[pub.estado] || pub.estado;
        const guionSafe = pub.guion ? pub.guion.replace(/<[^>]*>/g, ' ').substring(0, 100) + (pub.guion.length > 100 ? '...' : '') : 'Sin guión';
        const driveSafe = pub.driveUrl ? `<a href="${pub.driveUrl}" target="_blank">Ver material</a>` : 'Sin link';
        const notasSafe = pub.notas ? pub.notas.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100) + (pub.notas.length > 100 ? '...' : '') : 'Sin notas';

        return `
          <tr>
            <td><strong>${pub.cliente.nombre}</strong></td>
            <td>${fechaFormateada}</td>
            <td>${tituloSafe}</td>
            <td><span class="badge badge-${pub.estado.toLowerCase()}">${estadoTexto}</span></td>
            <td class="text-muted">${guionSafe}</td>
            <td>${driveSafe}</td>
            <td class="text-muted">${notasSafe}</td>
          </tr>
        `;
      }).join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Publicaciones</title>
          <style>
            @page {
              size: letter landscape;
              margin: 0.4in;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 11px;
              background-color: #fff;
            }
            .header {
              margin-bottom: 20px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 20px;
              color: #1e3a8a;
            }
            .header .subtitle {
              margin: 0;
              color: #4b5563;
              font-size: 12px;
            }
            .header .meta {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px 10px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f3f4f6;
              color: #1f2937;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .badge {
              display: inline-block;
              padding: 3px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .badge-por_grabar { background-color: #fef3c7; color: #d97706; }
            .badge-edicion { background-color: #dbeafe; color: #2563eb; }
            .badge-terminado { background-color: #d1fae5; color: #059669; }
            .badge-publicado { background-color: #f3e8ff; color: #7c3aed; }
            .text-muted { color: #6b7280; }
            a { color: #2563eb; text-decoration: none; font-weight: 500; }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 9px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Reporte de Publicaciones</h1>
              <p class="subtitle"><strong>Cliente:</strong> ${clienteNombre} | <strong>Rango:</strong> ${rangoTexto}</p>
            </div>
            <div class="meta">
              Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}<br>
              Total publicaciones: ${publicaciones.length}
            </div>
          </div>

          ${publicaciones.length === 0 ? `
            <div style="text-align: center; padding: 40px; font-size: 14px; color: #6b7280; border: 1px dashed #d1d5db; border-radius: 6px;">
              No se encontraron publicaciones planificadas para el rango y cliente seleccionado.
            </div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Negocio / Marca</th>
                  <th style="width: 12%;">Fecha</th>
                  <th style="width: 20%;">Título / Publicación</th>
                  <th style="width: 15%;">Estado</th>
                  <th style="width: 20%;">Guión (Extracto)</th>
                  <th style="width: 10%;">Material</th>
                  <th style="width: 18%;">Notas de Producción</th>
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
            </table>
          `}

          <div class="footer">
            Sistema de Planificación de Contenido - Generado automáticamente
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
        }, 500);
        setSuccess('Se ha abierto la vista de impresión en una nueva pestaña.');
      } else {
        setError('El bloqueador de ventanas emergentes ha bloqueado la vista de impresión. Por favor, permítelo.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener publicaciones para el reporte.');
    } finally {
      setLoading(false);
    }
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
        <form onSubmit={handleImprimirReporte} className="form">
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

          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', textAlign: 'right' }}>
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
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Generar Vista de Impresión / PDF
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="info-banner">
        <span className="info-banner-icon" style={{ fontWeight: 'bold', marginRight: '6px' }}>i</span>
        <p className="info-banner-text">
          El documento PDF exportado contendrá una tabla estructurada de forma horizontal para asegurar la lectura cómoda de títulos, guiones cortos, enlaces de descarga directa de material y notas internas de producción. Es ideal para enviar por WhatsApp o correo a tus clientes para su revisión y aprobación.
        </p>
      </div>
    </div>
  );
};

export default ReportesPage;
