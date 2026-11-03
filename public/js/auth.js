import { apiRequest, cerrarSesionLocal, guardarSesion, leerToken, leerUsuario } from './api.js';

function mostrarPantallaAuth() {
  document.querySelector('#auth-screen').classList.remove('is-hidden');
  document.querySelector('#app-shell').classList.add('is-hidden');
}

function mostrarApp() {
  document.querySelector('#auth-screen').classList.add('is-hidden');
  document.querySelector('#app-shell').classList.remove('is-hidden');
}

function activarPestana(nombre) {
  document.querySelectorAll('[data-auth-tab]').forEach((boton) => {
    const activo = boton.dataset.authTab === nombre;
    boton.classList.toggle('is-active', activo);
    boton.setAttribute('aria-selected', String(activo));
  });
  document.querySelector('#login-form').classList.toggle('is-hidden', nombre !== 'login');
  document.querySelector('#register-form').classList.toggle('is-hidden', nombre !== 'register');
}

function dibujarUsuario(usuario) {
  const nombre = usuario?.nombre || 'Usuario';
  document.querySelector('#user-name').textContent = nombre;
  document.querySelector('#welcome-name').textContent = nombre.split(' ')[0];
  document.querySelector('#responsible-name').textContent = nombre;
  document.querySelector('#responsible-initials').textContent = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

export function iniciarAuth({ notificar, alEntrar }) {
  document.querySelectorAll('[data-auth-tab]').forEach((boton) => {
    boton.addEventListener('click', () => activarPestana(boton.dataset.authTab));
  });

  document.querySelector('#login-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const correo = String(datos.get('correo') || '').trim();
    const contrasena = String(datos.get('contrasena') || '');

    if (!correo || !formulario.elements.correo.validity.valid || !contrasena) {
      notificar('Ingresa un correo válido y una contraseña.', 'error');
      return;
    }

    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
      const resultado = await apiRequest('/auth/login', {
        method: 'POST',
        body: { correo, contrasena }
      });
      guardarSesion(resultado.token, resultado.usuario);
      formulario.reset();
      mostrarApp();
      dibujarUsuario(resultado.usuario);
      notificar('Sesión iniciada correctamente.', 'success');
      await alEntrar();
    } catch (error) {
      notificar(error.message, 'error');
    } finally {
      boton.disabled = false;
    }
  });

  document.querySelector('#register-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const nombre = String(datos.get('nombre') || '').trim();
    const correo = String(datos.get('correo') || '').trim();
    const contrasena = String(datos.get('contrasena') || '');

    if (!nombre || !correo || !formulario.elements.correo.validity.valid) {
      notificar('Completa tu nombre y escribe un correo válido.', 'error');
      return;
    }
    if (contrasena.length < 6) {
      notificar('La contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }

    const boton = formulario.querySelector('button[type="submit"]');
    boton.disabled = true;
    try {
      await apiRequest('/auth/registro', {
        method: 'POST',
        body: { nombre, correo, contrasena }
      });
      formulario.reset();
      activarPestana('login');
      document.querySelector('#login-form [name="correo"]').value = correo;
      notificar('Cuenta creada. Ya puedes iniciar sesión.', 'success');
    } catch (error) {
      notificar(error.message, 'error');
    } finally {
      boton.disabled = false;
    }
  });

  document.querySelector('#logout-button').addEventListener('click', () => {
    cerrarSesionLocal();
    mostrarPantallaAuth();
    activarPestana('login');
    notificar('Sesión cerrada.', 'info');
  });

  window.addEventListener('sesion:vencida', () => {
    cerrarSesionLocal();
    mostrarPantallaAuth();
    activarPestana('login');
    notificar('Tu sesión venció. Inicia sesión nuevamente.', 'error');
  });

  if (leerToken() && leerUsuario()) {
    const usuario = leerUsuario();
    mostrarApp();
    dibujarUsuario(usuario);
    alEntrar();
  } else {
    mostrarPantallaAuth();
  }
}
