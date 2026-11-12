// src/components/cedula/FormularioEditorCedula.jsx
import { useState } from 'react';
import {
  FileText,
  Building2,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  Users,
  Database
} from 'lucide-react';
import { OPCIONES_PARENTESCO, TIPOS_SERVICIO_FUNERARIO } from '../../constants/panteonData';

/**
 * Panel reutilizable para modificar los datos específicos de la Cédula Oficial
 * y la plantilla institucional (membrete, cláusulas y firmas).
 */
export default function FormularioEditorCedula({
  datosCedula,
  onChangeDatosCedula,
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

  const actualizarCampoDatos = (campo, valor) => {
    onChangeDatosCedula((prev) => {
      const siguiente = { ...prev, [campo]: valor };
      // Si se actualiza el titular y el subtítulo de firma aún coincidía con el anterior, sincronizarlo
      if (campo === 'titularNombre') {
        const firmaAnterior = prev.firmaTitularSubtitulo || '';
        const titularAnterior = prev.titularNombre || '';
        if (!firmaAnterior || firmaAnterior === titularAnterior || firmaAnterior === 'Firma de Aceptación') {
          siguiente.firmaTitularSubtitulo = valor || 'Firma de Aceptación';
        }
      }
      return siguiente;
    });
  };

  const actualizarCampoPlantilla = (campo, valor) => {
    onChangePlantilla((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const actualizarDifunto = (indice, campo, valor) => {
    onChangeDatosCedula((prev) => {
      const lista = Array.isArray(prev.difuntos) ? [...prev.difuntos] : [];
      lista[indice] = { ...(lista[indice] || {}), [campo]: valor };
      return { ...prev, difuntos: lista };
    });
  };

  const agregarDifunto = () => {
    onChangeDatosCedula((prev) => ({
      ...prev,
      difuntos: [
        ...(Array.isArray(prev.difuntos) ? prev.difuntos : []),
        { nombre: '', parentesco: '', tipoServicio: 'Inhumación', fecha: '' }
      ]
    }));
  };

  const eliminarDifunto = (indice) => {
    onChangeDatosCedula((prev) => ({
      ...prev,
      difuntos: (Array.isArray(prev.difuntos) ? prev.difuntos : []).filter((_, i) => i !== indice)
    }));
  };

  const difuntos = Array.isArray(datosCedula?.difuntos) ? datosCedula.difuntos : [];

  return (
    <div className="bg-cream-50/70 rounded-2xl border border-cream-300 p-4 sm:p-5 space-y-4">
      {/* Navegación interna de sub-apartados */}
      <div className="flex flex-wrap items-center gap-2 border-b border-cream-300 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('datos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
            subTab === 'datos'
              ? 'bg-[#152822] text-white border-[#152822] shadow-xs'
              : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Datos de esta Cédula</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('plantilla')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
            subTab === 'plantilla'
              ? 'bg-[#152822] text-white border-[#152822] shadow-xs'
              : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Membrete, Cláusulas y Firmas</span>
        </button>
      </div>

      {/* Confirmación de guardado */}
      {mensajeGuardado && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{mensajeGuardado}</span>
        </div>
      )}

      {/* SUB-TAB 1: DATOS ESPECÍFICOS DE ESTA CÉDULA */}
      {subTab === 'datos' && (
        <div className="space-y-4 text-xs">
          {/* Folio y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Folio Oficial</label>
              <input
                type="text"
                value={datosCedula.folioOficial || ''}
                onChange={(e) => actualizarCampoDatos('folioOficial', e.target.value)}
                placeholder="Ej. TIT-0001"
                className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Fecha de Expedición</label>
              <input
                type="text"
                value={datosCedula.fechaExpedicion || ''}
                onChange={(e) => actualizarCampoDatos('fechaExpedicion', e.target.value)}
                placeholder="Ej. 11 de noviembre de 2026"
                className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Ficha Técnica del Espacio */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="font-black text-[11px] uppercase tracking-wider text-teal-900">
              Ficha Técnica del Espacio Funerario
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Número de Fosa</label>
                <input
                  type="text"
                  value={datosCedula.numeroFosa || ''}
                  onChange={(e) => actualizarCampoDatos('numeroFosa', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Sección</label>
                <input
                  type="text"
                  value={datosCedula.seccionNombre || ''}
                  onChange={(e) => actualizarCampoDatos('seccionNombre', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Tipo de Espacio</label>
                <input
                  type="text"
                  value={datosCedula.tipoEspacio || ''}
                  onChange={(e) => actualizarCampoDatos('tipoEspacio', e.target.value)}
                  placeholder="Fosa, Nicho, Lote..."
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1 col-span-2 sm:col-span-2">
                <label className="block font-bold text-stone-700">Construcción</label>
                <input
                  type="text"
                  value={datosCedula.construccionTexto || ''}
                  onChange={(e) => actualizarCampoDatos('construccionTexto', e.target.value)}
                  placeholder="Sencilla / Sellada"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Estatus de Cobro</label>
                <input
                  type="text"
                  value={datosCedula.estatusPago || ''}
                  onChange={(e) => actualizarCampoDatos('estatusPago', e.target.value)}
                  placeholder="Al Corriente"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Datos del Titular */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider text-teal-900">
              <User className="w-3.5 h-3.5" />
              <span>Titular Concesionario(a)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Nombre del Titular</label>
                <input
                  type="text"
                  value={datosCedula.titularNombre || ''}
                  onChange={(e) => actualizarCampoDatos('titularNombre', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={datosCedula.titularTelefono || ''}
                  onChange={(e) => actualizarCampoDatos('titularTelefono', e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">
                  Nombre debajo de Firma del Concesionario
                </label>
                <input
                  type="text"
                  value={datosCedula.firmaTitularSubtitulo || ''}
                  onChange={(e) => actualizarCampoDatos('firmaTitularSubtitulo', e.target.value)}
                  placeholder="Por defecto el nombre del titular"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Lista Editable de Difuntos */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider text-teal-900">
                <Users className="w-3.5 h-3.5" />
                <span>Difunto(s) Inhumado(s) en la Cédula ({difuntos.length})</span>
              </div>
              <button
                type="button"
                onClick={agregarDifunto}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar Difunto</span>
              </button>
            </div>

            {difuntos.length === 0 ? (
              <p className="text-[11px] text-stone-400 italic py-1">
                Sin difuntos listados (en la cédula se imprimirá &quot;Espacio libre / Disponible&quot;).
              </p>
            ) : (
              <div className="space-y-2.5">
                {difuntos.map((dif, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-cream-50 rounded-xl border border-cream-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-stone-500 uppercase">
                        Difunto #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => eliminarDifunto(idx)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                        title="Quitar difunto de esta cédula"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={dif.nombre || ''}
                        onChange={(e) => actualizarDifunto(idx, 'nombre', e.target.value)}
                        placeholder="Nombre completo del difunto"
                        className="sm:col-span-2 bg-white border border-cream-300 rounded-lg px-2.5 py-1.5 font-bold text-stone-900 focus:outline-none focus:border-teal-500"
                      />
                      <select
                        value={dif.parentesco || ''}
                        onChange={(e) => actualizarDifunto(idx, 'parentesco', e.target.value)}
                        className="bg-white border border-cream-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-teal-500"
                      >
                        <option value="">Parentesco (Opcional)</option>
                        {OPCIONES_PARENTESCO.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <select
                        value={dif.tipoServicio || 'Inhumación'}
                        onChange={(e) => actualizarDifunto(idx, 'tipoServicio', e.target.value)}
                        className="bg-white border border-cream-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-teal-500"
                      >
                        {TIPOS_SERVICIO_FUNERARIO.map((op) => (
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={dif.fecha || ''}
                        onChange={(e) => actualizarDifunto(idx, 'fecha', e.target.value)}
                        placeholder="Fecha (ej. 05/11/2026)"
                        className="sm:col-span-2 bg-white border border-cream-300 rounded-lg px-2.5 py-1.5 font-mono text-stone-800 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones opcionales */}
          <div className="space-y-1">
            <label className="block font-bold text-stone-700">
              Observaciones / Anotaciones Adicionales en Cédula (Opcional)
            </label>
            <textarea
              rows={2}
              value={datosCedula.observacionesCedula || ''}
              onChange={(e) => actualizarCampoDatos('observacionesCedula', e.target.value)}
              placeholder="Ej. Reposición por extravío, medidas del lote, aclaraciones de titularidad..."
              className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-y"
            />
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MEMBRETE, CLÁUSULAS Y FIRMAS INSTITUCIONALES (PLANTILLA GLOBAL) */}
      {subTab === 'plantilla' && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
            Los cambios realizados en este apartado aplican como formato oficial predeterminado para todas las cédulas del{' '}
            <strong>Panteón La Soledad</strong>.
          </div>

          {/* Membrete */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="font-black text-[11px] uppercase tracking-wider text-teal-900">
              Encabezado y Membrete Oficial
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Línea Superior Institucional</label>
                <input
                  type="text"
                  value={plantilla.encabezadoSuperior || ''}
                  onChange={(e) => actualizarCampoPlantilla('encabezadoSuperior', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Dependencia / Dirección</label>
                <input
                  type="text"
                  value={plantilla.direccionAdministrativa || ''}
                  onChange={(e) => actualizarCampoPlantilla('direccionAdministrativa', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-semibold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Título Principal</label>
                  <input
                    type="text"
                    value={plantilla.nombrePanteon || ''}
                    onChange={(e) => actualizarCampoPlantilla('nombrePanteon', e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-black text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Ubicación / Localidad</label>
                  <input
                    type="text"
                    value={plantilla.ubicacionPanteon || ''}
                    onChange={(e) => actualizarCampoPlantilla('ubicacionPanteon', e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Etiqueta / Título del Título</label>
                <input
                  type="text"
                  value={plantilla.tituloDocumento || ''}
                  onChange={(e) => actualizarCampoPlantilla('tituloDocumento', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-extrabold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Textos Jurídicos y Cláusulas */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="font-black text-[11px] uppercase tracking-wider text-teal-900">
              Declaración Jurídica y Cláusulas
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Párrafo Introductorio</label>
              <textarea
                rows={3}
                value={plantilla.declaracionJuridica || ''}
                onChange={(e) => actualizarCampoPlantilla('declaracionJuridica', e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Título Cláusula 1</label>
                <input
                  type="text"
                  value={plantilla.clausula1Titulo || ''}
                  onChange={(e) => actualizarCampoPlantilla('clausula1Titulo', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">Texto Cláusula 1</label>
                <textarea
                  rows={2}
                  value={plantilla.clausula1Texto || ''}
                  onChange={(e) => actualizarCampoPlantilla('clausula1Texto', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500 resize-y"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Título Cláusula 2</label>
                <input
                  type="text"
                  value={plantilla.clausula2Titulo || ''}
                  onChange={(e) => actualizarCampoPlantilla('clausula2Titulo', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">Texto Cláusula 2</label>
                <textarea
                  rows={2}
                  value={plantilla.clausula2Texto || ''}
                  onChange={(e) => actualizarCampoPlantilla('clausula2Texto', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Firmas y Pie de Página */}
          <div className="bg-white p-3.5 rounded-xl border border-cream-300 space-y-3">
            <div className="font-black text-[11px] uppercase tracking-wider text-teal-900">
              Firmas Oficiales y Pie de Página
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Firma Izquierda (Cargo)</label>
                <input
                  type="text"
                  value={plantilla.firmaAdminTitulo || ''}
                  onChange={(e) => actualizarCampoPlantilla('firmaAdminTitulo', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Nombre / Dependencia Firma</label>
                <input
                  type="text"
                  value={plantilla.firmaAdminSubtitulo || ''}
                  onChange={(e) => actualizarCampoPlantilla('firmaAdminSubtitulo', e.target.value)}
                  placeholder="Ej. Corina Michel Aceves León / Panteón La Soledad"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Firma Derecha (Etiqueta)</label>
                <input
                  type="text"
                  value={plantilla.firmaTitularTitulo || ''}
                  onChange={(e) => actualizarCampoPlantilla('firmaTitularTitulo', e.target.value)}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 font-bold text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Leyenda del Pie de Página</label>
              <input
                type="text"
                value={plantilla.piePagina || ''}
                onChange={(e) => actualizarCampoPlantilla('piePagina', e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Botonera Inferior de Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-cream-300">
        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'datos' && espacioAsociado && onRestaurarDatosFosa && (
            <button
              type="button"
              onClick={onRestaurarDatosFosa}
              className="px-3 py-2 bg-white hover:bg-cream-100 text-stone-700 border border-cream-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Descartar cambios personalizados y cargar nuevamente los datos originales de esta fosa"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Datos de la Fosa</span>
            </button>
          )}

          {subTab === 'plantilla' && onRestablecerPlantilla && (
            <button
              type="button"
              onClick={onRestablecerPlantilla}
              className="px-3 py-2 bg-white hover:bg-cream-100 text-stone-700 border border-cream-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Restablecer membretes, cláusulas y firmas a los valores oficiales predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Plantilla Oficial</span>
            </button>
          )}

          {subTab === 'datos' && espacioAsociado && onSincronizarConFosa && (
            <button
              type="button"
              onClick={onSincronizarConFosa}
              className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Actualizar también los datos del titular, teléfono y estatus en el padrón general"
            >
              <Database className="w-3.5 h-3.5 text-teal-700" />
              <span>Actualizar Ficha en Padrón</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onGuardarTodo}
          className="px-4 py-2 bg-[#152822] hover:bg-[#1E3A31] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all border border-[#152822]"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Guardar Cambios de Cédula</span>
        </button>
      </div>
    </div>
  );
}
