// src/constants/expedienteConfig.js
// Configuración y utilidades del Expediente Electrónico para Panteón La Soledad

export const DOCUMENTOS_REQUERIDOS = [
  // Documentos del Difunto
  {
    id: 'acta_defuncion',
    categoria: 'difunto',
    categoriaTitulo: 'Documentación del Difunto',
    titulo: 'Acta de Defunción',
    descripcion: 'Acta oficial emitida por el Registro Civil',
    obligatorio: true,
    icono: 'FileText'
  },
  {
    id: 'certificado_medico',
    categoria: 'difunto',
    categoriaTitulo: 'Documentación del Difunto',
    titulo: 'Certificado Médico',
    descripcion: 'Certificado médico oficial de defunción con causa y firma médica',
    obligatorio: true,
    icono: 'FileCheck'
  },
  {
    id: 'acta_nacimiento_difunto',
    categoria: 'difunto',
    categoriaTitulo: 'Documentación del Difunto',
    titulo: 'Acta de Nacimiento (Difunto)',
    descripcion: 'Copia certificada de nacimiento de la persona finada',
    obligatorio: true,
    icono: 'FileText'
  },
  {
    id: 'ine_difunto',
    categoria: 'difunto',
    categoriaTitulo: 'Documentación del Difunto',
    titulo: 'INE / Identificación del Difunto',
    descripcion: 'Copia de credencial para votar o identificación oficial vigente',
    obligatorio: true,
    icono: 'ShieldCheck'
  },

  // Documentos del Titular / Concesionario
  {
    id: 'ine_titular',
    categoria: 'titular',
    categoriaTitulo: 'Documentación del Titular / Responsable',
    titulo: 'INE del Titular',
    descripcion: 'Identificación oficial del concesionario o responsable del lote',
    obligatorio: true,
    icono: 'ShieldCheck'
  },
  {
    id: 'acta_nacimiento_titular',
    categoria: 'titular',
    categoriaTitulo: 'Documentación del Titular / Responsable',
    titulo: 'Acta de Nacimiento (Titular)',
    descripcion: 'Acta de nacimiento del titular para acreditar personalidad y parentesco',
    obligatorio: true,
    icono: 'FileText'
  }
];

/**
 * Determina si un objeto representa un archivo o imagen digitalizada real
 * @param {*} val 
 * @returns {boolean}
 */
export function esArchivoAdjuntoValido(val) {
  if (!val) return false;
  if (typeof val === 'string') {
    return val.startsWith('data:') || val.startsWith('http') || val.startsWith('blob:') || val.startsWith('/');
  }
  if (typeof val !== 'object' || Array.isArray(val)) {
    return false;
  }
  const dataUrl = val.dataUrl || val.data_url || val.url;
  const tieneDataUrl = typeof dataUrl === 'string' && (dataUrl.startsWith('data:') || dataUrl.startsWith('http') || dataUrl.startsWith('blob:') || dataUrl.startsWith('/'));
  
  const nombre = val.nombre || val.nombre_archivo || val.name;
  const tipo = val.tipo || val.tipo_mime || val.type;
  const tieneInfoArchivo = typeof nombre === 'string' && nombre.trim().length > 0 && (Boolean(tipo) || Boolean(val.tamanoBytes) || Boolean(val.tamano_bytes) || val.adjuntado === true);
  const tieneAdjuntadoExplicito = val.adjuntado === true && (tieneDataUrl || typeof nombre === 'string');

  return Boolean(tieneDataUrl || tieneInfoArchivo || tieneAdjuntadoExplicito);
}

/**
 * Calcula el estado de completitud de un expediente electrónico
 * @param {Object} expediente - Objeto con los documentos del expediente o el espacio completo
 * @returns {Object} { totalRequeridos, totalAdjuntados, porcentaje, estatus, colorEstatus }
 */
export function calcularEstadoExpediente(expediente) {
  const totalRequeridos = DOCUMENTOS_REQUERIDOS.length; // 6

  if (!expediente || typeof expediente !== 'object') {
    return {
      totalRequeridos,
      totalAdjuntados: 0,
      porcentaje: 0,
      estatus: 'Sin Documentación',
      colorEstatus: 'stone'
    };
  }

  // Extraer el objeto de documentos según la estructura
  let docs = {};
  if (expediente.expediente?.documentos && typeof expediente.expediente.documentos === 'object' && !Array.isArray(expediente.expediente.documentos)) {
    docs = expediente.expediente.documentos;
  } else if (expediente.documentos && typeof expediente.documentos === 'object' && !Array.isArray(expediente.documentos)) {
    docs = expediente.documentos;
  } else if (expediente.adjuntos && typeof expediente.adjuntos === 'object' && !Array.isArray(expediente.adjuntos)) {
    docs = expediente.adjuntos;
  } else if (!expediente.codigo && !expediente.seccionNombre && !expediente.tipoEspacio && !expediente.titularNombre && !expediente.historialDifuntos) {
    // Es un objeto directo de documentos (clave => archivo)
    docs = expediente;
  }

  let totalAdjuntados = 0;
  const docsContados = new Set();

  // 1. Revisar los 6 documentos normativos (Difunto y Titular)
  DOCUMENTOS_REQUERIDOS.forEach(doc => {
    const val = docs[doc.id];
    if (esArchivoAdjuntoValido(val)) {
      docsContados.add(doc.id);
      totalAdjuntados++;
    }
  });

  // 2. Revisar cualquier documento adicional o personalizado que pertenezca a este expediente
  Object.entries(docs).forEach(([key, val]) => {
    if (docsContados.has(key)) return;
    if (key === 'documentos' || key === 'fechaCreacion' || key === 'ultimaActualizacion' || key === 'observaciones') return;

    if (esArchivoAdjuntoValido(val)) {
      docsContados.add(key);
      totalAdjuntados++;
    }
  });

  const porcentaje = Math.min(100, Math.round((totalAdjuntados / totalRequeridos) * 100));

  let estatus = 'Sin Documentación';
  let colorEstatus = 'stone';

  if (totalAdjuntados >= totalRequeridos) {
    estatus = 'Completo';
    colorEstatus = 'olive';
  } else if (totalAdjuntados > 0) {
    estatus = 'Incompleto';
    colorEstatus = 'amber';
  }

  return {
    totalRequeridos,
    totalAdjuntados,
    porcentaje,
    estatus,
    colorEstatus
  };
}

/**
 * Lee un archivo seleccionado por el usuario y lo convierte a DataURL Base64
 * @param {File} archivo
 * @returns {Promise<Object>}
 */
export function leerArchivoParaExpediente(archivo) {
  return new Promise((resolve, reject) => {
    if (!archivo) {
      reject(new Error('No se proporcionó ningún archivo'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      resolve({
        nombre: archivo.name,
        tipo: archivo.type || 'application/octet-stream',
        tamano: formatearTamanoArchivo(archivo.size),
        tamanoBytes: archivo.size,
        fechaSubida: new Date().toISOString().split('T')[0],
        horaSubida: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        dataUrl: reader.result
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsDataURL(archivo);
  });
}

/**
 * Formatea el tamaño en bytes a una representación legible (KB / MB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatearTamanoArchivo(bytes) {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
