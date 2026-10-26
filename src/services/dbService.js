// src/services/dbService.js
/**
 * Servicio de Base de Datos Local con IndexedDB para Panteón La Soledad
 * 
 * Base de Datos Única Oficial: 'PanteonLaSoledad'
 * 
 * Permite persistencia permanente de:
 * 1. Padrón de Fosas y Nichos ('fosas')
 * 2. Expedientes Catastrales Digitales ('expedientes')
 * 3. Almacén dedicado de Archivos e Imágenes Adjuntas ('adjuntos_expediente')
 * 4. Movimientos financieros y caja ('movimientos')
 * 5. Configuración del sistema ('configuracion')
 */

const DB_NOMBRE = 'PanteonLaSoledad';
const DB_VERSION = 2; // Versión 2: Incorpora tabla dedicada 'adjuntos_expediente'

// Bases de datos antiguas o no utilizadas a depurar automáticamente
const DBS_LEGACY = ['panteon_db', 'PanteonLaSoledad_DB'];

const STORES = {
  FOSAS: 'fosas',
  EXPEDIENTES: 'expedientes',
  ADJUNTOS: 'adjuntos_expediente',
  MOVIMIENTOS: 'movimientos',
  CONFIGURACION: 'configuracion'
};

// Promesa / instancia única para inicializar la conexión
let dbInstance = null;

// Limpieza de bases de datos obsoletas
function limpiarBasesDatosObsoletas() {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  for (const dbLegacy of DBS_LEGACY) {
    try {
      window.indexedDB.deleteDatabase(dbLegacy);
    } catch {
      // Ignorar si no existe
    }
  }
}

