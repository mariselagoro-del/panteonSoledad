// src/pages/PermisoArregloTumba.jsx
import { useState, useMemo } from 'react';
import { Hammer, Printer, Search, FilePlus2, ArrowLeft } from 'lucide-react';
import {
  obtenerPlantillaPermisoTumba,
  guardarPlantillaPermisoTumba,
  restablecerPlantillaPermisoTumba,
  obtenerDatosPermisoEspacio,
  guardarDatosPermisoEspacio,
  limpiarDatosPermisoEspacio
} from '../constants/permisoTumbaConfig';
import { coincideEspacioConBusqueda, formatearNumeroFosa } from '../utils/busquedaUtils';
import VistaDocumentoPermisoTumba from '../components/permiso/VistaDocumentoPermisoTumba';
import FormularioEditorPermisoTumba from '../components/permiso/FormularioEditorPermisoTumba';

/**
 * Apartado completo para editar, personalizar e imprimir el Permiso de Arreglo de Tumba
 * del Panteón La Soledad con vista previa en vivo.
 */
export default function PermisoArregloTumba({
  registrosFosas = [],
  onActualizarFosa,
  onVolver
}) {
  const [busquedaFosa, setBusquedaFosa] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(() => registrosFosas[0] || null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const [plantilla, setPlantilla] = useState(() => obtenerPlantillaPermisoTumba());
  const [datosPermiso, setDatosPermiso] = useState(() =>
    obtenerDatosPermisoEspacio(registrosFosas[0] || null)
  );
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  const resultadosBusqueda = useMemo(() => {
    if (!busquedaFosa.trim()) {
      return (registrosFosas || []).slice(0, 15);
    }
    return (registrosFosas || [])
      .filter((r) => coincideEspacioConBusqueda(r, busquedaFosa).coincide)
      .slice(0, 20);
  }, [registrosFosas, busquedaFosa]);

  const mostrarConfirmacion = (texto) => {
    setMensajeGuardado(texto);
    setTimeout(() => setMensajeGuardado(''), 3500);
  };

  const handleSeleccionarEspacio = (espacio) => {
    setEspacioSeleccionado(espacio);
    setDatosPermiso(obtenerDatosPermisoEspacio(espacio));
    setDropdownAbierto(false);
    setBusquedaFosa('');
    setMensajeGuardado('');
  };

  const handleFormatoEnBlanco = () => {
    setEspacioSeleccionado(null);
    setDatosPermiso(obtenerDatosPermisoEspacio(null));
    setDropdownAbierto(false);
    setBusquedaFosa('');
    setMensajeGuardado('');
  };

  const handleGuardarTodo = () => {
    guardarPlantillaPermisoTumba(plantilla);
    guardarDatosPermisoEspacio(espacioSeleccionado, datosPermiso);
    mostrarConfirmacion('Datos del permiso y formato guardados correctamente.');
  };

  const handleRestaurarDatosFosa = () => {
    const originales = limpiarDatosPermisoEspacio(espacioSeleccionado);
    setDatosPermiso(originales);
    mostrarConfirmacion('Se restauraron los datos originales de la fosa seleccionada.');
  };

  const handleRestablecerPlantilla = () => {
    const base = restablecerPlantillaPermisoTumba();
    setPlantilla(base);
    mostrarConfirmacion('Se restableció el formato institucional predeterminado.');
  };

  const handleSincronizarConFosa = () => {
    if (!espacioSeleccionado || !onActualizarFosa) return;
    guardarDatosPermisoEspacio(espacioSeleccionado, datosPermiso);
    const fosaActualizada = {
      ...espacioSeleccionado,
      seccionNombre: datosPermiso.seccion || espacioSeleccionado.seccionNombre,
      titularNombre: datosPermiso.responsable || espacioSeleccionado.titularNombre
    };
    onActualizarFosa(fosaActualizada);
    setEspacioSeleccionado(fosaActualizada);
    mostrarConfirmacion('Responsable y sección actualizados en el padrón y guardados en el permiso.');
  };

  const handleImprimir = () => {
    guardarPlantillaPermisoTumba(plantilla);
    guardarDatosPermisoEspacio(espacioSeleccionado, datosPermiso);
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn print:space-y-0">
      <style>{`
        @media print {
          @page {
            size: letter portrait !important;
            margin: 4mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Cabecera del Apartado (Oculta al imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Hammer className="w-6 h-6 text-teal-600" />
            <span>Edición e Impresión de Permiso de Arreglo de Tumba</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Modifica los datos de la tumba, donación, medidas autorizadas, condiciones y firmas del Panteón La Soledad con vista previa en vivo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onVolver && (
            <button
              type="button"
              onClick={onVolver}
              className="px-3.5 py-2.5 bg-white hover:bg-cream-100 text-stone-700 text-xs font-bold rounded-xl border border-cream-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleImprimir}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-teal-700"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir Permiso de Arreglo</span>
          </button>
        </div>
      </div>

      {/* Selector de Lote / Fosa a Cargar (Oculto al imprimir) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-300 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Lote o Tumba Cargada en el Permiso
            </h2>
            <p className="text-[11px] text-stone-500">
              {espacioSeleccionado ? (
                <>
                  Editando permiso de tumba{' '}
                  <strong className="font-mono text-teal-900">
                    {formatearNumeroFosa(espacioSeleccionado.codigo)}
                  </strong>{' '}
                  — {espacioSeleccionado.titularNombre || 'Sin titular'}
                </>
              ) : (
                'Formato en blanco / personalizado (sin vincular a una fosa específica)'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleFormatoEnBlanco}
            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-800 rounded-xl text-xs font-bold border border-cream-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-teal-700" />
            <span>Formato en Blanco</span>
          </button>
        </div>

        {/* Buscador con dropdown */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busquedaFosa}
            onFocus={() => setDropdownAbierto(true)}
            onChange={(e) => {
              setBusquedaFosa(e.target.value);
              setDropdownAbierto(true);
            }}
            placeholder="Buscar tumba, titular o difunto para cargar sus datos en el permiso..."
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />

          {dropdownAbierto && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-cream-300 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-cream-200">
              <div className="px-3 py-2 bg-cream-50 flex items-center justify-between text-[11px] text-stone-500 font-bold sticky top-0">
                <span>Selecciona un espacio del padrón ({resultadosBusqueda.length})</span>
                <button
                  type="button"
                  onClick={() => setDropdownAbierto(false)}
                  className="text-teal-700 hover:underline cursor-pointer"
                >
                  Cerrar lista
                </button>
              </div>
              {resultadosBusqueda.length === 0 ? (
                <div className="p-4 text-center text-xs text-stone-400 italic">
                  No se encontraron espacios que coincidan con tu búsqueda.
                </div>
              ) : (
                resultadosBusqueda.map((item) => {
                  const seleccionado = espacioSeleccionado?.codigo === item.codigo;
                  return (
                    <button
                      key={item.id || item.codigo}
                      type="button"
                      onClick={() => handleSeleccionarEspacio(item)}
                      className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between gap-3 hover:bg-cream-50 cursor-pointer transition-colors ${
                        seleccionado ? 'bg-teal-50/80' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 flex items-center gap-2">
                          <span className="font-mono text-teal-800">
                            {formatearNumeroFosa(item.codigo)}
                          </span>
                          <span className="truncate">
                            {item.titularNombre || 'Sin titular registrado'}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {item.seccionNombre} • {item.tipoEspacio} •{' '}
                          {item.historialDifuntos?.length > 0
                            ? `Difunto: ${item.historialDifuntos.map((d) => d.nombre).join(', ')}`
                            : 'Disponible / Sin difuntos'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 shrink-0">
                        Cargar datos
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área Principal: Editor a la Izquierda + Vista Previa del Formato en Vivo a la Derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block">
        <div className="xl:col-span-5 print:hidden">
          <FormularioEditorPermisoTumba
            datosPermiso={datosPermiso}
            onChangeDatosPermiso={setDatosPermiso}
            plantilla={plantilla}
            onChangePlantilla={setPlantilla}
            onGuardarTodo={handleGuardarTodo}
            onRestaurarDatosFosa={espacioSeleccionado ? handleRestaurarDatosFosa : null}
            onRestablecerPlantilla={handleRestablecerPlantilla}
            onSincronizarConFosa={
              espacioSeleccionado && onActualizarFosa ? handleSincronizarConFosa : null
            }
            espacioAsociado={espacioSeleccionado}
            mensajeGuardado={mensajeGuardado}
          />
        </div>

        <div className="xl:col-span-7 print:w-full">
          <VistaDocumentoPermisoTumba
            datosPermiso={datosPermiso}
            plantilla={plantilla}
          />
        </div>
      </div>
    </div>
  );
}
