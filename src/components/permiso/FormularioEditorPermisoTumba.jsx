// src/components/permiso/FormularioEditorPermisoTumba.jsx
import { useState } from 'react';
import {
  FileText,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Ruler,
  Users,
  Database,
  AlertTriangle
} from 'lucide-react';

/**
 * Formulario reutilizable para editar tanto los datos específicos del Permiso de Arreglo de Tumba
 * como las opciones de plantilla (medidas base, condiciones, sellos, bordes y firmantes).
 */
export default function FormularioEditorPermisoTumba({
  datosPermiso,
  onChangeDatosPermiso,
  plantilla,
  onChangePlantilla,
  onGuardarTodo,
  onRestaurarDatosFosa,
  onRestablecerPlantilla,
  onSincronizarConFosa,
  espacioAsociado = null,
  mensajeGuardado = ''
}) {
  const [subTab, setSubTab] = useState('datos'); // 'datos' | 'plantilla'

  const actualizarCampoDato = (campo, valor) => {
    onChangeDatosPermiso((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const actualizarCampoPlantilla = (campo, valor) => {
    onChangePlantilla((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const actualizarCondicion = (indice, valor) => {
    onChangePlantilla((prev) => {
      const lista = Array.isArray(prev.condiciones) ? [...prev.condiciones] : [];
      lista[indice] = valor;
      return { ...prev, condiciones: lista };
    });
  };

  const agregarCondicion = () => {
    onChangePlantilla((prev) => ({
      ...prev,
      condiciones: [...(Array.isArray(prev.condiciones) ? prev.condiciones : []), '']
    }));
  };

  const eliminarCondicion = (indice) => {
    onChangePlantilla((prev) => ({
      ...prev,
      condiciones: (Array.isArray(prev.condiciones) ? prev.condiciones : []).filter(
        (_, i) => i !== indice
      )
    }));
  };

  const actualizarFirmante = (clave, campo, valor) => {
    onChangePlantilla((prev) => ({
      ...prev,
      firmantes: {
        ...(prev.firmantes || {}),
        [clave]: {
          ...((prev.firmantes && prev.firmantes[clave]) || {}),
          [campo]: valor
        }
      }
    }));
  };

  const clavesFirmantes = [
    { clave: 'presidente', etiqueta: 'Presidente (Centro)' },
    { clave: 'secretario', etiqueta: 'Secretario (Superior Izquierda)' },
    { clave: 'tesorero', etiqueta: 'Tesorero (Superior Derecha)' },
    { clave: 'vocal1', etiqueta: 'Vocal 1 (Inferior Izquierda)' },
    { clave: 'vocal2', etiqueta: 'Vocal 2 (Inferior Derecha)' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-cream-300 shadow-2xs overflow-hidden flex flex-col">
      {/* Navegación interna */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-cream-100/80 border-b border-cream-300">
        <div className="flex items-center gap-1.5 bg-cream-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setSubTab('datos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              subTab === 'datos'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Datos del Permiso
          </button>
          <button
            type="button"
            onClick={() => setSubTab('plantilla')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              subTab === 'plantilla'
                ? 'bg-white text-teal-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Formato, Condiciones y Firmas
          </button>
        </div>

        <button
          type="button"
          onClick={onGuardarTodo}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs cursor-pointer transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Guardar Cambios
        </button>
      </div>

      {/* Confirmación de guardado */}
      {mensajeGuardado && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{mensajeGuardado}</span>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-5 max-h-[68vh] overflow-y-auto">
        {subTab === 'datos' ? (
          <>
            {/* Sección 1: Datos principales del permiso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Datos Generales del Permiso
                </h3>
                {espacioAsociado && onRestaurarDatosFosa && (
                  <button
                    type="button"
                    onClick={onRestaurarDatosFosa}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restaurar del padrón
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Tumba / Espacio
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.tumba || ''}
                    onChange={(e) => actualizarCampoDato('tumba', e.target.value)}
                    placeholder="Ej: 045"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Sección
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.seccion || ''}
                    onChange={(e) => actualizarCampoDato('seccion', e.target.value)}
                    placeholder="Ej: Fosa 1"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-50/50 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  T / Responsable (Titular)
                </label>
                <input
                  type="text"
                  value={datosPermiso.responsable || ''}
                  onChange={(e) => actualizarCampoDato('responsable', e.target.value)}
                  placeholder="Nombre completo del titular o responsable"
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Difunto
                </label>
                <input
                  type="text"
                  value={datosPermiso.difunto || ''}
                  onChange={(e) => actualizarCampoDato('difunto', e.target.value)}
                  placeholder="Nombre del difunto en la tumba"
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Donación ($)
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.donacion || ''}
                    onChange={(e) => actualizarCampoDato('donacion', e.target.value)}
                    placeholder="Ej: 500.00"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Fecha de Expedición
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.expedicion || ''}
                    onChange={(e) => actualizarCampoDato('expedicion', e.target.value)}
                    placeholder="Ej: 11/11/2026"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Medidas y Advertencia */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900 border-b border-cream-200 pb-2 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-teal-600" />
                Medidas Autorizadas y Aviso
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Largo Autorizado
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.largoAutorizado || ''}
                    onChange={(e) => actualizarCampoDato('largoAutorizado', e.target.value)}
                    placeholder="2.30 m"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Ancho Autorizado
                  </label>
                  <input
                    type="text"
                    value={datosPermiso.anchoAutorizado || ''}
                    onChange={(e) => actualizarCampoDato('anchoAutorizado', e.target.value)}
                    placeholder="1.30 m"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Aviso Destacado
                </label>
                <input
                  type="text"
                  value={datosPermiso.advertencia ?? ''}
                  onChange={(e) => actualizarCampoDato('advertencia', e.target.value)}
                  placeholder="NO SE PUEDEN REALIZAR NICHOS"
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-amber-50/40 text-sm font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Observaciones Adicionales (opcional)
                </label>
                <input
                  type="text"
                  value={datosPermiso.observaciones || ''}
                  onChange={(e) => actualizarCampoDato('observaciones', e.target.value)}
                  placeholder="Ej: Colocación de lápida y barandal sin exceder medidas"
                  className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {espacioAsociado && onSincronizarConFosa && (
              <div className="pt-2 border-t border-cream-200 flex items-center justify-between gap-2 flex-wrap">
                <p className="text-[11px] text-stone-500 max-w-xs">
                  ¿Deseas guardar los cambios de Responsable y Sección directamente en el padrón?
                </p>
                <button
                  type="button"
                  onClick={onSincronizarConFosa}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  Actualizar en Padrón
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Encabezado y Apariencia */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                  Encabezado y Elementos Visuales
                </h3>
                {onRestablecerPlantilla && (
                  <button
                    type="button"
                    onClick={onRestablecerPlantilla}
                    className="text-[11px] font-bold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restablecer formato
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Título Institucional
                  </label>
                  <input
                    type="text"
                    value={plantilla.tituloEncabezado || ''}
                    onChange={(e) => actualizarCampoPlantilla('tituloEncabezado', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">
                    Subtítulo del Formato
                  </label>
                  <input
                    type="text"
                    value={plantilla.subtituloPermiso || ''}
                    onChange={(e) => actualizarCampoPlantilla('subtituloPermiso', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-semibold text-stone-700">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantilla.mostrarSello !== false}
                    onChange={(e) => actualizarCampoPlantilla('mostrarSello', e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Sello Oficial
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantilla.mostrarMarcaAgua !== false}
                    onChange={(e) => actualizarCampoPlantilla('mostrarMarcaAgua', e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Marca de Agua
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantilla.mostrarBordesOrnamentales !== false}
                    onChange={(e) =>
                      actualizarCampoPlantilla('mostrarBordesOrnamentales', e.target.checked)
                    }
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Marcos Ornamentales
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantilla.mostrarFirmasDigitales !== false}
                    onChange={(e) =>
                      actualizarCampoPlantilla('mostrarFirmasDigitales', e.target.checked)
                    }
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Firmas Digitales
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={plantilla.mostrarAdvertencia !== false}
                    onChange={(e) => actualizarCampoPlantilla('mostrarAdvertencia', e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Aviso Amarillo/Rojo
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-cream-50 border border-cream-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(plantilla.mostrarSubtitulo)}
                    onChange={(e) => actualizarCampoPlantilla('mostrarSubtitulo', e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Mostrar Subtítulo debajo del nombre
                </label>
              </div>
            </div>

            {/* Condiciones Editables */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between border-b border-cream-200 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                  Condiciones del Permiso
                </h3>
                <button
                  type="button"
                  onClick={agregarCondicion}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold cursor-pointer border border-teal-200"
                >
                  <Plus className="w-3 h-3" />
                  Agregar Regla
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Título de la Sección
                </label>
                <input
                  type="text"
                  value={plantilla.tituloCondiciones || ''}
                  onChange={(e) => actualizarCampoPlantilla('tituloCondiciones', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-cream-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                {(plantilla.condiciones || []).map((condicion, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <textarea
                      rows={2}
                      value={condicion}
                      onChange={(e) => actualizarCondicion(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-cream-300 bg-white text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarCondicion(idx)}
                      title="Eliminar condición"
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Firmas de la Comisión */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-900 border-b border-cream-200 pb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                Integrantes de la Comisión (Firmas)
              </h3>

              <div className="space-y-2.5">
                {clavesFirmantes.map(({ clave, etiqueta }) => {
                  const item = plantilla.firmantes?.[clave] || {};
                  return (
                    <div
                      key={clave}
                      className="p-3 rounded-xl border border-cream-300 bg-cream-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-stone-700 uppercase">
                          {etiqueta}
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.visible !== false}
                            onChange={(e) => actualizarFirmante(clave, 'visible', e.target.checked)}
                            className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                          />
                          Visible
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.nombre || ''}
                          onChange={(e) => actualizarFirmante(clave, 'nombre', e.target.value)}
                          placeholder="Nombre completo"
                          className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <input
                          type="text"
                          value={item.cargo || ''}
                          onChange={(e) => actualizarFirmante(clave, 'cargo', e.target.value)}
                          placeholder="Cargo"
                          className="px-2.5 py-1.5 rounded-lg border border-cream-300 bg-white text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
