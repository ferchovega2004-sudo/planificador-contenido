const getApiUrl = (): string => {
  const savedUrl = localStorage.getItem('API_BASE_URL');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }
  // Si estamos en el navegador en producción (no cargados por file://)
  if (window.location.protocol !== 'file:') {
    return `${window.location.origin}/api`;
  }
  // Por defecto, se asume que corre localmente en el puerto 3000
  return 'http://localhost:3000/api';
};

const BASE_URL = getApiUrl();

// Cabecera común que incluye el JWT si existe
const getHeaders = (contentType: string | null = 'application/json'): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface Usuario {
  id: number;
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
  getApiUrl(): string {
    return BASE_URL;
  },
  // 1. Autenticación & Usuarios
  async login(username: string, password: string): Promise<{ token: string; usuario: Usuario }> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al iniciar sesión');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    return data;
  },

  logout(): void {
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
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar usuario');
    }
    return res.json();
  },

  async getUsuarios(): Promise<Usuario[]> {
    const res = await fetch(`${BASE_URL}/auth/usuarios`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener usuarios del equipo');
    }
    return res.json();
  },

  async deleteUsuario(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/usuarios/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar usuario');
    }
  },

  async cambiarPassword(usuarioId: number, nuevaContrasena: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/usuarios/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ usuarioId, nuevaContrasena }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al cambiar contraseña');
    }
  },

  // 2. Clientes (Marcas) CRUD
  async getClientes(): Promise<Cliente[]> {
    const res = await fetch(`${BASE_URL}/clientes`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener marcas');
    }
    return res.json();
  },

  async createCliente(nombre: string): Promise<Cliente> {
    const res = await fetch(`${BASE_URL}/clientes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ nombre }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al registrar marca');
    }
    return res.json();
  },

  async updateCliente(id: number, nombre: string): Promise<Cliente> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ nombre }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar marca');
    }
    return res.json();
  },

  async deleteCliente(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/clientes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar marca');
    }
  },

  // 3. Publicaciones (Tareas & Calendario & Kanban)
  async getPublicaciones(filtros?: {
    clienteId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Publicacion[]> {
    let url = `${BASE_URL}/publicaciones`;
    const params = new URLSearchParams();
    if (filtros) {
      if (filtros.clienteId) params.append('clienteId', filtros.clienteId.toString());
      if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    }
    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al obtener publicaciones');
    }
    return res.json();
  },

  async createPublicacion(data: {
    clienteId: number;
    titulo: string;
    fechaProgramada: string;
    estado?: string;
  }): Promise<Publicacion> {
    const res = await fetch(`${BASE_URL}/publicaciones`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al crear publicación');
    }
    return res.json();
  },

  async updatePublicacion(
    id: number,
    data: Partial<Omit<Publicacion, 'id' | 'cliente' | 'clienteId'>> & {
      clienteId?: number;
    }
  ): Promise<Publicacion> {
    const res = await fetch(`${BASE_URL}/publicaciones/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al actualizar publicación');
    }
    return res.json();
  },

  async deletePublicacion(id: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/publicaciones/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al eliminar publicación');
    }
  },

  // 4. Reportes & Exportación PDF
  async generarReportePdf(filtros: {
    clienteId?: number;
    fechaInicio?: string;
    fechaFin?: string;
  }): Promise<Blob> {
    let url = `${BASE_URL}/reportes/pdf`;
    const params = new URLSearchParams();
    if (filtros.clienteId) params.append('clienteId', filtros.clienteId.toString());
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    
    const queryStr = params.toString();
    if (queryStr) {
      url += `?${queryStr}`;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(null), // null para no enviar content-type en GET, pero sí el token
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error al generar PDF del reporte');
    }
    return res.blob();
  },
};
