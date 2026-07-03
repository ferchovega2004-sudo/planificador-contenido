import prisma from './db';
import bcrypt from 'bcryptjs';

export async function inicializarDatosSemilla(): Promise<void> {
  try {
    console.log('[Seed] Verificando usuarios en la base de datos...');
    
    // Contar usuarios activos o eliminados
    const cantidadUsuarios = await prisma.usuario.count();
    
    if (cantidadUsuarios === 0) {
      console.log('[Seed] No se encontraron usuarios. Creando administrador inicial por defecto...');
      
      const contrasenaPorDefecto = 'adminpassword';
      const hashedPassword = await bcrypt.hash(contrasenaPorDefecto, 10);
      
      const admin = await prisma.usuario.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          nombre: 'Administrador Inicial',
          rol: 'ADMIN'
        }
      });
      
      console.log(`[Seed] Administrador inicial creado con éxito.`);
      console.log(`[Seed] Usuario: ${admin.username}`);
      console.log(`[Seed] Contraseña temporal: ${contrasenaPorDefecto}`);
      console.log(`[Seed] IMPORTANTE: Por seguridad, cambie esta contraseña tras el primer inicio de sesión.`);
    } else {
      console.log(`[Seed] Base de datos ya cuenta con ${cantidadUsuarios} usuarios. Omitiendo creación de administrador por defecto.`);
    }
  } catch (error) {
    console.error('[Seed] Error al inicializar datos semilla:', error);
  }
}
