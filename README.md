# Fullstack2_P_and_P_Grupo1 — Pixel & Play (P&P)

Tienda de juegos de mesa y accesorios de escritorio. El frontend está hecho con React, React Router y Bootstrap. La API está hecha con Express y guarda los datos en PostgreSQL.
Proyecto de DSY1104 Desarrollo Fullstack II (Duoc UC).

Grupo 1: Francisco Figueroa, Jose Salas, Benjamin Jorquera y Santiago Vega.

El repositorio tiene dos proyectos independientes, cada uno con su propio `package.json`:

| Carpeta | Contenido | Puerto |
|---|---|---|
| [`api/`](api) | API REST en Express 5 conectada a PostgreSQL | 3001 |
| [`web/`](web) | Página web en React 19 + Vite, con pruebas en Jasmine y Karma | 5173 |

## Tecnologías

| Uso | Herramienta |
|---|---|
| Framework de frontend | React 19 + Vite |
| Navegación | React Router 7 |
| Diseño responsivo | Bootstrap 5 + React Bootstrap |
| API (backend) | Express 5 sobre Node.js |
| Base de datos | PostgreSQL, con el cliente `pg` |
| Pruebas del frontend | Jasmine (con React Testing Library), ejecutadas con Karma en Chrome, Chromium o Firefox |
| Cobertura | karma-coverage + babel-plugin-istanbul |
| Pruebas de la API | Ejecutor de pruebas de Node (`node --test`) |

## Requisitos

| Requisito | Versión | Motivo |
|---|---|---|
| Node.js | **20.19 o superior** (en la rama 20), o **22.12 o superior** | Mínimo que exige Vite 7. Se probó con Node 24.22 |
| npm | 10 o superior | Viene incluido con Node.js. Se probó con npm 11.19 |
| PostgreSQL | 14 o superior | Base de datos de productos, usuarios y compras. Se probó con PostgreSQL 18 |
| Navegador para las pruebas | Una versión actual de Chrome, Chromium (incluido Ungoogled Chromium) o Firefox | Karma ejecuta las pruebas en un navegador real. Se probó con Chrome 157 |
| Git | Cualquier versión reciente | Solo para clonar el repositorio |

Versiones principales (las exactas quedan fijadas en el `package-lock.json` de cada carpeta):

| Paquete | Versión | Carpeta |
|---|---|---|
| Express / pg | 5.3 / 8.23 | `api/` |
| React / React DOM | 19.3 | `web/` |
| Vite / @vitejs/plugin-react | 7.3 / 5.2 | `web/` |
| React Router DOM | 7.18 | `web/` |
| Bootstrap / React Bootstrap | 5.3 / 2.10 | `web/` |
| Karma | 6.4 | `web/` |
| Jasmine (`jasmine-core` / `karma-jasmine`) | 4.6 / 5.1 | `web/` |
| React Testing Library | 16.3 | `web/` |
| webpack / babel-loader (solo para las pruebas) | 5.112 / 9.2 | `web/` |

## Instalación

```bash
git clone https://github.com/Fran-informatica/Fullstack2_P_and_P_Grupo1.git
cd Fullstack2_P_and_P_Grupo1
```

```bash
cd api
npm ci
```

```bash
cd web
npm ci
```

`npm ci` instala exactamente las versiones de `package-lock.json`; `npm install` también funciona. La instalación se hace una vez en cada carpeta, o de nuevo si cambian las dependencias.

### Configurar la conexión a PostgreSQL

Dentro de `api/`, copiar `.env.example` como `.env` y completar la contraseña del usuario de PostgreSQL (`PGPASSWORD`). El resto de los valores sirve para una instalación local por defecto.

```bash
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

`.env` contiene la contraseña: está en `.gitignore` y no debe subirse al repositorio ni incluirse en la entrega.

## Ejecución (dos terminales)

En `api/`:

```bash
npm start
```

La primera vez crea la base `pixel_play` (si el usuario tiene permiso para crear bases), las tablas y el catálogo inicial. Queda en `http://localhost:3001/api`.

