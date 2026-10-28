// src/pages/ControlEspacios.jsx
import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Archive, 
  Sprout, 
  Printer, 
  Pencil, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Receipt,
  Folder,
  FolderPlus,
  History,
  X,
  Users
} from 'lucide-react';
import ModalCedulaTitulo from '../components/modals/ModalCedulaTitulo';
import ModalReciboPago from '../components/modals/ModalReciboPago';
import { calcularEstadoExpediente } from '../constants/expedienteConfig';
import { coincideEspacioConBusqueda } from '../utils/busquedaUtils';

export default function ControlEspacios({
  secciones = [],
  seccionSeleccionada = 'Todas',
  onCambiarSeccion,
  registrosFosas = [],
  busquedaGlobal = '',
  onBusquedaChange,
  onAbrirModalRegistro,
  onSeleccionarRegistro,
  onAbrirExpediente,
  onAbrirHistorial,
  onContextMenu,
  onRegistrarMovimiento,
  onActualizarFosa,
  enfocarBusqueda = false,
  esAdmin = true,
  puedeRegistrarPagos = true
}) {
  const [busquedaLocal, setBusquedaLocal] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos'); // 'Todos' | 'Fosa' | 'Nicho'
  const [filtroConstruccion, setFiltroConstruccion] = useState('Todas'); // 'Todas' | 'Sencilla' | 'Sellada'
  const [filtroPago, setFiltroPago] = useState('Todos'); // 'Todos' | 'Al Corriente' | 'Con Adeudo'
  const [filtroOcupacion, setFiltroOcupacion] = useState('Todos'); // 'Todos' | 'Ocupado' | 'Disponible'
  const [filtroExpediente, setFiltroExpediente] = useState('Todos'); // 'Todos' | 'Completo' | 'Incompleto' | 'Sin Documentacion'
  
  const inputBusquedaRef = useRef(null);

  useEffect(() => {
    if (enfocarBusqueda) {
      inputBusquedaRef.current?.focus();
    }
  }, [enfocarBusqueda]);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(25);

  // Modales
  const [espacioImprimir, setEspacioImprimir] = useState(null);
  const [modalRecibo, setModalRecibo] = useState({ abierto: false, espacio: null });
  const [modalDifuntosFosa, setModalDifuntosFosa] = useState(null);

  // Lista única de secciones para evitar duplicados en el selector
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

  // Si hay búsqueda global en el header, tiene prioridad
  const busqueda = busquedaGlobal !== undefined && busquedaGlobal !== '' ? busquedaGlobal : busquedaLocal;

  // Filtrado reactivo multidimensional con búsqueda en todos los difuntos
  const registrosFiltrados = useMemo(() => {
    return (registrosFosas || []).map(r => {
      // 1. Filtro Sección
      const matchSeccion = seccionSeleccionada === 'Todas' || 
        (r.seccionNombre && r.seccionNombre.toLowerCase().includes(seccionSeleccionada.toLowerCase()));

      // 2. Filtro Tipo
      const matchTipo = filtroTipo === 'Todos' || r.tipoEspacio === filtroTipo;

      // 3. Filtro Construcción / Sellado
      const tipoConstruccionActual = r.tipoConstruccion || 'Sencilla';
      const matchConstruccion = filtroConstruccion === 'Todas' || tipoConstruccionActual === filtroConstruccion;

      // 4. Filtro Pago
      const matchPago = filtroPago === 'Todos' || r.estatusPago === filtroPago;

      // 5. Filtro Ocupación
      const ocupado = r.historialDifuntos?.length > 0 || r.estatusOcupacion === 'Ocupado';
      const matchOcupacion = filtroOcupacion === 'Todos' || 
        (filtroOcupacion === 'Ocupado' && ocupado) || 
        (filtroOcupacion === 'Disponible' && !ocupado);

      // 6. Filtro Expediente
      const estadoExp = calcularEstadoExpediente(r.expediente);
      const matchExpediente = filtroExpediente === 'Todos' ||
        (filtroExpediente === 'Completo' && estadoExp.estatus === 'Completo') ||
        (filtroExpediente === 'Incompleto' && estadoExp.estatus === 'Incompleto') ||
        (filtroExpediente === 'Sin Documentacion' && estadoExp.estatus === 'Sin Documentación');

      // 7. Búsqueda inteligente (todos los difuntos, orden de palabras independiente, sin acentos)
      const resBusqueda = coincideEspacioConBusqueda(r, busqueda);

      if (matchSeccion && matchTipo && matchConstruccion && matchPago && matchOcupacion && matchExpediente && resBusqueda.coincide) {
        return {
          ...r,
          _difuntoCoincidente: resBusqueda.difuntoCoincidente,
          _todosDifuntosCoincidentes: resBusqueda.todosDifuntosCoincidentes
        };
      }
      return null;
    }).filter(Boolean);
  }, [registrosFosas, seccionSeleccionada, filtroTipo, filtroConstruccion, filtroPago, filtroOcupacion, filtroExpediente, busqueda]);

  // Paginación
  const totalRegistros = registrosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / registrosPorPagina) || 1;
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const registrosPaginados = registrosFiltrados.slice(indiceInicio, indiceInicio + registrosPorPagina);

  const handleCambiarFiltro = (setter, valor) => {
    setter(valor);
    setPaginaActual(1);
  };

  const handleBusquedaInputChange = (valor) => {
    if (onBusquedaChange) onBusquedaChange(valor);
    setBusquedaLocal(valor);
    setPaginaActual(1);
  };

  const handleAbrirRecibo = (item = null) => {
    setModalRecibo({ abierto: true, espacio: item });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Encabezado y Botones de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-teal-600" />
            Padrón General de Fosas y Nichos
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Catálogo de <strong>{totalRegistros.toLocaleString()}</strong> espacios ({registrosFosas.length.toLocaleString()} espacios registrados).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón de Emitir Recibo de Pago (Admin y Operador que puede registrar pagos) */}
          {(esAdmin || puedeRegistrarPagos) && (
            <button
              type="button"
              onClick={() => handleAbrirRecibo(null)}
              className="px-4 py-2.5 bg-[#2D6A4F] hover:bg-[#21533D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#2D6A4F]"
              title="Registrar cobro y emitir recibo oficial de pago"
            >
              <Receipt className="w-4 h-4 text-white" />
              <span>Emitir Recibo de Pago</span>
            </button>
          )}

          {/* Botón de Registrar Nueva Fosa (Verde Bosque Institucional #152822) */}
          <button
            type="button"
            onClick={onAbrirModalRegistro}
            className="px-4 py-2.5 bg-[#152822] hover:bg-[#1E3A31] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#152822]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Registrar Nueva Fosa</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Filtros Rápidos y Búsqueda */}
      <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-center">
          
          {/* Buscador Universal (4 cols en desktop) */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busqueda}
              onChange={(e) => handleBusquedaInputChange(e.target.value)}
              placeholder="Buscar por código, titular, difunto, CURP..."
              className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => handleBusquedaInputChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Sección (3 cols en desktop) */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-3">
            <select
              value={seccionSeleccionada}
              onChange={(e) => handleCambiarFiltro(onCambiarSeccion, e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="Todas">Todas las Secciones</option>
              {listaSeccionesUnicas.map(s => (
                <option key={s.id} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo de Espacio (2 cols en desktop) */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2">
            <select
              value={filtroTipo}
              onChange={(e) => handleCambiarFiltro(setFiltroTipo, e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
            >
              <option value="Todos">Tipo: Todos</option>
              <option value="Fosa">Solo Fosas</option>
              <option value="Nicho">Solo Nichos</option>
            </select>
          </div>

          {/* Filtro Cobro (Admin y Operador que puede registrar pagos) */}
          {(esAdmin || puedeRegistrarPagos) && (
            <div className="sm:col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1">
              <select
                value={filtroPago}
                onChange={(e) => handleCambiarFiltro(setFiltroPago, e.target.value)}
                className="w-full bg-cream-50 border border-cream-300 rounded-xl px-2 py-2 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              >
                <option value="Todos">Cobro</option>
                <option value="Al Corriente">Al Corriente</option>
                <option value="Con Adeudo">Con Adeudo</option>
              </select>
            </div>
          )}

          {/* Filtro Expediente Digital */}
          <div className={(esAdmin || puedeRegistrarPagos) ? "sm:col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2" : "sm:col-span-1 md:col-span-1 lg:col-span-3 xl:col-span-3"}>
            <select
              value={filtroExpediente}
              onChange={(e) => handleCambiarFiltro(setFiltroExpediente, e.target.value)}
              className="w-full bg-cream-50 border border-cream-300 rounded-xl px-2 py-2 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
              title="Filtrar por estatus de documentos del expediente"
            >
              <option value="Todos">Expediente: Todos</option>
              <option value="Completo">Docs Completos (6/6)</option>
              <option value="Incompleto">Incompletos</option>
              <option value="Sin Documentacion">Sin Documentos</option>
            </select>
          </div>

        </div>

        {/* Chips de Estado de Ocupación y Condición de Tumba */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-cream-200 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-semibold text-stone-600">
              <span className="text-[11px] text-stone-400 mr-1">Ocupación:</span>
              {['Todos', 'Ocupado', 'Disponible'].map(est => (
                <button
                  key={est}
                  type="button"
                  onClick={() => handleCambiarFiltro(setFiltroOcupacion, est)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filtroOcupacion === est
                      ? 'bg-teal-500 text-white shadow-2xs'
                      : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-stone-600">
              <span className="text-[11px] text-stone-400 mr-1">Condición:</span>
              {['Todas', 'Sencilla', 'Sellada'].map(cond => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => handleCambiarFiltro(setFiltroConstruccion, cond)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filtroConstruccion === cond
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-stone-500">
            Mostrando <strong>{registrosPaginados.length}</strong> de <strong>{totalRegistros.toLocaleString()}</strong> resultados
          </div>
        </div>

      </div>

      {/* 3. Tabla Catastral de Fosas */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-cream-100 text-stone-900 font-black border-b border-cream-300 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Lote / Fosa</th>
                <th className="py-3.5 px-4">Sección / Tipo</th>
                <th className="py-3.5 px-4">Titular / Concesionario</th>
                <th className="py-3.5 px-4">Difunto(s) Inhumados</th>
                <th className="py-3.5 px-4">Refrendo</th>
                <th className="py-3.5 px-3 text-center">Expediente</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {registrosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 italic">
                    No se encontraron fosas o nichos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                registrosPaginados.map((item) => {
                  const ocupado = item.historialDifuntos?.length > 0 || item.estatusOcupacion === 'Ocupado';
                  const alCorriente = item.estatusPago === 'Al Corriente';
                  const estadoExp = calcularEstadoExpediente(item.expediente);
                  const tieneDocumentos = estadoExp.totalAdjuntados > 0;

                  return (
                    <tr
                      key={item.id}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, item)}
                      className="hover:bg-cream-50 transition-colors group cursor-pointer"
                      onClick={() => onSeleccionarRegistro && onSeleccionarRegistro(item)}
                    >
                      {/* Código de Fosa */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-lg ${ocupado ? 'bg-rust-100 text-rust-800' : 'bg-olive-100 text-olive-800'}`}>
                            {ocupado ? <Archive className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-mono font-black text-sm text-stone-900">
                            {item.codigo}
                          </span>
                        </div>
                      </td>

                      {/* Sección, Tipo y Sellado */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-800">{item.seccionNombre}</div>
                        <div className="text-[10px] text-stone-500 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{item.tipoEspacio}</span>
                          <span>•</span>
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded font-bold ${
                            item.tipoConstruccion === 'Sellada'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-cream-100 text-stone-700 border border-cream-300'
                          }`}>
                            {item.tipoConstruccion === 'Sellada' ? 'Sellada' : 'Sencilla'}
                          </span>
                        </div>
                        {item.tipoConstruccion === 'Sellada' && item.fechaSellado && (
                          <div className="text-[9px] text-amber-800 font-semibold mt-0.5">
                            Sellada: {item.fechaSellado}
                          </div>
                        )}
                      </td>

                      {/* Titular */}
                      <td className="py-3 px-4">
                        <div className="font-black text-stone-900">
                          {item.titularNombre || 'Sin titular registrado'}
                        </div>
                        {item.titularTelefono && (
                          <div className="text-[10px] text-stone-500 font-mono">
                            {item.titularTelefono}
                          </div>
                        )}
                      </td>

                      {/* Historial Difuntos */}
                      <td className="py-3 px-4">
                        {item.historialDifuntos && item.historialDifuntos.length > 0 ? (
                          <div className="space-y-1">
                            {busqueda.trim() && item._difuntoCoincidente ? (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-stone-900">
                                    {item._difuntoCoincidente.nombre}
                                  </span>
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded border border-teal-300">
                                    Coincidencia
                                  </span>
                                </div>
                                <div className="text-[10px] text-stone-500 flex items-center gap-2 mt-0.5">
                                  <span>Inhumación: {item._difuntoCoincidente.fechaInhumacion || item._difuntoCoincidente.fechaDefuncion || 'N/D'}</span>
                                  {item.historialDifuntos.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setModalDifuntosFosa(item);
                                      }}
                                      className="font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1 cursor-pointer"
                                      title="Ver todos los difuntos inhumados en este lote"
                                    >
                                      <Users className="w-3 h-3 text-teal-600" />
                                      Ver {item.historialDifuntos.length} difuntos
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-semibold text-stone-900">
                                  {item.historialDifuntos[0].nombre}
                                </div>
                                <div className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                                  <span>Inhumación: {item.historialDifuntos[0].fechaInhumacion || item.historialDifuntos[0].fechaDefuncion || 'N/D'}</span>
                                  {item.historialDifuntos.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setModalDifuntosFosa(item);
                                      }}
                                      className="inline-flex items-center gap-1 ml-1.5 font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 border border-teal-300 px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors"
                                      title="Ver todos los difuntos inhumados en este lote"
                                    >
                                      <Users className="w-2.5 h-2.5" />
                                      +{item.historialDifuntos.length - 1} más
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-stone-400 text-[11px]">Disponible / Sin difuntos</span>
                        )}
                      </td>

                      {/* Estatus Refrendo (Interactivo para abrir historial de pagos para admin y operador con permisos de registrar pagos) */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {(esAdmin || puedeRegistrarPagos) ? (
                          <button
                            type="button"
                            onClick={() => onAbrirHistorial && onAbrirHistorial(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer hover:shadow-xs hover:scale-102 ${
                              alCorriente
                                ? 'bg-olive-100 hover:bg-olive-200 text-olive-900 border-olive-300'
                                : 'bg-rust-100 hover:bg-rust-200 text-rust-900 border-rust-300'
                            }`}
                            title="Clic para ver el historial completo de pagos y refrendos"
                          >
                            {alCorriente ? <CheckCircle2 className="w-3 h-3 text-olive-600" /> : <AlertCircle className="w-3 h-3 text-rust-600" />}
                            <span>{item.estatusPago || 'Al Corriente'}</span>
                            <History className="w-3 h-3 opacity-60 ml-0.5" />
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            alCorriente
                              ? 'bg-olive-50 text-olive-800 border-olive-200'
                              : 'bg-rust-50 text-rust-800 border-rust-200'
                          }`}>
                            {alCorriente ? <CheckCircle2 className="w-3 h-3 text-olive-600" /> : <AlertCircle className="w-3 h-3 text-rust-600" />}
                            <span>{item.estatusPago || 'Al Corriente'}</span>
                          </span>
                        )}
                      </td>

                      {/* Expediente Electrónico (Badge Interactivo que abre el Visor) */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onAbrirExpediente && onAbrirExpediente(item, 'visor')}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            estadoExp.estatus === 'Completo'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                              : tieneDocumentos
                              ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200 font-extrabold shadow-xs'
                              : 'bg-cream-100 text-stone-500 border-cream-300 hover:bg-cream-200'
                          }`}
                          title="Clic para abrir el visor de documentos e imágenes digitalizadas"
                        >
                          <Folder className={`w-3.5 h-3.5 ${estadoExp.estatus === 'Completo' ? 'text-emerald-700' : tieneDocumentos ? 'text-amber-700' : 'text-stone-400'}`} />
                          <span>{estadoExp.totalAdjuntados}/{estadoExp.totalRequeridos} Docs</span>
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          
                          {/* Botón: Ya Pagó (Admin y Operador que puede registrar pagos) */}
                          {(esAdmin || puedeRegistrarPagos) && !alCorriente && (
                            <button
                              type="button"
                              onClick={() => onAbrirHistorial && onAbrirHistorial(item, { filtro: 'Adeudos' })}
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 cursor-pointer transition-colors shadow-2xs"
                              title="Registrar que Ya Pagó con Recibo Físico (Reflejar en sistema)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                          )}

                          {/* Botón: Ver Historial de Pagos de la Tumba (Admin y Operador que puede registrar pagos) */}
                          {(esAdmin || puedeRegistrarPagos) && (
                            <button
                              type="button"
                              onClick={() => onAbrirHistorial && onAbrirHistorial(item)}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer transition-colors"
                              title="Ver Historial de Pagos y Refrendos de la Fosa"
                            >
                              <History className="w-3.5 h-3.5 text-teal-700" />
                            </button>
                          )}

                          {/* Botón 1: Adjuntar / Gestionar Documentos del Expediente (FolderPlus) */}
                          <button
                            type="button"
                            onClick={() => onAbrirExpediente && onAbrirExpediente(item, 'expediente')}
                            className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 border border-cream-300 cursor-pointer transition-colors"
                            title="Adjuntar / Gestionar Documentos del Expediente"
                          >
                            <FolderPlus className="w-3.5 h-3.5 text-stone-600" />
                          </button>

                          {/* Botón Emitir / Imprimir Recibo de Pago (Admin y Operador que puede registrar pagos) */}
                          {(esAdmin || puedeRegistrarPagos) && (
                            <button
                              type="button"
                              onClick={() => handleAbrirRecibo(item)}
                              className="p-1.5 rounded-lg bg-olive-100 hover:bg-olive-200 text-olive-900 border border-olive-300 cursor-pointer transition-colors"
                              title="Cobrar y Emitir Recibo Oficial de Pago"
                            >
                              <Receipt className="w-3.5 h-3.5 text-olive-800" />
                            </button>
                          )}

                          {/* Botón Cédula de Título */}
                          <button
                            type="button"
                            onClick={() => setEspacioImprimir(item)}
                            className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 border border-cream-300 cursor-pointer transition-colors"
                            title="Imprimir Cédula Oficial de Título"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Editar Lote */}
                          <button
                            type="button"
                            onClick={() => onSeleccionarRegistro && onSeleccionarRegistro(item)}
                            className="p-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white cursor-pointer transition-colors"
                            title="Editar Datos de Fosa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Inferior */}
        <div className="bg-cream-50 px-4 py-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 text-stone-600">
            <span>Mostrar por página:</span>
            <select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              className="bg-white border border-cream-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">
              Página <strong>{paginaActual}</strong> de <strong>{totalPaginas}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-white border border-cream-300 text-stone-700 disabled:opacity-40 hover:bg-cream-100 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                className="p-1.5 rounded-lg bg-white border border-cream-300 text-stone-700 disabled:opacity-40 hover:bg-cream-100 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Cédula de Título Oficial */}
      {espacioImprimir && (
        <ModalCedulaTitulo
          espacio={espacioImprimir}
          onCerrar={() => setEspacioImprimir(null)}
        />
      )}

      {/* Modal de Cobro y Recibo Oficial de Pago */}
      {modalRecibo.abierto && (
        <ModalReciboPago
          espacio={modalRecibo.espacio}
          registrosFosas={registrosFosas}
          onCerrar={() => setModalRecibo({ abierto: false, espacio: null })}
          onRegistrarMovimiento={onRegistrarMovimiento}
          onActualizarFosa={onActualizarFosa}
        />
      )}

      {/* Modal de Todos los Difuntos Inhumados en el Lote */}
      {modalDifuntosFosa && (
        <div 
          onClick={() => setModalDifuntosFosa(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-2xl w-full overflow-hidden my-6 flex flex-col"
          >
            {/* Cabecera */}
            <div className="bg-[#152822] text-white px-6 py-4 flex items-center justify-between border-b border-[#234238]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-800/80 border border-teal-500/50 flex items-center justify-center text-teal-200">
                  <Users className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-black text-base text-white">
                      Historial de Inhumaciones
                    </h2>
                    <span className="bg-teal-900/90 text-teal-200 text-xs font-mono font-bold px-2 py-0.5 rounded-md border border-teal-600/60">
                      {modalDifuntosFosa.codigo}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-200/80">
                    Panteón La Soledad • {modalDifuntosFosa.seccionNombre} • {modalDifuntosFosa.tipoEspacio}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalDifuntosFosa(null)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Lote y Titular */}
            <div className="bg-cream-100/70 p-4 border-b border-cream-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Titular / Concesionario:</span>
                <p className="font-black text-stone-900">{modalDifuntosFosa.titularNombre || 'Sin titular registrado'}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Total Inhumados:</span>
                <p className="font-black text-teal-900">{modalDifuntosFosa.historialDifuntos?.length || 0} personas</p>
              </div>
            </div>

            {/* Lista de Difuntos */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {modalDifuntosFosa.historialDifuntos && modalDifuntosFosa.historialDifuntos.length > 0 ? (
                modalDifuntosFosa.historialDifuntos.map((dif, idx) => {
                  const esCoincidente = busqueda.trim() && (
                    dif.nombre?.toLowerCase().includes(busqueda.toLowerCase().trim()) ||
                    modalDifuntosFosa._difuntoCoincidente?.nombre === dif.nombre
                  );

                  return (
                    <div 
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        esCoincidente 
                          ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-xs' 
                          : 'bg-cream-50/60 border-cream-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-black text-sm text-stone-900">
                                {dif.nombre}
                              </h3>
                              {esCoincidente && (
                                <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Búsqueda
                                </span>
                              )}
                            </div>
                            {dif.curp && (
                              <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                                CURP: {dif.curp}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-stone-400 font-medium block">Fecha de Servicio:</span>
                          <span className="font-bold text-xs text-stone-800">
                            {dif.fechaInhumacion || dif.fechaDefuncion || 'Sin fecha'}
                          </span>
                        </div>
                      </div>

                      {(dif.edad || dif.causaMuerte || dif.parentesco || dif.notas) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-cream-200 text-[11px] text-stone-600">
                          {dif.edad && (
                            <div>
                              <span className="text-stone-400 font-medium">Edad:</span> {dif.edad} años
                            </div>
                          )}
                          {dif.causaMuerte && (
                            <div className="col-span-2">
                              <span className="text-stone-400 font-medium">Causa:</span> {dif.causaMuerte}
                            </div>
                          )}
                          {dif.parentesco && (
                            <div>
                              <span className="text-stone-400 font-medium">Parentesco:</span> {dif.parentesco}
                            </div>
                          )}
                          {dif.notas && (
                            <div className="col-span-full text-stone-500 italic">
                              Nota: {dif.notas}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-stone-400 text-xs italic">
                  No hay difuntos registrados en este lote.
                </div>
              )}
            </div>

            {/* Pie de Modal */}
            <div className="bg-cream-100/70 px-6 py-3.5 border-t border-cream-200 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDifuntosFosa(null)}
                className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
