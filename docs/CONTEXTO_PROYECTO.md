# CONTEXTO_PROYECTO.md - Sistema Integral de Gestión Catastral y Financiera
## Panteón La Soledad • San Francisco Tepojaco

---

## 🎨 Paleta de Colores Oficial (Eliza Palette 2026)

| Color | HEX | Rol en el Sistema |
|---|:---:|---|
| Sage Green | `#98A086` | Fosas libres/disponibles, cuentas "Al Corriente", botón "Cobrar Refrendo", porcentajes positivos. |
| Dusty Rose | `#A76D5E` | Fosas ocupadas, cuentas con adeudo, botones destacados de creación, curvas de egresos. |
| Golden Tan | `#C4A071` | Zona de nichos (cenizas), tarjetas de arqueo, badges de tesorería, acentos institucionales. |
| Warm Beige | `#DFCCB1` | Fondo general (`#FAF7F2`), submenú lateral, pasillo central continuo, pergamino oficial de títulos. |
| Terracotta Brown | `#846044` | Riel lateral del Sidebar, botones de guardado y login, encabezados oscuros, portón/barda de ladrillo. |

---

## 🗄️ Arquitectura de Base de Datos

- **Nombre de BD Oficial:** `PanteonLaSoledad`
- **Motor Cliente:** IndexedDB (`PanteonLaSoledad`)
- **Host / Puerto (si aplica backend REST):** `localhost:5000` / `localhost:5432`

### Tablas / Almacenes Principales:
1. `fosas`: Registros catastrales de fosas y nichos.
2. `expedientes`: Documentos digitales e imágenes adjuntas en Base64/PDF por código de lote.
3. `movimientos`: Registros de refrendos, pagos de derechos y servicios de caja.
4. `configuracion`: Parámetros institucionales y preferencias del sistema.

---

## ⚡ Módulos Funcionales

1. **Dashboard Ejecutivo:** KPIs en tiempo real con Recharts.
2. **Padrón de Fosas y Nichos:** Paginación (25, 50, 100), filtros multidimensionales y expediente digital.
3. **Plano General:** Mural cartográfico 4x3 con asignación de secciones y ficha interactiva.
4. **Caja Chica y Tesorería:** Arqueo de efectivo diario y libro de ingresos/egresos.
5. **Cédula Oficial de Título:** Formato institucional imprimible.
6. **Módulo de Login:** Acceso administrativo con credenciales seguras.
