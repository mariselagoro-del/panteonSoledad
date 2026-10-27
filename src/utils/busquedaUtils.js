// src/utils/busquedaUtils.js
/**
 * Utilidades de búsqueda universal para el Panteón La Soledad.
 * 
 * Características:
 * - Normalización de acentos/diacríticos (ej: "José" coincide con "Jose", "Pérez" con "Perez").
 * - Búsqueda multi-token / multi-palabra independiente del orden (ej: "Salvador Sanchez" coincide con "Sanchez Ramirez Salvador").
 * - Búsqueda exhaustiva en CUALQUIER difunto registrado en el historial (no solo el primero o el último).
 * - Detección y retorno del difunto específico que coincidió con la consulta para destacarlo en la interfaz.
 */

/**
 * Normaliza un texto removiendo acentos, espacios extra y convirtiendo a minúsculas.
 */
export function normalizarTexto(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Comprueba si un texto contiene todas las palabras (tokens) del término de búsqueda.
 * Permite coincidencias sin importar el orden de nombres y apellidos.
 */
export function coincideTexto(textoFuente, terminoBusqueda) {
  const fuenteNorm = normalizarTexto(textoFuente);
  const busquedaNorm = normalizarTexto(terminoBusqueda);

  if (!busquedaNorm) return true;
  if (!fuenteNorm) return false;

  const tokens = busquedaNorm.split(/\s+/).filter(Boolean);
  return tokens.every(token => fuenteNorm.includes(token));
}

/**
 * Busca de forma exhaustiva en todos los difuntos de una fosa o espacio.
 * Retorna si hubo coincidencia y la lista de todos los difuntos coincidentes.
 * 
 * @param {Array|Object|string} historialDifuntos Lista de difuntos de la fosa
 * @param {string} terminoBusqueda Término escrito por el usuario
 * @returns {{ coincide: boolean, difuntosCoincidentes: Array, primerCoincidencia: Object|null }}
 */
export function buscarEnHistorialDifuntos(historialDifuntos, terminoBusqueda) {
  const termNorm = normalizarTexto(terminoBusqueda);
  if (!termNorm) {
    const lista = Array.isArray(historialDifuntos) ? historialDifuntos : (historialDifuntos ? [historialDifuntos] : []);
    return {
      coincide: true,
      difuntosCoincidentes: lista,
      primerCoincidencia: lista[0] || null
    };
  }

  const difuntos = Array.isArray(historialDifuntos) 
    ? historialDifuntos 
    : (historialDifuntos ? [historialDifuntos] : []);

  const coincidentes = [];

  for (const dif of difuntos) {
    if (!dif) continue;

    let camposTexto = '';
    if (typeof dif === 'string') {
      camposTexto = dif;
    } else if (typeof dif === 'object') {
      camposTexto = [
        dif.nombre || '',
        dif.curp || '',
        dif.causaMuerte || '',
        dif.fechaInhumacion || '',
        dif.fechaDefuncion || '',
        dif.direccion || '',
        dif.edad ? String(dif.edad) : ''
      ].join(' ');
    }

    if (coincideTexto(camposTexto, termNorm)) {
      coincidentes.push(dif);
    }
  }

  return {
    coincide: coincidentes.length > 0,
    difuntosCoincidentes: coincidentes,
    primerCoincidencia: coincidentes[0] || null
  };
}

/**
 * Evalúa si una fosa/espacio coincide con una consulta global.
 * Revisa código, titular, teléfono, correo, sección, observaciones y TODOS los difuntos.
 * 
 * @param {Object} espacio Objeto de fosa/nicho
 * @param {string} query Texto buscado
 * @returns {{ coincide: boolean, difuntoCoincidente: Object|null, todosDifuntosCoincidentes: Array }}
 */
export function coincideEspacioConBusqueda(espacio, query) {
  if (!espacio) return { coincide: false, difuntoCoincidente: null, todosDifuntosCoincidentes: [] };
  
  const queryNorm = normalizarTexto(query);
  if (!queryNorm) {
    const listaDifuntos = espacio.historialDifuntos || [];
    return {
      coincide: true,
      difuntoCoincidente: listaDifuntos[0] || null,
      todosDifuntosCoincidentes: listaDifuntos
    };
  }

  // 1. Coincidencia en campos directos del espacio
  const camposEspacio = [
    espacio.codigo || '',
    espacio.numero || '',
    (espacio.codigo || '').replace(/^[a-z0-9]+-/i, ''),
    espacio.titularNombre || '',
    espacio.titularTelefono || '',
    espacio.titularCorreo || '',
    espacio.titularDireccion || '',
    espacio.seccionNombre || '',
    espacio.tipoEspacio || '',
    espacio.tipoConstruccion || '',
    espacio.fechaSellado || '',
    espacio.observaciones || ''
  ].join(' ');

  const coincideEspacioDirecto = coincideTexto(camposEspacio, queryNorm);

  // 2. Coincidencia en CUALQUIER difunto registrado
  const resultadoDifuntos = buscarEnHistorialDifuntos(espacio.historialDifuntos, queryNorm);

  const coincide = coincideEspacioDirecto || resultadoDifuntos.coincide;

  return {
    coincide,
    difuntoCoincidente: resultadoDifuntos.primerCoincidencia || (espacio.historialDifuntos?.[0] || null),
    todosDifuntosCoincidentes: resultadoDifuntos.difuntosCoincidentes
  };
}
