# CLAUDE.md - Guía de Desarrollo para Claude Code

Guía de desarrollo para el repositorio **`panteon-frontend`**.

---

## 🚫 REGLA ESTRICTA DE ICONOGRAFÍA (PROHIBIDO EL USO DE EMOJIS)

> **NO USAR EMOJIS EN NINGÚN COMPONENTE O VISTA DE LA INTERFAZ.**
> Toda iconografía debe importarse de **[`lucide-react`](https://lucide.dev/icons)** (`^1.34.0`).

---

## 🎨 ESTÁNDAR DE ESTILOS: TAILWIND CSS

> **Toda la interfaz debe estilizarse con clases de Tailwind CSS v4.**
> - Usar `className="..."` en lugar de objetos de estilo inline.
> - Plugin activo en Vite: `@tailwindcss/vite`.
> - Base de estilos en `src/index.css` (`@import "tailwindcss";`).

---

## ⚡ Comandos de Desarrollo

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `npm run build` | Compilación para producción |
| `npm run preview` | Previsualiza el bundle de producción |
| `npm run lint` | Ejecuta ESLint |

---

## 🏛️ Estructura y Módulos

- `src/components/common/`: Componentes comunes (`Navbar.jsx`, `StatsCards.jsx`, `ContextMenu.jsx`).
- `src/components/modals/`: Modales (`ModalRegistroFosa.jsx`, `ModalEditarFosa.jsx`).
- `src/constants/`: Datos y constantes (`panteonData.js`).
- `src/pages/`: Vistas principales (`ControlEspacios.jsx`, `PlanoGeneral.jsx`, `ReportesIngresos.jsx`, `Dashboard.jsx`).
- `src/services/`: Capa HTTP (`panteonService.js`).
- `src/App.jsx`: Orquestador principal.
- `src/index.css`: Hoja de estilos con `@import "tailwindcss";`.
