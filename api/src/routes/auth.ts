import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// 1. POST /login - Inicio de sesión
router.post('/login', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
      return;
    }

    const usuario = await prisma.usuario.findFirst({
      where: { username, deletedAt: null },
    });

    if (!usuario) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'clave_secreta_para_jsonwebtoken_planificador_contenido';
    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 2. POST /register - Registro de nuevos usuarios (Solo ADMIN)
router.post('/register', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, nombre, rol } = req.body;

    if (!username || !password || !nombre || !rol) {
      res.status(400).json({ error: 'Todos los campos (username, password, nombre, rol) son obligatorios' });
      return;
    }

    if (rol !== 'ADMIN' && rol !== 'USER') {
      res.status(400).json({ error: 'El rol debe ser ADMIN o USER' });
      return;
    }

    // Verificar si el usuario ya existe (incluyendo eliminados)
    const existente = await prisma.usuario.findFirst({
      where: { username },
    });

    if (existente) {
      if (existente.deletedAt !== null) {
        // Reactivar usuario si estaba eliminado
        const hashedPassword = await bcrypt.hash(password, 10);
        const reactivado = await prisma.usuario.update({
          where: { id: existente.id },
          data: {
            password: hashedPassword,
            nombre,
            rol,
            deletedAt: null,
          },
        });
        res.status(200).json({
          message: 'Usuario reactivado correctamente',
          usuario: { id: reactivado.id, username: reactivado.username, nombre: reactivado.nombre, rol: reactivado.rol },
        });
        return;
      }
      res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        username,
        password: hashedPassword,
        nombre,
        rol,
      },
    });

    res.status(201).json({
      id: nuevoUsuario.id,
      username: nuevoUsuario.username,
      nombre: nuevoUsuario.nombre,
      rol: nuevoUsuario.rol,
    });
  } catch (error) {
    next(error);
  }
});

// 3. GET /usuarios - Listar todos los usuarios activos (Solo ADMIN)
router.get('/usuarios', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        nombre: true,
        rol: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
});

// 4. DELETE /usuarios/:id - Eliminar lógicamente un usuario (Solo ADMIN)
router.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    // Evitar que el admin se borre a sí mismo
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
      return;
    }

    const existente = await prisma.usuario.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existente) {
      res.status(404).json({ error: 'Usuario no encontrado o ya eliminado' });
      return;
    }

    await prisma.usuario.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Usuario eliminado correctamente (soft delete)' });
  } catch (error) {
    next(error);
  }
});

// 5. PUT /usuarios/password - Cambiar contraseña
router.put('/usuarios/password', authenticateToken, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { usuarioId, nuevaContrasena } = req.body;

    if (!usuarioId || !nuevaContrasena || nuevaContrasena.trim() === '') {
      res.status(400).json({ error: 'ID de usuario y nueva contraseña son obligatorios' });
      return;
    }

    const targetId = parseInt(usuarioId);
    if (isNaN(targetId)) {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }

    // Un usuario normal (USER) solo puede cambiar su propia contraseña.
    // Un ADMIN puede cambiar la contraseña de cualquiera.
    if (req.user && req.user.rol !== 'ADMIN' && req.user.id !== targetId) {
      res.status(403).json({ error: 'No tienes permiso para cambiar la contraseña de otros usuarios' });
      return;
    }

    const usuario = await prisma.usuario.findFirst({
      where: { id: targetId, deletedAt: null },
    });

    if (!usuario) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    await prisma.usuario.update({
      where: { id: targetId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
