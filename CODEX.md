# CODEX.md - Guía para OpenAI Codex y GitHub Copilot

Directrices para desarrollo en **`panteon-frontend`**.

---

## 🚫 REGLA ESTRICTA DE ICONOGRAFÍA
- **Prohibido el uso de emojis.**
- Usar siempre **`lucide-react`** (`^1.34.0`).

---

## 🎨 ESTÁNDAR DE ESTILOS: TAILWIND CSS
- Usar clases de **Tailwind CSS v4** (`className="..."`) en todos los componentes.
- Cero estilos inline con objetos JS.

---

## ⚙️ Arquitectura
- `src/components/common/`: Componentes comunes (`Navbar.jsx`, `StatsCards.jsx`, `ContextMenu.jsx`).
- `src/components/modals/`: Modales (`ModalRegistroFosa.jsx`, `ModalEditarFosa.jsx`).
- `src/constants/`: Constantes (`panteonData.js`).
- `src/pages/`: Vistas (`ControlEspacios.jsx`, `PlanoGeneral.jsx`, `ReportesIngresos.jsx`, `Dashboard.jsx`).
- `src/services/`: Conectores a la API (`panteonService.js`).
- `src/App.jsx`: Orquestador principal.
- `src/index.css`: `@import "tailwindcss";`.
