// src/components/modals/ModalPermisoArregloTumba.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Pencil, Eye, Hammer } from 'lucide-react';
import {
  obtenerPlantillaPermisoTumba,
  guardarPlantillaPermisoTumba,
  restablecerPlantillaPermisoTumba,
  obtenerDatosPermisoEspacio,
  guardarDatosPermisoEspacio,
  limpiarDatosPermisoEspacio
} from '../../constants/permisoTumbaConfig';
import VistaDocumentoPermisoTumba from '../permiso/VistaDocumentoPermisoTumba';
import FormularioEditorPermisoTumba from '../permiso/FormularioEditorPermisoTumba';

/**
 * Modal interactivo para previsualizar, modificar datos y/o imprimir
 * el Permiso de Arreglo de Tumba del Panteón La Soledad.
 */
export default function ModalPermisoArregloTumba({
  espacio,
  onCerrar,
  onActualizarFosa
}) {
  const [modoEditor, setModoEditor] = useState(false);
  const [plantilla, setPlantilla] = useState(() => obtenerPlantillaPermisoTumba());
  const [datosPermiso, setDatosPermiso] = useState(() => obtenerDatosPermisoEspacio(espacio));
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  const mostrarConfirmacion = (texto) => {
    setMensajeGuardado(texto);
    setTimeout(() => setMensajeGuardado(''), 3500);
  };

  const handleGuardarTodo = () => {
    guardarPlantillaPermisoTumba(plantilla);
    guardarDatosPermisoEspacio(espacio, datosPermiso);
    mostrarConfirmacion('Cambios del permiso y del formato guardados correctamente.');
  };

  const handleRestaurarDatosFosa = () => {
    const originales = limpiarDatosPermisoEspacio(espacio);
    setDatosPermiso(originales);
    mostrarConfirmacion('Se restauraron los datos originales del padrón.');
  };

  const handleRestablecerPlantilla = () => {
    const base = restablecerPlantillaPermisoTumba();
    setPlantilla(base);
    mostrarConfirmacion('Se restableció el formato institucional predeterminado.');
  };

  const handleSincronizarConFosa = () => {
    if (!espacio || !onActualizarFosa) return;
    guardarDatosPermisoEspacio(espacio, datosPermiso);
    const actualizado = {
      ...espacio,
      titularNombre: datosPermiso.responsable || espacio.titularNombre,
      seccionNombre: datosPermiso.seccion || espacio.seccionNombre
    };
    onActualizarFosa(actualizado);
    mostrarConfirmacion('Responsable y sección actualizados en el padrón y guardados en el permiso.');
  };

  const handleImprimir = () => {
    guardarPlantillaPermisoTumba(plantilla);
    guardarDatosPermisoEspacio(espacio, datosPermiso);
    window.print();
  };

  const contenidoModal = (
    <div className="permiso-print-portal fixed inset-0 z-[100] bg-black/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <style>{`
        @media print {
          @page {
            size: letter portrait !important;
            margin: 4mm !important;
          }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #root {
            display: none !important;
          }
          .permiso-print-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .permiso-print-portal * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col border border-cream-300 overflow-hidden print:shadow-none print:border-none print:max-h-none print:rounded-none print:w-full print:max-w-none print:block">
        {/* Barra Superior de Control (Oculta al imprimir) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 border-b border-cream-300 bg-cream-50 print:hidden">
          <div className="flex items-center gap-2.5 text-teal-900 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Hammer className="w-4 h-4" />
            </div>
            <div>
              <span className="block leading-tight">Permiso de Arreglo de Tumba</span>
              <span className="block text-[11px] font-medium text-stone-500">
                Tumba {datosPermiso.tumba || 'En blanco'} {datosPermiso.seccion ? `• ${datosPermiso.seccion}` : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Alternar Vista Previa / Editor */}
            <div className="flex items-center bg-cream-200/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setModoEditor(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  !modoEditor
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Vista Previa
              </button>
              <button
                type="button"
                onClick={() => setModoEditor(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  modoEditor
                    ? 'bg-white text-teal-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Modificar Datos
              </button>
            </div>

            <button
              type="button"
              onClick={handleImprimir}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir Formato
            </button>

            <button
              type="button"
              onClick={onCerrar}
              title="Cerrar ventana"
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-cream-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo: Editor o Documento Imprimible */}
        <div className="flex-1 overflow-y-auto bg-stone-100/70 p-3 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          {modoEditor ? (
            <div className="max-w-3xl mx-auto print:hidden">
              <FormularioEditorPermisoTumba
                datosPermiso={datosPermiso}
                onChangeDatosPermiso={setDatosPermiso}
                plantilla={plantilla}
                onChangePlantilla={setPlantilla}
                onGuardarTodo={handleGuardarTodo}
                onRestaurarDatosFosa={handleRestaurarDatosFosa}
                onRestablecerPlantilla={handleRestablecerPlantilla}
                onSincronizarConFosa={onActualizarFosa ? handleSincronizarConFosa : undefined}
                espacioAsociado={espacio}
                mensajeGuardado={mensajeGuardado}
              />
            </div>
          ) : null}

          <div className={modoEditor ? 'hidden print:block' : 'block'}>
            <VistaDocumentoPermisoTumba
              datosPermiso={datosPermiso}
              plantilla={plantilla}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(contenidoModal, document.body);
}
