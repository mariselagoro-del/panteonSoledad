// src/pages/FormatosOficiales.jsx
import { useState, useMemo } from 'react';
import {
  Files,
  Award,
  Hammer,
  Printer,
  Search,
  FilePlus2,
  ArrowLeft
} from 'lucide-react';
import {
  obtenerPlantillaCedula,
  guardarPlantillaCedula,
  restablecerPlantillaCedula,
  obtenerDatosCedulaEspacio,
  guardarDatosCedulaEspacio,
  limpiarDatosCedulaEspacio
} from '../constants/cedulaConfig';
import {
  obtenerPlantillaPermisoTumba,
  guardarPlantillaPermisoTumba,
  restablecerPlantillaPermisoTumba,
  obtenerDatosPermisoEspacio,
  guardarDatosPermisoEspacio,
  limpiarDatosPermisoEspacio
} from '../constants/permisoTumbaConfig';
import { coincideEspacioConBusqueda, formatearNumeroFosa } from '../utils/busquedaUtils';
import VistaDocumentoCedula from '../components/cedula/VistaDocumentoCedula';
import FormularioEditorCedula from '../components/cedula/FormularioEditorCedula';
import VistaDocumentoPermisoTumba from '../components/permiso/VistaDocumentoPermisoTumba';
import FormularioEditorPermisoTumba from '../components/permiso/FormularioEditorPermisoTumba';

const FORMATOS_DISPONIBLES = [
  {
    id: 'cedula',
    titulo: 'Cédula Oficial',
    descripcion: 'Título de concesión de fosa o nicho y ficha técnica',
    icono: Award,
    textoBotonImprimir: 'Imprimir Cédula Oficial'
  },
  {
    id: 'permiso-arreglo',
    titulo: 'Permiso de Arreglo de Tumba',
    descripcion: 'Autorización de trabajos con medidas 2.30m x 1.30m y condiciones',
    icono: Hammer,
    textoBotonImprimir: 'Imprimir Permiso de Arreglo'
  }
];

/**
 * Concentrador unificado de Formatos Oficiales del Panteón La Soledad.
 * Permite elegir entre los distintos formatos disponibles mediante pestañas,
 * cargar cualquier fosa del padrón (o iniciar en blanco), editar en vivo e imprimir.
 */
