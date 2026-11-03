const API_BASE = '/api';
const TOKEN_KEY = 'controlPrestamosToken';
const USER_KEY = 'controlPrestamosUsuario';

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.mensaje || 'No se pudo completar la solicitud.');
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function guardarSesion(token, usuario) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo
  }));
}

export function leerToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function leerUsuario() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function cerrarSesionLocal() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = leerToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = { mensaje: 'La respuesta del servidor no es JSON válido.' };
  }

  if (response.status === 401 && !path.startsWith('/auth/login')) {
    window.dispatchEvent(new CustomEvent('sesion:vencida'));
  }
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}
