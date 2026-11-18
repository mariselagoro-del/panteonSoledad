// src/pages/FinanzasCaja.jsx
import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  DollarSign, 
  Wallet,
  Receipt,
  FileCheck,
  Landmark,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';
import ModalAlerta from '../components/common/ModalAlerta';
import { formatearFecha, formatearNumeroFosa, coincideEspacioConBusqueda } from '../utils/busquedaUtils';
import { agregarPagoAFosa, obtenerHistorialPagosFosa } from '../utils/pagosUtils';

// Conceptos oficiales rápidos para cobro en caja
const CONCEPTOS_RAPIDOS = [
  { nombre: 'Anualidad / MTTO', monto: 250, categoria: 'Refrendo', desc: 'Mantenimiento anual catastral' },
  { nombre: 'Faena', monto: 250, categoria: 'Faena', desc: 'Cumplimiento / cuota de faena' },
  { nombre: 'MTTO y Faena', monto: 500, categoria: 'MTTO + Faena', desc: 'Anualidad y faena combinadas' },
  { nombre: 'Cambio de titular', monto: 500, categoria: 'Cambio de titular', desc: 'Trámite de cambio de titular' },
  { nombre: 'Titularidad', monto: 500, categoria: 'Titularidad', desc: 'Expedición de titularidad' },
  { nombre: 'Depósito de cenizas', monto: 800, categoria: 'Depósito de cenizas', desc: 'Derecho de depósito de cenizas' },
  { nombre: 'Cooperación voluntaria', monto: '', categoria: 'Cooperación voluntaria', desc: 'Aportación voluntaria libre' }
];