function abrirBaseDatos() {
  if (dbInstance) return Promise.resolve(dbInstance);

  limpiarBasesDatosObsoletas();

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB no está disponible en este entorno.');
      return resolve(null);
    }

    const request = window.indexedDB.open(DB_NOMBRE, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Almacén de Fosas y Espacios
      if (!db.objectStoreNames.contains(STORES.FOSAS)) {
        const fosaStore = db.createObjectStore(STORES.FOSAS, { keyPath: 'id' });
        fosaStore.createIndex('codigo', 'codigo', { unique: false });
        fosaStore.createIndex('seccionNombre', 'seccionNombre', { unique: false });
      }

      // 2. Almacén de Expedientes Digitales
      if (!db.objectStoreNames.contains(STORES.EXPEDIENTES)) {
        const expStore = db.createObjectStore(STORES.EXPEDIENTES, { keyPath: 'codigo' });
        expStore.createIndex('ultimaActualizacion', 'ultimaActualizacion', { unique: false });
      }

      // 3. Tabla / Almacén dedicado de Archivos e Imágenes Adjuntas
      if (!db.objectStoreNames.contains(STORES.ADJUNTOS)) {
        const adjStore = db.createObjectStore(STORES.ADJUNTOS, { keyPath: 'id' });
        adjStore.createIndex('codigo', 'codigo', { unique: false });
        adjStore.createIndex('docId', 'docId', { unique: false });
        adjStore.createIndex('tipo', 'tipo', { unique: false });
        adjStore.createIndex('fechaSubida', 'fechaSubida', { unique: false });
      }

      // 4. Almacén de Movimientos Financieros
      if (!db.objectStoreNames.contains(STORES.MOVIMIENTOS)) {
        const movStore = db.createObjectStore(STORES.MOVIMIENTOS, { keyPath: 'id' });
        movStore.createIndex('fecha', 'fecha', { unique: false });
        movStore.createIndex('folio', 'folio', { unique: false });
      }

      // 5. Almacén de Configuración
      if (!db.objectStoreNames.contains(STORES.CONFIGURACION)) {
        db.createObjectStore(STORES.CONFIGURACION, { keyPath: 'clave' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;

      // Manejar cierre inesperado de la conexión
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('Error al abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

export const dbService = {
  /**
   * Carga todos los registros de fosas desde IndexedDB.
   * Sincroniza y fusiona automáticamente los expedientes y archivos adjuntos persistidos.
   */
  obtenerFosas: async (datosIniciales = []) => {
    try {
      const db = await abrirBaseDatos();
      if (!db) return datosIniciales;

      return new Promise((resolve) => {
        const tx = db.transaction([STORES.FOSAS, STORES.EXPEDIENTES, STORES.ADJUNTOS], 'readonly');
        const fosaStore = tx.objectStore(STORES.FOSAS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const adjStore = tx.objectStore(STORES.ADJUNTOS);

        const reqFosas = fosaStore.getAll();
        const reqExpedientes = expStore.getAll();
        const reqAdjuntos = adjStore.getAll();

        let fosasRes = null;
        let expedientesRes = null;
        let adjuntosRes = null;

        const intentarCombinar = async () => {
          if (fosasRes === null || expedientesRes === null || adjuntosRes === null) return;

          let fosas = (fosasRes && fosasRes.length > 0) ? fosasRes : (datosIniciales || []);

          if ((!fosasRes || fosasRes.length === 0) && datosIniciales.length > 0) {
            // Guardar datos iniciales en la base de datos local
            await dbService.guardarMultiplesFosas(datosIniciales);
          }

          // Normalizador de código seguro
          const normCod = (c) => String(c || '').trim().toUpperCase();

          // Mapa de expedientes por código
          const mapaExpedientes = new Map();
          for (const exp of (expedientesRes || [])) {
            if (exp.codigo) {
              mapaExpedientes.set(normCod(exp.codigo), exp);
            }
          }

          // Mapa de adjuntos agrupados por código
          const mapaAdjuntos = new Map();
          for (const adj of (adjuntosRes || [])) {
            if (adj.codigo && adj.docId) {
              const codUpper = normCod(adj.codigo);
              if (!mapaAdjuntos.has(codUpper)) {
                mapaAdjuntos.set(codUpper, {});
              }
              mapaAdjuntos.get(codUpper)[adj.docId] = {
                id: adj.docId,
                nombre: adj.nombre,
                tipo: adj.tipo,
                tamano: adj.tamano,
                tamanoBytes: adj.tamanoBytes,
                fechaSubida: adj.fechaSubida,
                horaSubida: adj.horaSubida,
                dataUrl: adj.dataUrl,
                adjuntado: true,
                titulo: adj.titulo,
                categoria: adj.categoria
              };
            }
          }

          // Fusionar expediente y adjuntos en cada fosa
          const fosasFusionadas = fosas.map(f => {
            const codUpper = normCod(f.codigo);
            const expEncontrado = mapaExpedientes.get(codUpper);
            const adjuntosEncontrados = mapaAdjuntos.get(codUpper);

            const docsExistentes = f.expediente?.documentos || (f.expediente && typeof f.expediente === 'object' ? f.expediente : {});
            const docsExp = expEncontrado?.documentos || (expEncontrado && typeof expEncontrado === 'object' ? expEncontrado : {});
            const docsAdj = adjuntosEncontrados || {};

            const docsFinales = {
              ...docsExistentes,
              ...docsExp,
              ...docsAdj
            };

            return {
              ...f,
              expediente: {
                ...(f.expediente || {}),
                ...(expEncontrado || {}),
                documentos: docsFinales,
                ultimaActualizacion: expEncontrado?.ultimaActualizacion || f.expediente?.ultimaActualizacion || new Date().toISOString()
              }
            };
          });

          resolve(fosasFusionadas);
        };

        reqFosas.onsuccess = () => {
          fosasRes = reqFosas.result || [];
          intentarCombinar();
        };

        reqExpedientes.onsuccess = () => {
          expedientesRes = reqExpedientes.result || [];
          intentarCombinar();
        };

        reqAdjuntos.onsuccess = () => {
          adjuntosRes = reqAdjuntos.result || [];
          intentarCombinar();
        };

        tx.onerror = () => {
          console.error('Error en transacción de lectura de fosas:', tx.error);
          resolve(datosIniciales);
        };
      });
    } catch (err) {
      console.error('Error al obtener fosas desde DB:', err);
      return datosIniciales;
    }
  },

  /**
   * Guarda o actualiza un registro de fosa (incluyendo su expediente y todos los documentos adjuntos).
   */
  guardarFosa: async (fosa) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !fosa) return fosa;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.FOSAS, STORES.EXPEDIENTES, STORES.ADJUNTOS], 'readwrite');
        const fosaStore = tx.objectStore(STORES.FOSAS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const adjStore = tx.objectStore(STORES.ADJUNTOS);

        fosaStore.put(fosa);

        const codigoUpper = (fosa.codigo || '').toUpperCase();
        const docs = fosa.expediente?.documentos || fosa.expediente;

        if (codigoUpper && docs && typeof docs === 'object') {
          // Guardar en tabla de expedientes
          expStore.put({
            codigo: codigoUpper,
            fosaId: fosa.id,
            documentos: docs,
            ultimaActualizacion: fosa.expediente?.ultimaActualizacion || new Date().toISOString()
          });

          // Guardar cada documento en la tabla dedicada de adjuntos
          Object.entries(docs).forEach(([docId, docData]) => {
            if (docData && (docData.adjuntado || docData.dataUrl)) {
              adjStore.put({
                id: `${codigoUpper}_${docId}`,
                codigo: codigoUpper,
                docId: docId,
                nombre: docData.nombre || 'Documento digital',
                tipo: docData.tipo || 'image/png',
                tamano: docData.tamano || 'N/D',
                tamanoBytes: docData.tamanoBytes || 0,
                fechaSubida: docData.fechaSubida || new Date().toISOString().split('T')[0],
                horaSubida: docData.horaSubida || '',
                dataUrl: docData.dataUrl || '',
                titulo: docData.titulo || docId,
                categoria: docData.categoria || 'general'
              });
            }
          });
        }

        tx.oncomplete = () => resolve(fosa);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar fosa en DB:', err);
      return fosa;
    }
  },

  /**
   * Guarda múltiples fosas en lote dentro de una sola transacción.
   */
  guardarMultiplesFosas: async (fosas = []) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || fosas.length === 0) return fosas;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.FOSAS, STORES.EXPEDIENTES, STORES.ADJUNTOS], 'readwrite');
        const fosaStore = tx.objectStore(STORES.FOSAS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const adjStore = tx.objectStore(STORES.ADJUNTOS);

        for (const f of fosas) {
          fosaStore.put(f);
          const codigoUpper = (f.codigo || '').toUpperCase();
          const docs = f.expediente?.documentos || f.expediente;

          if (codigoUpper && docs && typeof docs === 'object') {
            expStore.put({
              codigo: codigoUpper,
              fosaId: f.id,
              documentos: docs,
              ultimaActualizacion: f.expediente?.ultimaActualizacion || new Date().toISOString()
            });

            Object.entries(docs).forEach(([docId, docData]) => {
              if (docData && (docData.adjuntado || docData.dataUrl)) {
                adjStore.put({
                  id: `${codigoUpper}_${docId}`,
                  codigo: codigoUpper,
                  docId: docId,
                  nombre: docData.nombre || 'Documento digital',
                  tipo: docData.tipo || 'image/png',
                  tamano: docData.tamano || 'N/D',
                  tamanoBytes: docData.tamanoBytes || 0,
                  fechaSubida: docData.fechaSubida || new Date().toISOString().split('T')[0],
                  horaSubida: docData.horaSubida || '',
                  dataUrl: docData.dataUrl || '',
                  titulo: docData.titulo || docId,
                  categoria: docData.categoria || 'general'
                });
              }
            });
          }
        }

        tx.oncomplete = () => resolve(fosas);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar lote de fosas en DB:', err);
      return fosas;
    }
  },

  /**
   * Guarda un archivo/imagen adjunta individual en la tabla dedicada y sincroniza con el expediente y la fosa.
   */
  guardarAdjunto: async (codigo, docId, archivoData) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !codigo || !docId) return null;

      const codigoUpper = codigo.toUpperCase();
      const registroAdjunto = {
        id: `${codigoUpper}_${docId}`,
        codigo: codigoUpper,
        docId: docId,
        nombre: archivoData.nombre || 'Documento adjunto',
        tipo: archivoData.tipo || 'image/png',
        tamano: archivoData.tamano || 'N/D',
        tamanoBytes: archivoData.tamanoBytes || 0,
        fechaSubida: archivoData.fechaSubida || new Date().toISOString().split('T')[0],
        horaSubida: archivoData.horaSubida || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        dataUrl: archivoData.dataUrl || '',
        titulo: archivoData.titulo || docId,
        categoria: archivoData.categoria || 'general',
        titularNombre: archivoData.titularNombre || '',
        difuntoNombre: archivoData.difuntoNombre || ''
      };

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.ADJUNTOS, STORES.EXPEDIENTES, STORES.FOSAS], 'readwrite');
        const adjStore = tx.objectStore(STORES.ADJUNTOS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const fosaStore = tx.objectStore(STORES.FOSAS);

        // 1. Guardar en la tabla de adjuntos
        adjStore.put(registroAdjunto);

        // 2. Actualizar el almacén de expedientes
        const expReq = expStore.get(codigoUpper);
        expReq.onsuccess = () => {
          const expActual = expReq.result || { codigo: codigoUpper, documentos: {} };
          const docsActualizados = {
            ...(expActual.documentos || {}),
            [docId]: {
              id: docId,
              adjuntado: true,
              ...registroAdjunto
            }
          };

          expStore.put({
            ...expActual,
            codigo: codigoUpper,
            documentos: docsActualizados,
            ultimaActualizacion: new Date().toISOString()
          });

          // 3. Sincronizar en la fosa
          const fosaIndex = fosaStore.index('codigo');
          const fosaReq = fosaIndex.get(codigoUpper);
          fosaReq.onsuccess = () => {
            const fosa = fosaReq.result;
            if (fosa) {
              fosa.expediente = {
                ...(fosa.expediente || {}),
                documentos: docsActualizados,
                ultimaActualizacion: new Date().toISOString()
              };
              fosaStore.put(fosa);
            }
          };
        };

        tx.oncomplete = () => resolve(registroAdjunto);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar adjunto en DB:', err);
      return null;
    }
  },

  /**
   * Obtiene todos los archivos e imágenes adjuntas asociadas a un código de lote.
   */
  obtenerAdjuntos: async (codigo) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !codigo) return [];

      const codigoUpper = codigo.toUpperCase();

      return new Promise((resolve) => {
        const tx = db.transaction([STORES.ADJUNTOS, STORES.EXPEDIENTES], 'readonly');
        const adjStore = tx.objectStore(STORES.ADJUNTOS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);

        const index = adjStore.index('codigo');
        const reqAdj = index.getAll(codigoUpper);
        const reqExp = expStore.get(codigoUpper);

        let adjuntosList = null;
        let expedienteObj = null;

        const finalizar = () => {
          if (adjuntosList === null || expedienteObj === null) return;

          const mapa = new Map();

          // Primero incorporar desde el expediente
          if (expedienteObj && expedienteObj.documentos) {
            Object.entries(expedienteObj.documentos).forEach(([k, v]) => {
              if (v && (v.adjuntado || v.dataUrl)) {
                mapa.set(k, { id: k, ...v });
              }
            });
          }

          // Luego incorporar / sobrescribir desde la tabla de adjuntos
          for (const item of adjuntosList) {
            mapa.set(item.docId || item.id, item);
          }

          resolve(Array.from(mapa.values()));
        };

        reqAdj.onsuccess = () => {
          adjuntosList = reqAdj.result || [];
          finalizar();
        };

        reqExp.onsuccess = () => {
          expedienteObj = reqExp.result || null;
          finalizar();
        };

        tx.onerror = () => {
          resolve([]);
        };
      });
    } catch (err) {
      console.error('Error al obtener adjuntos:', err);
      return [];
    }
  },

  /**
   * Elimina un archivo adjunto de la tabla de adjuntos y actualiza el expediente.
   */
  eliminarAdjunto: async (codigo, docId) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !codigo || !docId) return false;

      const codigoUpper = codigo.toUpperCase();
      const adjId = `${codigoUpper}_${docId}`;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.ADJUNTOS, STORES.EXPEDIENTES, STORES.FOSAS], 'readwrite');
        const adjStore = tx.objectStore(STORES.ADJUNTOS);
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const fosaStore = tx.objectStore(STORES.FOSAS);

        // 1. Eliminar de la tabla de adjuntos
        adjStore.delete(adjId);

        // 2. Actualizar el expediente
        const expReq = expStore.get(codigoUpper);
        expReq.onsuccess = () => {
          const exp = expReq.result;
          if (exp && exp.documentos && exp.documentos[docId]) {
            const nuevosDocs = { ...exp.documentos };
            delete nuevosDocs[docId];

            expStore.put({
              ...exp,
              documentos: nuevosDocs,
              ultimaActualizacion: new Date().toISOString()
            });

            // 3. Actualizar la fosa
            const fosaIndex = fosaStore.index('codigo');
            const fosaReq = fosaIndex.get(codigoUpper);
            fosaReq.onsuccess = () => {
              const fosa = fosaReq.result;
              if (fosa && fosa.expediente && fosa.expediente.documentos) {
                const fosaDocs = { ...fosa.expediente.documentos };
                delete fosaDocs[docId];
                fosa.expediente = {
                  ...fosa.expediente,
                  documentos: fosaDocs,
                  ultimaActualizacion: new Date().toISOString()
                };
                fosaStore.put(fosa);
              }
            };
          }
        };

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al eliminar adjunto:', err);
      return false;
    }
  },

  /**
   * Obtiene el expediente electrónico de una fosa por su código.
   */
  obtenerExpediente: async (codigo) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !codigo) return null;

      const codigoUpper = codigo.toUpperCase();

      return new Promise((resolve) => {
        const tx = db.transaction([STORES.EXPEDIENTES, STORES.ADJUNTOS], 'readonly');
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const adjStore = tx.objectStore(STORES.ADJUNTOS);

        const reqExp = expStore.get(codigoUpper);
        const adjIndex = adjStore.index('codigo');
        const reqAdj = adjIndex.getAll(codigoUpper);

        let expediente = null;
        let adjuntos = null;

        const consolidar = () => {
          if (expediente === null || adjuntos === null) return;

          let docs = { ...(expediente?.documentos || {}) };

          for (const adj of adjuntos) {
            docs[adj.docId] = {
              id: adj.docId,
              adjuntado: true,
              nombre: adj.nombre,
              tipo: adj.tipo,
              tamano: adj.tamano,
              tamanoBytes: adj.tamanoBytes,
              fechaSubida: adj.fechaSubida,
              horaSubida: adj.horaSubida,
              dataUrl: adj.dataUrl,
              titulo: adj.titulo,
              categoria: adj.categoria
            };
          }

          resolve({
            codigo: codigoUpper,
            documentos: docs,
            ultimaActualizacion: expediente?.ultimaActualizacion || new Date().toISOString()
          });
        };

        reqExp.onsuccess = () => {
          expediente = reqExp.result || { codigo: codigoUpper, documentos: {} };
          consolidar();
        };

        reqAdj.onsuccess = () => {
          adjuntos = reqAdj.result || [];
          consolidar();
        };

        tx.onerror = () => resolve(null);
      });
    } catch (err) {
      console.error('Error al obtener expediente:', err);
      return null;
    }
  },

  /**
   * Guarda directamente el expediente completo y sincroniza con el almacén de adjuntos y la fosa.
   */
  guardarExpediente: async (codigo, expedienteData) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !codigo) return null;

      const codigoUpper = codigo.toUpperCase();
      const docs = expedienteData.documentos || expedienteData;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.EXPEDIENTES, STORES.ADJUNTOS, STORES.FOSAS], 'readwrite');
        const expStore = tx.objectStore(STORES.EXPEDIENTES);
        const adjStore = tx.objectStore(STORES.ADJUNTOS);
        const fosaStore = tx.objectStore(STORES.FOSAS);

        const expObj = {
          codigo: codigoUpper,
          documentos: docs,
          ultimaActualizacion: new Date().toISOString()
        };

        expStore.put(expObj);

        // Guardar cada documento en la tabla de adjuntos
        if (docs && typeof docs === 'object') {
          Object.entries(docs).forEach(([docId, docData]) => {
            if (docData && (docData.adjuntado || docData.dataUrl)) {
              adjStore.put({
                id: `${codigoUpper}_${docId}`,
                codigo: codigoUpper,
                docId: docId,
                nombre: docData.nombre || 'Documento digital',
                tipo: docData.tipo || 'image/png',
                tamano: docData.tamano || 'N/D',
                tamanoBytes: docData.tamanoBytes || 0,
                fechaSubida: docData.fechaSubida || new Date().toISOString().split('T')[0],
                horaSubida: docData.horaSubida || '',
                dataUrl: docData.dataUrl || '',
                titulo: docData.titulo || docId,
                categoria: docData.categoria || 'general'
              });
            }
          });
        }

        // Actualizar la fosa correspondiente si existe
        const fosaIndex = fosaStore.index('codigo');
        const fosaReq = fosaIndex.get(codigoUpper);

        fosaReq.onsuccess = () => {
          const fosa = fosaReq.result;
          if (fosa) {
            fosa.expediente = {
              ...(fosa.expediente || {}),
              documentos: expObj.documentos,
              ultimaActualizacion: expObj.ultimaActualizacion
            };
            fosaStore.put(fosa);
          }
        };

        tx.oncomplete = () => resolve(expObj);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar expediente en DB:', err);
      return null;
    }
  },

  /**
   * Obtiene los movimientos financieros guardados.
   */
  obtenerMovimientos: async (datosIniciales = []) => {
    try {
      const db = await abrirBaseDatos();
      if (!db) return datosIniciales;

      return new Promise((resolve) => {
        const tx = db.transaction(STORES.MOVIMIENTOS, 'readonly');
        const store = tx.objectStore(STORES.MOVIMIENTOS);
        const req = store.getAll();

        req.onsuccess = async () => {
          const resultado = req.result || [];
          if (resultado.length > 0) {
            resolve(resultado);
          } else if (datosIniciales.length > 0) {
            await dbService.guardarMultiplesMovimientos(datosIniciales);
            resolve(datosIniciales);
          } else {
            resolve([]);
          }
        };

        req.onerror = () => resolve(datosIniciales);
      });
    } catch (err) {
      console.error('Error al obtener movimientos en DB:', err);
      return datosIniciales;
    }
  },

  /**
   * Guarda un movimiento financiero.
   */
  guardarMovimiento: async (movimiento) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || !movimiento) return movimiento;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.MOVIMIENTOS, 'readwrite');
        const store = tx.objectStore(STORES.MOVIMIENTOS);
        store.put(movimiento);

        tx.oncomplete = () => resolve(movimiento);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar movimiento:', err);
      return movimiento;
    }
  },

  /**
   * Guarda múltiples movimientos en lote.
   */
  guardarMultiplesMovimientos: async (movimientos = []) => {
    try {
      const db = await abrirBaseDatos();
      if (!db || movimientos.length === 0) return movimientos;

      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.MOVIMIENTOS, 'readwrite');
        const store = tx.objectStore(STORES.MOVIMIENTOS);

        for (const m of movimientos) {
          store.put(m);
        }

        tx.oncomplete = () => resolve(movimientos);
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al guardar lote de movimientos:', err);
      return movimientos;
    }
  },

  /**
   * Sincroniza y actualiza la base de datos local con el dataset definitivo (Julio 2026),
   * asegurando que las fosas y los movimientos arranquen exactamente con el nuevo archivo
   * y el saldo inicial de $150,000.00 MXN sin alterar expedientes digitales ni archivos adjuntos.
   */
  sincronizarDatasetDefinitivo: async (espaciosNuevos = [], movimientosNuevos = [], version = '2026.10-limpio-oficial') => {
    try {
      const db = await abrirBaseDatos();
      if (!db) return false;

      return new Promise((resolve, reject) => {
        const tx = db.transaction([STORES.FOSAS, STORES.MOVIMIENTOS], 'readwrite');
        const fosaStore = tx.objectStore(STORES.FOSAS);
        const movStore = tx.objectStore(STORES.MOVIMIENTOS);

        // Limpiar almacenes para no dejar registros obsoletos
        fosaStore.clear();
        movStore.clear();

        for (const f of espaciosNuevos) {
          fosaStore.put(f);
        }

        for (const m of movimientosNuevos) {
          movStore.put(m);
        }

        tx.oncomplete = () => {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('panteon_dataset_version', version || '2026.10-definitivo-v2');
          }
          resolve(true);
        };

        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error('Error al sincronizar dataset definitivo:', err);
      return false;
    }
  }
};

