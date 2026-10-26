// src/constants/panteonData.js
// Constantes y datos iniciales del sistema catastral del Panteón La Soledad
import datasetReal from './panteonDataset.json';

export const METADATA_PANTEON = datasetReal.metadata || {
  panteonNombre: 'Panteón La Soledad',
  ubicacion: 'San Francisco Tepojaco, Cuautitlán Izcalli, Edo. Méx.'
};

export const TOTAL_FOSAS_CAPACIDAD = 3000;
export const TOTAL_NICHOS_CAPACIDAD = 500;

export const SECCIONES_INICIALES = [
  { id: 1, nombre: 'Sección 1', subtexto: 'Centro Poniente', capacidadEstimada: 700 },
  { id: 2, nombre: 'Sección 2', subtexto: 'Centro y Frente Oriente', capacidadEstimada: 1100 },
  { id: 3, nombre: 'Sección 3', subtexto: 'Fondo Oriente', capacidadEstimada: 450 },
  { id: 4, nombre: 'Sección 4', subtexto: 'Fondo Poniente', capacidadEstimada: 400 },
  { id: 5, nombre: 'Sección 5', subtexto: 'Frente Poniente / Entrada', capacidadEstimada: 350 },
  { id: 6, nombre: 'Zona de Nichos', subtexto: 'Sector de Urnas y Cenizas', capacidadEstimada: 500 },
];

// Distribución oficial de la cuadrícula 4 columnas x 3 filas (12 celdas) según el mural histórico
export const DISTRIBUCION_PLANO_INICIAL = [
  // Fila 1 (Casillas 1 a 4) - Nivel Superior / Fondo
  { id: 1, celda: 1, col: 1, fila: 1, nombreSeccion: 'Capilla / Nichos', tipo: 'Nichos', color: 'purple' },
  { id: 2, celda: 2, col: 2, fila: 1, nombreSeccion: 'Sección 4', tipo: 'Fosas', color: 'blue' },
  { id: 3, celda: 3, col: 3, fila: 1, nombreSeccion: 'Sección 1 (Alta)', tipo: 'Fosas', color: 'blue' },
  { id: 4, celda: 4, col: 4, fila: 1, nombreSeccion: 'Sección 3', tipo: 'Fosas', color: 'blue' },
  
  // Fila 2 (Casillas 5 a 8) - Nivel Medio
  { id: 5, celda: 5, col: 1, fila: 2, nombreSeccion: 'Andador Poniente', tipo: 'Infraestructura', color: 'slate' },
  { id: 6, celda: 6, col: 2, fila: 2, nombreSeccion: 'Sección 1 (Baja)', tipo: 'Fosas', color: 'blue' },
  { id: 7, celda: 7, col: 3, fila: 2, nombreSeccion: 'Sección 2 (Alta)', tipo: 'Fosas', color: 'blue' },
  { id: 8, celda: 8, col: 4, fila: 2, nombreSeccion: 'Sección 2 (Centro)', tipo: 'Fosas', color: 'blue' },

  // Fila 3 (Casillas 9 a 12) - Nivel Frente / Acceso
  { id: 9, celda: 9, col: 1, fila: 3, nombreSeccion: 'Sección 5 (Frente)', tipo: 'Fosas', color: 'blue' },
  { id: 10, celda: 10, col: 2, fila: 3, nombreSeccion: 'Sección 5 (Acceso)', tipo: 'Fosas', color: 'blue' },
  { id: 11, celda: 11, col: 3, fila: 3, nombreSeccion: 'Sección 2 (Frente)', tipo: 'Fosas', color: 'blue' },
  { id: 12, celda: 12, col: 4, fila: 3, nombreSeccion: 'Puerta Principal / Calzada', tipo: 'Infraestructura', color: 'amber' },
];

export const REGISTROS_FOSAS_INICIALES = datasetReal.espacios || [];
export const MOVIMIENTOS_FINANCIEROS_INICIALES = datasetReal.movimientosFinancieros || [];
