// src/constants/permisoTumbaConfig.js
import { formatearNumeroFosa, formatearFecha } from '../utils/busquedaUtils';

const KEY_PLANTILLA_PERMISO = 'panteon_soledad_plantilla_permiso_tumba_v1';
const KEY_PERMISOS_POR_ESPACIO = 'panteon_soledad_permisos_tumba_v1';

export const PLANTILLA_PERMISO_DEFAULT = {
  tituloEncabezado: 'Panteón La Soledad',
  subtituloPermiso: 'Permiso de Arreglo de Tumba',
  mostrarSubtitulo: false,
  tituloMedidas: 'MEDIDAS AUTORIZADAS',
  largoPredeterminado: '2.30 m',
  anchoPredeterminado: '1.30 m',
  advertenciaPredeterminada: 'NO SE PUEDEN REALIZAR NICHOS',
  mostrarAdvertencia: true,
  tituloCondiciones: 'CONDICIONES',
  condiciones: [
    'El trabajo deberá realizarse únicamente dentro de las medidas autorizadas.',
    'No se podrá invadir el espacio de otras tumbas ni pasillos.',
    'El responsable deberá mantener limpia el área durante y después de realizar el trabajo.',
    'El permiso deberá presentarse cuando sea requerido por la administración.',
    'El material para el arreglo de la tumba deberá traerse conforme se vaya utilizando, de acuerdo con el avance de los trabajos.'
  ],
  mostrarSello: true,
  mostrarMarcaAgua: true,
  mostrarBordesOrnamentales: true,
  mostrarFirmasDigitales: true,
  firmantes: {
    presidente: {
      visible: true,
      nombre: 'Prof. Raúl González Rivera',
      cargo: 'Presidente'
    },
    secretario: {
      visible: true,
      nombre: 'Carlos Alberto Vázquez García',
      cargo: 'Secretario'
    },
    tesorero: {
      visible: true,
      nombre: 'Mario Francisco García Faz',
      cargo: 'Tesorero'
    },
    vocal1: {
      visible: true,
      nombre: 'Efrén Flores Romero',
      cargo: 'Vocal 1'
    },
    vocal2: {
      visible: true,
      nombre: 'Javier Martínez Martínez',
      cargo: 'Vocal 2'
    }
  }
};

function fechaHoyFormateada() {
  const ahora = new Date();
  const d = String(ahora.getDate()).padStart(2, '0');
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const y = ahora.getFullYear();
  return `${d}/${m}/${y}`;
}

function clonarPlantillaBase() {
  return {
    ...PLANTILLA_PERMISO_DEFAULT,
    condiciones: [...PLANTILLA_PERMISO_DEFAULT.condiciones],
    firmantes: {
      presidente: { ...PLANTILLA_PERMISO_DEFAULT.firmantes.presidente },
      secretario: { ...PLANTILLA_PERMISO_DEFAULT.firmantes.secretario },
      tesorero: { ...PLANTILLA_PERMISO_DEFAULT.firmantes.tesorero },
      vocal1: { ...PLANTILLA_PERMISO_DEFAULT.firmantes.vocal1 },
      vocal2: { ...PLANTILLA_PERMISO_DEFAULT.firmantes.vocal2 }
    }
  };
}

/**
 * Obtiene la plantilla institucional actual para el Permiso de Arreglo de Tumba.
 */
export function obtenerPlantillaPermisoTumba() {
  const base = clonarPlantillaBase();
  try {
    const raw = localStorage.getItem(KEY_PLANTILLA_PERMISO);
    if (!raw) return base;
    const guardada = JSON.parse(raw);
    return {
      ...base,
      ...guardada,
      condiciones: Array.isArray(guardada.condiciones)
        ? guardada.condiciones
        : base.condiciones,
      firmantes: {
        presidente: { ...base.firmantes.presidente, ...(guardada.firmantes?.presidente || {}) },
        secretario: { ...base.firmantes.secretario, ...(guardada.firmantes?.secretario || {}) },
        tesorero: { ...base.firmantes.tesorero, ...(guardada.firmantes?.tesorero || {}) },
        vocal1: { ...base.firmantes.vocal1, ...(guardada.firmantes?.vocal1 || {}) },
        vocal2: { ...base.firmantes.vocal2, ...(guardada.firmantes?.vocal2 || {}) }
      }
    };
  } catch {
    return base;
  }
}

/**
 * Guarda la plantilla institucional personalizada para el Permiso de Arreglo de Tumba.
 */
