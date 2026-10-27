// src/components/modals/ModalRegistroFosa.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Save, 
  Landmark, 
  User, 
  FileText,
  Folder,
  UploadCloud,
  CheckCircle2,
  Trash2,
  FileCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Layers,
  Calendar
} from 'lucide-react';
import { 
  DOCUMENTOS_REQUERIDOS, 
  leerArchivoParaExpediente,
  calcularEstadoExpediente
} from '../../constants/expedienteConfig';
import ModalAlerta from '../common/ModalAlerta';

/**
 * Función que calcula de forma automática el siguiente código consecutivo disponible
 * en base a la sección seleccionada y los registros existentes en el sistema.
 */
function calcularSiguienteCodigo(seccionNombre, registros = []) {
  let prefijo;
  const sec = (seccionNombre || '').toLowerCase();
  
  if (sec.includes('nicho') || sec.includes('ceniza')) {
    prefijo = 'N';
  } else if (sec.includes('5')) {
    prefijo = 'F5';
  } else if (sec.includes('4')) {
    prefijo = 'F4';
  } else if (sec.includes('3')) {
    prefijo = 'F3';
  } else if (sec.includes('2')) {
    prefijo = 'F2';
  } else if (sec.includes('1')) {
    prefijo = 'F1';
  } else {
    prefijo = 'F';
  }

  let maxNumero = 0;

  for (const reg of registros) {
    const cod = (reg.codigo || '').trim().toUpperCase();
    const regSec = (reg.seccionNombre || '').toLowerCase();
    
    const coincideSeccion = sec && regSec.includes(sec);
    const coincidePrefijo = cod.startsWith(prefijo.toUpperCase());

    if (coincideSeccion || coincidePrefijo) {
      const matches = cod.match(/\d+/g);
      if (matches && matches.length > 0) {
        const num = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(num) && num > maxNumero) {
          maxNumero = num;
        }
      }
    }
  }

  const siguiente = maxNumero + 1;
  return `${prefijo}-${String(siguiente).padStart(3, '0')}`;
}

