// src/services/panteonService.js
// Capa de abstracción y base de datos para el Panteón La Soledad
import datasetReal from '../constants/panteonDataset.json';
import { dbService } from './dbService';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';
const DATASET_VERSION_ACTUAL = datasetReal.metadata?.versionDataset || '2026.10-limpio-oficial';

let sincronizadoPromise = null;

async function asegurarSincronizacion() {
  if (sincronizadoPromise) return sincronizadoPromise;

  sincronizadoPromise = (async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const ver = window.localStorage.getItem('panteon_dataset_version');
        if (ver !== DATASET_VERSION_ACTUAL) {
          console.log(`Sincronizando base de datos local con padrón corregido y contabilidad (${DATASET_VERSION_ACTUAL})...`);
          await dbService.sincronizarDatasetDefinitivo(
            datasetReal.espacios || [],
            datasetReal.movimientosFinancieros || [],
            DATASET_VERSION_ACTUAL
          );
        }
      } catch (err) {
        console.error('Error durante sincronización de versión:', err);
      }
    }
  })();

  return sincronizadoPromise;
}

export const panteonService = {
  // 1. Obtener padrón completo de espacios y fosas desde la base de datos
  obtenerEspacios: async () => {
    await asegurarSincronizacion();
    let datasetBase = datasetReal.espacios || [];
    try {
      // Intentar primero backend REST si estuviera activo
      const res = await fetch(`${API_BASE_URL}/espacios`, { method: 'GET' });
      if (res.ok) {
        const datosApi = await res.json();
        if (Array.isArray(datosApi) && datosApi.length > 0) {
          datasetBase = datosApi;
        }
      }
    } catch {
      // Continuar con IndexedDB local
    }

    return await dbService.obtenerFosas(datasetBase);
  },

  // 2. Obtener movimientos financieros y saldo de caja desde base de datos
  obtenerMovimientosFinancieros: async () => {
    await asegurarSincronizacion();
    try {
      const res = await fetch(`${API_BASE_URL}/movimientos`, { method: 'GET' });
      if (res.ok) {
        const datosApi = await res.json();
        if (Array.isArray(datosApi) && datosApi.length > 0) {
          await dbService.guardarMultiplesMovimientos(datosApi);
          return datosApi;
        }
      }
    } catch {
      // Continuar con IndexedDB local
    }

    const movsIniciales = datasetReal.movimientosFinancieros || [];
    return await dbService.obtenerMovimientos(movsIniciales);
  },

  // Forzar resincronización manual de padrón y caja
  sincronizarPadrónCompleto: async () => {
    await dbService.sincronizarDatasetDefinitivo(
      datasetReal.espacios || [],
      datasetReal.movimientosFinancieros || [],
      DATASET_VERSION_ACTUAL
    );
    return {
      fosas: datasetReal.espacios || [],
      movimientos: datasetReal.movimientosFinancieros || [],
      metadata: datasetReal.metadata || {}
    };
  },

  // 3. Registrar un nuevo movimiento financiero en la base de datos
  registrarMovimiento: async (movimiento) => {
    // Guardar en la base de datos local permanente (IndexedDB)
    await dbService.guardarMovimiento(movimiento);

    try {
      const res = await fetch(`${API_BASE_URL}/movimientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimiento)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Guardado local exitoso
    }
    return movimiento;
  },

  // 4. Guardar o actualizar fosa y expediente en la base de datos permanente
  guardarEspacio: async (espacio) => {
    // Guardar en la base de datos local permanente (IndexedDB)
    await dbService.guardarFosa(espacio);

    try {
      const res = await fetch(`${API_BASE_URL}/espacios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(espacio)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Guardado local exitoso
    }
    return espacio;
  },

  // 5. Guardar expediente electrónico directamente
  guardarExpediente: async (codigo, expediente) => {
    await dbService.guardarExpediente(codigo, expediente);

    try {
      const res = await fetch(`${API_BASE_URL}/espacios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, expediente })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Guardado local en IndexedDB exitoso
    }
    return expediente;
  },

  // 6. Obtener expediente electrónico por código
  obtenerExpediente: async (codigo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/espacios/${encodeURIComponent(codigo)}/adjuntos`, { method: 'GET' });
      if (res.ok) {
        const adjuntosApi = await res.json();
        if (Array.isArray(adjuntosApi) && adjuntosApi.length > 0) {
          const docs = {};
          adjuntosApi.forEach(a => {
            docs[a.docId || a.id] = a;
          });
          return { codigo, documentos: docs };
        }
      }
    } catch {
      // Fallback a IndexedDB
    }
    return await dbService.obtenerExpediente(codigo);
  },

  // 7. Guardar archivo o imagen adjunta individual
  guardarAdjunto: async (codigo, docId, archivoData) => {
    // Guardar en la base de datos local permanente (IndexedDB)
    const localRes = await dbService.guardarAdjunto(codigo, docId, archivoData);

    try {
      const res = await fetch(`${API_BASE_URL}/espacios/${encodeURIComponent(codigo)}/adjuntos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, ...archivoData })
      });
      if (res.ok) {
        const apiData = await res.json();
        return apiData.documento || localRes;
      }
    } catch {
      // Fallback a guardado local
    }
    return localRes;
  },

  // 8. Obtener todos los archivos adjuntos de un lote
  obtenerAdjuntos: async (codigo) => {
    try {
      const res = await fetch(`${API_BASE_URL}/espacios/${encodeURIComponent(codigo)}/adjuntos`, { method: 'GET' });
      if (res.ok) {
        const adjuntosApi = await res.json();
        if (Array.isArray(adjuntosApi) && adjuntosApi.length > 0) {
          return adjuntosApi;
        }
      }
    } catch {
      // Fallback a IndexedDB
    }
    return await dbService.obtenerAdjuntos(codigo);
  },

  // 9. Eliminar un archivo adjunto
  eliminarAdjunto: async (codigo, docId) => {
    await dbService.eliminarAdjunto(codigo, docId);

    try {
      await fetch(`${API_BASE_URL}/espacios/${encodeURIComponent(codigo)}/adjuntos/${encodeURIComponent(docId)}`, {
        method: 'DELETE'
      });
    } catch {
      // Fallback a eliminación local
    }
    return true;
  }
};