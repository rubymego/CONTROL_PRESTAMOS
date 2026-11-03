# Pruebas de la API

Base URL: `http://localhost:3000`. Salvo donde se indique, las rutas de equipos y préstamos requieren `Authorization: Bearer <token>`. Importa `Control_Prestamos.postman_collection.json` en Postman y ejecuta las solicitudes en orden. Los cuerpos son JSON.

## 1. Acceso sin token

**Método y ruta:** `GET /api/equipos`  
**Cuerpo:** ninguno.  
**Esperado:** HTTP `401`.

```json
{ "mensaje": "Se requiere un token Bearer válido." }
```

Un token inválido también devuelve HTTP `401` con el mensaje `El token es inválido o ha expirado.`

## 2. Correo o código de equipo repetido

Correo registrado:

**Método y ruta:** `POST /api/auth/registro`  
**Cuerpo:**

```json
{ "nombre": "Ruby duplicada", "correo": "ruby@senati.test", "contrasena": "Ruby123" }
```

**Esperado:** HTTP `409`.

```json
{ "mensaje": "El correo ya está registrado." }
```

Código de equipo existente:

**Método y ruta:** `POST /api/equipos`  
**Cuerpo:**

```json
{ "codigo": "LAB-MIC-001", "nombre": "Microscopio duplicado", "categoria": "Microscopía", "condicion_uso": "Bueno" }
```

**Esperado:** HTTP `409`.

```json
{ "mensaje": "El código de equipo ya existe." }
```

## 3. Préstamo válido y equipo no disponible

Primero inicia sesión y usa el token que responde. En una base recién sembrada, `LAB-BAL-002` no tiene préstamo activo; se obtiene su id con `GET /api/equipos`.

**Método y ruta:** `POST /api/prestamos`  
**Cuerpo:**

```json
{ "equipo_id": 2, "prestatario": "Estudiante de prueba", "fecha_prestamo": "2026-11-02", "fecha_prevista": "2026-11-09" }
```

**Esperado:** HTTP `201`, con un préstamo persistido y `fecha_devolucion: null`.

```json
{ "mensaje": "Préstamo registrado correctamente.", "prestamo": { "id": 4, "equipo_id": 2, "usuario_id": 1, "prestatario": "Estudiante de prueba", "fecha_prestamo": "2026-11-02", "fecha_prevista": "2026-11-09", "fecha_devolucion": null } }
```

El `id` y `usuario_id` pueden variar según la base. Comprueba la disponibilidad con `GET /api/prestamos?activos=true&equipo_id=2`; debe aparecer el préstamo activo.

## 4. Segundo préstamo activo del mismo equipo

**Método y ruta:** `POST /api/prestamos`  
**Cuerpo:** usa el mismo `equipo_id` y fechas del caso 3, cambiando `prestatario` a `Segundo estudiante`.  
**Esperado:** HTTP `409`; no crea otro préstamo.

```json
{ "mensaje": "El equipo ya tiene un préstamo activo." }
```

## 5. Devolución y nuevo préstamo

Devuelve el préstamo creado en el caso 3 (usa su `id`):

**Método y ruta:** `PUT /api/prestamos/4/devolucion`  
**Cuerpo:**

```json
{ "fecha_devolucion": "2026-11-02" }
```

**Esperado:** HTTP `200` y `fecha_devolucion` actualizada. Al no enviar una fecha, la API utiliza el día actual.

```json
{ "mensaje": "Devolución registrada correctamente.", "prestamo": { "id": 4, "fecha_devolucion": "2026-11-02" } }
```

Luego repite `POST /api/prestamos` para el mismo equipo con `prestatario` nuevo.  
**Esperado:** HTTP `201`. El equipo vuelve a estar disponible al cerrar el préstamo anterior.

## 6. Datos incompletos o fecha incoherente

**Método y ruta:** `POST /api/prestamos`  
**Cuerpo:**

```json
{ "equipo_id": 2, "prestatario": "Prueba de fecha", "fecha_prestamo": "2026-11-09", "fecha_prevista": "2026-11-02" }
```

**Esperado:** HTTP `400` con el campo explicado.

```json
{ "mensaje": "Hay datos inválidos o incompletos.", "errores": [{ "campo": "fecha_prevista", "mensaje": "fecha_prevista no puede ser anterior a fecha_prestamo." }] }
```

## 7. Id inexistente

**Método y ruta:** `GET /api/equipos/999999`  
**Cuerpo:** ninguno.  
**Esperado:** HTTP `404`.

```json
{ "mensaje": "No existe un equipo con ese id." }
```

## 8. Persistencia al reiniciar el servidor

1. Registra un equipo con `POST /api/equipos` y guarda su `codigo`.
2. Detén el servidor con `Ctrl+C` y vuelve a iniciarlo con `npm run dev`.
3. Inicia sesión otra vez si expiró el token.
4. Consulta `GET /api/equipos` y busca el mismo código.

**Esperado:** HTTP `200` y el equipo sigue en MySQL, porque el servidor conserva los datos en la base y no en memoria.

## Consultas de filtros

- `GET /api/prestamos?activos=true`: solo préstamos sin devolución.
- `GET /api/prestamos?equipo_id=2`: historial del equipo 2.
- `GET /api/prestamos?activos=true&equipo_id=2`: préstamos activos del equipo 2.
