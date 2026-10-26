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
  FileCheck
} from 'lucide-react';
import ModalAlerta from '../components/common/ModalAlerta';

export default function FinanzasCaja({
  movimientos = [],
  onRegistrarMovimiento
}) {
  const [tipoFiltro, setTipoFiltro] = useState('Todos'); // 'Todos' | 'Ingreso' | 'Egreso'
  const [busqueda, setBusqueda] = useState('');
  
  // Modal para nuevo ingreso / egreso
  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertaConfig, setAlertaConfig] = useState(null);
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

  // Filtrado de movimientos
  const movimientosFiltrados = useMemo(() => {
    return (movimientos || []).filter(m => {
      const tipo = m.tipo || m.tipo_movimiento;
      const concepto = (m.concepto || m.concepto_detalle || '').toLowerCase();
      const folio = (m.folio || m.folio_comprobante || '').toLowerCase();
      const term = busqueda.toLowerCase();

      const matchTipo = tipoFiltro === 'Todos' || tipo === tipoFiltro;
      const matchSearch = concepto.includes(term) || folio.includes(term);

      return matchTipo && matchSearch;
    });
  }, [movimientos, tipoFiltro, busqueda]);

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!nuevoMov.monto || !nuevoMov.concepto) {
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

    const registro = {
      id: Date.now(),
      tipo: nuevoMov.tipo,
      categoria: nuevoMov.categoria,
      concepto: nuevoMov.concepto,
      monto: Number(nuevoMov.monto),
      metodoPago: nuevoMov.metodoPago,
      folio: folioFinal,
      fecha: new Date().toISOString().split('T')[0],
      observaciones: nuevoMov.observaciones
    };

    if (onRegistrarMovimiento) {
      onRegistrarMovimiento(registro);
    }

    setModalAbierto(false);
    setNuevoMov({
      tipo: 'Ingreso',
      categoria: 'Refrendo',
      concepto: '',
      monto: '',
      metodoPago: 'Efectivo_Caja',
      folio: '',
      observaciones: ''
    });

    setAlertaConfig({
      tipo: 'exito',
      titulo: 'Movimiento Registrado',
      mensaje: `¡${nuevoMov.tipo} registrado exitosamente con folio ${folioFinal}!`,
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
            Control de Caja y Movimientos
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Registro diario de ingresos (refrendos, inhumaciones, títulos) y egresos operativos (mantenimiento, personal).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="px-4 py-2 bg-[#152822] hover:bg-[#1E3A31] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#152822]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Nuevo Movimiento de Caja</span>
          </button>
        </div>
      </div>

      {/* 2. Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Total Ingresos Recaudados (Ahora primero, valor en Negro) */}
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
              Refrendos, nichos y concesiones
            </div>
          </div>
        </div>

        {/* 2. Saldo Disponible en Efectivo (Ahora segundo, valor en Verde) */}
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

        {/* Total Egresos (Terracotta Rust #AE5238) */}
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
        <div className="flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por concepto o folio..."
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
                <th className="py-3 px-4">Concepto Detallado</th>
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
                  return (
                    <tr key={idx} className="hover:bg-cream-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-stone-900">{item.folio || item.folio_comprobante || 'REC-2026'}</div>
                        <div className="text-[10px] text-stone-400">{item.fecha || item.fecha_movimiento}</div>
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
                      <td className="py-3 px-4 font-medium text-stone-900 max-w-xs truncate" title={item.concepto || item.concepto_detalle}>
                        {item.concepto || item.concepto_detalle}
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
          className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-cream-300 shadow-2xl w-full max-w-lg p-6 space-y-5"
          >
            
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                Registrar Movimiento en Caja
              </h3>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4 text-xs">
              
              {/* Tipo de Movimiento */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNuevoMov({ ...nuevoMov, tipo: 'Ingreso', categoria: 'Refrendo' })}
                  className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    nuevoMov.tipo === 'Ingreso'
                      ? 'bg-olive-500 text-white border-olive-600 shadow-xs'
                      : 'bg-cream-100 text-stone-600 border-cream-300'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Ingreso / Cobro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNuevoMov({ ...nuevoMov, tipo: 'Egreso', categoria: 'Mantenimiento' })}
                  className={`py-2.5 rounded-xl font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    nuevoMov.tipo === 'Egreso'
                      ? 'bg-rust-500 text-white border-rust-600 shadow-xs'
                      : 'bg-cream-100 text-stone-600 border-cream-300'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Egreso / Gasto</span>
                </button>
              </div>

              {/* Monto y Folio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Monto ($ MXN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={nuevoMov.monto}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, monto: e.target.value })}
                    placeholder="Ej: 250.00"
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Folio (Opcional)</label>
                  <input
                    type="text"
                    value={nuevoMov.folio}
                    onChange={(e) => setNuevoMov({ ...nuevoMov, folio: e.target.value })}
                    placeholder="Ej: REC-2026-084"
                    className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Concepto / Motivo *</label>
                <input
                  type="text"
                  required
                  value={nuevoMov.concepto}
                  onChange={(e) => setNuevoMov({ ...nuevoMov, concepto: e.target.value })}
                  placeholder="Ej: Refrendo anual fosa F1-042 (Familia Reyes)"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-cream-200">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs border border-teal-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Guardar Registro</span>
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
