import { apiRequest } from './api.js';
import { iniciarAuth } from './auth.js';
import { iniciarEquipos } from './equipos.js';
import { iniciarPrestamos } from './prestamos.js';

let temporizadorAviso;

function notificar(mensaje, tipo = 'info') {
  const aviso = document.querySelector('#toast');
  aviso.textContent = mensaje;
  aviso.className = `toast is-visible is-${tipo}`;
  window.clearTimeout(temporizadorAviso);
  temporizadorAviso = window.setTimeout(() => aviso.classList.remove('is-visible'), 5200);
}

function celda(texto, clase = '') {
  const elemento = document.createElement('td');
  if (clase) elemento.className = clase;
  elemento.textContent = texto;
  return elemento;
}

function fechaHoy() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dibujarVencidos(prestamos) {
  const lista = document.querySelector('#overdue-list');
  lista.replaceChildren();
  const hoy = fechaHoy();
  const vencidos = prestamos.filter((prestamo) => !prestamo.fecha_devolucion && prestamo.fecha_prevista < hoy);
  document.querySelector('#overdue-count').textContent = String(vencidos.length);
  if (!vencidos.length) {
    const mensaje = document.createElement('p');
    mensaje.className = 'empty-state';
    mensaje.textContent = prestamos.length
      ? 'No hay préstamos fuera de fecha. Todo está al día.'
      : 'No hay préstamos activos para revisar.';
    lista.append(mensaje);
    return;
  }

  vencidos.forEach((prestamo) => {
    const fila = document.createElement('div');
    fila.className = 'overdue-row';
    const equipo = document.createElement('span');
    equipo.className = 'overdue-name';
    equipo.textContent = prestamo.equipo?.nombre || `Equipo ${prestamo.equipo_id}`;
    const retraso = Math.max(1, Math.floor((new Date(`${hoy}T00:00:00`) - new Date(`${prestamo.fecha_prevista}T00:00:00`)) / 86400000));
    const dias = document.createElement('span');
    dias.className = 'overdue-days';
    dias.textContent = `${retraso} ${retraso === 1 ? 'día' : 'días'} de retraso`;
    const detalle = document.createElement('span');
    detalle.className = 'overdue-meta';
    detalle.textContent = `${prestamo.prestatario} · vencía ${prestamo.fecha_prevista}`;
    fila.append(equipo, dias, detalle);
    lista.append(fila);
  });
}

async function cargarInicio() {
  const lista = document.querySelector('#overdue-list');
  const carga = document.createElement('p');
  carga.className = 'empty-state';
  carga.textContent = 'Cargando resumen…';
  lista.replaceChildren(carga);
  try {
    const [respuestaEquipos, respuestaActivos] = await Promise.all([
      apiRequest('/equipos'),
      apiRequest('/prestamos?activos=true')
    ]);
    const equipos = respuestaEquipos.equipos;
    const prestamos = respuestaActivos.prestamos;
    const idsPrestados = new Set(prestamos.map((prestamo) => Number(prestamo.equipo_id)));
    const disponibles = equipos.filter((equipo) => !idsPrestados.has(Number(equipo.id))).length;
    document.querySelector('#stat-total').textContent = String(equipos.length);
    document.querySelector('#stat-available').textContent = String(disponibles);
    document.querySelector('#stat-loaned').textContent = String(equipos.length - disponibles);
    document.querySelector('#stat-active').textContent = String(prestamos.length);
    dibujarVencidos(prestamos);
  } catch (error) {
    lista.replaceChildren();
    const mensaje = document.createElement('p');
    mensaje.className = 'empty-state';
    mensaje.textContent = 'No fue posible cargar el resumen. Vuelve a intentarlo.';
    lista.append(mensaje);
    notificar(error.message, 'error');
  }
}

const equipos = iniciarEquipos({
  notificar,
  alCambiar: () => cargarInicio()
});
const prestamos = iniciarPrestamos({
  notificar,
  alCambiar: () => cargarInicio()
});

function cerrarMenu() {
  document.querySelector('#sidebar').classList.remove('is-open');
  document.querySelector('#sidebar-scrim').classList.remove('is-open');
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', 'false');
}

async function abrirVista(nombre) {
  const vistas = ['inicio', 'equipos', 'prestamos', 'historial'];
  if (!vistas.includes(nombre)) return;
  vistas.forEach((vista) => {
    document.querySelector(`#view-${vista}`).classList.toggle('is-hidden', vista !== nombre);
  });
  document.querySelectorAll('.nav-link').forEach((boton) => {
    const activo = boton.dataset.view === nombre;
    boton.classList.toggle('is-active', activo);
    if (activo) boton.setAttribute('aria-current', 'page');
    else boton.removeAttribute('aria-current');
  });
  const titulo = { inicio: 'Inicio', equipos: 'Equipos', prestamos: 'Préstamos', historial: 'Historial' }[nombre];
  document.querySelector('#page-title').textContent = titulo;
  cerrarMenu();
  if (nombre === 'inicio') await cargarInicio();
  if (nombre === 'equipos') await equipos.cargar();
  if (nombre === 'prestamos') await prestamos.cargar();
  if (nombre === 'historial') {
    await prestamos.cargar();
    await prestamos.cargarHistorial();
  }
}

async function cargarTodo() {
  document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());
  await abrirVista('inicio');
}

document.querySelectorAll('.nav-link').forEach((boton) => {
  boton.addEventListener('click', () => abrirVista(boton.dataset.view));
});
document.querySelectorAll('[data-go]').forEach((boton) => {
  boton.addEventListener('click', () => abrirVista(boton.dataset.go));
});
document.querySelector('#menu-toggle').addEventListener('click', () => {
  const sidebar = document.querySelector('#sidebar');
  const abierto = sidebar.classList.toggle('is-open');
  document.querySelector('#sidebar-scrim').classList.toggle('is-open', abierto);
  document.querySelector('#menu-toggle').setAttribute('aria-expanded', String(abierto));
});
document.querySelector('#sidebar-scrim').addEventListener('click', cerrarMenu);
document.querySelector('#today-label').textContent = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
}).format(new Date());

iniciarAuth({ notificar, alEntrar: cargarTodo });
