# Turpial Dorado

Sistema de **Gestión Agrícola Inteligente** con pantalla combinada de registro e inicio de sesión.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

## Estructura

```
src/
  components/
    AuthPage.jsx        # Layout principal (header, card, footer)
    RegistrationForm.jsx # Panel izquierdo — Crear cuenta
    LoginForm.jsx        # Panel derecho — Iniciar sesión
    AuthPage.css         # Estilos de la pantalla
  App.jsx
  main.jsx
  index.css
public/
  logo-turpial.svg
```

## Paleta de colores

| Uso            | Color     |
|----------------|-----------|
| Verde oscuro   | `#1a3d2e` |
| Dorado         | `#d4a843` |
| Fondo crema    | `#f5f0e6` |

## Build web

```bash
npm run build
npm run preview
```

## App de escritorio (instalador Windows)

Tu código de desarrollo **no cambia**: sigues usando `npm run dev` en el navegador como siempre. La app de escritorio es una capa extra (Electron) que empaqueta el mismo build.

### Probar como programa (sin instalador)

```bash
npm run desktop
```

Abre la app empaquetada en una ventana de escritorio, usando los archivos de `dist/`.

### Probar en desarrollo con ventana de escritorio

```bash
npm run dev:desktop
```

Vite en caliente + ventana Electron (útil para depurar la versión de escritorio).

### Crear instalador `.exe` para Windows

```bash
npm run build:installer
```

Genera en la carpeta `release/`:

- `AgroApp Setup 1.0.0.exe` — instalador para otros equipos
- La app instalada aparece en el menú Inicio y puede tener acceso directo en el escritorio

Para una prueba más rápida (carpeta portable, sin instalador):

```bash
npm run build:installer:dir
```

### Datos y copias de seguridad

- En el **navegador**, los datos viven en `localStorage` del navegador.
- En la **app instalada**, los datos viven en la carpeta de usuario de Electron (separados del navegador).
- El código fuente en `d:\lll` **no se modifica** al instalar; el instalador solo copia el programa compilado.

### Icono personalizado (opcional)

Para un icono propio en el instalador, agrega `build/icon.ico` (256×256) y en `package.json` → `build.win.icon` apunta a ese archivo.
