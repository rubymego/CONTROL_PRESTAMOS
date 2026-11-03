import { apiRequest } from './api.js';

function crearCelda(texto, clase = '') {
  const celda = document.createElement('td');
  if (clase) celda.className = clase;
  celda.textContent = texto;
  return celda;
}

function crearBadge(texto, clase) {
  const badge = document.createElement('span');
  badge.className = `status-badge ${clase}`;
  badge.textContent = texto;
  return badge;
}

export function iniciarEquipos({ notificar, alCambiar }) {
  const cuerpo = document.querySelector('#equipment-table-body');
  const panelFormulario = document.querySelector('#equipment-form-panel');
  const formulario = document.querySelector('#equipment-form');
  const busqueda = document.querySelector('#equipment-search');
  const filtroCategoria = document.querySelector('#category-filter');
  let equipos = [];
  let idsActivos = new Set();
  let equipoEditando = null;

  function cerrarFormulario() {
    equipoEditando = null;
    formulario.reset();
    panelFormulario.classList.add('is-hidden');
    document.querySelector('#equipment-form-title').textContent = 'Agregar equipo';
    document.querySelector('#equipment-form-eyebrow').textContent = 'ALTA DE INVENTARIO';
    document.querySelector('#save-equipment-button').textContent = 'Guardar equipo';
  }

  function actualizarCategorias() {
    const seleccion = filtroCategoria.value;
    const categorias = [...new Set(equipos.map((equipo) => equipo.categoria))].sort((a, b) => a.localeCompare(b, 'es'));
    while (filtroCategoria.firstChild) filtroCategoria.removeChild(filtroCategoria.firstChild);
    const todas = document.createElement('option');
    todas.value = '';
    todas.textContent = 'Todas';
    filtroCategoria.append(todas);
    categorias.forEach((categoria) => {
      const opcion = document.createElement('option');
      opcion.value = categoria;
      opcion.textContent = categoria;
      filtroCategoria.append(opcion);
    });
    filtroCategoria.value = categorias.includes(seleccion) ? seleccion : '';
  }

  function dibujarTabla() {
    while (cuerpo.firstChild) cuerpo.removeChild(cuerpo.firstChild);
    const texto = busqueda.value.trim().toLocaleLowerCase('es');
    const categoria = filtroCategoria.value;
    const filtrados = equipos.filter((equipo) => {
      const coincideTexto = `${equipo.codigo} ${equipo.nombre}`.toLocaleLowerCase('es').includes(texto);
      return coincideTexto && (!categoria || equipo.categoria === categoria);
    });

    document.querySelector('#equipment-count-label').textContent = `${filtrados.length} ${filtrados.length === 1 ? 'equipo' : 'equipos'}`;
    if (!filtrados.length) {
      const fila = document.createElement('tr');
      const celda = crearCelda(equipos.length ? 'No hay equipos que coincidan con la búsqueda.' : 'Todavía no hay equipos registrados.', 'empty-cell');
      celda.colSpan = 5;
      fila.append(celda);
      cuerpo.append(fila);
      return;
    }

    filtrados.forEach((equipo) => {
      const fila = document.createElement('tr');
      const descripcion = document.createElement('td');
      const titulo = document.createElement('span');
      titulo.className = 'equipment-title';
      titulo.textContent = equipo.nombre;
      const codigo = document.createElement('span');
      codigo.className = 'equipment-code';
      codigo.textContent = equipo.codigo;
      descripcion.append(titulo, codigo);
      fila.append(descripcion, crearCelda(equipo.categoria), crearCelda(equipo.condicion_uso));
      const estado = document.createElement('td');
      const prestado = idsActivos.has(Number(equipo.id));
      estado.append(crearBadge(prestado ? 'Prestado' : 'Disponible', prestado ? 'status-loaned' : 'status-available'));
      fila.append(estado);

      const acciones = document.createElement('td');
      acciones.className = 'action-cell';
      const grupo = document.createElement('span');
      grupo.className = 'row-actions';
      const editar = document.createElement('button');
      editar.type = 'button';
      editar.className = 'icon-action';
      editar.setAttribute('aria-label', `Editar ${equipo.codigo}`);
      editar.title = 'Editar equipo';
      editar.textContent = '✎';
      editar.addEventListener('click', () => {
        equipoEditando = equipo.id;
        formulario.elements.codigo.value = equipo.codigo;
        formulario.elements.nombre.value = equipo.nombre;
        formulario.elements.categoria.value = equipo.categoria;
        formulario.elements.condicion_uso.value = equipo.condicion_uso;
        document.querySelector('#equipment-form-title').textContent = 'Editar equipo';
        document.querySelector('#equipment-form-eyebrow').textContent = `EDITANDO ${equipo.codigo}`;
        document.querySelector('#save-equipment-button').textContent = 'Guardar cambios';
        panelFormulario.classList.remove('is-hidden');
        panelFormulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      const eliminar = document.createElement('button');
      eliminar.type = 'button';
      eliminar.className = 'icon-action danger';
      eliminar.setAttribute('aria-label', `Eliminar ${equipo.codigo}`);
      eliminar.title = 'Eliminar equipo';
      eliminar.textContent = '×';
      eliminar.addEventListener('click', async () => {
        if (!window.confirm(`¿Eliminar el equipo ${equipo.codigo}?`)) return;
        eliminar.disabled = true;
        try {
          const resultado = await apiRequest(`/equipos/${equipo.id}`, { method: 'DELETE' });
          notificar(resultado.mensaje || 'Equipo eliminado.', 'success');
          await cargar();
          await alCambiar();
        } catch (error) {
          notificar(error.message, 'error');
        } finally {
          eliminar.disabled = false;
        }
      });
      grupo.append(editar, eliminar);
      acciones.append(grupo);
      fila.append(acciones);
      cuerpo.append(fila);
    });
  }

  async function cargar() {
    cuerpo.replaceChildren();
    const filaCarga = document.createElement('tr');
    const mensajeCarga = crearCelda('Cargando equipos…', 'empty-cell');
    mensajeCarga.colSpan = 5;
    filaCarga.append(mensajeCarga);
    cuerpo.append(filaCarga);
    try {
      const [respuestaEquipos, respuestaActivos] = await Promise.all([
        apiRequest('/equipos'),
        apiRequest('/prestamos?activos=true')
      ]);
      equipos = respuestaEquipos.equipos;
      idsActivos = new Set(respuestaActivos.prestamos.map((prestamo) => Number(prestamo.equipo_id)));
      actualizarCategorias();
      dibujarTabla();
    } catch (error) {
      notificar(error.message, 'error');
      cuerpo.replaceChildren();
      const fila = document.createElement('tr');
      const celda = crearCelda('No fue posible cargar el inventario.', 'empty-cell');
      celda.colSpan = 5;
      fila.append(celda);
      cuerpo.append(fila);
    }
  }

  document.querySelector('#new-equipment-button').addEventListener('click', () => {
    cerrarFormulario();
    panelFormulario.classList.remove('is-hidden');
    formulario.elements.codigo.focus();
  });
  document.querySelector('#cancel-equipment-button').addEventListener('click', cerrarFormulario);
  document.querySelector('#cancel-equipment-button-bottom').addEventListener('click', cerrarFormulario);
  busqueda.addEventListener('input', dibujarTabla);
  filtroCategoria.addEventListener('change', dibujarTabla);

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = new FormData(formulario);
    const equipo = {
      codigo: String(datos.get('codigo') || '').trim(),
      nombre: String(datos.get('nombre') || '').trim(),
      categoria: String(datos.get('categoria') || '').trim(),
      condicion_uso: String(datos.get('condicion_uso') || '').trim()
    };
    if (Object.values(equipo).some((valor) => !valor)) {
      notificar('Completa código, nombre, categoría y condición de uso.', 'error');
      return;
    }

    const boton = document.querySelector('#save-equipment-button');
    boton.disabled = true;
    try {
      const resultado = await apiRequest(equipoEditando ? `/equipos/${equipoEditando}` : '/equipos', {
        method: equipoEditando ? 'PUT' : 'POST',
        body: equipo
      });
      notificar(resultado.mensaje || (equipoEditando ? 'Equipo actualizado.' : 'Equipo creado.'), 'success');
      cerrarFormulario();
      await cargar();
      await alCambiar();
    } catch (error) {
      notificar(error.message, 'error');
    } finally {
      boton.disabled = false;
    }
  });

  return { cargar };
}
