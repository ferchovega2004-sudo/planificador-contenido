import { supabase } from './supabaseClient';

export interface Usuario {
  id: number | string;
  username: string;
  nombre: string;
  rol: 'ADMIN' | 'USER';
  createdAt?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
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
  createdAt?: string;
}

export const api = {
  // 1. Autenticación & Usuarios
  async login(username: string, password: string): Promise<{ token: string; usuario: Usuario }> {
    // Mapear username a email por defecto en Supabase Auth si no contiene @
    const email = username.includes('@') ? username : `${username}@planificador.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    // Buscar el perfil extendido en la tabla pública usuarios
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .is('deletedAt', null)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Error al obtener perfil extendido:', profileError.message);
    }

    const usuario: Usuario = {
      id: data.user.id,
      username: data.user.email || username,
      nombre: profile?.nombre || 'Miembro del Equipo',
      rol: (profile?.rol as 'ADMIN' | 'USER') || 'USER',
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
    const email = data.username.includes('@') ? data.username : `${data.username}@planificador.com`;
    const password = data.password || 'Planificador123!';
    
    // Crear el usuario en Supabase Auth
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: data.nombre,
          rol: data.rol,
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
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .is('deletedAt', null)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Error al obtener marcas');
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      nombre: c.nombre,
      createdAt: c.createdAt,
    }));
  },

  async createCliente(nombre: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .insert([{ nombre }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al registrar marca');
    }

    return {
      id: data.id,
      nombre: data.nombre,
      createdAt: data.createdAt,
    };
  },

  async updateCliente(id: number, nombre: string): Promise<Cliente> {
    const { data, error } = await supabase
      .from('clientes')
      .update({ nombre, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al actualizar marca');
    }

    return {
      id: data.id,
      nombre: data.nombre,
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

  // 3. Publicaciones (Tareas & Calendario & Kanban)
  async getPublicaciones(filtros?: {
    clienteId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Publicacion[]> {
    let query = supabase
      .from('publicaciones')
      .select('*, cliente:clientes(id, nombre)')
      .is('deletedAt', null);

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
      createdAt: p.createdAt,
    }));
  },

  async createPublicacion(data: {
    clienteId: number;
    titulo: string;
    fechaProgramada: string;
    estado?: string;
  }): Promise<Publicacion> {
    const { data: resData, error } = await supabase
      .from('publicaciones')
      .insert([data])
      .select('*, cliente:clientes(id, nombre)')
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
      .select('*, cliente:clientes(id, nombre)')
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
};
