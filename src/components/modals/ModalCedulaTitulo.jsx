// src/components/modals/ModalCedulaTitulo.jsx
import { useState } from 'react';
import { Printer, X, Award, Pencil, Eye } from 'lucide-react';
import {
  obtenerPlantillaCedula,
  guardarPlantillaCedula,
  restablecerPlantillaCedula,
  obtenerDatosCedulaEspacio,
  guardarDatosCedulaEspacio,
  limpiarDatosCedulaEspacio
} from '../../constants/cedulaConfig';
import VistaDocumentoCedula from '../cedula/VistaDocumentoCedula';
import FormularioEditorCedula from '../cedula/FormularioEditorCedula';

export default function ModalCedulaTitulo({ espacio, onCerrar, onActualizarFosa }) {
  const [modo, setModo] = useState('vista'); // 'vista' | 'editar'
  const [plantilla, setPlantilla] = useState(() => obtenerPlantillaCedula());
  const [datosCedula, setDatosCedula] = useState(() => obtenerDatosCedulaEspacio(espacio));
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  if (!espacio) return null;

  const mostrarConfirmacion = (texto) => {
    setMensajeGuardado(texto);
    setTimeout(() => setMensajeGuardado(''), 3500);
  };

  const handleGuardarTodo = () => {
    guardarPlantillaCedula(plantilla);
    guardarDatosCedulaEspacio(espacio, datosCedula);
    mostrarConfirmacion('Cambios guardados en la cédula oficial.');
    setModo('vista');
  };

  const handleRestaurarDatosFosa = () => {
    const originales = limpiarDatosCedulaEspacio(espacio);
    setDatosCedula(originales);
    mostrarConfirmacion('Se restauraron los datos originales de la fosa.');
  };

  const handleRestablecerPlantilla = () => {
    const def = restablecerPlantillaCedula();
    setPlantilla(def);
    mostrarConfirmacion('Se restableció la plantilla institucional predeterminada.');
  };

  const handleSincronizarConFosa = () => {
    if (!onActualizarFosa) return;
    const difuntosActualizados = (datosCedula.difuntos || [])
      .map((d, idx) => {
        const original = (espacio.historialDifuntos || [])[idx] || {};
        return {
          ...original,
          nombre: (d.nombre || '').trim(),
          parentesco: d.parentesco || '',
          tipoServicio: d.tipoServicio || original.tipoServicio || 'Inhumación'
        };
      })
      .filter((d) => d.nombre !== '');

    onActualizarFosa({
      ...espacio,
      seccionNombre: datosCedula.seccionNombre || espacio.seccionNombre,
      tipoEspacio: datosCedula.tipoEspacio || espacio.tipoEspacio,
      estatusPago: datosCedula.estatusPago || espacio.estatusPago,
      titularNombre: datosCedula.titularNombre || espacio.titularNombre,
      titularTelefono: datosCedula.titularTelefono ?? espacio.titularTelefono,
      historialDifuntos: difuntosActualizados
    });
    guardarDatosCedulaEspacio(espacio, datosCedula);
    mostrarConfirmacion('Datos actualizados en el padrón y guardados en la cédula.');
  };

  const handlePrint = () => {
    // Asegurar modo vista antes de imprimir
    if (modo !== 'vista') {
      setModo('vista');
      setTimeout(() => window.print(), 80);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn print:bg-white print:p-0 print:static">
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-4xl w-full p-5 sm:p-8 space-y-5 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-h-none print:rounded-none print:max-w-none print:overflow-visible">
        {/* Barra de Acciones del Modal (Oculta al imprimir) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-cream-200 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-stone-900">
                Cédula Oficial de Título de Concesión
              </h2>
              <p className="text-xs text-stone-500">
                Visualiza, modifica datos o imprime el formato oficial del Panteón La Soledad.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector Vista Previa / Modificar Datos */}
            <div className="inline-flex rounded-xl bg-cream-100 p-1 border border-cream-300">
              <button
                type="button"
                onClick={() => setModo('vista')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'vista'
                    ? 'bg-white text-[#152822] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista Previa</span>
              </button>
              <button
                type="button"
                onClick={() => setModo('editar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modo === 'editar'
                    ? 'bg-[#152822] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Modificar Datos</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-teal-600"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir Cédula</span>
            </button>

            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-cream-100 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirmación rápida en vista previa */}
        {modo === 'vista' && mensajeGuardado && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold text-center print:hidden">
            {mensajeGuardado}
          </div>
        )}

        {/* MODO EDICIÓN: APARTADO PARA MODIFICAR LOS DATOS DE LA CÉDULA OFICIAL */}
        {modo === 'editar' && (
          <div className="print:hidden">
            <FormularioEditorCedula
              datosCedula={datosCedula}
              onChangeDatosCedula={setDatosCedula}
              plantilla={plantilla}
              onChangePlantilla={setPlantilla}
              onGuardarTodo={handleGuardarTodo}
              onRestaurarDatosFosa={handleRestaurarDatosFosa}
              onRestablecerPlantilla={handleRestablecerPlantilla}
              onSincronizarConFosa={onActualizarFosa ? handleSincronizarConFosa : null}
              espacioAsociado={espacio}
              mensajeGuardado={mensajeGuardado}
            />
          </div>
        )}

        {/* MODO VISTA PREVIA / DOCUMENTO OFICIAL IMPRIMIBLE */}
        <div className={modo === 'editar' ? 'hidden print:block' : 'block'}>
          <VistaDocumentoCedula datosCedula={datosCedula} plantilla={plantilla} />
        </div>
      </div>
    </div>
  );
}
