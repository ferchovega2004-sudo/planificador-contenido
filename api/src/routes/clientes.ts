import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../db';

const router = Router();

// 1. Obtener todas las marcas (clientes) activas
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: 'asc' },
    });
    res.json(clientes);
  } catch (error) {
    next(error);
  }
});

// 2. Obtener una marca por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const cliente = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });

    if (!cliente) {
      res.status(404).json({ error: 'Marca no encontrada' });
      return;
    }

    res.json(cliente);
  } catch (error) {
    next(error);
  }
});

// 3. Crear una nueva marca (cliente)
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ error: 'El nombre de la marca es obligatorio' });
      return;
    }

    const nombreNormalizado = nombre.trim();

    // Verificar si ya existe (incluyendo eliminados)
    const existente = await prisma.cliente.findFirst({
      where: { nombre: nombreNormalizado },
    });

    if (existente) {
      if (existente.deletedAt !== null) {
        // Reactivar si estaba eliminada
        const reactivada = await prisma.cliente.update({
          where: { id: existente.id },
          data: { deletedAt: null },
        });
        res.status(200).json(reactivada);
        return;
      }
      res.status(400).json({ error: 'Ya existe una marca activa con este nombre' });
      return;
    }

    const nuevaMarca = await prisma.cliente.create({
      data: { nombre: nombreNormalizado },
    });

    res.status(201).json(nuevaMarca);
  } catch (error) {
    next(error);
  }
});

// 4. Actualizar una marca (cliente)
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      res.status(400).json({ error: 'El nombre de la marca es obligatorio' });
      return;
    }

    const nombreNormalizado = nombre.trim();

    // Verificar si la marca existe y está activa
    const existente = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existente) {
      res.status(404).json({ error: 'Marca no encontrada' });
      return;
    }

    // Si el nombre cambia, verificar que no choque con otra marca activa
    if (nombreNormalizado.toLowerCase() !== existente.nombre.toLowerCase()) {
      const choque = await prisma.cliente.findFirst({
        where: { nombre: nombreNormalizado, deletedAt: null },
      });
      if (choque) {
        res.status(400).json({ error: 'Ya existe otra marca activa con este nombre' });
        return;
      }
    }

    const marcaActualizada = await prisma.cliente.update({
      where: { id },
      data: { nombre: nombreNormalizado },
    });

    res.json(marcaActualizada);
  } catch (error) {
    next(error);
  }
});

// 5. Eliminar lógicamente una marca (Soft Delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const existente = await prisma.cliente.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existente) {
      res.status(404).json({ error: 'Marca no encontrada o ya eliminada' });
      return;
    }

    // Soft delete
    await prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Marca eliminada correctamente (soft delete)' });
  } catch (error) {
    next(error);
  }
});

export default router;