En `web/`:

```bash
npm run dev
```

La página queda en `http://localhost:5173`. Vite reenvía las peticiones a `/api` hacia la API, así que ambas deben estar corriendo. Cada una se detiene con `Ctrl + C`.

Si la API usa otro puerto, se cambia `API_PORT` en `api/.env` y se indica la misma dirección en `API_URL` de `web/.env` (ver `web/.env.example`).

## Comandos

| Carpeta | Comando | Qué hace |
|---|---|---|
| `api/` | `npm start` | Inicia la API |
| `api/` | `npm run dev` | Inicia la API y la reinicia al guardar cambios |
| `api/` | `npm test` | Pruebas de validación y seguridad; no necesitan PostgreSQL |
| `web/` | `npm run dev` | Servidor de desarrollo |
| `web/` | `npm run build` | Versión de producción en `web/dist/` |
| `web/` | `npm run preview` | Sirve `web/dist/` (también reenvía `/api`, con la API corriendo) |
| `web/` | `npm test` | Pruebas con la ventana del navegador visible; quedan atentas a los cambios |
| `web/` | `npm run test:ci` | Pruebas una sola vez, sin ventana, con el resumen en la terminal |

## Pruebas del frontend

```bash
npm test
```

Se ejecuta en `web/`. Abre el navegador con Karma y muestra los resultados de Jasmine en la ventana (botón **DEBUG** para verlos en detalle). Queda atento a los cambios y se detiene con `Ctrl + C`. No conviene hacer clic en los enlaces de la ventana principal de Karma ni cerrarla: para revisar, usar la pestaña DEBUG.

```bash
npm run test:ci
```

Ejecuta una sola vez sin ventana (headless) y muestra el resumen en la terminal. En ambos casos el reporte de cobertura queda en `web/coverage/index.html`.

Las pruebas no necesitan la API ni PostgreSQL: `fetch` se reemplaza por un espía de Jasmine (`simularApi` y `simularApiTienda` en `web/src/tests/helpers.jsx`) que responde como la API.

### Elegir el navegador

Por defecto se usa **Google Chrome**. El navegador se cambia con la variable de entorno `KARMA_BROWSER` (`Chrome`, `Chromium` o `Firefox`), y la ruta de un Chrome o Chromium que no esté en la ubicación habitual se indica con `CHROME_BIN`.

```bash
# Linux / macOS / Git Bash
KARMA_BROWSER=Firefox npm test
CHROME_BIN=$(which chromium) npm test
```

```powershell
# Windows PowerShell
$env:KARMA_BROWSER = "Firefox"; npm test
$env:CHROME_BIN = "C:\ruta\a\ungoogled-chromium\chrome.exe"; npm test
```

En PowerShell la variable queda definida hasta cerrar la terminal; se quita con `Remove-Item Env:KARMA_BROWSER` o `Remove-Item Env:CHROME_BIN`. Si Chromium está instalado como **Flatpak** en Linux, Karma no puede abrirlo directamente; conviene instalarlo desde el gestor de paquetes de la distribución o usar Firefox.

## Estructura

