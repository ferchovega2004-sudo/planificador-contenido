import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    rol: string;
    nombre: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Permitir token como query parameter para descargas o vistas HTML en pestaña nueva
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'clave_secreta_para_jsonwebtoken_planificador_contenido';
    const decoded = jwt.verify(token, secret) as { id: number; username: string; rol: string; nombre: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido o expirado.' });
    return;
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de Administrador.' });
    return;
  }
  next();
};
