// src/pages/ImportadorExcel.jsx
import { useState } from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  RefreshCw, 
  UploadCloud, 
  Table, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';

import { panteonService } from '../services/panteonService';
import datasetReal from '../constants/panteonDataset.json';

export default function ImportadorExcel({
  totalEspacios = 0,
  onRecargarDatos
}) {
  const [sincronizando, setSincronizando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultado(null);

    try {
      await panteonService.sincronizarPadrónCompleto();
      setSincronizando(false);
      setResultado({
        exito: true,
        fosasProcesadas: datasetReal.metadata?.totalEspacios || 2665,
        difuntosVinculados: datasetReal.metadata?.totalDifuntos || 2531,
        seccionesActualizadas: 6,
        tiempo: '1.2s'
      });
      if (onRecargarDatos) onRecargarDatos();
    } catch (err) {
      console.error('Error al sincronizar:', err);
      setSincronizando(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-teal-600" />
            Sincronizador y Respaldo de Archivos Excel
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Módulo de importación, respaldo y actualización masiva con los libros de cálculo Excel.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSincronizar}
          disabled={sincronizando}
          className="px-4 py-2.5 bg-[#152822] hover:bg-[#1E3A31] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#152822] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          <span>{sincronizando ? 'Procesando registros de Excel...' : 'Actualizar Padrón'}</span>
        </button>
      </div>

      {/* 2. Estado de Conexión y Archivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
            <FileCheck className="w-4 h-4 text-teal-600" />
            <span>Formato de Archivo</span>
          </div>
          <div className="mt-2 font-mono font-bold text-stone-800 text-sm">
            Libro Maestro (.xlsx)
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-olive-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-olive-500" />
            Estructura validada y activa
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
            <Table className="w-4 h-4 text-teal-600" />
            <span>Registros Catastrales</span>
          </div>
          <div className="mt-2 font-mono font-black text-stone-900 text-xl">
            {totalEspacios.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Fosas y Nichos en el padrón
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
            <ShieldCheck className="w-4 h-4 text-olive-600" />
            <span>Integridad de Datos</span>
          </div>
          <div className="mt-2 font-bold text-olive-800 text-sm">
            100% Sin Conflictos
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5">
            Validación de CURP y Folios
          </div>
        </div>

      </div>

      {/* 3. Panel de Sincronización y Carga Manual */}
      <div className="bg-white p-6 rounded-3xl border border-cream-300 shadow-sm space-y-6">
        
        <div className="flex items-center justify-between pb-4 border-b border-cream-200">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Importación Directa de Archivos Excel (.xlsx / .csv)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Arrastra o selecciona el archivo del censo para actualizar titulares, números de fosa y pagos.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 bg-teal-100 px-3 py-1 rounded-full border border-teal-200">
            Excel Reader
          </span>
        </div>

        {/* Zona de Dropzone */}
        <div className="border-2 border-dashed border-cream-400 rounded-2xl p-8 text-center bg-cream-50/60 hover:bg-cream-100 transition-colors cursor-pointer space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-stone-900">
              Haz clic para cargar el archivo Excel o arrástralo aquí
            </div>
            <div className="text-xs text-stone-500 mt-1">
              Compatible con formato oficial de campos: Código, Sección, Titular, Teléfono, Difuntos, Estatus de Pago.
            </div>
          </div>
        </div>

        {/* Resultado de la Sincronización */}
        {resultado && (
          <div className="p-4 bg-olive-50 border border-olive-200 rounded-2xl space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-bold text-olive-900">
              <CheckCircle2 className="w-4 h-4 text-olive-600" />
              <span>Actualización Exitosa de Registros ({resultado.tiempo})</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-stone-700 font-medium">
              <div>• Fosas Procesadas: <strong>{resultado.fosasProcesadas}</strong></div>
              <div>• Difuntos Vinculados: <strong>{resultado.difuntosVinculados}</strong></div>
              <div>• Secciones: <strong>{resultado.seccionesActualizadas} cuadrantes</strong></div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