export default function ModalRegistroFosa({
  abierto = false,
  isOpen = false,
  secciones = [],
  registrosActuales = [],
  registrosFosas = [],
  onGuardar,
  onClose,
  onCerrar
}) {
  const visible = abierto || isOpen;
  
  const listaRegistros = useMemo(() => {
    return registrosActuales.length > 0 ? registrosActuales : registrosFosas;
  }, [registrosActuales, registrosFosas]);

  // Lista única de secciones para evitar duplicados en el select
  const listaSeccionesUnicas = useMemo(() => {
    const nombres = new Set();
    const resultado = [];

    for (const s of secciones) {
      const nombre = typeof s === 'string' ? s : s.nombre;
      if (nombre && !nombres.has(nombre.trim().toLowerCase())) {
        nombres.add(nombre.trim().toLowerCase());
        resultado.push({ id: s.id || nombre, nombre: nombre.trim() });
      }
    }

    if (!nombres.has('zona de nichos')) {
      resultado.push({ id: 'nichos-default', nombre: 'Zona de Nichos' });
    }

    return resultado;
  }, [secciones]);

  const [formData, setFormData] = useState({
    codigo: '',
    seccionNombre: 'Sección 1',
    tipoEspacio: 'Fosa',
    tipoConstruccion: 'Sencilla', // 'Sencilla' | 'Sellada'
    fechaSellado: '',
    estatusPago: 'Al Corriente',
    estatusOcupacion: 'Disponible',
    titularNombre: '',
    titularTelefono: '',
    titularCorreo: '',
    observaciones: '',
    difuntoNombre: '',
    difuntoFechaInhumacion: '',
    difuntoCurp: '',
    difuntoCausaMuerte: '',
    difuntoEdad: ''
  });

  // Estado para los documentos del expediente
  const [documentosExpediente, setDocumentosExpediente] = useState({});
  const [mostrarSeccionDocs, setMostrarSeccionDocs] = useState(true);
  const [cargandoDocId, setCargandoDocId] = useState(null);
  const [alertaConfig, setAlertaConfig] = useState(null);
  const resetFormulario = useCallback(() => {
    setDocumentosExpediente({});
    setFormData({
      codigo: '',
      seccionNombre: 'Sección 1',
      tipoEspacio: 'Fosa',
      tipoConstruccion: 'Sencilla',
      fechaSellado: '',
      estatusPago: 'Al Corriente',
      estatusOcupacion: 'Disponible',
      titularNombre: '',
      titularTelefono: '',
      titularCorreo: '',
      observaciones: '',
      difuntoNombre: '',
      difuntoFechaInhumacion: '',
      difuntoCurp: '',
      difuntoCausaMuerte: '',
      difuntoEdad: ''
    });
  }, []);

  const handleClose = useCallback(() => {
    resetFormulario();
    if (onClose) onClose();
    if (onCerrar) onCerrar();
  }, [onClose, onCerrar, resetFormulario]);

  // Soporte para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  // Si no está abierto, no renderizar nada
  if (!visible) return null;

  // Manejar cambio de sección y recalcular código en automático
  const handleSeccionChange = (nuevaSeccion) => {
    const nuevoCodigo = calcularSiguienteCodigo(nuevaSeccion, listaRegistros);
    const nuevoTipo = nuevaSeccion.toLowerCase().includes('nicho') ? 'Nicho' : 'Fosa';

    setFormData(prev => ({
      ...prev,
      seccionNombre: nuevaSeccion,
      codigo: nuevoCodigo,
      tipoEspacio: nuevoTipo
    }));
  };

  const codigoActualOCalculado = formData.codigo || calcularSiguienteCodigo(formData.seccionNombre, listaRegistros);

  // Manejador para adjuntar documento al expediente en nuevo registro
  const handleAdjuntarDoc = async (docId, archivo) => {
    if (!archivo) return;
    setCargandoDocId(docId);
    try {
      const datosArchivo = await leerArchivoParaExpediente(archivo);
      setDocumentosExpediente(prev => ({
        ...prev,
        [docId]: {
          id: docId,
          adjuntado: true,
          ...datosArchivo
        }
      }));
    } catch (err) {
      console.error('Error al procesar archivo:', err);
      setAlertaConfig({
        tipo: 'error',
        titulo: 'Error en Documento',
        mensaje: 'Error al leer el archivo. Intenta con una imagen o PDF válido.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
    } finally {
      setCargandoDocId(null);
    }
  };

  const handleEliminarDoc = (docId) => {
    setDocumentosExpediente(prev => {
      const nuevo = { ...prev };
      delete nuevo[docId];
      return nuevo;
    });
  };

  const estadoExp = calcularEstadoExpediente({ documentos: documentosExpediente });

  const getDocIcon = (icono) => {
    switch (icono) {
      case 'FileCheck': return FileCheck;
      case 'ShieldCheck': return ShieldCheck;
      default: return FileText;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const codigoFinal = formData.codigo.trim() || codigoActualOCalculado;

    if (!codigoFinal || !formData.titularNombre.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Campos Requeridos Incompletos',
        mensaje: 'Por favor completa el código de fosa y el nombre del titular para continuar con el registro.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const nuevoRegistro = {
      id: Date.now(),
      codigo: codigoFinal.toUpperCase(),
      seccionNombre: formData.seccionNombre,
      tipoEspacio: formData.tipoEspacio,
      tipoConstruccion: formData.tipoConstruccion || 'Sencilla',
      fechaSellado: formData.tipoConstruccion === 'Sellada' ? formData.fechaSellado : null,
      estatusPago: formData.estatusPago,
      estatusOcupacion: formData.difuntoNombre ? 'Ocupado' : 'Disponible',
      titularNombre: formData.titularNombre.trim(),
      titularTelefono: formData.titularTelefono.trim(),
      titularCorreo: formData.titularCorreo.trim(),
      observaciones: formData.observaciones.trim(),
      historialDifuntos: formData.difuntoNombre.trim() ? [
        {
          id: 1,
          nombre: formData.difuntoNombre.trim(),
          fechaInhumacion: formData.difuntoFechaInhumacion,
          curp: formData.difuntoCurp.trim(),
          causaMuerte: formData.difuntoCausaMuerte.trim(),
          edad: formData.difuntoEdad
        }
      ] : [],
      expediente: {
        documentos: documentosExpediente,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString()
      }
    };

    if (onGuardar) onGuardar(nuevoRegistro);
    handleClose();
  };

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-3xl w-full overflow-hidden my-6 max-h-[92vh] flex flex-col"
      >
        
        {/* Cabecera Modal (Verde Bosque Institucional #152822) */}
        <div className="bg-[#152822] text-white px-6 py-4 flex items-center justify-between shrink-0 border-b border-[#234238]">
          <div className="flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-black text-sm tracking-wide">
                Registrar Nueva Fosa / Inhumación
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

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
          
          {/* Fila 1: Ubicación, Sección y Código Consecutivo Bloqueado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* 1. Sección */}
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Sección *</label>
              <select
                value={formData.seccionNombre}
                onChange={(e) => handleSeccionChange(e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              >
                {listaSeccionesUnicas.map(s => (
                  <option key={s.id} value={s.nombre}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* 2. Código / Lote (Automático) */}
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Código / Lote (Automático) *</label>
              <input
                type="text"
                disabled
                readOnly
                value={formData.codigo || codigoActualOCalculado}
                className="w-full bg-cream-100/90 border border-cream-300 rounded-xl p-2.5 font-mono font-black text-teal-900 cursor-not-allowed select-all shadow-inner"
              />
              <span className="text-[10px] text-stone-500 block">
                Consecutivo calculado de <strong>{formData.seccionNombre}</strong>
              </span>
            </div>

            {/* 3. Tipo de Espacio */}
            <div className="space-y-1">
              <label className="block font-bold text-stone-700">Tipo de Espacio</label>
              <select
                value={formData.tipoEspacio}
                onChange={(e) => setFormData({ ...formData, tipoEspacio: e.target.value })}
                className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              >
                <option value="Fosa">Fosa en Tierra</option>
                <option value="Nicho">Nicho para Cenizas</option>
                <option value="Mausoleo">Mausoleo / Cripta</option>
              </select>
            </div>
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

          {/* Fila 2: Titular */}
          <div className="p-4 bg-cream-50/70 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex items-center gap-1.5 font-black text-teal-900">
              <User className="w-4 h-4 text-teal-600" />
              <span>Titular o Responsable del Espacio</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">Nombre del Titular *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y apellidos completos"
                  value={formData.titularNombre}
                  onChange={(e) => setFormData({ ...formData, titularNombre: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Teléfono</label>
                <input
                  type="tel"
                  placeholder="55 1234 5678"
                  value={formData.titularTelefono}
                  onChange={(e) => setFormData({ ...formData, titularTelefono: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Estatus Inicial de Pago</label>
                <select
                  value={formData.estatusPago}
                  onChange={(e) => setFormData({ ...formData, estatusPago: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                >
                  <option value="Al Corriente">Al Corriente (Pagado)</option>
                  <option value="Con Adeudo">Con Adeudo Pendiente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fila 3: Difunto (Opcional) */}
          <div className="p-4 bg-cream-50/70 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex items-center justify-between font-black text-teal-900">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Primer Difunto (Opcional - si ya hubo sepelio)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="block font-bold text-stone-700">Nombre del Difunto</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={formData.difuntoNombre}
                  onChange={(e) => setFormData({ ...formData, difuntoNombre: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Fecha de Inhumación</label>
                <input
                  type="date"
                  value={formData.difuntoFechaInhumacion}
                  onChange={(e) => setFormData({ ...formData, difuntoFechaInhumacion: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Causa de Muerte</label>
                <input
                  type="text"
                  placeholder="Ej: Natural / Infarto"
                  value={formData.difuntoCausaMuerte}
                  onChange={(e) => setFormData({ ...formData, difuntoCausaMuerte: e.target.value })}
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Fila 4: Expediente Electrónico (Adjuntar Documentos Requeridos en Nuevo Registro) */}
          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-black text-teal-900 block text-xs">
                    Expediente Electrónico (Adjuntar Documentación)
                  </span>
                  <span className="text-[10px] text-teal-700">
                    {estadoExp.totalAdjuntados} de {estadoExp.totalRequeridos} documentos anexados ({estadoExp.porcentaje}%)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMostrarSeccionDocs(prev => !prev)}
                className="text-teal-800 hover:text-teal-950 p-1 rounded-lg hover:bg-teal-100/60 transition-colors cursor-pointer"
                title={mostrarSeccionDocs ? 'Minimizar documentos' : 'Expandir documentos'}
              >
                {mostrarSeccionDocs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {mostrarSeccionDocs && (
              <div className="space-y-3 pt-2">
                <p className="text-[11px] text-stone-600">
                  Puedes anexar fotos o archivos PDF de los documentos solicitados por el área de administración (Acta de defunción, certificado médico, acta de nacimiento e INE del difunto y del titular):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DOCUMENTOS_REQUERIDOS.map((docConfig) => {
                    const archivoData = documentosExpediente[docConfig.id];
                    const estaAdjuntado = !!archivoData && (archivoData.adjuntado || !!archivoData.dataUrl);
                    const DocIcon = getDocIcon(docConfig.icono);
                    const cargandoEste = cargandoDocId === docConfig.id;

                    return (
                      <div
                        key={docConfig.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          estaAdjuntado 
                            ? 'bg-white border-olive-400 shadow-2xs' 
                            : 'bg-white/80 border-cream-300 hover:border-teal-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <DocIcon className={`w-4 h-4 shrink-0 ${estaAdjuntado ? 'text-olive-600' : 'text-teal-700'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-stone-900 text-[11px] truncate">
                                {docConfig.titulo}
                              </div>
                              <div className="text-[9px] text-stone-400 truncate">
                                {estaAdjuntado ? `${archivoData.nombre} (${archivoData.tamano})` : docConfig.categoriaTitulo}
                              </div>
                            </div>
                          </div>

                          {estaAdjuntado ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-bold text-olive-700 bg-olive-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Anexado
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEliminarDoc(docConfig.id)}
                                className="p-1 text-stone-400 hover:text-rust-600 rounded cursor-pointer"
                                title="Quitar archivo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="shrink-0 px-2 py-1 bg-cream-100 hover:bg-teal-100 text-teal-800 hover:text-teal-900 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-cream-300">
                              <UploadCloud className="w-3 h-3 text-teal-600" />
                              <span>{cargandoEste ? 'Cargando...' : 'Subir'}</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                disabled={cargandoEste}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleAdjuntarDoc(docConfig.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Fila 5: Observaciones */}
          <div className="space-y-1">
            <label className="block font-bold text-stone-700">Observaciones Generales</label>
            <textarea
              rows={2}
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas sobre el estado físico del lote o trámites pendientes..."
              className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Botones de Envío */}
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
              className="px-5 py-2.5 bg-rust-500 hover:bg-rust-600 text-white font-bold rounded-xl shadow-xs border border-rust-600 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Nueva Fosa</span>
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
