import { supabase, crearClienteRegistro } from './supabaseClient';

export interface Usuario {
  id: number | string;
  username: string;
  nombre: string;
  rol: 'ADMIN' | 'USER' | 'EDITOR' | 'ACOMPAÑANTE';
  activo?: boolean;
  createdAt?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  contenido?: string;
  createdAt?: string;
}

export interface Publicacion {
  id: number;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
  };
  titulo: string;
  fechaProgramada: string;
  estado: 'POR_GRABAR' | 'EDICION' | 'TERMINADO' | 'PUBLICADO';
  guion: string | null;
  driveUrl: string | null;
  notas: string | null;
  plataforma?: string | null;
  responsableId?: string | null;
  responsable?: Usuario | null;
  horaPublicacion?: string | null;
  miniaturaUrl?: string | null;
  createdAt?: string;
}

export const api = {
  // 1. Autenticación & Usuarios
  async login(username: string, password: string): Promise<{ token: string; usuario: Usuario }> {
    const cleanUsername = username.toLowerCase().trim();
    const emailTransformado = cleanUsername.includes('@') 
      ? cleanUsername.replace('@', '_at_') + '@planificador.com'
      : `${cleanUsername}@planificador.com`;
    
    let authResult = await supabase.auth.signInWithPassword({
      email: emailTransformado,
      password,
    });

    // Si falla y el username ingresado contiene un '@', reintentar con el correo original tal cual (fallback para usuarios antiguos)
    if (authResult.error && cleanUsername.includes('@')) {
      const fallbackResult = await supabase.auth.signInWithPassword({
        email: cleanUsername,
        password,
      });
      if (!fallbackResult.error) {
        authResult = fallbackResult;
      }
    }

    if (authResult.error) {
      throw new Error(authResult.error.message || 'Error al iniciar sesión');
    }

    const { data } = authResult;

    // Buscar el perfil extendido en la tabla pública usuarios
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .is('deletedAt', null)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Error al obtener perfil extendido:', profileError.message);
    }

    const usuario: Usuario = {
      id: data.user.id,
      username: profile?.username || data.user.email || username,
      nombre: profile?.nombre || 'Miembro del Equipo',
      rol: (profile?.rol as any) || 'USER',
      activo: profile?.activo === true,
    };

    localStorage.setItem('token', data.session?.access_token || '');
    localStorage.setItem('usuario', JSON.stringify(usuario));

    return {
      token: data.session?.access_token || '',
      usuario,
    };
  },

  logout(): void {
    supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  getUsuarioActual(): Usuario | null {
    const usr = localStorage.getItem('usuario');
    if (!usr) return null;
    try {
      return JSON.parse(usr);
    } catch {
      return null;
    }
  },

  async registrarUsuario(data: Omit<Usuario, 'id'> & { password?: string }): Promise<Usuario> {
    const cleanUsername = data.username.toLowerCase().trim();
    const email = cleanUsername.includes('@')
      ? cleanUsername.replace('@', '_at_') + '@planificador.com'
      : `${cleanUsername}@planificador.com`;
    const password = data.password || 'Planificador123!';
    
    // Usar cliente sin persistencia de sesión para evitar que el Administrador sea deslogueado
    const registroClient = crearClienteRegistro();
    
    // Crear el usuario en Supabase Auth
    const { data: signUpData, error } = await registroClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: data.nombre,
          rol: data.rol,
          username: data.username, // Guardar el nombre de usuario original
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Error al registrar usuario en Supabase Auth');
    }

    if (!signUpData.user) {
      throw new Error('No se pudo crear el usuario.');
    }

    return {
      id: signUpData.user.id,
      username: data.username,
      nombre: data.nombre,
      rol: data.rol,
    };
  },

  async getUsuarios(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .is('deletedAt', null);

    if (error) {
      throw new Error(error.message || 'Error al obtener usuarios');
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      nombre: u.nombre,
      rol: u.rol,
      activo: u.activo === true,
      createdAt: u.createdAt,
    }));
  },

  async deleteUsuario(id: number | string): Promise<void> {
    // Soft delete actualizando deletedAt en la tabla pública
    const { error } = await supabase
      .from('usuarios')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al eliminar usuario');
    }
  },

  async getUsuariosEliminados(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .not('deletedAt', 'is', null)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Error al obtener usuarios eliminados');
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      username: u.username,
      nombre: u.nombre,
      rol: u.rol,
      activo: u.activo === true,
      createdAt: u.createdAt,
    }));
  },

  async restaurarUsuario(id: number | string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ deletedAt: null })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al restaurar usuario');
    }
  },

  async cambiarPassword(usuarioId: number | string, nuevaContrasena: string): Promise<void> {
    const currentUsr = this.getUsuarioActual();
    if (currentUsr && currentUsr.id === usuarioId) {
      // El usuario actual puede cambiar su propia contraseña en Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: nuevaContrasena,
      });
      if (error) {
        throw new Error(error.message || 'Error al cambiar contraseña');
      }
    } else {
      throw new Error(
        'Por seguridad, solo el usuario autenticado puede cambiar su propia contraseña. Para restablecer contraseñas de otros usuarios, hágalo desde el panel de control de Supabase.'
      );
    }
  },

  // 2. Clientes (Marcas) CRUD
  async getClientes(): Promise<Cliente[]> {
    const usr = this.getUsuarioActual();
    let query = supabase
      .from('clientes')
      .select('*')
      .is('deletedAt', null);

    if (usr && usr.rol !== 'ADMIN') {
      const marcasPermitidas = await this.getMarcasPermitidasPorUsuario(usr.id);
      if (marcasPermitidas.length === 0) {
        return [];
      }
      query = query.in('id', marcasPermitidas);
    }

    const { data, error } = await query.order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Error al obtener marcas');
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      contenido: c.contenido,
      createdAt: c.createdAt,
    }));
  },

  async createCliente(nombre: string, contenido?: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nombre, contenido }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al registrar marca');
    }

    return {
      id: data.id,
      nombre: data.nombre,
      contenido: data.contenido,
      createdAt: data.createdAt,
    };
  },

  async updateCliente(id: number, nombre: string, contenido?: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ nombre, contenido, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al actualizar marca');
    }

    return {
      id: data.id,
      nombre: data.nombre,
      contenido: data.contenido,
      createdAt: data.createdAt,
    };
  },

  async deleteCliente(id: number): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al eliminar marca');
    }
  },

  async getClientesEliminados(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .not('deletedAt', 'is', null)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Error al obtener marcas eliminadas');
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      contenido: c.contenido,
      createdAt: c.createdAt,
    }));
  },

  async restaurarCliente(id: number): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({ deletedAt: null })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al restaurar marca');
    }
  },

  // 3. Publicaciones (Tareas & Calendario & Kanban)
  async getPublicaciones(filtros?: {
    clienteId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Publicacion[]> {
    const usr = this.getUsuarioActual();
    let query = supabase
      .from('publicaciones')
      .select('*, cliente:clientes(id, nombre), responsable:usuarios(id, username, nombre, rol)')
      .is('deletedAt', null);

    if (usr && usr.rol !== 'ADMIN') {
      const marcasPermitidas = await this.getMarcasPermitidasPorUsuario(usr.id);
      if (marcasPermitidas.length === 0) {
        return [];
      }
      query = query.in('clienteId', marcasPermitidas);
    }

    if (filtros) {
      if (filtros.clienteId) {
        query = query.eq('clienteId', filtros.clienteId);
      }
      if (filtros.fechaInicio) {
        query = query.gte('fechaProgramada', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fechaProgramada', filtros.fechaFin);
      }
    }

    const { data, error } = await query.order('fechaProgramada', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Error al obtener publicaciones');
    }

    return (data || []).map((p: any) => ({
      id: p.id,
      clienteId: p.clienteId,
      cliente: p.cliente ? {
        id: p.cliente.id,
        nombre: p.cliente.nombre,
      } : { id: 0, nombre: 'Marca Desconocida' },
      titulo: p.titulo,
      fechaProgramada: p.fechaProgramada,
      estado: p.estado,
      guion: p.guion,
      driveUrl: p.driveUrl,
      notas: p.notas,
      plataforma: p.plataforma,
      responsableId: p.responsableId,
      responsable: p.responsable ? {
        id: p.responsable.id,
        username: p.responsable.username,
        nombre: p.responsable.nombre,
        rol: p.responsable.rol
      } : null,
      horaPublicacion: p.horaPublicacion,
      miniaturaUrl: p.miniaturaUrl,
      createdAt: p.createdAt,
    }));
  },

  async createPublicacion(data: {
    clienteId: number;
    titulo: string;
    fechaProgramada: string;
    estado?: string;
    guion?: string;
    driveUrl?: string;
    notas?: string;
    plataforma?: string | null;
    responsableId?: string | null;
    horaPublicacion?: string | null;
    miniaturaUrl?: string | null;
  }): Promise<Publicacion> {
    const { data: resData, error } = await supabase
      .from('publicaciones')
      .insert([data])
      .select('*, cliente:clientes(id, nombre), responsable:usuarios(id, username, nombre, rol)')
      .single();

    if (error) {
      throw new Error(error.message || 'Error al crear publicación');
    }

    return {
      id: resData.id,
      clienteId: resData.clienteId,
      cliente: resData.cliente ? {
        id: resData.cliente.id,
        nombre: resData.cliente.nombre,
      } : { id: 0, nombre: 'Marca Desconocida' },
      titulo: resData.titulo,
      fechaProgramada: resData.fechaProgramada,
      estado: resData.estado,
      guion: resData.guion,
      driveUrl: resData.driveUrl,
      notas: resData.notas,
      plataforma: resData.plataforma,
      responsableId: resData.responsableId,
      responsable: resData.responsable ? {
        id: resData.responsable.id,
        username: resData.responsable.username,
        nombre: resData.responsable.nombre,
        rol: resData.responsable.rol
      } : null,
      horaPublicacion: resData.horaPublicacion,
      miniaturaUrl: resData.miniaturaUrl,
      createdAt: resData.createdAt,
    };
  },

  async updatePublicacion(
    id: number,
    data: Partial<Omit<Publicacion, 'id' | 'cliente' | 'clienteId'>> & {
      clienteId?: number;
    }
  ): Promise<Publicacion> {
    const { data: resData, error } = await supabase
      .from('publicaciones')
      .update({ ...data, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select('*, cliente:clientes(id, nombre), responsable:usuarios(id, username, nombre, rol)')
      .single();

    if (error) {
      throw new Error(error.message || 'Error al actualizar publicación');
    }

    return {
      id: resData.id,
      clienteId: resData.clienteId,
      cliente: resData.cliente ? {
        id: resData.cliente.id,
        nombre: resData.cliente.nombre,
      } : { id: 0, nombre: 'Marca Desconocida' },
      titulo: resData.titulo,
      fechaProgramada: resData.fechaProgramada,
      estado: resData.estado,
      guion: resData.guion,
      driveUrl: resData.driveUrl,
      notas: resData.notas,
      plataforma: resData.plataforma,
      responsableId: resData.responsableId,
      responsable: resData.responsable ? {
        id: resData.responsable.id,
        username: resData.responsable.username,
        nombre: resData.responsable.nombre,
        rol: resData.responsable.rol
      } : null,
      horaPublicacion: resData.horaPublicacion,
      miniaturaUrl: resData.miniaturaUrl,
      createdAt: resData.createdAt,
    };
  },

  async deletePublicacion(id: number): Promise<void> {
    const { error } = await supabase
      .from('publicaciones')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al eliminar publicación');
    }
  },

  // 4. Reportes PDF (Deshabilitado en esta arquitectura sin servidor, redirigido a vista de impresión local)
  async generarReportePdf(filtros: {
    clienteId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Blob> {
    throw new Error(
      'La generación de PDF por servidor está deshabilitada en el modo "Solo Supabase". Por favor, utiliza el botón "Vista de Impresión / PDF Web" para generar el documento de forma directa y limpia en tu navegador.'
    );
  },

  // 5. Métodos de Relaciones de Marcas para Acompañante
  async getAsociacionesUsuarioClientes(): Promise<{ usuarioId: string; clienteId: number; clienteNombre: string }[]> {
    const { data, error } = await supabase
      .from('usuario_clientes')
      .select('usuarioId, clienteId, clientes:clientes(nombre)');
    
    if (error) {
      throw new Error(error.message || 'Error al obtener marcas de usuarios');
    }
    
    return (data || []).map((x: any) => ({
      usuarioId: x.usuarioId,
      clienteId: x.clienteId,
      clienteNombre: x.clientes?.nombre || 'Marca Desconocida'
    }));
  },

  async getMarcasPermitidasPorUsuario(usuarioId: string | number): Promise<number[]> {
    const { data, error } = await supabase
      .from('usuario_clientes')
      .select('clienteId')
      .eq('usuarioId', usuarioId);
    
    if (error) {
      throw new Error(error.message || 'Error al obtener marcas permitidas');
    }
    
    return (data || []).map((x: any) => x.clienteId);
  },

  async asignarMarcasAUsuario(usuarioId: string | number, clienteIds: number[]): Promise<void> {
    const { error: deleteError } = await supabase
      .from('usuario_clientes')
      .delete()
      .eq('usuarioId', usuarioId);
    
    if (deleteError) {
      throw new Error(deleteError.message || 'Error al limpiar marcas asignadas');
    }
    
    if (clienteIds.length === 0) return;
    
    const inserts = clienteIds.map(cid => ({
      usuarioId,
      clienteId: cid
    }));
    
    const { error: insertError } = await supabase
      .from('usuario_clientes')
      .insert(inserts);
    
    if (insertError) {
      throw new Error(insertError.message || 'Error al asignar marcas');
    }
  },

  async toggleAccesoUsuario(id: string | number, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo, updatedAt: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Error al cambiar estado de acceso');
    }
  },

  async obtenerPerfilActual(id: string | number): Promise<Usuario | null> {
    const { data: profile, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .is('deletedAt', null)
      .maybeSingle();

    if (error || !profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      nombre: profile.nombre || 'Miembro del Equipo',
      rol: profile.rol as any,
      activo: profile.activo === true,
    };
  },
};
