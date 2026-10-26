# GEMINI.md - Contexto y Guía del Proyecto para Google Gemini / Antigravity

Este archivo proporciona el contexto completo de arquitectura, directrices y estándares del sistema **`panteon-frontend`** para el modelo Gemini y asistentes de Google Antigravity.

---

## 🚫 REGLA ESTRICTA DE ICONOGRAFÍA (PROHIBIDO EL USO DE EMOJIS)

> [!IMPORTANT]
> **NO UTILIZAR EMOJIS EN LA INTERFAZ NI EN COMPONENTES.**
> - Está estrictamente prohibido incrustar caracteres emoji de Unicode (ej: 🏛️, 🪦, 🌱, 🏢, 🏺, ✨, 📁, 🗺️, 📊, ✏️, 💾, 📞, ✉️, etc.).
> - Toda iconografía debe implementarse exclusivamente mediante **[`lucide-react`](https://lucide.dev/icons)** (`^1.34.0`).
> - Importación directa de componentes SVG vectoriales de Lucide:
>   ```javascript
>   import { Landmark, Archive, Sprout, Layers, Sparkles, Folder, Map, BarChart3, Plus, Pencil, Save, X, Phone, Mail, Search, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
>   ```

---

## 🎨 ESTÁNDAR DE ESTILOS: TAILWIND CSS

> [!TIP]
> **Toda la maquetación y diseño se gestiona mediante Tailwind CSS v4.**
> - Utiliza clases utilitarias de Tailwind (`className="..."`).
> - No utilices objetos de estilo JS inline (`style={{...}}`) ni CSS puro adicional salvo casos indispensables de cálculo dinámico.
> - Paleta de colores recomendada: `blue-600`/`blue-700` (acciones primarias), `slate-800`/`slate-900` (textos y fondos institucionales), `emerald-600` (disponibles/al corriente), `rose-600` (ocupados/adeudo), `amber-600` (advertencias/nichos).

---

## 🏛️ REGLA INSTITUCIONAL: NOMBRE OFICIAL "PANTEÓN LA SOLEDAD"

> [!IMPORTANT]
> **PROHIBIDO EL USO DE LA PALABRA "MUNICIPAL".**
> - El nombre oficial en todo el sistema, pantallas, membretes, cédulas, recibos, login y constantes debe ser exclusivamente **`Panteón La Soledad`**.
> - Queda estrictamente prohibido utilizar *'Panteón Municipal'* ni *'Panteón Municipal La Soledad'*.

---

## 🏛️ Propósito y Alcance

**`panteon-frontend`** es el cliente web para la gestión administrativa, cartográfica y financiera del **Panteón La Soledad (fundado en 1908)**.

### Módulos Principales:
1. **Control General de Espacios**: Padrón con filtrado multidimensional en tiempo real (por código, sección, tipo, titular, difunto, teléfono/correo, estatus de pago y notas).
2. **Plano General (4x3)**: Representación visual estructurada en 4 columnas y 3 filas (12 casillas funcionales) con soporte de personalización y reasignación de áreas.
3. **Historial de Inhumaciones**: Registro cronológico de múltiples difuntos por lote (con CURP, fecha de inhumación y causa de defunción).
4. **Reportes Estadísticos y Financieros**: Cálculo automático de ocupación (%) para fosas y nichos, semáforo de cobro/refrendo y filtro de datos para impresión.

---

## ⚙️ Especificaciones Técnicas

- **Entorno**: Node.js ESM (`"type": "module"`)
- **Framework de UI**: React 19 (`19.2.8`)
- **Herramienta de Compilación**: Vite 8 (`8.2.2`) con `@tailwindcss/vite`
- **Framework CSS**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`)
- **Iconografía Oficial**: `lucide-react` (`1.34.0`)
- **Visualización / Gráficos**: `recharts` (`3.10.1`)
- **Calidad de Código**: ESLint 10 (`eslint.config.js`)

---

## 📂 Organización Modular de Archivos

```text
panteon-frontend/
├── src/
│   ├── assets/              # Recursos gráficos y multimedia
│   ├── components/          # Componentes modulares reutilizables
│   │   ├── common/          # Componentes transversales (Navbar, StatsCards, ContextMenu)
│   │   └── modals/          # Modales interactivos (ModalRegistroFosa, ModalEditarFosa)
│   ├── constants/           # Constantes y datos iniciales (panteonData.js)
│   ├── pages/               # Vistas principales del sistema (ControlEspacios, PlanoGeneral, ReportesIngresos, Dashboard)
│   ├── services/            # Abstracción de API REST (panteonService.js)
│   ├── App.jsx              # Orquestador limpio y desacoplado
│   ├── index.css            # Importación de Tailwind CSS (@import "tailwindcss";)
│   └── main.jsx             # Render inicial con React.StrictMode
├── .cursor/rules/           # Reglas de desarrollo para Cursor
├── .claude/                 # Configuración de Claude Code
├── .gemini/                 # Configuración de Gemini CLI / Antigravity
├── .openai/                 # Configuración de Codex / Copilot
├── package.json
└── vite.config.js
```

---

## 💡 Instrucciones para Generación de Código con Gemini

1. **Iconografía**: Usa exclusivamente iconos de `lucide-react`. No introduzcas emojis.
2. **Estilizado**: Usa siempre clases utilitarias de **Tailwind CSS**.
3. **Gestión de Estado**: Usa siempre actualizaciones inmutables en React.
4. **Validaciones**: Valida campos obligatorios (`titularNombre`, `fechaInhumacion`, `numeroEspacio`) antes de enviar formularios.
5. **Idioma**: Todos los textos de interfaz, mensajes de alerta, nombres de variables de negocio y comentarios deben estar en **español**.
