import React, { useState, useEffect } from 'react';
import { api, Cliente, Publicacion } from '../services/api';

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

  const [previewData, setPreviewData] = useState<Publicacion[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [columnasVisibles, setColumnasVisibles] = useState({
    marca: true,
    fecha: true,
    plataforma: true,
    titulo: true,
    estado: true,
    responsable: true,
    guion: true,
    material: true,
    publicacionFinal: true,
    notas: true
  });

  // Calcular las fechas por defecto al cargar o cambiar el tipo de rango
  useEffect(() => {
    const hoy = new Date();
    
    if (rangoTipo === 'semanal') {
      const diaSemana = hoy.getDay();
      const diff = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
      const lunes = new Date(hoy.setDate(diff));
      
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);
      
      setFechaInicio(lunes.toISOString().split('T')[0]);
      setFechaFin(domingo.toISOString().split('T')[0]);
    } else {
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

  // Cargar vista previa cuando cambien los filtros
  useEffect(() => {
    const cargarPreview = async () => {
      if (!fechaInicio || !fechaFin) return;
      try {
        setLoadingPreview(true);
        const filtros: any = {
          fechaInicio: `${fechaInicio}T00:00:00.000Z`,
          fechaFin: `${fechaFin}T23:59:59.999Z`
        };
        if (clienteSeleccionado !== 'TODOS') {
          filtros.clienteId = Number(clienteSeleccionado);
        }
        const data = await api.getPublicaciones(filtros);
        setPreviewData(data);
      } catch (err) {
        console.error('Error al cargar vista previa:', err);
      } finally {
        setLoadingPreview(false);
      }
    };
    
    cargarPreview();
  }, [clienteSeleccionado, fechaInicio, fechaFin]);

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

      // Obtener datos de Supabase
      const publicaciones = await api.getPublicaciones(filtros);

      let clienteNombre = 'Todos los clientes';
      if (clienteSeleccionado !== 'TODOS' && publicaciones.length > 0) {
        clienteNombre = publicaciones[0].cliente.nombre;
      } else if (clienteSeleccionado !== 'TODOS') {
        const marca = clientes.find(c => c.id === clienteSeleccionado);
        if (marca) clienteNombre = marca.nombre;
      }

      const rangoTexto = `${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}`;

      const mapeoEstados: any = {
        'POR_GRABAR': 'Por grabar',
        'EDICION': 'En proceso de edición',
        'TERMINADO': 'Terminado',
        'PUBLICADO': 'Publicado'
      };
      const thMarca = columnasVisibles.marca ? `<th style="width: 10%;">Marca</th>` : '';
      const thFecha = columnasVisibles.fecha ? `<th style="width: 12%;">Fecha / Hora</th>` : '';
      const thPlataforma = columnasVisibles.plataforma ? `<th style="width: 10%;">Plataforma</th>` : '';
      const thTitulo = columnasVisibles.titulo ? `<th style="width: 15%;">Título</th>` : '';
      const thEstado = columnasVisibles.estado ? `<th style="width: 10%;">Estado</th>` : '';
      const thResponsable = columnasVisibles.responsable ? `<th style="width: 12%;">Responsable</th>` : '';
      const thGuion = columnasVisibles.guion ? `<th style="width: 13%;">Guión (Extracto)</th>` : '';
      const thMaterial = columnasVisibles.material ? `<th style="width: 8%;">Drive</th>` : '';
      const thPubFinal = columnasVisibles.publicacionFinal ? `<th style="width: 8%;">Enlace Final</th>` : '';
      const thNotas = columnasVisibles.notas ? `<th style="width: 10%;">Notas</th>` : '';

      const filasHTML = publicaciones.map((pub: any) => {
        const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }) + (pub.horaPublicacion ? ` @ ${pub.horaPublicacion}` : '');

        const tituloSafe = pub.titulo.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const estadoTexto = mapeoEstados[pub.estado] || pub.estado;
        const guionSafe = pub.guion ? pub.guion.replace(/<[^>]*>/g, ' ').substring(0, 100) + (pub.guion.length > 100 ? '...' : '') : 'Sin guion';
        const driveSafe = pub.driveUrl ? `<a href="${pub.driveUrl}" target="_blank">Ver material</a>` : 'Sin link';
        const pubFinalSafe = pub.miniaturaUrl ? `<a href="${pub.miniaturaUrl}" target="_blank">Ver enlace</a>` : 'Sin enlace';
        const notasSafe = pub.notas ? pub.notas.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100) + (pub.notas.length > 100 ? '...' : '') : 'Sin notas';
        const responsableSafe = pub.responsable?.nombre || 'Sin asignar';
        const plataformaSafe = pub.plataforma || 'OTRO';

        const tdMarca = columnasVisibles.marca ? `<td><strong>${pub.cliente.nombre}</strong></td>` : '';
        const tdFecha = columnasVisibles.fecha ? `<td>${fechaFormateada}</td>` : '';
        const tdPlataforma = columnasVisibles.plataforma ? `<td><strong>${plataformaSafe}</strong></td>` : '';
        const tdTitulo = columnasVisibles.titulo ? `<td>${tituloSafe}</td>` : '';
        const tdEstado = columnasVisibles.estado ? `<td><span class="badge badge-${pub.estado.toLowerCase()}">${estadoTexto}</span></td>` : '';
        const tdResponsable = columnasVisibles.responsable ? `<td>${responsableSafe}</td>` : '';
        const tdGuion = columnasVisibles.guion ? `<td class="text-muted">${guionSafe}</td>` : '';
        const tdMaterial = columnasVisibles.material ? `<td>${driveSafe}</td>` : '';
        const tdPubFinal = columnasVisibles.publicacionFinal ? `<td>${pubFinalSafe}</td>` : '';
        const tdNotas = columnasVisibles.notas ? `<td class="text-muted">${notasSafe}</td>` : '';

        return `
          <tr>
            ${tdMarca}
            ${tdFecha}
            ${tdPlataforma}
            ${tdTitulo}
            ${tdEstado}
            ${tdResponsable}
            ${tdGuion}
            ${tdMaterial}
            ${tdNotas}
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
              margin: 0.3in;
            }
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 0;
              font-size: 10px;
              background-color: #fff;
            }
            .header {
              margin-bottom: 15px;
              border-bottom: 2px solid #6366f1;
              padding-bottom: 10px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 18px;
              color: #1e1b4b;
            }
            .header .subtitle {
              margin: 0;
              color: #4b5563;
              font-size: 11px;
            }
            .header .meta {
              text-align: right;
              font-size: 9px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 6px 8px;
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
              padding: 2px 5px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .badge-por_grabar { background-color: #fef3c7; color: #d97706; }
            .badge-edicion { background-color: #dbeafe; color: #2563eb; }
            .badge-terminado { background-color: #d1fae5; color: #059669; }
            .badge-publicado { background-color: #f3e8ff; color: #7c3aed; }
            .text-muted { color: #6b7280; }
            a { color: #6366f1; text-decoration: none; font-weight: 500; }
            .footer {
              margin-top: 25px;
              text-align: center;
              font-size: 8px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
              padding-top: 8px;
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
            <div style="text-align: center; padding: 40px; font-size: 13px; color: #6b7280; border: 1px dashed #d1d5db; border-radius: 6px;">
              No se encontraron publicaciones planificadas para el rango y cliente seleccionado.
            </div>
          ` : `
            <table>
              <thead>
                <tr>
                  ${thMarca}
                  ${thFecha}
                  ${thPlataforma}
                  ${thTitulo}
                  ${thEstado}
                  ${thResponsable}
                  ${thGuion}
                  ${thMaterial}
                  ${thPubFinal}
                  ${thNotas}
                </tr>
              </thead>
              <tbody>
                ${filasHTML}
              </tbody>
            </table>
          `}

          <div class="footer">
            Gara Digital Planificador - Reporte Oficial de Producción
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

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'stretch', width: '100%', marginTop: '20px' }}>
        {/* Panel Izquierda: Filtros */}
        <div className="card" style={{ flex: '1 1 320px', maxWidth: '380px' }}>
          <h2 className="card-title" style={{ fontSize: '15px', marginBottom: '16px' }}>Configuración de Reporte</h2>
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
                  style={{ width: '100%' }}
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

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Período de Planificación</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="radio"
                    name="rangoTipo"
                    checked={rangoTipo === 'semanal'}
                    onChange={() => setRangoTipo('semanal')}
                    disabled={loading}
                    style={{ accentColor: 'var(--neon-pink)' }}
                  />
                  Semanal
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input
                    type="radio"
                    name="rangoTipo"
                    checked={rangoTipo === 'mensual'}
                    onChange={() => setRangoTipo('mensual')}
                    disabled={loading}
                    style={{ accentColor: 'var(--neon-pink)' }}
                  />
                  Mensual
                </label>
              </div>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Fecha de Inicio</label>
                <input
                  type="date"
                  className="form-input"
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
                  className="form-input"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Configurar Columnas Visibles */}
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ marginBottom: '8px', display: 'block' }}>Columnas Visibles en PDF</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)'
              }}>
                {Object.keys(columnasVisibles).map((colKey) => {
                  const labelMap: Record<string, string> = {
                    marca: 'Marca',
                    fecha: 'Fecha/Hora',
                    plataforma: 'Plataforma',
                    titulo: 'Título',
                    estado: 'Estado',
                    responsable: 'Responsable',
                    guion: 'Guión',
                    material: 'Material / Drive',
                    publicacionFinal: 'Publicación Final',
                    notas: 'Notas'
                  };
                  return (
                    <label 
                      key={colKey} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontWeight: 'normal', 
                        fontSize: '11px', 
                        cursor: 'pointer', 
                        color: 'var(--text-secondary)' 
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={columnasVisibles[colKey as keyof typeof columnasVisibles]}
                        onChange={(e) => {
                          setColumnasVisibles((prev) => ({
                            ...prev,
                            [colKey]: e.target.checked
                          }));
                        }}
                        style={{ accentColor: 'var(--neon-pink)', width: '13px', height: '13px' }}
                      />
                      {labelMap[colKey]}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', textAlign: 'right' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                    Generando Documento...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Imprimir / Exportar PDF
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Panel Derecha: Vista Previa que simula hoja horizontal */}
        <div 
          className="card" 
          style={{ 
            flex: '2 2 500px', 
            display: 'flex', 
            flexDirection: 'column', 
            background: 'var(--surface-hover)', 
            borderRadius: '16px', 
            padding: '20px', 
            border: '1px solid rgba(192, 132, 252, 0.1)', 
            overflow: 'auto',
            maxHeight: '75vh'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '1px' }}>
              Vista Previa de Impresión
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Simulación de hoja carta horizontal (Landscape)
            </span>
          </div>

          {loadingPreview ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px', color: 'var(--text-muted)' }}>
              <span className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'var(--neon-cyan)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}></span>
              Cargando vista previa en tiempo real...
            </div>
          ) : previewData.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '300px', border: '2px dashed rgba(255,255,255,0.06)', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '24px', marginBottom: '10px' }}>📄</span>
              <strong style={{ color: '#ffffff' }}>No hay publicaciones para el rango seleccionado</strong>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Prueba seleccionando otras fechas o marcas.</p>
            </div>
          ) : (
            <div 
              style={{
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                color: '#1f2937',
                borderRadius: '4px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                padding: '24px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                boxSizing: 'border-box',
                aspectRatio: '1.294',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
            >
              {/* Encabezado de la hoja de reporte */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #6366f1', paddingBottom: '8px', marginBottom: '14px' }}>
                <div>
                  <h1 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1e1b4b', fontWeight: '800', letterSpacing: '-0.3px' }}>
                    Reporte de Publicaciones
                  </h1>
                  <p style={{ margin: 0, fontSize: '10px', color: '#4b5563' }}>
                    <strong>Cliente:</strong> {clienteSeleccionado === 'TODOS' ? 'Todos los clientes' : (clientes.find(c => c.id === clienteSeleccionado)?.nombre || '')} | <strong>Rango:</strong> {new Date(fechaInicio || Date.now()).toLocaleDateString('es-ES')} al {new Date(fechaFin || Date.now()).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#6b7280', lineHeight: '1.3' }}>
                  Generado: {new Date().toLocaleDateString('es-ES')} a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}<br />
                  Total publicaciones: <strong>{previewData.length}</strong>
                </div>
              </div>

              {/* Tabla de contenido */}
              <div style={{ flex: 1, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1.5px solid #d1d5db' }}>
                      {columnasVisibles.marca && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Marca</th>}
                      {columnasVisibles.fecha && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Fecha / Hora</th>}
                      {columnasVisibles.plataforma && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Plataforma</th>}
                      {columnasVisibles.titulo && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Título / Post</th>}
                      {columnasVisibles.estado && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Estado</th>}
                      {columnasVisibles.responsable && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Responsable</th>}
                      {columnasVisibles.guion && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Guión</th>}
                      {columnasVisibles.material && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Material / Drive</th>}
                      {columnasVisibles.publicacionFinal && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Enlace Final</th>}
                      {columnasVisibles.notas && <th style={{ padding: '6px 8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#1f2937' }}>Notas</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((pub) => {
                      const mappedEstados: Record<string, { label: string; bg: string; text: string }> = {
                        POR_GRABAR: { label: 'Por grabar', bg: '#fef3c7', text: '#d97706' },
                        EDICION: { label: 'En proceso', bg: '#dbeafe', text: '#2563eb' },
                        TERMINADO: { label: 'Terminado', bg: '#d1fae5', text: '#059669' },
                        PUBLICADO: { label: 'Publicado', bg: '#f3e8ff', text: '#7c3aed' }
                      };
                      const est = mappedEstados[pub.estado] || { label: pub.estado, bg: '#f3f4f6', text: '#374151' };
                      const guionTexto = pub.guion ? pub.guion.replace(/<[^>]*>/g, ' ').substring(0, 80) + (pub.guion.length > 80 ? '...' : '') : 'Sin guion';
                      
                      return (
                        <tr key={pub.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
                          {columnasVisibles.marca && <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', fontWeight: '700', color: '#111827' }}>{pub.cliente.nombre}</td>}
                          {columnasVisibles.fecha && (
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', color: '#374151' }}>
                              {new Date(pub.fechaProgramada).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {pub.horaPublicacion ? `@ ${pub.horaPublicacion}` : ''}
                            </td>
                          )}
                          {columnasVisibles.plataforma && <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#4b5563' }}>{pub.plataforma || 'OTRO'}</td>}
                          {columnasVisibles.titulo && <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '500' }}>{pub.titulo}</td>}
                          {columnasVisibles.estado && (
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>
                              <span style={{ display: 'inline-block', padding: '1px 4px', borderRadius: '3px', fontSize: '7.5px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: est.bg, color: est.text }}>
                                {est.label}
                              </span>
                            </td>
                          )}
                          {columnasVisibles.responsable && (
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', color: '#4b5563' }}>
                              {pub.responsable?.nombre || 'Sin asignar'}
                            </td>
                          )}
                          {columnasVisibles.guion && <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '8px' }}>{guionTexto}</td>}
                          {columnasVisibles.material && (
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>
                              {pub.driveUrl ? <a href={pub.driveUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: '8px' }}>Ver material</a> : <span style={{ color: '#9ca3af', fontSize: '8px' }}>Sin link</span>}
                            </td>
                          )}
                          {columnasVisibles.publicacionFinal && (
                            <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb' }}>
                              {pub.miniaturaUrl ? <a href={pub.miniaturaUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontSize: '8px' }}>Ver enlace</a> : <span style={{ color: '#9ca3af', fontSize: '8px' }}>Sin link</span>}
                            </td>
                          )}
                          {columnasVisibles.notas && <td style={{ padding: '5px 8px', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '8px' }}>{pub.notas ? pub.notas.substring(0, 80) + (pub.notas.length > 80 ? '...' : '') : 'Sin notas'}</td>}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pie de la hoja */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid #e5e7eb', paddingTop: '6px', fontSize: '8px', color: '#9ca3af' }}>
                <span>Gara Digital Planificador - Documento Oficial de Trabajo</span>
                <span>Página 1 de 1</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="info-banner" style={{ marginTop: '24px' }}>
        <span className="info-banner-icon" style={{ fontWeight: 'bold', marginRight: '6px' }}>i</span>
        <p className="info-banner-text">
          El documento PDF exportado contendrá una tabla estructurada de forma horizontal para asegurar la lectura cómoda de títulos, plataformas, guiones cortos, enlaces de descarga directa de material y notas internas de producción. Es ideal para enviar por WhatsApp o correo a tus clientes para su revisión y aprobación.
        </p>
      </div>
    </div>
  );
};

export default ReportesPage;