export function guardarPlantillaPermisoTumba(plantilla) {
  try {
    localStorage.setItem(KEY_PLANTILLA_PERMISO, JSON.stringify(plantilla));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

/**
 * Restablece la plantilla institucional del Permiso de Arreglo de Tumba a sus valores originales.
 */
export function restablecerPlantillaPermisoTumba() {
  try {
    localStorage.removeItem(KEY_PLANTILLA_PERMISO);
  } catch {
    // Ignorar errores de almacenamiento
  }
  return clonarPlantillaBase();
}

function obtenerClaveEspacio(espacio) {
  if (!espacio) return '__EN_BLANCO__';
  return String(espacio.id || espacio.codigo || '__SIN_CLAVE__');
}

function extraerNombresDifuntos(espacio) {
  if (!espacio) return '';
  const historial = Array.isArray(espacio.historialDifuntos) ? espacio.historialDifuntos : [];
  const nombres = historial
    .map((item) => (typeof item === 'string' ? item : item?.nombre || item?.nombreDifunto || '').trim())
    .filter(Boolean);

  if (nombres.length > 0) {
    return [...new Set(nombres)].join(' / ');
  }
  return (espacio.ultimoDifuntoNombre || espacio.nombreDifunto || '').trim();
}

/**
 * Construye los datos base del permiso a partir de un registro de espacio/fosa.
 */
export function construirDatosBasePermiso(espacio, plantilla = obtenerPlantillaPermisoTumba()) {
  if (!espacio) {
    return {
      tumba: '',
      seccion: '',
      responsable: '',
      difunto: '',
      donacion: '',
      expedicion: fechaHoyFormateada(),
      largoAutorizado: plantilla.largoPredeterminado || '2.30 m',
      anchoAutorizado: plantilla.anchoPredeterminado || '1.30 m',
      advertencia: plantilla.advertenciaPredeterminada || 'NO SE PUEDEN REALIZAR NICHOS',
      observaciones: ''
    };
  }

  const codigo = espacio.codigo || espacio.numero || '';
  const tumba = formatearNumeroFosa(codigo) || codigo || '';
  const fechaPermisoExistente = espacio.fechaPermisoArreglo
    ? formatearFecha(espacio.fechaPermisoArreglo, '')
    : '';

  return {
    tumba,
    seccion: (espacio.seccionNombre || espacio.seccion || '').trim(),
    responsable: (espacio.titularNombre || '').trim(),
    difunto: extraerNombresDifuntos(espacio),
    donacion: espacio.donacionArreglo != null ? String(espacio.donacionArreglo) : '',
    expedicion: fechaPermisoExistente || fechaHoyFormateada(),
    largoAutorizado: plantilla.largoPredeterminado || '2.30 m',
    anchoAutorizado: plantilla.anchoPredeterminado || '1.30 m',
    advertencia: plantilla.advertenciaPredeterminada || 'NO SE PUEDEN REALIZAR NICHOS',
    observaciones: (espacio.observacionesArreglo || '').trim()
  };
}

/**
 * Obtiene los datos del permiso combinando los datos de la fosa y las ediciones guardadas.
 */
export function obtenerDatosPermisoEspacio(espacio) {
  const plantilla = obtenerPlantillaPermisoTumba();
  const base = construirDatosBasePermiso(espacio, plantilla);
  const clave = obtenerClaveEspacio(espacio);

  try {
    const raw = localStorage.getItem(KEY_PERMISOS_POR_ESPACIO);
    if (!raw) return base;
    const mapa = JSON.parse(raw);
    if (!mapa || !mapa[clave]) return base;
    return {
      ...base,
      ...mapa[clave]
    };
  } catch {
    return base;
  }
}

/**
 * Guarda las modificaciones del permiso asociadas al espacio seleccionado.
 */
export function guardarDatosPermisoEspacio(espacio, datosPermiso) {
  const clave = obtenerClaveEspacio(espacio);
  try {
    const raw = localStorage.getItem(KEY_PERMISOS_POR_ESPACIO);
    const mapa = raw ? JSON.parse(raw) : {};
    mapa[clave] = datosPermiso;
    localStorage.setItem(KEY_PERMISOS_POR_ESPACIO, JSON.stringify(mapa));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

/**
 * Elimina las personalizaciones guardadas del permiso para restaurar los datos originales del padrón.
 */
export function limpiarDatosPermisoEspacio(espacio) {
  const clave = obtenerClaveEspacio(espacio);
  try {
    const raw = localStorage.getItem(KEY_PERMISOS_POR_ESPACIO);
    if (raw) {
      const mapa = JSON.parse(raw);
      delete mapa[clave];
      localStorage.setItem(KEY_PERMISOS_POR_ESPACIO, JSON.stringify(mapa));
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
  return construirDatosBasePermiso(espacio);
}
