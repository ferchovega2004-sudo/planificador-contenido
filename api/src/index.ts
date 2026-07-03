import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './routes/auth';
import clientesRouter from './routes/clientes';
import publicacionesRouter from './routes/publicaciones';
import reportesRouter from './routes/reportes';
import { inicializarCronLimpieza, ejecutarLimpiezaHistorial } from './cronLimpieza';
import { inicializarDatosSemilla } from './seed';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend compilado
const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

// Registrar Rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/publicaciones', publicacionesRouter);
app.use('/api/reportes', reportesRouter);

// Endpoint de prueba de salud de la API
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor del Planificador de Contenido ejecutándose correctamente',
    timestamp: new Date()
  });
});

// Ruta de autolimpieza automática (Vercel Cron)
app.get('/api/cron/limpieza', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  try {
    await ejecutarLimpiezaHistorial();
    res.json({ success: true, message: 'Mantenimiento de base de datos ejecutado con éxito' });
  } catch (error: any) {
    console.error('[Cron] Error en autolimpieza:', error);
    res.status(500).json({ error: error.message || 'Error en autolimpieza' });
  }
});

// Comodín para SPA: cualquier ruta GET que no sea API sirve el index.html
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

// Middleware global de manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Error de API]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Arrancar servidor solo si no estamos en Vercel
if (!process.env.VERCEL) {
  app.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`[Servidor] API REST escuchando en todas las interfaces en el puerto ${PORT}`);
    
    // Ejecutar el script seed para crear el administrador por defecto si es necesario
    await inicializarDatosSemilla();
    
    // Iniciar la tarea en segundo plano de limpieza
    inicializarCronLimpieza();
  });
}

export default app;
