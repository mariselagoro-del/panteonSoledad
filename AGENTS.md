# AGENTS.md - Guía Global para Agentes de IA

Referencia universal para cualquier agente inteligente o asistente de código en **`panteon-frontend`**.

---

## 🚫 REGLA SUPREMA: PROHIBIDO USAR EMOJIS (USAR LUCIDE-REACT)

> [!CAUTION]
> **NO UTILIZAR EMOJIS EN LA INTERFAZ DE USUARIO.**
> - Queda estrictamente prohibido el uso de emojis Unicode en botones, títulos, tarjetas estadísticas, tablas o modales.
> - Toda iconografía debe implementarse con componentes de **[`lucide-react`](https://lucide.dev/icons)**.

---

## 🏛️ REGLA INSTITUCIONAL: NOMBRE OFICIAL "PANTEÓN LA SOLEDAD"

> [!IMPORTANT]
> **PROHIBIDO EL USO DE LA PALABRA "MUNICIPAL".**
> - El nombre en todo el sistema, pantallas, membretes, cédulas, recibos, login y constantes debe ser exclusivamente **`Panteón La Soledad`**.
> - Nunca utilizar *'Panteón Municipal'* ni *'Panteón Municipal La Soledad'*.

---

## 🎨 ESTÁNDAR DE DISEÑO: TAILWIND CSS

> [!IMPORTANT]
> - Utilizar exclusivamente **Tailwind CSS v4** con clases utilitarias (`className="..."`).
> - No emplear objetos de estilo JS inline.

## REGLA DE SINCRONIZACIÓN CONTINUA CON GITHUB

> [!IMPORTANT]
> **SUBIR TODOS LOS CAMBIOS A GITHUB DE FORMA INMEDIATA.**
> - Cada vez que se realice un cambio, modificación o mejora en el código, el agente debe hacer `git commit` y `git push origin main` automáticamente.
> - Esto mantiene el despliegue en la nube (Render) siempre actualizado y sincronizado en tiempo real.

---


## 🧭 Mapa Rápido del Repositorio

- `src/components/common/`: Componentes comunes (`Navbar.jsx`, `StatsCards.jsx`, `ContextMenu.jsx`).
- `src/components/modals/`: Modales (`ModalRegistroFosa.jsx`, `ModalEditarFosa.jsx`).
- `src/pages/`: Páginas y pestañas (`ControlEspacios.jsx`, `PlanoGeneral.jsx`, `ReportesIngresos.jsx`, `Dashboard.jsx`).
- `src/constants/`: Constantes y estructuras iniciales (`panteonData.js`).
- `src/services/`: Capa HTTP (`panteonService.js`).
- `src/App.jsx`: Componente orquestador principal.
- `src/index.css`: `@import "tailwindcss";`.

---

## ⚡ Comandos Rápidos

| Acción | Comando |
|---|---|
| Servidor de Desarrollo | `npm run dev` |
| Compilación Producción | `npm run build` |
| Linting | `npm run lint` |
| Vista Previa de Build | `npm run preview` |