```
api/
├── src/
│   ├── index.js           Inicio: prepara la base y escucha en 127.0.0.1
│   ├── app.js             Rutas de Express
│   ├── config.js          Lectura de .env
│   ├── db.js              Conexión a PostgreSQL y transacciones
│   ├── esquema.sql        Tablas
│   ├── prepararBase.js    Crea la base, las tablas y el catálogo inicial si faltan
│   ├── seguridad.js       Contraseñas con scrypt y tokens de sesión
│   ├── validacion.js      Validación de carritos y productos
│   └── dominio/           Catálogo, cálculos del carrito, boleta y validaciones (copias de web/)
├── tests/                 Pruebas de la API
└── .env.example           Plantilla de la conexión

web/
├── src/
│   ├── App.jsx            Rutas y proveedores de contexto
│   ├── App.test.jsx       Pruebas originales del grupo, adaptadas a Jasmine
│   ├── main.jsx           Punto de entrada
│   ├── assets/style.css   Paleta y estilos propios
│   ├── components/        Navbar, Footer, ProductCard, ProductGrid, Filters, Carousel, CartToast,
│   │                      EstadoCarga, CartIcon y UserIcon
│   ├── context/           CartContext (carrito) y AuthContext (sesión)
│   ├── data/              Acceso a la API con fetch (api.js) y funciones de productos, usuarios y compras
│   ├── hooks/             useCarga: estado de carga y error de las peticiones
│   ├── pages/             Home, Products, ProductDetail, Cart, Contact, Login, Register, Profile, NotFound
│   ├── utils/             Funciones puras: carrito, boleta y validaciones
│   └── tests/             Pruebas unitarias y helpers.jsx
├── public/assets/         Imágenes y video de los productos
├── karma.conf.cjs         Configuración de Karma, Jasmine, webpack, cobertura y navegador
└── vite.config.js         Servidor de desarrollo y reenvío de /api
```

`api/src/dominio/` repite algunos archivos de `web/src/` (catálogo inicial, cálculos del carrito, boleta y validaciones) para que la API no dependa de la carpeta de la página. Si se cambia uno, hay que cambiar también su copia; cada archivo lo indica en la primera línea.

## Rutas de la página

| Ruta | Vista |
|---|---|
| `/` | Inicio con productos destacados |
| `/productos` | Catálogo con filtro por categoría |
| `/producto/:id` | Detalle con carrusel de imágenes y video |
| `/carrito` | Carrito con cantidades, total y compra |
| `/perfil` | Perfil e historial de boletas |
| `/registro`, `/login` | Registro e inicio de sesión con validaciones |
| `/contacto` | Formulario de contacto con validaciones |

## API

| Método y ruta | Uso | Requiere |
|---|---|---|
| `GET /api/productos` | Catálogo (`?destacados=true` para los destacados) | — |
| `GET /api/productos/:id` | Detalle de un producto | — |
| `POST /api/productos` | Crear producto | Token de administración |
| `PUT /api/productos/:id` | Modificar producto | Token de administración |
| `DELETE /api/productos/:id` | Eliminar producto | Token de administración |
| `POST /api/usuarios` | Registrar cuenta | — |
| `POST /api/sesiones` | Iniciar sesión; devuelve el token | — |
| `DELETE /api/sesiones` | Cerrar sesión | Token de sesión |
| `GET /api/compras` | Boletas de la cuenta con sesión | Token de sesión |
| `POST /api/compras` | Comprar el carrito (`{ items: [{ id, quantity }] }`) | Token de sesión |

Los tokens se envían en el encabezado `Authorization: Bearer <token>`.

- La API calcula precios y totales con los datos de la base; no acepta precios enviados desde el navegador.
- Las compras siempre quedan a nombre del usuario del token.
- Las rutas de administración de productos quedan desactivadas mientras `ADMIN_TOKEN` esté vacío en `api/.env`.

## Persistencia en PostgreSQL

| Tabla | Contenido |
|---|---|
| `productos` | Catálogo (CRUD) |
| `usuarios` | Cuentas; la contraseña se guarda cifrada con scrypt, nunca en texto plano |
| `sesiones` | Hash del token de cada sesión iniciada, con vencimiento a las 8 horas |
| `compras` y `compra_items` | Boletas; el nombre y el precio se copian al comprar |

- En el navegador, `sessionStorage.sesionActiva` guarda el usuario y el token de la sesión.
- El carrito vive en memoria y se reinicia al recargar.

## Entrega

Comprimir el proyecto **sin** las carpetas `node_modules`, `dist` ni `coverage`, y **sin** los archivos `.env`.
