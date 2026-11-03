const cors = require('cors');/api.js';, saveSession, readToken, readUser } from './api.js';n who dances lives next to the one who has a cat. The person who has a horse lives next to the person who swims. The person who likes reading drinks beer. The Chilean loves singing. The Argentine lives next to the blue house. The person who dances has a neighbour who drinks water.

# API de control de préstamos de laboratorio

## Descripción

API REST para registrar usuarios, equipos de laboratorio y préstamos. Usa MySQL para guardar la información, Sequelize para los modelos y migraciones, y JWT para proteger las rutas de equipos y préstamos. La disponibilidad se calcula revisando si existe un préstamo con `fecha_devolucion` igual a `null`.

## Requisitos

- Node.js 20 o superior y npm.
- MySQL 8.0 o superior. Laragon incluye MySQL y HeidiSQL.
- Una base MySQL llamada `control_prestamos`.

## Instalación

Desde la carpeta del proyecto:

```bash
npm install
```

## Configuración de entorno

Copia `.env.example` como `.env` y completa los valores de conexión. En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Para Laragon local, configura `DB_HOST=127.0.0.1`, `DB_PORT=3306`, `DB_NAME=control_prestamos`, `DB_USER=root` y `DB_PASSWORD=` si root no tiene contraseña. Define también una clave JWT privada. El archivo `.env` no se sube a Git.

## Crear la base de datos

Inicia MySQL desde Laragon y en HeidiSQL ejecuta:

```sql
CREATE DATABASE control_prestamos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Las tablas se crean exclusivamente mediante las migraciones de Sequelize; no uses un esquema SQL manual.

## Migraciones y datos de prueba

```bash
npm run db:migrate
npm run db:seed
```

Para deshacer la última migración o todas:

```bash
npm run db:migrate:undo
npm run db:migrate:undo:all
```

Para retirar todos los seeders:

```bash
npm run db:seed:undo
```

El seeder se puede ejecutar otra vez sin duplicar registros. Incluye estos usuarios:

| Correo | Contraseña de prueba |
|---|---|
| `ruby@senati.test` | `Ruby123` |
| `ana@senati.test` | `Ana12345` |
| `luis@senati.test` | `Luis12345` |

Las contraseñas se guardan en la base como hashes bcrypt.

## Ejecutar

Modo desarrollo con reinicio automático:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

La API queda disponible en `http://localhost:3000`. Las rutas de equipos y préstamos requieren `Authorization: Bearer <token>`; obtén el token con el login.

## Rutas de la API

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| POST | `/api/auth/registro` | Público | Registrar usuario |
| POST | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| GET | `/api/equipos` | JWT | Listar equipos |
| POST | `/api/equipos` | JWT | Crear equipo |
| GET | `/api/equipos/:id` | JWT | Consultar equipo |
| PUT | `/api/equipos/:id` | JWT | Actualizar equipo |
| DELETE | `/api/equipos/:id` | JWT | Eliminar equipo sin historial |
| GET | `/api/prestamos` | JWT | Consultar préstamos y filtros |
| POST | `/api/prestamos` | JWT | Registrar préstamo |
| PUT | `/api/prestamos/:id/devolucion` | JWT | Registrar devolución |

Filtros del listado de préstamos:

- `GET /api/prestamos?activos=true`: solo préstamos que no se han devuelto.
- `GET /api/prestamos?equipo_id=2`: historial del equipo con id 2.
- `GET /api/prestamos?activos=true&equipo_id=2`: préstamos activos del equipo 2.

## Restricción de préstamos activos

La migración crea `equipo_activo` como columna generada virtual: contiene el id del equipo mientras el préstamo no tenga devolución y queda `NULL` al devolverlo. El índice único sobre esa columna impide que dos filas activas compartan el mismo id. Así la regla también se respeta en MySQL aunque coincidan varias solicitudes.

## Pruebas

Importa `docs/Control_Prestamos.postman_collection.json` en Postman. Las solicitudes se deben ejecutar en orden; el login guarda el token automáticamente. Los cuerpos y las respuestas esperadas de los ocho casos están en [docs/PRUEBAS.md](docs/PRUEBAS.md).

## Distribución de responsabilidades

- Ruby Mego (@rubymego): backend Node/Express, registro, login, JWT y middleware, README.
- Integrante 2: base de datos MySQL, Sequelize, modelos, migraciones, seeders, pruebas en Postman.
- Integrante 3: CRUD de equipos, préstamos y devoluciones, validaciones, informe.
- Todo el equipo: demostración y sustentación.

## Interfaz web

Inicia MySQL en Laragon y ejecuta la aplicación desde la carpeta del proyecto:

```bash
npm run dev
```

Abre `http://localhost:3000` en el navegador. Si el puerto 3000 está ocupado, cambia temporalmente `PORT` en `.env` y usa el puerto indicado por el servidor.

La interfaz está hecha con HTML, CSS y JavaScript nativo, y se sirve desde `public/` por Express. Sus pantallas son:

- **Acceso:** permite iniciar sesión o registrar una cuenta. El JWT y los datos básicos de la sesión quedan en `sessionStorage`; la contraseña nunca se guarda. Si el token vence, se regresa al acceso con un aviso.
- **Inicio:** muestra el total de equipos, disponibles, prestados, préstamos activos y préstamos vencidos.
- **Equipos:** lista disponibilidad calculada por préstamos activos, permite buscar y filtrar por categoría, y crear, editar o eliminar equipos. La API informa cuando no se puede eliminar un equipo con historial.
- **Préstamos:** registra entregas solo para equipos disponibles, muestra al usuario autenticado como responsable, lista préstamos activos y permite registrar devoluciones.
- **Historial:** muestra los préstamos activos y devueltos de un equipo, con fechas, prestatario y responsable.

La web envía el token en `Authorization: Bearer <token>` para las rutas protegidas. Los valores recibidos de la API se insertan como texto mediante `textContent` o nodos creados con `createElement`; así se evita interpretar contenido del usuario como HTML ejecutable.