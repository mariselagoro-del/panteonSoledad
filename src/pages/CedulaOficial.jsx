// src/pages/CedulaOficial.jsx
import { useState, useMemo } from 'react';
import { Award, Printer, Search, FilePlus2, ArrowLeft } from 'lucide-react';
import {
  obtenerPlantillaCedula,
  guardarPlantillaCedula,
  restablecerPlantillaCedula,
  obtenerDatosCedulaEspacio,
  guardarDatosCedulaEspacio,
  limpiarDatosCedulaEspacio
} from '../constants/cedulaConfig';
import { coincideEspacioConBusqueda, formatearNumeroFosa } from '../utils/busquedaUtils';
import VistaDocumentoCedula from '../components/cedula/VistaDocumentoCedula';
import FormularioEditorCedula from '../components/cedula/FormularioEditorCedula';

export default function CedulaOficial({
  registrosFosas = [],
  onActualizarFosa,
  onVolver
}) {
  const [busquedaFosa, setBusquedaFosa] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(() => registrosFosas[0] || null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  const [plantilla, setPlantilla] = useState(() => obtenerPlantillaCedula());
  const [datosCedula, setDatosCedula] = useState(() =>
    obtenerDatosCedulaEspacio(registrosFosas[0] || null)
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
    setDatosCedula(obtenerDatosCedulaEspacio(espacio));
    setDropdownAbierto(false);
    setBusquedaFosa('');
    setMensajeGuardado('');
  };

  const handleFormatoEnBlanco = () => {
    setEspacioSeleccionado(null);
    setDatosCedula(obtenerDatosCedulaEspacio(null));
    setDropdownAbierto(false);
    setBusquedaFosa('');
    setMensajeGuardado('');
  };

  const handleGuardarTodo = () => {
    guardarPlantillaCedula(plantilla);
    guardarDatosCedulaEspacio(espacioSeleccionado, datosCedula);
    mostrarConfirmacion('Datos de la cédula y plantilla oficial guardados correctamente.');
  };

  const handleRestaurarDatosFosa = () => {
    const originales = limpiarDatosCedulaEspacio(espacioSeleccionado);
    setDatosCedula(originales);
    mostrarConfirmacion('Se restauraron los datos originales de la fosa seleccionada.');
  };

  const handleRestablecerPlantilla = () => {
    const def = restablecerPlantillaCedula();
    setPlantilla(def);
    mostrarConfirmacion('Se restableció la plantilla oficial predeterminada.');
  };

  const handleSincronizarConFosa = () => {
    if (!espacioSeleccionado || !onActualizarFosa) return;
    const difuntosActualizados = (datosCedula.difuntos || [])
      .map((d, idx) => {
        const original = (espacioSeleccionado.historialDifuntos || [])[idx] || {};
        return {
          ...original,
          nombre: (d.nombre || '').trim(),
          parentesco: d.parentesco || '',
          tipoServicio: d.tipoServicio || original.tipoServicio || 'Inhumación'
        };
      })
      .filter((d) => d.nombre !== '');

    const fosaActualizada = {
      ...espacioSeleccionado,
      seccionNombre: datosCedula.seccionNombre || espacioSeleccionado.seccionNombre,
      tipoEspacio: datosCedula.tipoEspacio || espacioSeleccionado.tipoEspacio,
      estatusPago: datosCedula.estatusPago || espacioSeleccionado.estatusPago,
      titularNombre: datosCedula.titularNombre || espacioSeleccionado.titularNombre,
      titularTelefono: datosCedula.titularTelefono ?? espacioSeleccionado.titularTelefono,
      historialDifuntos: difuntosActualizados
    };

    onActualizarFosa(fosaActualizada);
    setEspacioSeleccionado(fosaActualizada);
    guardarDatosCedulaEspacio(fosaActualizada, datosCedula);
    mostrarConfirmacion('Ficha actualizada en el padrón y guardada en la cédula.');
  };

  return (
    <div className="space-y-6 animate-fadeIn print:space-y-0">
      {/* 1. Cabecera del Apartado (Oculta al imprimir) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-6 h-6 text-teal-600" />
            <span>Edición y Expedición de Cédula Oficial</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Modifica los datos de la concesión, membrete, cláusulas y firmas de la Cédula Oficial del Panteón La Soledad con vista previa en vivo.
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
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-teal-700"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir Cédula Oficial</span>
          </button>
        </div>
      </div>

      {/* 2. Selector de Lote / Fosa a Cargar (Oculto al imprimir) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-300 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Lote o Fosa Cargada en Cédula
            </h2>
            <p className="text-[11px] text-stone-500">
              {espacioSeleccionado ? (
                <>
                  Editando cédula del lote{' '}
                  <strong className="font-mono text-teal-900">
                    {formatearNumeroFosa(espacioSeleccionado.codigo)}
                  </strong>{' '}
                  — {espacioSeleccionado.titularNombre || 'Sin titular'}
                </>
              ) : (
                'Formato personalizado / En blanco (sin vincular a una fosa específica)'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleFormatoEnBlanco}
            className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-800 rounded-xl text-xs font-bold border border-cream-300 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-teal-700" />
            <span>Cédula Personalizada / En Blanco</span>
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
            placeholder="Buscar fosa, titular o difunto para cargar sus datos en la cédula..."
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
                  No se encontraron fosas que coincidan con tu búsqueda.
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

      {/* 3. Área Principal: Editor a la Izquierda + Vista Previa Oficial en Vivo a la Derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block">
        {/* Columna Izquierda: Formulario de Modificación */}
        <div className="xl:col-span-5 print:hidden">
          <FormularioEditorCedula
            datosCedula={datosCedula}
            onChangeDatosCedula={setDatosCedula}
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

        {/* Columna Derecha: Vista Previa del Documento Imprimible */}
        <div className="xl:col-span-7 bg-white p-3 sm:p-5 rounded-3xl border border-cream-300 shadow-xs print:p-0 print:border-none print:shadow-none print:rounded-none">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-cream-200 print:hidden">
            <span className="text-xs font-black uppercase tracking-wider text-stone-700">
              Vista Previa en Tiempo Real (Lista para Imprimir)
            </span>
            <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              {datosCedula.folioOficial || 'TIT-0000'}
            </span>
          </div>

          <VistaDocumentoCedula datosCedula={datosCedula} plantilla={plantilla} />
        </div>
      </div>
    </div>
  );
}
