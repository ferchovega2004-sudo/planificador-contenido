import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// Helper para encontrar de manera dinámica el ejecutable de un navegador compatible (Edge, Chrome, Brave, etc.)
function getBrowserPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  if (process.platform !== 'win32') {
    const linuxPaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    for (const p of linuxPaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    return undefined; 
  }

  const userProfile = process.env.USERPROFILE || '';
  const localAppData = process.env.LOCALAPPDATA || path.join(userProfile, 'AppData', 'Local');
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const commonWindowsPaths = [
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFilesX86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    path.join(programFilesX86, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')
  ];

  for (const p of commonWindowsPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return undefined;
}

// GET /api/reportes/pdf
router.get('/pdf', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clienteId, fechaInicio, fechaFin } = req.query;

    const whereClause: any = { deletedAt: null };

    if (clienteId) {
      const cid = parseInt(clienteId as string);
      if (!isNaN(cid)) {
        whereClause.clienteId = cid;
      }
    }

    if (fechaInicio || fechaFin) {
      whereClause.fechaProgramada = {};
      if (fechaInicio) {
        whereClause.fechaProgramada.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        whereClause.fechaProgramada.lte = new Date(fechaFin as string);
      }
    }

    // Obtener publicaciones filtradas
    const publicaciones = await prisma.publicacion.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: [
        { fechaProgramada: 'asc' },
        { id: 'asc' }
      ],
    });

    // Formatear fechas para mostrar en el reporte
    const rangoTexto = `${fechaInicio ? new Date(fechaInicio as string).toLocaleDateString('es-ES') : 'Inicio'} - ${fechaFin ? new Date(fechaFin as string).toLocaleDateString('es-ES') : 'Fin'}`;

    // Obtener el nombre del cliente si se filtró por uno específico
    let clienteNombre = 'Todos los clientes';
    if (clienteId && publicaciones.length > 0) {
      clienteNombre = publicaciones[0].cliente.nombre;
    }

    // Mapeo de estados en español con sus emojis
    const mapeoEstados: any = {
      'POR_GRABAR': 'Por grabar 🎥',
      'EDICION': 'En proceso de edición ✂️',
      'TERMINADO': 'Terminado ✅',
      'PUBLICADO': 'Publicado 🚀'
    };

    // Construir tabla HTML
    const filasHTML = publicaciones.map((pub: any) => {
      const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });

      // Sanitizar textos para evitar inyección en HTML
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

    // Configuración de Puppeteer
    const executablePath = getBrowserPath();
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    const pdfBuffer = await page.pdf({
      format: 'letter',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0.4in',
        right: '0.4in',
        bottom: '0.4in',
        left: '0.4in',
      },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_planificacion_${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/reportes/html (Alternativa robusta para Vercel)
router.get('/html', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clienteId, fechaInicio, fechaFin } = req.query;

    const whereClause: any = { deletedAt: null };

    if (clienteId) {
      const cid = parseInt(clienteId as string);
      if (!isNaN(cid)) {
        whereClause.clienteId = cid;
      }
    }

    if (fechaInicio || fechaFin) {
      whereClause.fechaProgramada = {};
      if (fechaInicio) {
        whereClause.fechaProgramada.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        whereClause.fechaProgramada.lte = new Date(fechaFin as string);
      }
    }

    // Obtener publicaciones filtradas
    const publicaciones = await prisma.publicacion.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: [
        { fechaProgramada: 'asc' },
        { id: 'asc' }
      ],
    });

    // Formatear fechas para mostrar en el reporte
    const rangoTexto = `${fechaInicio ? new Date(fechaInicio as string).toLocaleDateString('es-ES') : 'Inicio'} - ${fechaFin ? new Date(fechaFin as string).toLocaleDateString('es-ES') : 'Fin'}`;

    // Obtener el nombre del cliente si se filtró por uno específico
    let clienteNombre = 'Todos los clientes';
    if (clienteId && publicaciones.length > 0) {
      clienteNombre = publicaciones[0].cliente.nombre;
    }

    // Mapeo de estados en español con sus emojis
    const mapeoEstados: any = {
      'POR_GRABAR': 'Por grabar 🎥',
      'EDICION': 'En proceso de edición ✂️',
      'TERMINADO': 'Terminado ✅',
      'PUBLICADO': 'Publicado 🚀'
    };

    // Construir tabla HTML
    const filasHTML = publicaciones.map((pub: any) => {
      const fechaFormateada = new Date(pub.fechaProgramada).toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      });

      // Sanitizar textos para evitar inyección en HTML
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
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    next(error);
  }
});

export default router;
