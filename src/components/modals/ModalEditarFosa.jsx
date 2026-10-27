// src/components/modals/ModalEditarFosa.jsx
import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Plus, 
  User, 
  Calendar, 
  Pencil,
  Folder,
  FolderPlus,
  Eye,
  CheckCircle2,
  AlertCircle,
  History,
  Layers
} from 'lucide-react';
import { calcularEstadoExpediente } from '../../constants/expedienteConfig';
import { obtenerHistorialPagosFosa } from '../../utils/pagosUtils';
import ModalAlerta from '../common/ModalAlerta';

export default function ModalEditarFosa({
  fosa,
  registro,
  onGuardar,
  onCerrar,
  onClose,
  onAbrirExpediente,
  onAbrirHistorial,
  esAdmin = true
}) {
  const itemActual = fosa || registro;

  const [formData, setFormData] = useState({
    codigo: itemActual?.codigo || '',
    seccionNombre: itemActual?.seccionNombre || 'Sección 1',
    tipoEspacio: itemActual?.tipoEspacio || 'Fosa',
    tipoConstruccion: itemActual?.tipoConstruccion || 'Sencilla',
    fechaSellado: itemActual?.fechaSellado || '',
    estatusPago: itemActual?.estatusPago || 'Al Corriente',
    titularNombre: itemActual?.titularNombre || '',
    titularTelefono: itemActual?.titularTelefono || '',
    titularCorreo: itemActual?.titularCorreo || '',
    observaciones: itemActual?.observaciones || '',
    historialDifuntos: itemActual?.historialDifuntos ? [...itemActual.historialDifuntos] : []
  });

  const [alertaConfig, setAlertaConfig] = useState(null);

  const [nuevoDifunto, setNuevoDifunto] = useState({
    nombre: '',
    fechaInhumacion: '',
    curp: '',
    causaMuerte: '',
    edad: ''
  });

  const [mostrarFormDifunto, setMostrarFormDifunto] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onCerrar) onCerrar();
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onClose]);

  if (!itemActual) return null;

  const handleClose = () => {
    if (onCerrar) onCerrar();
    if (onClose) onClose();
  };

  const estadoExp = calcularEstadoExpediente(itemActual.expediente);

  const handleAgregarDifunto = () => {
    if (!nuevoDifunto.nombre.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Nombre Requerido',
        mensaje: 'Por favor ingresa el nombre de la persona finada.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const difuntoCompleto = {
      ...nuevoDifunto,
      id: Date.now()
    };

    setFormData(prev => ({
      ...prev,
      historialDifuntos: [...prev.historialDifuntos, difuntoCompleto]
    }));

    setNuevoDifunto({
      nombre: '',
      fechaInhumacion: '',
      curp: '',
      causaMuerte: '',
      edad: ''
    });
    setMostrarFormDifunto(false);
  };

  const handleEliminarDifunto = (index) => {
    setFormData(prev => ({
      ...prev,
      historialDifuntos: prev.historialDifuntos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titularNombre.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Dato Requerido',
        mensaje: 'Por favor ingresa el nombre del titular o responsable.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    if (onGuardar) {
      onGuardar({
        ...itemActual,
        ...formData,
        tipoConstruccion: formData.tipoConstruccion || 'Sencilla',
        fechaSellado: formData.tipoConstruccion === 'Sellada' ? formData.fechaSellado : null
      });
    }
    handleClose();
  };

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-2xl w-full overflow-hidden my-8 max-h-[92vh] flex flex-col"
      >
        
        {/* Cabecera Modal (Verde Bosque #152822) */}
        <div className="bg-[#152822] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-[#234238]">
          <div className="flex items-center gap-2.5">
            <Pencil className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-black text-sm tracking-wide">
                Editar Espacio Funerario: {itemActual?.codigo}
              </h3>
              <p className="text-[11px] text-cream-100">
                Panteón La Soledad
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          
          {/* Fila 1: Identificación y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Código / Lote</label>
              <input
                type="text"
                disabled
                value={formData.codigo}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-mono font-bold text-stone-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Sección</label>
              <input
                type="text"
                disabled
                value={formData.seccionNombre}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900"
              />
            </div>

            {esAdmin ? (
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Estatus de Cobro</label>
                <select
                  value={formData.estatusPago}
                  onChange={(e) => setFormData({ ...formData, estatusPago: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Al Corriente">Al Corriente</option>
                  <option value="Con Adeudo">Con Adeudo</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Tipo de Espacio</label>
                <input
                  type="text"
                  disabled
                  value={formData.tipoEspacio || 'Fosa'}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900"
                />
              </div>
            )}
          </div>

          {/* Fila: Estado de Construcción de la Tumba (Sencilla / Sellada) y Fecha de Sellado */}
          <div className="p-4 bg-cream-50/70 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-teal-900">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Estado de Construcción / Sellado</span>
              </div>
              <span className="text-[10px] text-stone-500 font-medium hidden sm:inline">
                Especifica si la fosa está sellada o es sencilla
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Selector Sencilla vs Sellada */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Condición de la Tumba *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tipoConstruccion: 'Sencilla', fechaSellado: '' }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                      formData.tipoConstruccion === 'Sencilla'
                        ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                        : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                    }`}
                  >
                    <span>Sencilla</span>
                    {formData.tipoConstruccion === 'Sencilla' && <CheckCircle2 className="w-3.5 h-3.5 text-cream-200" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      tipoConstruccion: 'Sellada',
                      fechaSellado: prev.fechaSellado || new Date().toISOString().split('T')[0]
                    }))}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold flex items-center justify-center gap-1.5 ${
                      formData.tipoConstruccion === 'Sellada'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-stone-700 border-cream-300 hover:bg-cream-100'
                    }`}
                  >
                    <span>Sellada</span>
                    {formData.tipoConstruccion === 'Sellada' && <CheckCircle2 className="w-3.5 h-3.5 text-amber-100" />}
                  </button>
                </div>
              </div>

              {/* Fecha de Sellado (Condicional si está sellada) */}
              {formData.tipoConstruccion === 'Sellada' ? (
                <div className="space-y-1 animate-fadeIn">
                  <label className="block font-bold text-stone-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    <span>Fecha en que se Selló *</span>
                  </label>
                  <input
                    type="date"
                    required={formData.tipoConstruccion === 'Sellada'}
                    value={formData.fechaSellado}
                    onChange={(e) => setFormData({ ...formData, fechaSellado: e.target.value })}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                  <span className="text-[10px] text-amber-800 block">
                    Fecha de sellado definitivo o losa colocada.
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-[11px] text-stone-500 p-2.5 bg-white/70 rounded-xl border border-dashed border-cream-300">
                  <span>Tumba estándar en tierra (sin sellar).</span>
                </div>
              )}
            </div>
          </div>

          {/* Expediente Electrónico - Acceso Rápido y Estado */}
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-teal-950 text-xs">Expediente Electrónico</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                    estadoExp.estatus === 'Completo'
                      ? 'bg-olive-100 text-olive-800 border-olive-300'
                      : estadoExp.estatus === 'Incompleto'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}>
                    {estadoExp.estatus === 'Completo' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                    {estadoExp.totalAdjuntados} de {estadoExp.totalRequeridos} docs ({estadoExp.porcentaje}%)
                  </span>
                </div>
                <p className="text-[11px] text-teal-700 mt-0.5">
                  Actas de defunción, certificado médico, INE y actas de nacimiento digitalizadas.
                </p>
              </div>
            </div>

            {onAbrirExpediente && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => onAbrirExpediente(itemActual, 'visor')}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
                  title="Ver documentos en visor de pantalla completa"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver en Visor</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAbrirExpediente(itemActual, 'expediente')}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs"
                  title="Adjuntar o gestionar archivos del expediente"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Adjuntar Docs</span>
                </button>
              </div>
            )}
          </div>

          {/* Historial de Pagos y Refrendos - Resumen y Acceso Rápido (Solo Administrador) */}
          {esAdmin && (() => {
            const finanzas = obtenerHistorialPagosFosa(itemActual);
            const alCorriente = finanzas.estatusActual === 'Al Corriente';

            return (
              <div className="p-4 bg-cream-50 rounded-2xl border border-cream-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <History className="w-5 h-5 text-teal-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-stone-900 text-xs">Historial de Pagos y Refrendos</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                        alCorriente
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                      }`}>
                        {alCorriente ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                        {finanzas.estatusActual}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">
                      Total aportado: <strong>${finanzas.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong> ({finanzas.listaPagos.length} pagos registrados).
                      {finanzas.aniosPendientes.length > 0 && (
                        <span className="text-rose-700 ml-1 font-semibold">
                          (Adeuda {finanzas.aniosPendientes.length} año(s): ${finanzas.adeudoEstimado.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {onAbrirHistorial && (
                  <button
                    type="button"
                    onClick={() => onAbrirHistorial(itemActual)}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer text-xs shrink-0"
                    title="Consultar y gestionar el historial de pagos de esta fosa"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Ver Historial de Pagos</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Fila 2: Datos del Titular */}
          <div className="p-4 bg-cream-50/70 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex items-center gap-1.5 font-black text-teal-900">
              <User className="w-4 h-4 text-teal-600" />
              <span>Datos del Titular Concesionario</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">Nombre Completo del Titular *</label>
                <input
                  type="text"
                  required
                  value={formData.titularNombre}
                  onChange={(e) => setFormData({ ...formData, titularNombre: e.target.value })}
                  placeholder="Ej: Juan Pérez Morales"
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Teléfono de Contacto</label>
                <input
                  type="tel"
                  value={formData.titularTelefono}
                  onChange={(e) => setFormData({ ...formData, titularTelefono: e.target.value })}
                  placeholder="Ej: 55 1234 5678"
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.titularCorreo}
                  onChange={(e) => setFormData({ ...formData, titularCorreo: e.target.value })}
                  placeholder="Ej: titular@correo.com"
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Fila 3: Difuntos Inhumados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-stone-900">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Difuntos Inhumados en este Lote ({formData.historialDifuntos.length})</span>
              </div>

              {!mostrarFormDifunto && (
                <button
                  type="button"
                  onClick={() => setMostrarFormDifunto(true)}
                  className="px-2.5 py-1 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Difunto</span>
                </button>
              )}
            </div>

            {/* Lista de difuntos */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.historialDifuntos.length === 0 ? (
                <p className="text-stone-400 italic py-2">No hay difuntos registrados en este espacio.</p>
              ) : (
                formData.historialDifuntos.map((dif, idx) => (
                  <div key={idx} className="p-3 bg-cream-50 rounded-xl border border-cream-300 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-stone-900">
                        {dif.nombre} {dif.edad ? `(${dif.edad} años)` : ''}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        Fecha: {dif.fechaInhumacion || dif.fechaDefuncion || 'N/D'} {dif.causaMuerte ? `• Causa: ${dif.causaMuerte}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminarDifunto(idx)}
                      className="p-1 text-stone-400 hover:text-rust-600 hover:bg-rust-50 rounded-lg cursor-pointer"
                      title="Eliminar difunto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulario para agregar difunto */}
            {mostrarFormDifunto && (
              <div className="p-3.5 bg-cream-100/70 rounded-2xl border border-cream-300 space-y-3 animate-fadeIn">
                <div className="font-bold text-stone-800">Nuevo Registro de Difunto</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nombre completo del difunto *"
                      value={nuevoDifunto.nombre}
                      onChange={(e) => setNuevoDifunto({ ...nuevoDifunto, nombre: e.target.value })}
                      className="w-full bg-white border border-cream-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={nuevoDifunto.fechaInhumacion}
                      onChange={(e) => setNuevoDifunto({ ...nuevoDifunto, fechaInhumacion: e.target.value })}
                      className="w-full bg-white border border-cream-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Causa de defunción"
                      value={nuevoDifunto.causaMuerte}
                      onChange={(e) => setNuevoDifunto({ ...nuevoDifunto, causaMuerte: e.target.value })}
                      className="w-full bg-white border border-cream-300 rounded-xl p-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setMostrarFormDifunto(false)}
                    className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAgregarDifunto}
                    className="px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Confirmar Difunto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="block font-bold text-stone-700">Observaciones o Notas Catastrales</label>
            <textarea
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas sobre el estado del monumento, permisos de construcción o referencias..."
              className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Botones de Guardado */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-cream-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs border border-teal-600 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>

        </form>

      </div>

      {/* Modal de Alerta / Validación Centrado */}
      {alertaConfig && (
        <ModalAlerta
          abierto={!!alertaConfig}
          tipo={alertaConfig.tipo}
          titulo={alertaConfig.titulo}
          mensaje={alertaConfig.mensaje}
          textoBotonPrincipal={alertaConfig.textoBotonPrincipal}
          textoBotonSecundario={alertaConfig.textoBotonSecundario}
          onAceptar={alertaConfig.onAceptar}
          onCancelar={alertaConfig.onCancelar}
          onCerrar={() => setAlertaConfig(null)}
        />
      )}
    </div>
  );
}
