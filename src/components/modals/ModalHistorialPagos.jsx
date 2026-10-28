// src/components/modals/ModalHistorialPagos.jsx
import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  History, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Phone, 
  ShieldCheck
} from 'lucide-react';
import { 
  obtenerHistorialPagosFosa, 
  agregarPagoAFosa, 
  eliminarPagoDeFosa, 
  ANIO_ACTUAL, 
  CUOTA_REFRENDO_ANUAL 
} from '../../utils/pagosUtils';
import { formatearNumeroFosa } from '../../utils/busquedaUtils';
import ModalAlerta from '../common/ModalAlerta';

export default function ModalHistorialPagos({
  abierto = false,
  isOpen = false,
  espacio = null,
  fosa = null,
  onCerrar,
  onClose,
  onEmitirRecibo,
  onRegistrarMovimiento,
  onActualizarFosa
}) {
  const visible = abierto || isOpen;
  const fosaInicial = espacio || fosa;

  // Estado sincronizado de la fosa para actualización inmediata sin latencia
  const [fosaOverride, setFosaOverride] = useState(null);
  const fosaActual = (fosaOverride && fosaOverride.id === fosaInicial?.id) ? fosaOverride : fosaInicial;

  // Estado del formulario manual de pago
  const [mostrarFormManual, setMostrarFormManual] = useState(false);
  const [dialogYaPago, setDialogYaPago] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(() => fosaInicial?._opcionesHistorial?.filtro || 'Todos');
  const [alertaConfig, setAlertaConfig] = useState(null);

  const [formManual, setFormManual] = useState({
    anio: ANIO_ACTUAL,
    fecha: new Date().toISOString().split('T')[0],
    concepto: `Refrendo Anual de Fosa ${ANIO_ACTUAL}`,
    categoria: 'Refrendo',
    monto: CUOTA_REFRENDO_ANUAL,
    folio: '',
    metodoPago: 'Efectivo en Caja',
    observaciones: ''
  });

  // Manejo de cierre con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dialogYaPago) {
          setDialogYaPago(null);
        } else {
          if (onCerrar) onCerrar();
          if (onClose) onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onClose, dialogYaPago]);

  // Cálculo de historial y finanzas
  const resumenFinanciero = useMemo(() => {
    return obtenerHistorialPagosFosa(fosaActual);
  }, [fosaActual]);

  // Generar lista de adeudos pendientes
  const listaAdeudos = useMemo(() => {
    return resumenFinanciero.aniosPendientes.map((anio) => ({
      id: `adeudo-${fosaActual.codigo || fosaActual.id}-${anio}`,
      folio: 'PENDIENTE',
      anio: anio,
      fecha: `${anio}-01-01`,
      periodo: `Ejercicio ${anio}`,
      concepto: `Refrendo Anual Extemporáneo ${anio} (Adeudo)`,
      categoria: 'Adeudo',
      monto: CUOTA_REFRENDO_ANUAL,
      metodoPago: 'Por Liquidar en Caja',
      titular: fosaActual.titularNombre || 'Titular Registrado',
      estatus: 'Con Adeudo',
      observaciones: `Cuota de refrendo anual correspondiente al ejercicio ${anio} pendiente de liquidar.`,
      esAdeudo: true
    }));
  }, [resumenFinanciero.aniosPendientes, fosaActual]);

  // Filtrado de la lista de pagos o adeudos
  const itemsFiltrados = useMemo(() => {
    if (filtroCategoria === 'Adeudos') {
      const term = busqueda.trim().toLowerCase();
      if (!term) return listaAdeudos;
      return listaAdeudos.filter(item =>
        String(item.anio).includes(term) ||
        item.concepto.toLowerCase().includes(term) ||
        item.observaciones.toLowerCase().includes(term)
      );
    }

    return resumenFinanciero.listaPagos.filter(pago => {
      const matchCat = filtroCategoria === 'Todos' || pago.categoria === filtroCategoria;
      const term = busqueda.trim().toLowerCase();
      if (!term) return matchCat;

      const matchTexto = (
        (pago.folio || '').toLowerCase().includes(term) ||
        (pago.concepto || '').toLowerCase().includes(term) ||
        String(pago.anio || '').includes(term) ||
        (pago.fecha || '').toLowerCase().includes(term) ||
        (pago.metodoPago || '').toLowerCase().includes(term) ||
        (pago.observaciones || '').toLowerCase().includes(term)
      );

      return matchCat && matchTexto;
    });
  }, [filtroCategoria, listaAdeudos, resumenFinanciero.listaPagos, busqueda]);

  if (!visible || !fosaActual) return null;

  const handleClose = () => {
    if (onCerrar) onCerrar();
    if (onClose) onClose();
  };

  const abrirDialogoYaPago = (opciones = {}) => {
    const esTodo = opciones.modo === 'todo';
    const aniosPendientes = resumenFinanciero.aniosPendientes || [];
    const totalAdeudo = resumenFinanciero.adeudoEstimado || 0;

    const anios = esTodo
      ? aniosPendientes
      : (opciones.anios || (opciones.anio ? [opciones.anio] : (aniosPendientes.length > 0 ? [aniosPendientes[0]] : [ANIO_ACTUAL])));

    const montoCalculado = esTodo
      ? (totalAdeudo || (anios.length * CUOTA_REFRENDO_ANUAL))
      : (opciones.monto !== undefined ? Number(opciones.monto) : (anios.length * CUOTA_REFRENDO_ANUAL));

    const conceptoGenerado = opciones.concepto || (
      esTodo
        ? `Liquidación de Refrendos Anuales (${anios.join(', ')})`
        : (anios.length === 1 ? `Refrendo Anual ${anios[0]}` : `Refrendos Anuales (${anios.join(', ')})`)
    );

    const cubreTotal = totalAdeudo > 0 ? montoCalculado >= totalAdeudo : true;

    setDialogYaPago({
      modo: esTodo ? 'todo' : 'individual',
      anios: anios,
      anio: anios[0] || (aniosPendientes[0] || ANIO_ACTUAL),
      concepto: conceptoGenerado,
      monto: montoCalculado,
      folioFisico: '',
      fecha: new Date().toISOString().split('T')[0],
      metodoPago: 'Efectivo en Caja',
      observaciones: esTodo
        ? `Liquidación total de adeudo (${anios.join(', ')}) con recibo físico en papel.`
        : `Refrendo año ${anios[0] || ANIO_ACTUAL} registrado con recibo físico en papel.`,
      marcarAlCorriente: cubreTotal
    });
  };

  const handleConfirmarYaPago = (e) => {
    if (e) e.preventDefault();
    if (!dialogYaPago) return;

    const montoNum = Number(dialogYaPago.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Cantidad Inválida',
        mensaje: 'Por favor ingresa la cantidad exacta que pagaron en efectivo (mayor a $0).',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const conceptoLimpio = (dialogYaPago.concepto || '').trim();
    if (!conceptoLimpio) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Concepto Requerido',
        mensaje: 'Por favor especifica qué fue lo que pagó el ciudadano (concepto del pago).',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const fechaFinal = dialogYaPago.fecha || new Date().toISOString().split('T')[0];
    const folioFisicoLimpio = (dialogYaPago.folioFisico || '').trim();
    const folioFinal = folioFisicoLimpio
      ? `FIS-${folioFisicoLimpio}`
      : `FIS-${Date.now().toString().slice(-4)}`;

    const nuevoPago = {
      id: Date.now(),
      folio: folioFinal,
      folioFisico: folioFisicoLimpio,
      origen: 'recibo_fisico',
      fecha: fechaFinal,
      concepto: conceptoLimpio,
      categoria: 'Refrendo',
      monto: montoNum,
      metodoPago: dialogYaPago.metodoPago || 'Efectivo en Caja',
      titular: fosaActual.titularNombre || 'Titular Registrado',
      anios: dialogYaPago.anios || [],
      anio: dialogYaPago.anio || (fechaFinal ? Number(fechaFinal.split('-')[0]) : ANIO_ACTUAL),
      marcarAlCorriente: dialogYaPago.marcarAlCorriente,
      observaciones: dialogYaPago.observaciones || (folioFisicoLimpio ? `Recibo físico en papel folio #${folioFisicoLimpio}` : 'Pago con recibo en papel físico')
    };

    // 1. Guardar pago y actualizar historial de la fosa
    const fosaActualizada = agregarPagoAFosa(fosaActual, nuevoPago);

    setFosaOverride(fosaActualizada);

    if (onActualizarFosa) {
      onActualizarFosa(fosaActualizada);
    }

    // 2. Registrar movimiento en la caja del panteón
    if (onRegistrarMovimiento) {
      onRegistrarMovimiento({
        id: Date.now(),
        tipo: 'Ingreso',
        categoria: 'Refrendo',
        concepto: `${conceptoLimpio} (Recibo Físico ${folioFisicoLimpio ? `#${folioFisicoLimpio}` : ''}) - Lote ${fosaActual.codigo}`,
        monto: montoNum,
        metodoPago: dialogYaPago.metodoPago || 'Efectivo en Caja',
        fecha: fechaFinal,
        folio: folioFinal,
        observaciones: nuevoPago.observaciones
      });
    }

    setDialogYaPago(null);

    setAlertaConfig({
      tipo: 'exito',
      titulo: '¡Pago en Efectivo Reflejado!',
      mensaje: `Se registró exitosamente el cobro en efectivo de $${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} por concepto de "${conceptoLimpio}" con fecha ${fechaFinal}. El dinero ingresó a la caja y quedó asentado en el historial de la fosa ${fosaActual.codigo}.`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => setAlertaConfig(null)
    });
  };

  const handleGuardarPagoManual = (e) => {
    e.preventDefault();

    const montoNum = Number(formManual.monto);
    if (!montoNum || montoNum <= 0) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Monto Requerido',
        mensaje: 'Por favor ingresa un monto válido mayor a $0.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    if (!formManual.concepto.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Concepto Requerido',
        mensaje: 'Por favor especifica el concepto del pago a registrar.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const folioFinal = formManual.folio.trim() || `MAN-${Date.now().toString().slice(-4)}`;

    const nuevoPago = {
      ...formManual,
      monto: montoNum,
      folio: folioFinal,
      titular: fosaActual.titularNombre || 'Titular Registrado'
    };

    const fosaActualizada = agregarPagoAFosa(fosaActual, nuevoPago);
    setFosaOverride(fosaActualizada);

    if (onActualizarFosa) {
      onActualizarFosa(fosaActualizada);
    }

    setMostrarFormManual(false);
    setFormManual({
      anio: ANIO_ACTUAL,
      fecha: new Date().toISOString().split('T')[0],
      concepto: `Refrendo Anual de Fosa ${ANIO_ACTUAL}`,
      categoria: 'Refrendo',
      monto: CUOTA_REFRENDO_ANUAL,
      folio: '',
      metodoPago: 'Efectivo en Caja',
      observaciones: ''
    });

    setAlertaConfig({
      tipo: 'exito',
      titulo: 'Pago Registrado en Historial',
      mensaje: `El pago de $${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} con folio ${folioFinal} ha sido registrado exitosamente en el historial del lote ${fosaActual.codigo}.`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => setAlertaConfig(null)
    });
  };

  const handleConfirmarEliminarPago = (pago) => {
    setAlertaConfig({
      tipo: 'peligro',
      titulo: '¿Eliminar Registro de Pago?',
      mensaje: `¿Estás seguro de que deseas eliminar el registro de pago "${pago.concepto}" (${pago.folio || 'Sin folio'}) por $${Number(pago.monto).toFixed(2)}? Esta acción modificará el historial de la tumba.`,
      textoBotonPrincipal: 'Sí, Eliminar',
      textoBotonSecundario: 'Cancelar',
      onAceptar: () => {
        const fosaActualizada = eliminarPagoDeFosa(fosaActual, pago.id);
        setFosaOverride(fosaActualizada);
        if (onActualizarFosa) {
          onActualizarFosa(fosaActualizada);
        }
        setAlertaConfig(null);
      },
      onCancelar: () => setAlertaConfig(null)
    });
  };

  const alCorriente = resumenFinanciero.estatusActual === 'Al Corriente';

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 md:p-6 z-50 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-6xl xl:max-w-7xl w-full my-4 max-h-[92vh] flex flex-col overflow-hidden"
      >
        
        {/* 1. Cabecera Institucional */}
        <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-800/80 rounded-2xl border border-teal-600/50">
              <History className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Historial de Pagos y Refrendos
                </h2>
                <span className="font-mono font-black text-xs bg-teal-800 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-600">
                  Fosa {formatearNumeroFosa(fosaActual.codigo)}
                </span>
                <span className="text-[11px] font-bold text-teal-100 bg-white/10 px-2 py-0.5 rounded-full">
                  {fosaActual.seccionNombre} - {fosaActual.tipoEspacio}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">
                Panteón La Soledad - Registro cronológico de cuotas, refrendos y servicios
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-teal-200 hover:text-white hover:bg-teal-600 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Cuerpo con scroll */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* Tarjeta de Titular y Estado de Cuenta */}
          <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800 font-bold shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Titular o Responsable</span>
                <h3 className="font-black text-stone-900 text-sm">
                  {fosaActual.titularNombre || 'Sin titular registrado'}
                </h3>
                {fosaActual.titularTelefono && (
                  <p className="text-xs text-stone-500 flex items-center gap-1 font-mono mt-0.5">
                    <Phone className="w-3 h-3 text-stone-400" />
                    {fosaActual.titularTelefono}
                  </p>
                )}
              </div>
            </div>

            {/* Acciones directas de cobro */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón: Ya Pagó (Recibo Físico en Papel) */}
              <button
                type="button"
                onClick={() => abrirDialogoYaPago({ modo: resumenFinanciero.aniosPendientes.length > 0 ? 'todo' : 'individual' })}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-emerald-700"
                title="Registrar que ya pagó con recibo físico en papel (sin imprimir)"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                <span>Ya Pagó (Recibo Físico)</span>
              </button>

              {onEmitirRecibo && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onEmitirRecibo(fosaActual);
                  }}
                  className="px-3.5 py-2 bg-olive-600 hover:bg-olive-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-olive-700"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Cobrar / Emitir Recibo Oficial</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setMostrarFormManual(prev => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  mostrarFormManual 
                    ? 'bg-cream-200 text-stone-800 border-cream-300' 
                    : 'bg-white hover:bg-cream-100 text-stone-700 border-cream-300 shadow-2xs'
                }`}
              >
                <Plus className="w-4 h-4 text-teal-600" />
                <span>{mostrarFormManual ? 'Cancelar Registro' : 'Registrar Pago Manual'}</span>
              </button>
            </div>
          </div>

          {/* Tarjetas KPI de Resumen Financiero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* KPI 1: Estatus de Cobro */}
            <div className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Estatus Actual</span>
              <div className="mt-1 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                  alCorriente
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  {alCorriente ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                  )}
                  {alCorriente ? 'Al Corriente' : 'Con Adeudo'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mt-2 font-medium">
                {alCorriente 
                  ? 'Refrendo 2026 cubierto al día.' 
                  : `${resumenFinanciero.aniosPendientes.length} año(s) pendiente(s).`}
              </p>
            </div>

            {/* KPI 2: Total Pagado Histórico */}
            <div className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Total Aportado</span>
              <div className="mt-1">
                <span className="font-mono font-black text-xl text-stone-900">
                  ${resumenFinanciero.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-stone-400 ml-1">MXN</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-2 font-medium">
                {resumenFinanciero.listaPagos.length} pagos registrados en padrón.
              </p>
            </div>

            {/* KPI 3: Último Refrendo / Pago */}
            <div className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-2xs flex flex-col justify-between">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">Último Pago</span>
              <div className="mt-1">
                <span className="font-black text-sm text-stone-900 truncate block" title={resumenFinanciero.ultimoPago?.concepto}>
                  {resumenFinanciero.ultimoPago?.fecha || 'Sin pagos'}
                </span>
                <span className="text-[10px] font-mono text-stone-500 block truncate">
                  {resumenFinanciero.ultimoPago?.folio || 'N/D'} (${resumenFinanciero.ultimoPago?.monto?.toFixed(2) || '0.00'})
                </span>
              </div>
              <p className="text-[10px] text-teal-700 mt-2 font-semibold truncate" title={resumenFinanciero.ultimoPago?.concepto}>
                {resumenFinanciero.ultimoPago?.concepto || 'Sin movimientos previos'}
              </p>
            </div>

            {/* KPI 4: Adeudo Estimado (Clicable para ver adeudos) */}
            <div 
              onClick={() => setFiltroCategoria('Adeudos')}
              className={`p-3.5 rounded-2xl border shadow-2xs flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                alCorriente 
                  ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300' 
                  : 'bg-rose-50/70 border-rose-200 hover:border-rose-400'
              }`}
              title="Clic para ver el desglose de lo que deben"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${alCorriente ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {alCorriente ? 'Saldo Pendiente' : 'Adeudo Estimado'}
                </span>
                <span className="text-[10px] font-bold text-stone-400 underline">
                  Ver detalle
                </span>
              </div>
              <div className="mt-1">
                <span className={`font-mono font-black text-xl ${alCorriente ? 'text-emerald-700' : 'text-rose-700'}`}>
                  ${resumenFinanciero.adeudoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] font-bold text-stone-400 ml-1">MXN</span>
              </div>
              <p className={`text-[10px] font-medium mt-2 ${alCorriente ? 'text-emerald-700' : 'text-rose-700'}`}>
                {alCorriente 
                  ? 'Sin rezagos catastrales.' 
                  : `Años: ${resumenFinanciero.aniosPendientes.join(', ')}`}
              </p>
            </div>

          </div>

          {/* Formulario Desplegable para Registrar Pago Manual */}
          {mostrarFormManual && (
            <form onSubmit={handleGuardarPagoManual} className="bg-cream-100/70 border border-cream-300 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-cream-300">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-700" />
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wide">
                    Captura Manual de Pago o Refrendo Histórico
                  </h4>
                </div>
                <span className="text-[10px] text-stone-500 italic">
                  Útil para registrar pagos antiguos de recibos en papel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Concepto */}
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Concepto del Pago</label>
                  <input
                    type="text"
                    value={formManual.concepto}
                    onChange={(e) => setFormManual({ ...formManual, concepto: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="Ej. Refrendo Anual 2024"
                    required
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={formManual.categoria}
                    onChange={(e) => setFormManual({ ...formManual, categoria: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Refrendo">Refrendo Anual</option>
                    <option value="Servicio">Servicio Funerario / Inhumación</option>
                    <option value="Mantenimiento">Mantenimiento de Áreas</option>
                    <option value="Construcción">Permiso de Construcción</option>
                    <option value="Otro">Otro Concepto</option>
                  </select>
                </div>

                {/* Año correspondiente */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Año Correspondiente</label>
                  <input
                    type="number"
                    min="1950"
                    max="2035"
                    value={formManual.anio}
                    onChange={(e) => setFormManual({ ...formManual, anio: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Monto ($ MXN)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formManual.monto}
                    onChange={(e) => setFormManual({ ...formManual, monto: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>

                {/* Fecha de Pago */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Fecha del Pago</label>
                  <input
                    type="date"
                    value={formManual.fecha}
                    onChange={(e) => setFormManual({ ...formManual, fecha: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                {/* Folio de Recibo Físico */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Folio del Recibo (Opcional)</label>
                  <input
                    type="text"
                    value={formManual.folio}
                    onChange={(e) => setFormManual({ ...formManual, folio: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="Ej. REC-2024-5120"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Método de Pago</label>
                  <select
                    value={formManual.metodoPago}
                    onChange={(e) => setFormManual({ ...formManual, metodoPago: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Efectivo en Caja">Efectivo en Caja</option>
                    <option value="Transferencia SPEI">Transferencia SPEI</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                    <option value="Cheque Administrativo">Cheque Administrativo</option>
                  </select>
                </div>

                {/* Observaciones */}
                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Notas / Observaciones del Pago</label>
                  <input
                    type="text"
                    value={formManual.observaciones}
                    onChange={(e) => setFormManual({ ...formManual, observaciones: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="Ej. Pago regularizado en oficina según recibo histórico físico."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormManual(false)}
                  className="px-4 py-2 bg-white hover:bg-cream-200 text-stone-700 font-bold rounded-xl text-xs border border-cream-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Guardar en Historial de la Fosa
                </button>
              </div>
            </form>
          )}

          {/* Barra de Filtros y Búsqueda */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cream-200">
            <div className="flex items-center gap-1.5 font-semibold text-stone-600 text-xs flex-wrap">
              <span className="text-[11px] text-stone-400 mr-1">Filtrar:</span>
              
              {/* Opción 1: Todos los Pagos */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('Todos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroCategoria === 'Todos'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                }`}
              >
                Todos los Pagos
              </button>

              {/* Opción 2: Refrendos Anuales */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('Refrendo')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroCategoria === 'Refrendo'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                }`}
              >
                Refrendos Anuales
              </button>

              {/* Opción 3: Servicios Funerarios */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('Servicio')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroCategoria === 'Servicio'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                }`}
              >
                Servicios Funerarios
              </button>

              {/* Opción 4: Lo que deben (Adeudos y Rezago de Refrendos) */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('Adeudos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroCategoria === 'Adeudos'
                    ? 'bg-rose-600 text-white shadow-2xs ring-2 ring-rose-300'
                    : resumenFinanciero.aniosPendientes.length > 0
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                }`}
                title="Ver el desglose exacto de lo que deben por concepto de refrendo"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Lo que deben</span>
                {resumenFinanciero.aniosPendientes.length > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filtroCategoria === 'Adeudos' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {resumenFinanciero.aniosPendientes.length} {resumenFinanciero.aniosPendientes.length === 1 ? 'año' : 'años'}
                  </span>
                ) : (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filtroCategoria === 'Adeudos' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    0
                  </span>
                )}
              </button>
            </div>

            {/* Input de Búsqueda rápida */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por folio, año o concepto..."
                className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Banner Resumen cuando se activa 'Lo que deben' */}
          {filtroCategoria === 'Adeudos' && resumenFinanciero.aniosPendientes.length > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">
                    Desglose de Adeudos Pendientes de Cobro
                  </h4>
                  <p className="text-xs text-rose-800 mt-0.5">
                    Esta fosa adeuda <strong>{resumenFinanciero.aniosPendientes.length} año(s)</strong> de refrendo ({resumenFinanciero.aniosPendientes.join(', ')}).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="text-right mr-1">
                  <span className="text-[10px] font-bold text-rose-600 uppercase block">Total a Liquidar</span>
                  <span className="font-mono font-black text-base text-rose-900">
                    ${resumenFinanciero.adeudoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                {/* BOTÓN: Ya pagó todo el adeudo (Recibo Físico sin imprimir) */}
                <button
                  type="button"
                  onClick={() => abrirDialogoYaPago({ modo: 'todo' })}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-emerald-700 ring-2 ring-emerald-300"
                  title="Registrar que ya se liquidó todo el adeudo con recibo físico en papel (sin imprimir)"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Ya pagó todo el adeudo</span>
                </button>

                {onEmitirRecibo && (
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onEmitirRecibo({
                        ...fosaActual,
                        _pagoSeleccionado: {
                          folio: `REF-LIQ-${Date.now().toString().slice(-4)}`,
                          fecha: new Date().toISOString().split('T')[0],
                          concepto: `Liquidación de Refrendos con Rezago (${resumenFinanciero.aniosPendientes.join(', ')})`,
                          monto: resumenFinanciero.adeudoEstimado,
                          metodoPago: 'Efectivo en Caja',
                          titular: fosaActual.titularNombre || '',
                          observaciones: `Cobro integral de años vencidos: ${resumenFinanciero.aniosPendientes.join(', ')}.`
                        }
                      });
                    }}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-rose-700"
                  >
                    <Receipt className="w-4 h-4" />
                    <span>Cobrar Todo el Adeudo</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Banner Informativo cuando se activa 'Lo que deben' pero NO hay adeudo */}
          {filtroCategoria === 'Adeudos' && resumenFinanciero.aniosPendientes.length === 0 && (
            <div className="p-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-center space-y-2 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-300">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-emerald-950">
                ¡Esta fosa se encuentra totalmente al corriente!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                No se registran adeudos ni años pendientes de pago para el lote <strong>{fosaActual.codigo}</strong>. Todos sus refrendos anuales hasta el año 2026 están cubiertos.
              </p>
            </div>
          )}

          {/* Tabla de Pagos o Adeudos */}
          <div className="bg-white rounded-2xl border border-cream-300 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700">
                <thead className="bg-cream-100 text-stone-900 font-black border-b border-cream-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">
                      {filtroCategoria === 'Adeudos' ? 'Ejercicio / Periodo' : 'Fecha / Periodo'}
                    </th>
                    <th className="py-3 px-3">Folio</th>
                    <th className="py-3 px-4">
                      {filtroCategoria === 'Adeudos' ? 'Concepto de Adeudo' : 'Concepto / Detalle'}
                    </th>
                    <th className="py-3 px-3">Método</th>
                    <th className="py-3 px-4 text-right">
                      {filtroCategoria === 'Adeudos' ? 'Monto Adeudado' : 'Monto'}
                    </th>
                    <th className="py-3 px-3 text-center">Estatus</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200">
                  {itemsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-stone-400 italic">
                        {filtroCategoria === 'Adeudos'
                          ? 'No hay adeudos pendientes para este espacio.'
                          : 'No se encontraron registros de pago o refrendo con los criterios seleccionados.'}
                      </td>
                    </tr>
                  ) : (
                    itemsFiltrados.map((item) => {
                      const montoNum = Number(item.monto) || 0;
                      const esAdeudo = item.esAdeudo || item.estatus === 'Con Adeudo';

                      return (
                        <tr 
                          key={item.id} 
                          className={`transition-colors ${
                            esAdeudo 
                              ? 'bg-rose-50/40 hover:bg-rose-50/80' 
                              : 'hover:bg-cream-50'
                          }`}
                        >
                          
                          {/* Fecha / Periodo */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-stone-900">
                              {esAdeudo ? `Ejercicio Fiscal ${item.anio}` : item.fecha}
                            </div>
                            {item.anio && (
                              <div className={`text-[10px] font-mono px-1.5 py-0.2 rounded w-fit mt-0.5 font-bold ${
                                esAdeudo 
                                  ? 'text-rose-800 bg-rose-100 border border-rose-200' 
                                  : 'text-teal-800 bg-teal-50'
                              }`}>
                                Año {item.anio}
                              </div>
                            )}
                          </td>

                          {/* Folio */}
                          <td className={`py-3 px-3 font-mono font-bold ${esAdeudo ? 'text-rose-700 text-[11px]' : 'text-stone-600'}`}>
                            {item.folioFisico ? (
                              <div className="flex flex-col">
                                <span className="text-emerald-800 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                                  Físico #{item.folioFisico}
                                </span>
                                <span className="text-[9px] text-stone-400 font-normal mt-0.5">{item.folio}</span>
                              </div>
                            ) : (
                              <span>{item.folio || 'S/F'}</span>
                            )}
                          </td>

                          {/* Concepto */}
                          <td className="py-3 px-4">
                            <div className="font-black text-stone-900">
                              {item.concepto}
                            </div>
                            {item.observaciones && (
                              <div className="text-[10px] text-stone-500 truncate max-w-sm xl:max-w-md" title={item.observaciones}>
                                {item.observaciones}
                              </div>
                            )}
                          </td>

                          {/* Método de Pago */}
                          <td className="py-3 px-3 text-[11px] text-stone-600">
                            {item.metodoPago || 'Efectivo en Caja'}
                          </td>

                          {/* Monto */}
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-black text-sm ${esAdeudo ? 'text-rose-700' : 'text-stone-900'}`}>
                              ${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>

                          {/* Estatus */}
                          <td className="py-3 px-3 text-center">
                            {esAdeudo ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                <AlertCircle className="w-3 h-3 text-rose-700" />
                                Con Adeudo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                {item.estatus || 'Pagado'}
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Acción para fila de Adeudo */}
                              {esAdeudo ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* BOTÓN: YA PAGÓ (Recibo Físico sin impresión) */}
                                  <button
                                    type="button"
                                    onClick={() => abrirDialogoYaPago({ 
                                      modo: 'individual', 
                                      anio: item.anio, 
                                      monto: item.monto, 
                                      concepto: `Refrendo Anual Extemporáneo ${item.anio}` 
                                    })}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 cursor-pointer transition-colors text-xs font-black inline-flex items-center gap-1.5 shadow-2xs"
                                    title={`Marcar que ya pagó el ejercicio fiscal ${item.anio} con recibo físico`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                                    <span>Ya pagó</span>
                                  </button>

                                  {/* Botón opcional: Cobrar este año (emite recibo digital) */}
                                  {onEmitirRecibo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleClose();
                                        onEmitirRecibo({
                                          ...fosaActual,
                                          _pagoSeleccionado: {
                                            folio: `REF-${item.anio}-${Math.floor(1000 + Math.random() * 9000)}`,
                                            fecha: new Date().toISOString().split('T')[0],
                                            concepto: `Refrendo Anual Extemporáneo ${item.anio}`,
                                            monto: item.monto,
                                            metodoPago: 'Efectivo en Caja',
                                            titular: fosaActual.titularNombre || '',
                                            observaciones: `Liquidación de cuota de refrendo vencida del año ${item.anio}.`
                                          }
                                        });
                                      }}
                                      className="px-2 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 border border-cream-300 cursor-pointer transition-colors text-[10px] font-bold inline-flex items-center gap-1"
                                      title={`Emitir recibo digital impreso del año ${item.anio}`}
                                    >
                                      <Receipt className="w-3 h-3 text-stone-500" />
                                      <span>Recibo digital</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <>
                                  {/* Reimprimir / Ver Recibo */}
                                  {onEmitirRecibo && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleClose();
                                        onEmitirRecibo({
                                          ...fosaActual,
                                          _pagoSeleccionado: item
                                        });
                                      }}
                                      className="p-1.5 rounded-lg bg-olive-100 hover:bg-olive-200 text-olive-900 border border-olive-300 cursor-pointer transition-colors"
                                      title="Ver / Reimprimir Recibo Oficial de este pago"
                                    >
                                      <Receipt className="w-3.5 h-3.5 text-olive-800" />
                                    </button>
                                  )}

                                  {/* Eliminar (solo abonos individuales / manuales) */}
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmarEliminarPago(item)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
                                    title="Eliminar este registro de pago"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Información Institucional al pie */}
          <div className="p-3.5 bg-cream-100/60 rounded-2xl border border-cream-200 text-[11px] text-stone-600 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                Registro financiero respaldado y sincronizado con el padrón oficial del <strong>Panteón La Soledad</strong>.
              </span>
            </div>
            <div className="text-[10px] font-mono text-stone-400">
              Total periodos cubiertos: {resumenFinanciero.aniosPagados.length} años
            </div>
          </div>

        </div>

        {/* 3. Pie del Modal */}
        <div className="bg-cream-100 px-6 py-3.5 border-t border-cream-300 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-500">
            {filtroCategoria === 'Adeudos' ? (
              <span>
                Mostrando <strong>{itemsFiltrados.length}</strong> de <strong>{resumenFinanciero.aniosPendientes.length}</strong> años con adeudo pendiente.
              </span>
            ) : (
              <span>
                Mostrando <strong>{itemsFiltrados.length}</strong> de <strong>{resumenFinanciero.listaPagos.length}</strong> registros de pago.
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Cerrar Historial
          </button>
        </div>

      </div>

      {/* Modal Dialog: Registrar que Ya Pagó con Recibo Físico en Papel */}
      {dialogYaPago && (
        <div 
          onClick={() => setDialogYaPago(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 z-60 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95"
          >
            {/* Cabecera */}
            <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800 rounded-xl border border-emerald-600">
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">
                    Registrar que Ya Pagó
                  </h3>
                  <p className="text-[11px] text-emerald-100">
                    Panteón La Soledad • Recibo físico en papel (sin impresión)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDialogYaPago(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600 cursor-pointer transition-colors"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleConfirmarYaPago} className="p-5 sm:p-6 space-y-4 text-xs">
              
              {/* Tarjeta Resumen del Lote y Adeudo */}
              <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-300 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-lg border border-teal-200">
                      {fosaActual.codigo}
                    </span>
                    <span className="font-bold text-stone-900 text-sm">
                      {fosaActual.titularNombre || 'Titular Registrado'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    resumenFinanciero.estatusActual === 'Al Corriente' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {resumenFinanciero.estatusActual}
                  </span>
                </div>

                {resumenFinanciero.adeudoEstimado > 0 ? (
                  <div className="flex flex-wrap items-center justify-between text-[11px] bg-rose-50/70 p-2 rounded-xl border border-rose-200/60 gap-1">
                    <span className="text-stone-600">
                      Adeudo total registrado ({resumenFinanciero.aniosPendientes.length} años: {resumenFinanciero.aniosPendientes.join(', ')}):
                    </span>
                    <span className="font-mono font-bold text-rose-700">
                      ${resumenFinanciero.adeudoEstimado.toFixed(2)} MXN
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-medium">
                    Esta fosa se encuentra registrada al corriente de sus pagos.
                  </div>
                )}
              </div>

              {/* CAMPO 1: ¿Qué fue lo que pagó? (Concepto) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-stone-800">
                    ¿Qué fue lo que pagó? (Concepto del pago) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-stone-400">Editable</span>
                </div>
                <input
                  type="text"
                  required
                  value={dialogYaPago.concepto}
                  onChange={(e) => setDialogYaPago({ ...dialogYaPago, concepto: e.target.value })}
                  placeholder="Ej. Abono a cuenta de refrendos, Refrendo Anual 2026, Liquidación total..."
                  className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs shadow-2xs"
                />
                
                {/* Botones de selección rápida de concepto */}
                <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                  <button
                    type="button"
                    onClick={() => setDialogYaPago({
                      ...dialogYaPago,
                      concepto: `Refrendo Anual ${ANIO_ACTUAL}`,
                      monto: CUOTA_REFRENDO_ANUAL,
                      marcarAlCorriente: resumenFinanciero.aniosPendientes.length <= 1
                    })}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 transition-colors cursor-pointer border border-cream-300"
                  >
                    + Refrendo {ANIO_ACTUAL} ($250)
                  </button>

                  {resumenFinanciero.adeudoEstimado > 0 && (
                    <button
                      type="button"
                      onClick={() => setDialogYaPago({
                        ...dialogYaPago,
                        concepto: `Liquidación total de refrendos (${resumenFinanciero.aniosPendientes.join(', ')})`,
                        monto: resumenFinanciero.adeudoEstimado,
                        marcarAlCorriente: true
                      })}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer border border-emerald-200"
                    >
                      + Liquidación Total (${resumenFinanciero.adeudoEstimado})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDialogYaPago({
                      ...dialogYaPago,
                      concepto: 'Abono a cuenta de refrendos pendientes',
                      marcarAlCorriente: false
                    })}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer border border-amber-200"
                  >
                    + Abono Parcial
                  </button>
                </div>
              </div>

              {/* CAMPO 2: Cantidad pagada en efectivo ($ MXN) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  Cantidad pagada en efectivo ($ MXN) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-black text-emerald-700 text-sm select-none">
                    $
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={dialogYaPago.monto}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val) || 0;
                      const totalAdeudo = resumenFinanciero.adeudoEstimado || 0;
                      setDialogYaPago({
                        ...dialogYaPago,
                        monto: val,
                        marcarAlCorriente: totalAdeudo > 0 ? num >= totalAdeudo : dialogYaPago.marcarAlCorriente
                      });
                    }}
                    placeholder="0.00"
                    className="w-full bg-emerald-50/40 border border-emerald-300 rounded-xl pl-8 pr-3 py-2 text-stone-900 font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Explicación de abono o liquidación según el monto */}
                {resumenFinanciero.adeudoEstimado > 0 && (
                  <div className="mt-1 text-[11px]">
                    {Number(dialogYaPago.monto) < resumenFinanciero.adeudoEstimado ? (
                      <p className="text-amber-700 font-semibold flex items-center gap-1">
                        <span>Abono parcial:</span>
                        <span>Se registran ${Number(dialogYaPago.monto || 0).toFixed(2)} en caja. Restarán ${(resumenFinanciero.adeudoEstimado - Number(dialogYaPago.monto || 0)).toFixed(2)} por cubrir.</span>
                      </p>
                    ) : (
                      <p className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span>Pago total:</span>
                        <span>Cubre el monto total adeudado (${resumenFinanciero.adeudoEstimado.toFixed(2)}).</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* CAMPOS 3 y 4: Fecha del Pago y Folio de Recibo Físico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    Fecha del Pago (del recibo físico) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dialogYaPago.fecha}
                    onChange={(e) => setDialogYaPago({ ...dialogYaPago, fecha: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    Folio del Recibo en Papel / Talonario
                  </label>
                  <input
                    type="text"
                    value={dialogYaPago.folioFisico}
                    onChange={(e) => setDialogYaPago({ ...dialogYaPago, folioFisico: e.target.value })}
                    placeholder="Ej. 1420 o TAL-85 (opcional)"
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs shadow-2xs"
                  />
                </div>
              </div>

              {/* CAMPOS 5 y 6: Estatus de la fosa y Método de pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    ¿Cómo debe quedar la fosa?
                  </label>
                  <select
                    value={dialogYaPago.marcarAlCorriente ? 'al_corriente' : 'con_adeudo'}
                    onChange={(e) => setDialogYaPago({ ...dialogYaPago, marcarAlCorriente: e.target.value === 'al_corriente' })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs cursor-pointer shadow-2xs"
                  >
                    <option value="con_adeudo">Es un Abono (La fosa sigue Con Adeudo)</option>
                    <option value="al_corriente">Liquidó Todo (Marcar fosa Al Corriente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-800 mb-1">
                    Forma de Pago
                  </label>
                  <select
                    value={dialogYaPago.metodoPago}
                    onChange={(e) => setDialogYaPago({ ...dialogYaPago, metodoPago: e.target.value })}
                    className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs cursor-pointer shadow-2xs"
                  >
                    <option value="Efectivo en Caja">Efectivo en Caja</option>
                    <option value="Transferencia SPEI">Transferencia SPEI</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">
                  Observaciones o Notas
                </label>
                <input
                  type="text"
                  value={dialogYaPago.observaciones}
                  onChange={(e) => setDialogYaPago({ ...dialogYaPago, observaciones: e.target.value })}
                  placeholder="Detalles sobre el recibo físico o abono..."
                  className="w-full bg-white border border-cream-300 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs shadow-2xs"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setDialogYaPago(null)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-colors border border-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Registrar Cobro (${Number(dialogYaPago.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })})</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal de Alerta y Confirmación */}
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