export default function FinanzasCaja({
  movimientos = [],
  onRegistrarMovimiento,
  registrosFosas = [],
  onActualizarFosa
}) {
  const [tipoFiltro, setTipoFiltro] = useState('Todos'); // 'Todos' | 'Ingreso' | 'Egreso'
  const [busqueda, setBusqueda] = useState('');
  
  // Modal para nuevo ingreso / egreso
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertaConfig, setAlertaConfig] = useState(null);
  
  // Estado para vincular fosa y difunto
  const [fosaSeleccionada, setFosaSeleccionada] = useState(null);
  const [difuntoSeleccionado, setDifuntoSeleccionado] = useState('');
  const [busquedaFosa, setBusquedaFosa] = useState('');
  const [dropdownFosasAbierto, setDropdownFosasAbierto] = useState(false);

  const [nuevoMov, setNuevoMov] = useState({
    tipo: 'Ingreso',
    categoria: 'Refrendo',
    concepto: '',
    monto: '',
    metodoPago: 'Efectivo_Caja',
    folio: '',
    observaciones: ''
  });

  // Métricas de Caja
  const totalIngresos = useMemo(() => {
    return (movimientos || [])
      .filter(m => (m.tipo === 'Ingreso' || m.tipo_movimiento === 'Ingreso'))
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  }, [movimientos]);

  const totalEgresos = useMemo(() => {
    return (movimientos || [])
      .filter(m => (m.tipo === 'Egreso' || m.tipo_movimiento === 'Egreso'))
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  }, [movimientos]);

  const saldoEnCaja = totalIngresos - totalEgresos;

  // Filtrado de fosas para el selector de vinculación
  const resultadosFosas = useMemo(() => {
    const term = busquedaFosa.trim();
    if (!term) return [];
    return (registrosFosas || [])
      .map(f => ({ fosa: f, ...coincideEspacioConBusqueda(f, term) }))
      .filter(res => res.coincide)
      .slice(0, 8);
  }, [registrosFosas, busquedaFosa]);

  // Resumen financiero de la fosa seleccionada (adeudos, años pendientes)
  const resumenFosaSeleccionada = useMemo(() => {
    if (!fosaSeleccionada) return null;
    return obtenerHistorialPagosFosa(fosaSeleccionada);
  }, [fosaSeleccionada]);

  // Filtrado de movimientos en la tabla principal
  const movimientosFiltrados = useMemo(() => {
    return (movimientos || []).filter(m => {
      const tipo = m.tipo || m.tipo_movimiento;
      const concepto = (m.concepto || m.concepto_detalle || '').toLowerCase();
      const folio = (m.folio || m.folio_comprobante || '').toLowerCase();
      const difunto = (m.difuntoNombre || '').toLowerCase();
      const titular = (m.titularNombre || m.titular || '').toLowerCase();
      const fosa = (m.fosaCodigo || '').toLowerCase();
      const term = busqueda.toLowerCase().trim();

      const matchTipo = tipoFiltro === 'Todos' || tipo === tipoFiltro;
      const matchSearch = !term || 
        concepto.includes(term) || 
        folio.includes(term) || 
        difunto.includes(term) || 
        titular.includes(term) || 
        fosa.includes(term);

      return matchTipo && matchSearch;
    });
  }, [movimientos, tipoFiltro, busqueda]);

  // Manejar selección de fosa en el modal
  const handleSeleccionarFosa = (fosa) => {
    setFosaSeleccionada(fosa);
    const primerDifunto = fosa.historialDifuntos?.[0]?.nombre || '';
    setDifuntoSeleccionado(primerDifunto);
    setDropdownFosasAbierto(false);
    setBusquedaFosa('');

    // Sugerir concepto si está vacío
    if (!nuevoMov.concepto) {
      const num = formatearNumeroFosa(fosa.codigo);
      setNuevoMov(prev => ({
        ...prev,
        concepto: `Pago de anualidad / faena - Fosa ${num}${primerDifunto ? ` (${primerDifunto})` : ''}`
      }));
    }
  };

  const handleDesvincularFosa = () => {
    setFosaSeleccionada(null);
    setDifuntoSeleccionado('');
    setBusquedaFosa('');
  };

  // Manejar click en concepto rápido
  const handleAplicarConceptoRapido = (concepto) => {
    const num = fosaSeleccionada ? formatearNumeroFosa(fosaSeleccionada.codigo) : '';
    const dif = difuntoSeleccionado || fosaSeleccionada?.historialDifuntos?.[0]?.nombre || '';
    
    let conceptoTexto = concepto.nombre;
    if (num) {
      conceptoTexto = `${concepto.nombre} 2026 - Lote ${num}${dif ? ` (${dif})` : ''}`;
    }

    setNuevoMov(prev => ({
      ...prev,
      categoria: concepto.categoria,
      monto: concepto.monto !== '' ? String(concepto.monto) : prev.monto,
      concepto: conceptoTexto
    }));
  };

  const handleAbrirModal = () => {
    setFosaSeleccionada(null);
    setDifuntoSeleccionado('');
    setBusquedaFosa('');
    setDropdownFosasAbierto(false);
    setNuevoMov({
      tipo: 'Ingreso',
      categoria: 'Refrendo',
      concepto: '',
      monto: '',
      metodoPago: 'Efectivo_Caja',
      folio: `REC-2026-${Date.now().toString().slice(-4)}`,
      observaciones: ''
    });
    setModalAbierto(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!nuevoMov.monto || !nuevoMov.concepto.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Datos Incompletos',
        mensaje: 'Por favor ingresa el monto y el concepto del movimiento para continuar.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const folioFinal = nuevoMov.folio.trim() || `REC-2026-${Date.now().toString().slice(-4)}`;
    const fechaActual = new Date().toISOString().split('T')[0];
    const difuntoFinal = difuntoSeleccionado || fosaSeleccionada?.historialDifuntos?.[0]?.nombre || '';

    // Si es un ingreso y se vinculó una fosa, actualizar el historial de la fosa
    if (nuevoMov.tipo === 'Ingreso' && fosaSeleccionada) {
      const nuevoPagoFosa = {
        id: Date.now(),
        folio: folioFinal,
        fecha: fechaActual,
        concepto: nuevoMov.concepto.trim(),
        categoria: nuevoMov.categoria || 'Refrendo',
        monto: Number(nuevoMov.monto),
        metodoPago: nuevoMov.metodoPago || 'Efectivo en Caja',
        titular: fosaSeleccionada.titularNombre || 'Titular Registrado',
        difunto: difuntoFinal,
        estatus: 'Pagado',
        observaciones: nuevoMov.observaciones.trim() || `Pago registrado desde Control de Caja (Folio #${folioFinal})`
      };

      const fosaConPago = agregarPagoAFosa(fosaSeleccionada, nuevoPagoFosa);
      if (onActualizarFosa) {
        onActualizarFosa(fosaConPago);
      }
    }

    // Registrar el movimiento en la caja
    const registro = {
      id: Date.now(),
      tipo: nuevoMov.tipo,
      categoria: nuevoMov.categoria,
      concepto: nuevoMov.concepto.trim(),
      monto: Number(nuevoMov.monto),
      metodoPago: nuevoMov.metodoPago,
      folio: folioFinal,
      fecha: fechaActual,
      fosaCodigo: fosaSeleccionada?.codigo || null,
      difuntoNombre: difuntoFinal || null,
      titularNombre: fosaSeleccionada?.titularNombre || null,
      observaciones: nuevoMov.observaciones.trim()
    };

    if (onRegistrarMovimiento) {
      onRegistrarMovimiento(registro);
    }

    setModalAbierto(false);
    setFosaSeleccionada(null);
    setDifuntoSeleccionado('');
    setBusquedaFosa('');

    setAlertaConfig({
      tipo: 'exito',
      titulo: 'Movimiento Registrado y Vinculado',
      mensaje: fosaSeleccionada
        ? `¡${nuevoMov.tipo} registrado con folio ${folioFinal}! El pago de $${Number(nuevoMov.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} se ligó exitosamente a la fosa ${fosaSeleccionada.codigo} (${difuntoFinal ? `Difunto: ${difuntoFinal}` : `Titular: ${fosaSeleccionada.titularNombre}`}) y quedó asentado en su historial.`
        : `¡${nuevoMov.tipo} registrado exitosamente con folio ${folioFinal}!`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => setAlertaConfig(null)
    });
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-teal-600" />
            <span>Control de Caja y Movimientos</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Registro diario de ingresos (anualidades, faenas, títulos) y egresos operativos con vinculación directa al historial del difunto y fosa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAbrirModal}
            className="px-4 py-2 bg-[#152822] hover:bg-[#1E3A31] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#152822]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Nuevo Movimiento de Caja</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Total Ingresos */}
        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Ingresos Recaudados
            </span>
            <span className="p-2 rounded-xl bg-stone-100 text-stone-800 border border-stone-200">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-stone-900">
              +${totalIngresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Refrendos, faenas, nichos y concesiones
            </div>
          </div>
        </div>

        {/* Saldo Disponible */}
        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Saldo Disponible en Efectivo
            </span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">
              ${saldoEnCaja.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Arqueo al día de hoy
            </div>
          </div>
        </div>

        {/* Total Egresos */}
        <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Total Egresos y Gastos
            </span>
            <span className="p-2 rounded-xl bg-rust-100 text-rust-800 border border-rust-200">
              <ArrowDownRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rust-800">
              -${totalEgresos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              Limpieza, gasolina y mantenimiento
            </div>
          </div>
        </div>

      </div>

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-cream-300 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* Selector Tipo */}
        <div className="flex items-center gap-1.5 p-1 bg-cream-100/70 rounded-xl border border-cream-300 text-xs font-semibold">
          {['Todos', 'Ingreso', 'Egreso'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                tipoFiltro === t
                  ? 'bg-teal-500 text-white shadow-2xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {t === 'Todos' ? 'Todos los Tipos' : `${t}s`}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto, folio, difunto, fosa..."
            className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

      </div>

      {/* 4. Tabla de Movimientos */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-cream-100 text-stone-900 font-black border-b border-cream-300 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Folio / Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Concepto y Difunto / Fosa Vinculada</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Monto (MXN)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 italic">
                    No se encontraron movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((item, idx) => {
                  const esIngreso = item.tipo === 'Ingreso' || item.tipo_movimiento === 'Ingreso';
                  const tieneVinculo = Boolean(item.fosaCodigo || item.difuntoNombre || item.titularNombre);

                  return (
                    <tr key={item.id || idx} className="hover:bg-cream-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-stone-900">
                          {item.folio || item.folio_comprobante || 'REC-2026'}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium">
                          {formatearFecha(item.fecha || item.fecha_movimiento)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          esIngreso 
                            ? 'bg-olive-100 text-olive-800 border-olive-300' 
                            : 'bg-rust-100 text-rust-800 border-rust-300'
                        }`}>
                          {esIngreso ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {esIngreso ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-800">
                        {item.categoria || item.categoria_tipo || 'Servicio'}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900 max-w-md">
                        <div className="font-bold text-stone-900">
                          {item.concepto || item.concepto_detalle}
                        </div>
                        {tieneVinculo && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            {item.fosaCodigo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-900 font-mono font-bold">
                                <Landmark className="w-3 h-3 text-teal-600" />
                                <span>Fosa {formatearNumeroFosa(item.fosaCodigo)}</span>
                              </span>
                            )}
                            {item.difuntoNombre && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-stone-800 font-semibold">
                                <User className="w-3 h-3 text-stone-600" />
                                <span>Difunto: {item.difuntoNombre}</span>
                              </span>
                            )}
                            {item.titularNombre && !item.difuntoNombre && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cream-100 border border-cream-300 text-stone-700">
                                <span>Titular: {item.titularNombre}</span>
                              </span>
                            )}
                          </div>
                        )}
                        {item.observaciones && (
                          <div className="text-[10px] text-stone-500 italic mt-0.5">
                            {item.observaciones}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {item.metodoPago || item.metodo_pago || 'Efectivo'}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-black text-sm ${
                        esIngreso ? 'text-olive-800' : 'text-rust-800'
                      }`}>
                        {esIngreso ? '+' : '-'}${Number(item.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Registrar Movimiento */}
      {modalAbierto && (
        <div 
          onClick={() => setModalAbierto(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-cream-300 shadow-2xl w-full max-w-xl p-5 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto flex flex-col"
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 shrink-0">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <span>Registrar Movimiento en Caja</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-cream-100 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              
              {/* Tipo de Movimiento */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNuevoMov({ ...nuevoMov, tipo: 'Ingreso', categoria: 'Refrendo' })}
                  className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    nuevoMov.tipo === 'Ingreso'
                      ? 'bg-olive-600 text-white border-olive-700 shadow-xs'
                      : 'bg-cream-100 text-stone-600 border-cream-300'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Ingreso / Cobro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNuevoMov({ ...nuevoMov, tipo: 'Egreso', categoria: 'Mantenimiento' });
                    setFosaSeleccionada(null);
                    setDifuntoSeleccionado('');
                  }}
                  className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    nuevoMov.tipo === 'Egreso'
                      ? 'bg-rust-600 text-white border-rust-700 shadow-xs'
                      : 'bg-cream-100 text-stone-600 border-cream-300'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Egreso / Gasto</span>
                </button>
              </div>

              {/* SECCIÓN VINCULAR A FOSA Y DIFUNTO (Solo en Ingresos) */}
              {nuevoMov.tipo === 'Ingreso' && (
                <div className="p-3.5 bg-cream-50/80 rounded-2xl border border-cream-300 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800 flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-teal-700" />
                      <span>Vincular a Fosa y Difunto</span>
                    </span>
                    <span className="text-[10px] text-stone-500 font-medium">
                      {fosaSeleccionada ? 'Fosa conectada' : 'Opcional para actualizar historial'}
                    </span>
                  </div>

                  {fosaSeleccionada ? (
                    /* Tarjeta de Fosa y Difunto Seleccionados */
                    <div className="p-3 bg-white rounded-xl border border-teal-300 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-900 rounded-md font-mono font-black text-xs">
                            Fosa {formatearNumeroFosa(fosaSeleccionada.codigo)}
                          </span>
                          <span className="text-stone-700 font-bold text-xs truncate max-w-xs">
                            {fosaSeleccionada.seccionNombre}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleDesvincularFosa}
                          className="text-[11px] text-rust-600 hover:text-rust-800 font-bold underline cursor-pointer"
                        >
                          Cambiar / Desvincular
                        </button>
                      </div>

                      {/* Selector de Difunto si hay más de 1 difunto */}
                      {fosaSeleccionada.historialDifuntos && fosaSeleccionada.historialDifuntos.length > 1 ? (
                        <div className="space-y-1 pt-1">
                          <label className="block text-[11px] font-bold text-stone-700">
                            Difunto asociado a este pago:
                          </label>
                          <select
                            value={difuntoSeleccionado}
                            onChange={(e) => setDifuntoSeleccionado(e.target.value)}
                            className="w-full bg-cream-50 border border-cream-300 rounded-lg p-1.5 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {fosaSeleccionada.historialDifuntos.map((d, i) => (
                              <option key={d.id || i} value={d.nombre}>
                                {d.nombre} ({d.fechaInhumacion ? `Inhumado: ${d.fechaInhumacion}` : 'Sin fecha'})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-[11px] text-stone-700">
                          <strong>Difunto:</strong>{' '}
                          {fosaSeleccionada.historialDifuntos?.[0]?.nombre || 'Sin difunto registrado'}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-stone-600 pt-1 border-t border-cream-200">
                        <div>
                          <strong>Titular:</strong> {fosaSeleccionada.titularNombre || 'No registrado'}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            resumenFosaSeleccionada?.estatusActual === 'Al Corriente'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {resumenFosaSeleccionada?.estatusActual === 'Al Corriente' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span>
                              {resumenFosaSeleccionada?.estatusActual === 'Al Corriente'
                                ? 'Al Corriente'
                                : `Con Adeudo ($${resumenFosaSeleccionada?.adeudoEstimado || 0})`}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Buscador de Fosa / Difunto */
                    <div className="relative">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={busquedaFosa}
                        onFocus={() => setDropdownFosasAbierto(true)}
                        onChange={(e) => {
                          setBusquedaFosa(e.target.value);
                          setDropdownFosasAbierto(true);
                        }}
                        placeholder="Buscar por difunto, titular o número de fosa (ej: 176-A, Sanchez)..."
                        className="w-full bg-white border border-cream-300 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-2xs"
                      />

                      {dropdownFosasAbierto && resultadosFosas.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-cream-300 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-cream-200">
                          {resultadosFosas.map(({ fosa }) => (
                            <button
                              key={fosa.id || fosa.codigo}
                              type="button"
                              onClick={() => handleSeleccionarFosa(fosa)}
                              className="w-full text-left p-2.5 hover:bg-teal-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="min-w-0">
                                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                                  <span className="font-mono text-teal-800">
                                    {formatearNumeroFosa(fosa.codigo)}
                                  </span>
                                  <span className="text-[11px] text-stone-500">
                                    • {fosa.seccionNombre}
                                  </span>
                                </div>
                                <div className="text-[11px] text-stone-700 truncate">
                                  Difunto: {fosa.historialDifuntos?.[0]?.nombre || 'Sin difunto'}
                                </div>
                                <div className="text-[10px] text-stone-500 truncate">
                                  Titular: {fosa.titularNombre || 'Sin titular'}
                                </div>
                              </div>
                              <span className="px-2 py-1 rounded-lg bg-teal-600 text-white font-bold text-[10px] shrink-0">
                                Vincular
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CONCEPTOS OFICIALES RÁPIDOS (Solo en Ingresos) */}
              {nuevoMov.tipo === 'Ingreso' && (
                <div className="space-y-1.5">
                  <label className="block font-bold text-stone-700 text-[11px] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-teal-600" />
                    <span>Conceptos Oficiales de Pago (Selección rápida):</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONCEPTOS_RAPIDOS.map((c) => {
                      const activo = nuevoMov.categoria === c.categoria;
                      return (
                        <button
                          key={c.nombre}
                          type="button"
                          onClick={() => handleAplicarConceptoRapido(c)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer font-bold flex items-center justify-between min-h-[42px] ${
                            activo
                              ? 'bg-[#152822] text-white border-[#152822] shadow-2xs'
                              : 'bg-white hover:bg-cream-100 text-stone-800 border-cream-300'
                          }`}
                        >
                          <span className="font-bold text-[11px] truncate">{c.nombre}</span>
                          {activo && <CheckCircle2 className="w-3.5 h-3.5 text-cream-200 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monto y Folio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Monto ($ MXN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={nuevoMov.monto}
                      onChange={(e) => setNuevoMov({ ...nuevoMov, monto: e.target.value })}
                      placeholder="250.00"
                      className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-7 pr-3 py-2.5 font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Folio del Recibo *</label>
                  <input
                    type="text"
                    required
                    value={nuevoMov.folio}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, folio: e.target.value })}
                    placeholder="Ej: REC-2026-084"
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="text-[10px] text-stone-400 block">
                    Identificador para consultar este pago en el historial de la fosa
                  </span>
                </div>
              </div>

              {/* Concepto Detallado */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Concepto / Motivo *</label>
                <input
                  type="text"
                  required
                  value={nuevoMov.concepto}
                  onChange={(e) => setNuevoMov({ ...nuevoMov, concepto: e.target.value })}
                  placeholder="Ej: Pago de anualidad 2026 y faena"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Método de Pago y Observaciones */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Método de Pago</label>
                  <select
                    value={nuevoMov.metodoPago}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, metodoPago: e.target.value })}
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Efectivo_Caja">Efectivo en Caja</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Débito / Crédito</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Observaciones (Opcional)</label>
                  <input
                    type="text"
                    value={nuevoMov.observaciones}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, observaciones: e.target.value })}
                    placeholder="Notas adicionales..."
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs border border-teal-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Guardar y Reflejar Pago</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Alerta / Éxito Centrado */}
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