export default function FormatosOficiales({
  registrosFosas = [],
  onActualizarFosa,
  onVolver,
  formatoInicial = 'cedula'
}) {
  const [formatoActivo, setFormatoActivo] = useState(formatoInicial);
  const [busquedaFosa, setBusquedaFosa] = useState('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(() => registrosFosas[0] || null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);

  // Estado para Cédula Oficial
  const [plantillaCedula, setPlantillaCedula] = useState(() => obtenerPlantillaCedula());
  const [datosCedula, setDatosCedula] = useState(() =>
    obtenerDatosCedulaEspacio(registrosFosas[0] || null)
  );

  // Estado para Permiso de Arreglo de Tumba
  const [plantillaPermiso, setPlantillaPermiso] = useState(() => obtenerPlantillaPermisoTumba());
  const [datosPermiso, setDatosPermiso] = useState(() =>
    obtenerDatosPermisoEspacio(registrosFosas[0] || null)
  );

  const [mensajeGuardado, setMensajeGuardado] = useState('');

  const formatoActualMeta =
    FORMATOS_DISPONIBLES.find((f) => f.id === formatoActivo) || FORMATOS_DISPONIBLES[0];

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

  const cargarEspacioEnFormatos = (espacio) => {
    setEspacioSeleccionado(espacio);
    setDatosCedula(obtenerDatosCedulaEspacio(espacio));
    setDatosPermiso(obtenerDatosPermisoEspacio(espacio));
    setDropdownAbierto(false);
    setBusquedaFosa('');
    setMensajeGuardado('');
  };

  const handleCambiarFormato = (nuevoFormatoId) => {
    setFormatoActivo(nuevoFormatoId);
    setMensajeGuardado('');
  };

  // Manejadores de Cédula Oficial
  const handleGuardarCedula = () => {
    guardarPlantillaCedula(plantillaCedula);
    guardarDatosCedulaEspacio(espacioSeleccionado, datosCedula);
    mostrarConfirmacion('Datos de la cédula y plantilla oficial guardados correctamente.');
  };

  const handleRestaurarCedula = () => {
    setDatosCedula(limpiarDatosCedulaEspacio(espacioSeleccionado));
    mostrarConfirmacion('Se restauraron los datos originales de la fosa en la cédula.');
  };

  const handleRestablecerPlantillaCedula = () => {
    setPlantillaCedula(restablecerPlantillaCedula());
    mostrarConfirmacion('Se restableció la plantilla predeterminada de la Cédula Oficial.');
  };

  const handleSincronizarCedulaConFosa = () => {
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

  // Manejadores de Permiso de Arreglo de Tumba
  const handleGuardarPermiso = () => {
    guardarPlantillaPermisoTumba(plantillaPermiso);
    guardarDatosPermisoEspacio(espacioSeleccionado, datosPermiso);
    mostrarConfirmacion('Datos del permiso y del formato guardados correctamente.');
  };

  const handleRestaurarPermiso = () => {
    setDatosPermiso(limpiarDatosPermisoEspacio(espacioSeleccionado));
    mostrarConfirmacion('Se restauraron los datos originales de la fosa en el permiso.');
  };

  const handleRestablecerPlantillaPermiso = () => {
    setPlantillaPermiso(restablecerPlantillaPermisoTumba());
    mostrarConfirmacion('Se restableció el formato predeterminado del Permiso de Arreglo.');
  };

  const handleSincronizarPermisoConFosa = () => {
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

  const handleImprimirFormatoActual = () => {
    if (formatoActivo === 'permiso-arreglo') {
      guardarPlantillaPermisoTumba(plantillaPermiso);
      guardarDatosPermisoEspacio(espacioSeleccionado, datosPermiso);
    } else {
      guardarPlantillaCedula(plantillaCedula);
      guardarDatosCedulaEspacio(espacioSeleccionado, datosCedula);
    }
    window.print();
  };

  return (
    <div className="space-y-5 animate-fadeIn print:space-y-0">
      <style>{`
        @media print {
          @page {
            size: letter portrait !important;
            margin: 5mm !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* 1. Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
            <Files className="w-6 h-6 text-teal-600" />
            <span>Formatos Oficiales</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Selecciona el formato oficial del Panteón La Soledad para editar sus datos, personalizar su diseño e imprimirlo.
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
            onClick={handleImprimirFormatoActual}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all border border-teal-700"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>{formatoActualMeta.textoBotonImprimir}</span>
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Formatos Disponibles */}
      <div
        role="tablist"
        aria-label="Formatos oficiales disponibles"
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden"
      >
        {FORMATOS_DISPONIBLES.map((formato) => {
          const Icono = formato.icono;
          const activo = formatoActivo === formato.id;
          return (
            <button
              key={formato.id}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => handleCambiarFormato(formato.id)}
              className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activo
                  ? 'bg-[#152822] text-white border-[#152822] shadow-md'
                  : 'bg-white hover:bg-cream-50 text-stone-800 border-cream-300 shadow-2xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  activo ? 'bg-[#D2B79A] text-[#152822]' : 'bg-cream-100 text-teal-700'
                }`}
              >
                <Icono className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-black tracking-tight ${
                      activo ? 'text-[#F5F3EF]' : 'text-stone-900'
                    }`}
                  >
                    {formato.titulo}
                  </span>
                  {activo && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D2B79A] text-[#152822] shrink-0">
                      Activo
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] mt-0.5 leading-snug ${
                    activo ? 'text-[#C5D1CC]' : 'text-stone-500'
                  }`}
                >
                  {formato.descripcion}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Selector Compartido de Lote / Fosa del Padrón */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-cream-300 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-stone-800">
              Lote o Fosa Cargada en el Formato
            </h2>
            <p className="text-[11px] text-stone-500">
              {espacioSeleccionado ? (
                <>
                  Cargando datos de fosa{' '}
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
            onClick={() => cargarEspacioEnFormatos(null)}
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
            placeholder="Buscar fosa, titular o difunto para cargar sus datos en cualquiera de los formatos..."
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
                      onClick={() => cargarEspacioEnFormatos(item)}
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

      {/* 4. Editor a la Izquierda + Vista Previa del Documento en Vivo a la Derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start print:block">
        <div className="xl:col-span-5 print:hidden">
          {formatoActivo === 'permiso-arreglo' ? (
            <FormularioEditorPermisoTumba
              datosPermiso={datosPermiso}
              onChangeDatosPermiso={setDatosPermiso}
              plantilla={plantillaPermiso}
              onChangePlantilla={setPlantillaPermiso}
              onGuardarTodo={handleGuardarPermiso}
              onRestaurarDatosFosa={espacioSeleccionado ? handleRestaurarPermiso : null}
              onRestablecerPlantilla={handleRestablecerPlantillaPermiso}
              onSincronizarConFosa={
                espacioSeleccionado && onActualizarFosa ? handleSincronizarPermisoConFosa : null
              }
              espacioAsociado={espacioSeleccionado}
              mensajeGuardado={mensajeGuardado}
            />
          ) : (
            <FormularioEditorCedula
              datosCedula={datosCedula}
              onChangeDatosCedula={setDatosCedula}
              plantilla={plantillaCedula}
              onChangePlantilla={setPlantillaCedula}
              onGuardarTodo={handleGuardarCedula}
              onRestaurarDatosFosa={espacioSeleccionado ? handleRestaurarCedula : null}
              onRestablecerPlantilla={handleRestablecerPlantillaCedula}
              onSincronizarConFosa={
                espacioSeleccionado && onActualizarFosa ? handleSincronizarCedulaConFosa : null
              }
              espacioAsociado={espacioSeleccionado}
              mensajeGuardado={mensajeGuardado}
            />
          )}
        </div>

        <div className="xl:col-span-7 print:w-full">
          {formatoActivo === 'permiso-arreglo' ? (
            <VistaDocumentoPermisoTumba
              datosPermiso={datosPermiso}
              plantilla={plantillaPermiso}
            />
          ) : (
            <VistaDocumentoCedula
              datosCedula={datosCedula}
              plantilla={plantillaCedula}
            />
          )}
        </div>
      </div>
    </div>
  );
}
