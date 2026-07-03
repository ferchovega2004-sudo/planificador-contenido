import prisma from './db';

/**
 * Realiza la purga física de registros antiguos y eliminados lógicamente
 * para no exceder los límites del plan gratuito de la base de datos de Supabase.
 */
export async function ejecutarLimpiezaHistorial(): Promise<void> {
  const limiteDias = 75; // 2 meses y medio
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - limiteDias);

  console.log(`[Limpieza] Iniciando mantenimiento de base de datos (Límite: ${fechaLimite.toISOString()})...`);

  try {
    // 1. Eliminar permanentemente Publicaciones que fueron marcadas como eliminadas (Soft Delete) hace más de 75 días
    const publicacionesEliminadas = await prisma.publicacion.deleteMany({
      where: {
        deletedAt: {
          lt: fechaLimite
        }
      }
    });

    // 2. Eliminar permanentemente Clientes (Marcas) que fueron marcados como eliminados (Soft Delete) hace más de 75 días
    const clientesEliminados = await prisma.cliente.deleteMany({
      where: {
        deletedAt: {
          lt: fechaLimite
        }
      }
    });

    console.log(
      `[Limpieza] Mantenimiento completado con éxito: ` +
      `${publicacionesEliminadas.count} publicaciones eliminadas de papelera, ` +
      `${clientesEliminados.count} marcas/clientes eliminados de papelera.`
    );
  } catch (error) {
    console.error('[Limpieza] Error al ejecutar la limpieza automática de la base de datos:', error);
  }
}

/**
 * Configura la tarea programada para ejecutarse inmediatamente al arrancar la API
 * y posteriormente cada 24 horas.
 */
export function inicializarCronLimpieza(): void {
  // Ejecutar limpieza al iniciar el servidor
  ejecutarLimpiezaHistorial();

  // Programar ejecución cada 24 horas
  const INTERVALO_24_HORAS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    ejecutarLimpiezaHistorial();
  }, INTERVALO_24_HORAS);

  console.log('[Limpieza] Servicio de autolimpieza diario inicializado correctamente.');
}
