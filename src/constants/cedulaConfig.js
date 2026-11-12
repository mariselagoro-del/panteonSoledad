// src/constants/cedulaConfig.js
// Configuración, persistencia y valores predeterminados de la Cédula Oficial de Título de Concesión
// para Panteón La Soledad.

import { formatearNumeroFosa, formatearFecha } from '../utils/busquedaUtils';

export const CEDULA_PLANTILLA_STORAGE_KEY = 'panteon_soledad_cedula_plantilla_v1';
export const CEDULA_DATOS_POR_FOSA_KEY = 'panteon_soledad_cedula_por_fosa_v1';

export const PLANTILLA_CEDULA_DEFAULT = {
  encabezadoSuperior: 'República Mexicana • Estado de México • Municipio de Cuautitlán Izcalli',
  direccionAdministrativa: 'Dirección de Servicios Públicos y Panteones',
  nombrePanteon: 'PANTEÓN LA SOLEDAD',
  ubicacionPanteon: 'San Francisco Tepojaco, Cuautitlán Izcalli',
  tituloDocumento: 'TÍTULO DE CONCESIÓN DE USO A PERPETUIDAD',
  declaracionJuridica:
    'Por medio del presente documento oficial, la Administración del Panteón La Soledad, con fundamento en los reglamentos de panteones y cementerios vigentes, otorga el presente TÍTULO DE CONCESIÓN Y DERECHO DE USO del espacio funerario que a continuación se describe:',
  clausula1Titulo: '1. Obligaciones del Titular:',
  clausula1Texto:
    'Mantener al corriente el pago anual por concepto de refrendo y mantenimiento de áreas comunes en los meses de enero a marzo de cada ejercicio fiscal.',
  clausula2Titulo: '2. Derechos:',
  clausula2Texto:
    'El titular concesionario tiene la facultad exclusiva para autorizar futuras inhumaciones, exhumaciones o colocación de monumentos en el espacio concesionado.',
  firmaAdminTitulo: 'ADMINISTRACIÓN GENERAL',
  firmaAdminSubtitulo: 'Panteón La Soledad',
  firmaTitularTitulo: 'CONCESIONARIO(A) TITULAR',
  piePagina:
    'Documento expedido por el Sistema de Gestión Catastral del Panteón La Soledad • Válido para trámites oficiales y administrativos.'
};

export function obtenerFechaHoyLarga() {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function obtenerPlantillaCedula() {
  try {
    const raw = localStorage.getItem(CEDULA_PLANTILLA_STORAGE_KEY);
    if (!raw) return { ...PLANTILLA_CEDULA_DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      ...PLANTILLA_CEDULA_DEFAULT,
      ...parsed
    };
  } catch {
    return { ...PLANTILLA_CEDULA_DEFAULT };
  }
}

export function guardarPlantillaCedula(plantilla) {
  const limpia = {
    ...PLANTILLA_CEDULA_DEFAULT,
    ...plantilla
  };
  try {
    localStorage.setItem(CEDULA_PLANTILLA_STORAGE_KEY, JSON.stringify(limpia));
  } catch (err) {
    console.warn('No se pudo guardar la plantilla de cédula en localStorage:', err);
  }
  return limpia;
}

export function restablecerPlantillaCedula() {
  try {
    localStorage.removeItem(CEDULA_PLANTILLA_STORAGE_KEY);
  } catch {
    // Ignorar error de almacenamiento
  }
  return { ...PLANTILLA_CEDULA_DEFAULT };
}

export function obtenerClaveEspacioCedula(espacio) {
  if (!espacio) return 'personalizada';
  if (espacio.codigo) return String(espacio.codigo);
  if (espacio.id !== undefined && espacio.id !== null) return String(espacio.id);
  return 'personalizada';
}

export function construirDatosCedulaDesdeEspacio(espacio) {
  if (!espacio) {
    return {
      folioOficial: 'TIT-0000',
      fechaExpedicion: obtenerFechaHoyLarga(),
      numeroFosa: '',
      seccionNombre: '',
      tipoEspacio: 'Fosa',
      construccionTexto: 'Sencilla',
      estatusPago: 'Al Corriente',
      titularNombre: '',
      titularTelefono: '',
      firmaTitularSubtitulo: 'Firma de Aceptación',
      difuntos: [],
      observacionesCedula: ''
    };
  }

  const difuntosBase = Array.isArray(espacio.historialDifuntos)
    ? espacio.historialDifuntos.map((dif) => ({
        nombre: dif.nombre || '',
        parentesco: dif.parentesco || '',
        tipoServicio: dif.tipoServicio || 'Inhumación',
        fecha: formatearFecha(dif.fechaInhumacion || dif.fechaDefuncion, '')
      }))
    : [];

  const numeroFormateado = formatearNumeroFosa(espacio.codigo);
  const construccionBase =
    espacio.tipoConstruccion === 'Sellada'
      ? `Sellada${espacio.fechaSellado ? ` (${formatearFecha(espacio.fechaSellado)})` : ''}`
      : 'Sencilla';

  return {
    folioOficial: espacio.codigo ? `TIT-${numeroFormateado}` : 'TIT-0000',
    fechaExpedicion: obtenerFechaHoyLarga(),
    numeroFosa: numeroFormateado,
    seccionNombre: espacio.seccionNombre || '',
    tipoEspacio: espacio.tipoEspacio || 'Fosa',
    construccionTexto: construccionBase,
    estatusPago: espacio.estatusPago || 'Al Corriente',
    titularNombre: espacio.titularNombre || 'Sin titular registrado',
    titularTelefono: espacio.titularTelefono || '',
    firmaTitularSubtitulo: espacio.titularNombre || 'Firma de Aceptación',
    difuntos: difuntosBase,
    observacionesCedula: ''
  };
}

function leerMapaDatosPorFosa() {
  try {
    const raw = localStorage.getItem(CEDULA_DATOS_POR_FOSA_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function obtenerDatosCedulaEspacio(espacio) {
  const base = construirDatosCedulaDesdeEspacio(espacio);
  const clave = obtenerClaveEspacioCedula(espacio);
  const mapa = leerMapaDatosPorFosa();
  const guardado = mapa[clave];
  if (!guardado || typeof guardado !== 'object') {
    return base;
  }
  return {
    ...base,
    ...guardado,
    difuntos: Array.isArray(guardado.difuntos) ? guardado.difuntos : base.difuntos
  };
}

export function guardarDatosCedulaEspacio(espacio, datos) {
  const clave = obtenerClaveEspacioCedula(espacio);
  const mapa = leerMapaDatosPorFosa();
  mapa[clave] = {
    ...datos,
    actualizadoEn: new Date().toISOString()
  };
  try {
    localStorage.setItem(CEDULA_DATOS_POR_FOSA_KEY, JSON.stringify(mapa));
  } catch (err) {
    console.warn('No se pudieron guardar los datos personalizados de la cédula:', err);
  }
  return datos;
}

export function limpiarDatosCedulaEspacio(espacio) {
  const clave = obtenerClaveEspacioCedula(espacio);
  const mapa = leerMapaDatosPorFosa();
  if (Object.prototype.hasOwnProperty.call(mapa, clave)) {
    delete mapa[clave];
    try {
      localStorage.setItem(CEDULA_DATOS_POR_FOSA_KEY, JSON.stringify(mapa));
    } catch {
      // Ignorar error
    }
  }
  return construirDatosCedulaDesdeEspacio(espacio);
}
