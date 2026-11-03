import { apiRequest } from './api.js';

function celda(texto, clase = '') {
  const elemento = document.createElement('td');
  if (clase) elemento.className = clase;
  elemento.textContent = texto;
  return elemento;
}

function formatoFecha(fecha) {
  if (!fecha) return '—';
  const partes = String(fecha).slice(0, 10).split('-');
  if (partes.length !== 3) return fecha;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaLocal() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function badge(texto, clase) {
  const elemento = document.createElement('span');
  elemento.className = `status-badge ${clase}`;
  elemento.textContent = texto;
  return elemento;
}

export function iniciarPrestamos({ notificar, alCambiar }) {
  const formulario = document.querySelector('#loan-form');
  const selectorEquipo = document.querySelector('#loan-equipment-select');
  const cuerpoActivos = document.querySelector('#active-loans-body');
  const selectorHistorial = document.querySelector('#history-equipment-select');
  const cuerpoHistorial = document.querySelector('#history-table-body');
  let equipos = [];
  let prestamosActivos = [];

  function ponerOpcion(selector, valor, texto) {
    const opcion = document.createElement('option');
    opcion.value = valor;
    opcion.textContent = texto;
    selector.append(opcion);
  }

  function dibujarOpcionesPrestamo() {
    const seleccionado = selectorEquipo.value;
    selectorEquipo.replaceChildren();
    ponerOpcion(selectorEquipo, '', equipos.length ? 'Selecciona un equipo disponible' : 'No hay equipos disponibles');
    const ocupados = new Set(prestamosActivos.map((prestamo) => Number(prestamo.equipo_id)));
    equipos.filter((equipo) => !ocupados.has(Number(equipo.id))).forEach((equipo) => {
      ponerOpcion(selectorEquipo, String(equipo.id), `${equipo.codigo} · ${equipo.nombre}`);
    });
    if ([...selectorEquipo.options].some((opcion) => opcion.value === seleccionado)) selectorEquipo.value = seleccionado;
    document.querySelector('#loan-equipment-help').textContent = selectorEquipo.options.length > 1
      ? 'Solo aparecen equipos sin préstamos activos.'
      : 'No hay equipos disponibles en este momento.';
    document.querySelector('#create-loan-button').disabled = selectorEquipo.options.length <= 1;
  }

  function dibujarActivos() {
    cuerpoActivos.replaceChildren();
    document.querySelector('#active-loan-count').textContent = String(prestamosActivos.length);
    if (!prestamosActivos.length) {
      const fila = document.createElement('tr');
      const vacio = celda('No hay préstamos activos. Los equipos están disponibles.', 'empty-cell');
      vacio.colSpan = 3;
      fila.append(vacio);
      cuerpoActivos.append(fila);
      return;
    }

    prestamosActivos.forEach((prestamo) => {
      const fila = document.createElement('tr');
      const equipo = celda('', '');
      const nombreEquipo = document.createElement('span');
      nombreEquipo.className = 'equipment-title';
      nombreEquipo.textContent = prestamo.equipo?.nombre || `Equipo ${prestamo.equipo_id}`;
      const prestatario = document.createElement('span');
      prestatario.className = 'borrower-name';
      prestatario.textContent = prestamo.prestatario;
      equipo.append(nombreEquipo, prestatario);
      const fecha = celda('');
      const fechaPrevista = document.createElement('span');
      fechaPrevista.textContent = formatoFecha(prestamo.fecha_prevista);
      const responsable = document.createElement('span');
      responsable.className = 'due-date';
      responsable.textContent = `Por ${prestamo.usuario?.nombre || 'Usuario'}`;
      fecha.append(fechaPrevista, responsable);
      const acciones = celda('');
      acciones.className = 'action-cell';
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'return-button';
      boton.textContent = 'Registrar devolución';
      boton.addEventListener('click', async () => {
        boton.disabled = true;
        try {
          const resultado = await apiRequest(`/prestamos/${prestamo.id}/devolucion`, {
            method: 'PUT',
            body: {}
          });
          notificar(resultado.mensaje || 'Devolución registrada.', 'success');
          await cargar();
          await alCambiar();
        } catch (error) {
          notificar(error.message, 'error');
        } finally {
          boton.disabled = false;
        }
      });
      acciones.append(boton);
      fila.append(equipo, fecha, acciones);
      cuerpoActivos.append(fila);
    });
  }

  async function cargar() {
    cuerpoActivos.replaceChildren();
    const carga = document.createElement('tr');
    const mensaje = celda('Cargando préstamos activos…', 'empty-cell');
    mensaje.colSpan = 3;
    carga.append(mensaje);
    cuerpoActivos.append(carga);
    try {
      const [respuestaEquipos, respuestaActivos] = await Promise.all([
        apiRequest('/equipos'),
        apiRequest('/prestamos?activos=true')
      ]);
      equipos = respuestaEquipos.equipos;
      prestamosActivos = respuestaActivos.prestamos;
      dibujarOpcionesPrestamo();
      dibujarActivos();
      await cargarOpcionesHistorial();
    } catch (error) {
      notificar(error.message, 'error');
      cuerpoActivos.replaceChildren();
      const filaError = document.createElement('tr');
      const errorCelda = celda('No fue posible consultar los préstamos.', 'empty-cell');
      errorCelda.colSpan = 3;
      filaError.append(errorCelda);
      cuerpoActivos.append(filaError);
    }
  }

  async function cargarOpcionesHistorial() {
    const seleccionado = selectorHistorial.value;
    selectorHistorial.replaceChildren();
    ponerOpcion(selectorHistorial, '', 'Selecciona un equipo');
    equipos.forEach((equipo) => ponerOpcion(selectorHistorial, String(equipo.id), `${equipo.codigo} · ${equipo.nombre}`));
    if ([...selectorHistorial.options].some((opcion) => opcion.value === seleccionado)) selectorHistorial.value = seleccionado;
  }

  async function cargarHistorial() {
    const equipoId = selectorHistorial.value;
    cuerpoHistorial.replaceChildren();
    if (!equipoId) {
      const fila = document.createElement('tr');
      const vacio = celda('Selecciona un equipo para ver su historial.', 'empty-cell');
      vacio.colSpan = 6;
      fila.append(vacio);
      cuerpoHistorial.append(fila);
      document.querySelector('#history-count').textContent = '—';
      document.querySelector('#history-equipment-name').textContent = 'Selecciona un equipo para consultar';
      return;
    }

    const filaCarga = document.createElement('tr');
    const mensajeCarga = celda('Cargando historial…', 'empty-cell');
    mensajeCarga.colSpan = 6;
    filaCarga.append(mensajeCarga);
    cuerpoHistorial.append(filaCarga);
    try {
      const [respuestaHistorial, respuestaActivos] = await Promise.all([
        apiRequest(`/prestamos?equipo_id=${encodeURIComponent(equipoId)}`),
        apiRequest(`/prestamos?activos=true&equipo_id=${encodeURIComponent(equipoId)}`)
      ]);
      const activosIds = new Set(respuestaActivos.prestamos.map((prestamo) => Number(prestamo.id)));
      const elementoEquipo = equipos.find((equipo) => String(equipo.id) === equipoId);
      const prestamos = respuestaHistorial.prestamos;
      document.querySelector('#history-count').textContent = String(prestamos.length);
      document.querySelector('#history-equipment-name').textContent = elementoEquipo
        ? `${elementoEquipo.codigo} · ${elementoEquipo.nombre}`
        : 'Equipo seleccionado';
      cuerpoHistorial.replaceChildren();
      if (!prestamos.length) {
        const filaVacia = document.createElement('tr');
        const vacio = celda('Este equipo todavía no tiene préstamos registrados.', 'empty-cell');
        vacio.colSpan = 6;
        filaVacia.append(vacio);
        cuerpoHistorial.append(filaVacia);
        return;
      }

      prestamos.forEach((prestamo) => {
        const fila = document.createElement('tr');
        const estaActivo = activosIds.has(Number(prestamo.id));
        fila.append(
          celda(prestamo.prestatario),
          celda(prestamo.usuario?.nombre || 'Usuario'),
          celda(formatoFecha(prestamo.fecha_prestamo)),
          celda(formatoFecha(prestamo.fecha_prevista)),
          celda(estaActivo ? 'Pendiente' : formatoFecha(prestamo.fecha_devolucion))
        );
        const estado = document.createElement('td');
        estado.append(badge(estaActivo ? 'Activo' : 'Devuelto', estaActivo ? 'status-loaned' : 'status-returned'));
        fila.append(estado);
        cuerpoHistorial.append(fila);
      });
    } catch (error) {
      notificar(error.message, 'error');
      cuerpoHistorial.replaceChildren();
      const filaError = document.createElement('tr');
      const errorCelda = celda('No fue posible cargar el historial.', 'empty-cell');
      errorCelda.colSpan = 6;
      filaError.append(errorCelda);
      cuerpoHistorial.append(filaError);
    }
  }

  formulario.elements.fecha_prestamo.value = fechaLocal();
  formulario.elements.fecha_prevista.value = fechaLocal();
  formulario.elements.fecha_prestamo.addEventListener('change', () => {
    formulario.elements.fecha_prevista.min = formulario.elements.fecha_prestamo.value;
  });
  document.querySelector('#loan-form').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    const equipoId = Number(datos.get('equipo_id'));
    const prestatario = String(datos.get('prestatario') || '').trim();
    const fechaPrestamo = String(datos.get('fecha_prestamo') || '');
    const fechaPrevista = String(datos.get('fecha_prevista') || '');
    if (!equipoId || !prestatario || !fechaPrestamo || !fechaPrevista) {
      notificar('Completa equipo, prestatario y ambas fechas.', 'error');
      return;
    }
    if (fechaPrevista < fechaPrestamo) {
      notificar('La fecha prevista no puede ser anterior a la fecha de préstamo.', 'error');
      return;
    }
    if (prestamosActivos.some((prestamo) => Number(prestamo.equipo_id) === equipoId)) {
      notificar('Ese equipo ya tiene un préstamo activo. Actualiza la lista.', 'error');
      await cargar();
      return;
    }

    const boton = document.querySelector('#create-loan-button');
    boton.disabled = true;
    try {
      const resultado = await apiRequest('/prestamos', {
        method: 'POST',
        body: {
          equipo_id: equipoId,
          prestatario,
          fecha_prestamo: fechaPrestamo,
          fecha_prevista: fechaPrevista
        }
      });
      notificar(resultado.mensaje || 'Préstamo registrado.', 'success');
      formulario.elements.prestatario.value = '';
      formulario.elements.equipo_id.value = '';
      await cargar();
      await alCambiar();
    } catch (error) {
      notificar(error.message, 'error');
    } finally {
      boton.disabled = selectorEquipo.options.length <= 1;
    }
  });

  selectorHistorial.addEventListener('change', cargarHistorial);

  return { cargar, cargarHistorial };
}
