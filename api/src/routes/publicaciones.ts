import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// Todos los endpoints de publicaciones requieren token
router.use(authenticateToken);

// 1. GET / - Obtener publicaciones con filtros de fecha y cliente
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

    const publicaciones = await prisma.publicacion.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [
        { fechaProgramada: 'asc' },
        { id: 'asc' }
      ],
    });

    res.json(publicaciones);
  } catch (error) {
    next(error);
  }
});

// 2. GET /:id - Detalle de una publicación
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const publicacion = await prisma.publicacion.findFirst({
      where: { id, deletedAt: null },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    if (!publicacion) {
      res.status(404).json({ error: 'Publicación no encontrada' });
      return;
    }

    res.json(publicacion);
  } catch (error) {
    next(error);
  }
});

// 3. POST / - Crear una nueva publicación
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clienteId, titulo, fechaProgramada, estado } = req.body;

    if (!clienteId || !titulo || !fechaProgramada) {
      res.status(400).json({ error: 'Marca (clienteId), título y fecha programada son obligatorios' });
      return;
    }

    const cid = parseInt(clienteId);
    if (isNaN(cid)) {
      res.status(400).json({ error: 'ID de marca inválido' });
      return;
    }

    // Verificar que el cliente existe y está activo
    const cliente = await prisma.cliente.findFirst({
      where: { id: cid, deletedAt: null },
    });

    if (!cliente) {
      res.status(404).json({ error: 'La marca seleccionada no existe o fue eliminada' });
      return;
    }

    // Validar estado válido
    const estadosValidos = ['POR_GRABAR', 'EDICION', 'TERMINADO', 'PUBLICADO'];
    const estadoFinal = estado && estadosValidos.includes(estado) ? estado : 'POR_GRABAR';

    const nuevaPublicacion = await prisma.publicacion.create({
      data: {
        clienteId: cid,
        titulo: titulo.trim(),
        fechaProgramada: new Date(fechaProgramada),
        estado: estadoFinal,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    res.status(201).json(nuevaPublicacion);
  } catch (error) {
    next(error);
  }
});

// 4. PUT /:id - Actualizar campos de una publicación (Drag & Drop o Modal de Producción)
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const existente = await prisma.publicacion.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existente) {
      res.status(404).json({ error: 'Publicación no encontrada' });
      return;
    }

    const { titulo, fechaProgramada, estado, guion, driveUrl, notas } = req.body;

    const dataToUpdate: any = {};

    if (titulo !== undefined) dataToUpdate.titulo = titulo.trim();
    if (fechaProgramada !== undefined) dataToUpdate.fechaProgramada = new Date(fechaProgramada);
    
    if (estado !== undefined) {
      const estadosValidos = ['POR_GRABAR', 'EDICION', 'TERMINADO', 'PUBLICADO'];
      if (!estadosValidos.includes(estado)) {
        res.status(400).json({ error: 'Estado de publicación inválido' });
        return;
      }
      dataToUpdate.estado = estado;
    }

    if (guion !== undefined) dataToUpdate.guion = guion;
    if (driveUrl !== undefined) dataToUpdate.driveUrl = driveUrl;
    if (notas !== undefined) dataToUpdate.notas = notas;

    const actualizada = await prisma.publicacion.update({
      where: { id },
      data: dataToUpdate,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    res.json(actualizada);
  } catch (error) {
    next(error);
  }
});

// 5. DELETE /:id - Eliminar lógicamente una publicación
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const existente = await prisma.publicacion.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existente) {
      res.status(404).json({ error: 'Publicación no encontrada o ya eliminada' });
      return;
    }

    await prisma.publicacion.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Publicación eliminada correctamente (soft delete)' });
  } catch (error) {
    next(error);
  }
});

export default router;
