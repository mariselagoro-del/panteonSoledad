// src/pages/PlanoGeneral.jsx
import { useState, useMemo } from 'react';
import { 
  Sprout, 
  Archive, 
  MapPin, 
  Printer, 
  Pencil, 
  Phone, 
  FileText, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Receipt,
  Search,
  FolderPlus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  FileImage,
  History,
  X
} from 'lucide-react';
import ModalCedulaTitulo from '../components/modals/ModalCedulaTitulo';
import ModalReciboPago from '../components/modals/ModalReciboPago';
import { obtenerHistorialPagosFosa } from '../utils/pagosUtils';
import { coincideEspacioConBusqueda, formatearNumeroFosa } from '../utils/busquedaUtils';

export default function PlanoGeneral({
  registrosFosas = [],
  onEditarFosa,
  onAbrirExpediente,
  onAbrirHistorial,
  onRegistrarMovimiento,
  onActualizarFosa,
  esAdmin = true,
  puedeRegistrarPagos = true
}) {
  const [docActivoIdx, setDocActivoIdx] = useState(0);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [paginaSecciones, setPaginaSecciones] = useState({
    nichos: 0,
    sec4: 0,
    sec1: 0,
    sec5: 0,
    sec3: 0,
    sec2_centro: 0,
    sec2_frente: 0
  });

  const [busquedasSecciones, setBusquedasSecciones] = useState({
    nichos: '',
    sec4: '',
    sec1: '',
    sec5: '',
    sec3: '',
    sec2_centro: '',
    sec2_frente: ''
  });

  const [cuadranteTopIzquierdo, setCuadranteTopIzquierdo] = useState('nichos'); // 'nichos' | 'sec4'
  const [modalRecibo, setModalRecibo] = useState({ abierto: false, espacio: null });

  // Agrupación de datos reales por sección
  const datosPorSeccion = useMemo(() => {
    const nichos = (registrosFosas || []).filter(r => r.tipoEspacio === 'Nicho' || r.seccionNombre?.includes('Nicho'));
    const sec4 = (registrosFosas || []).filter(r => r.seccionNombre?.includes('Sección 4'));
    const sec1 = (registrosFosas || []).filter(r => r.seccionNombre?.includes('Sección 1') && r.tipoEspacio !== 'Nicho');
    const sec5 = (registrosFosas || []).filter(r => r.seccionNombre?.includes('Sección 5'));
    const sec3 = (registrosFosas || []).filter(r => r.seccionNombre?.includes('Sección 3'));
    
    const todasSec2 = (registrosFosas || []).filter(r => r.seccionNombre?.includes('Sección 2'));
    const mitad = Math.ceil(todasSec2.length / 2) || 12;
    const sec2_centro = todasSec2.slice(0, mitad);
    const sec2_frente = todasSec2.slice(mitad);

    return { nichos, sec4, sec1, sec5, sec3, sec2_centro, sec2_frente };
  }, [registrosFosas]);

  // Selección inicial
  const [fosaSeleccionada, setFosaSeleccionada] = useState(() => {
    const nichos = (registrosFosas || []).filter(r => r.tipoEspacio === 'Nicho' || r.seccionNombre?.includes('Nicho'));
    return nichos[0] || registrosFosas[0] || null;
  });

  const [cedulaAImprimir, setCedulaAImprimir] = useState(null);

  // Filtrado reactivo por término de búsqueda dentro de cada sección (busca en todos los difuntos, sin importar el orden ni acentos)
  const obtenerListaFiltrada = (clave, lista) => {
    const q = (busquedasSecciones[clave] || '').trim();
    if (!q) return lista;

    return lista.filter(item => {
      return coincideEspacioConBusqueda(item, q).coincide;
    });
  };

  // Generador de cuadrícula de 12 lotes por sección
  const obtenerCeldasSeccion = (clave, lista, totalGenerar = 12) => {
    const inicio = (paginaSecciones[clave] || 0) * totalGenerar;
    const items = lista.slice(inicio, inicio + totalGenerar);

    const celdas = [...items];
    while (celdas.length < totalGenerar) {
      const numConsecutivo = inicio + celdas.length + 1;
      let prefijo = 'F';
      let nombreSecc = 'Sección';

      if (clave === 'nichos') {
        prefijo = 'N';
        nombreSecc = 'Zona de Nichos';
      } else if (clave === 'sec4') {
        prefijo = 'F4';
        nombreSecc = 'Sección 4';
      } else if (clave === 'sec1') {
        prefijo = 'F1';
        nombreSecc = 'Sección 1';
      } else if (clave === 'sec5') {
        prefijo = 'F5';
        nombreSecc = 'Sección 5';
      } else if (clave === 'sec3') {
        prefijo = 'F3';
        nombreSecc = 'Sección 3';
      } else if (clave.startsWith('sec2')) {
        prefijo = 'F2';
        nombreSecc = 'Sección 2';
      }

      const codigoGenerado = `${prefijo}-${String(numConsecutivo).padStart(3, '0')}`;
      
      celdas.push({
        id: `gen-${clave}-${numConsecutivo}`,
        codigo: codigoGenerado,
        seccionNombre: nombreSecc,
        tipoEspacio: clave === 'nichos' ? 'Nicho' : 'Fosa',
        estatusPago: 'Al Corriente',
        estatusOcupacion: 'Disponible',
        titularNombre: 'Disponible / Sin Titular',
        historialDifuntos: [],
        observaciones: 'Espacio disponible para concesión o apartado.'
      });
    }

    return celdas;
  };

  const cambiarPaginaSeccion = (clave, direccion, totalItems) => {
    const totalPags = Math.ceil(totalItems / 12);
    setPaginaSecciones(prev => {
      const actual = prev[clave] || 0;
      const nuevo = actual + direccion;
      if (nuevo < 0 || nuevo >= totalPags) return prev;
      return { ...prev, [clave]: nuevo };
    });
  };

  // Renderizador de un cuadrante de sección con buscador integrado
  const renderCuadranteSeccion = (titulo, clave, lista, colorBadge = 'text-teal-900', selectorHeader = null) => {
    const listaFiltrada = obtenerListaFiltrada(clave, lista);
    const busquedaActiva = (busquedasSecciones[clave] || '').trim().length > 0;
    const celdas = obtenerCeldasSeccion(clave, listaFiltrada);
    const pagActual = paginaSecciones[clave] || 0;
    const totalPaginas = Math.ceil(listaFiltrada.length / 12) || 1;

    return (
      <div className="bg-[#FAF8F5] p-3.5 sm:p-4 lg:p-5 rounded-2xl border-2 border-cream-200 shadow-2xs flex flex-col justify-between h-full space-y-3">
        
        <div>
          {/* Encabezado del Cuadrante con Buscador Inline Integrado */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-cream-300">
            
            {/* 1. Título o Selector de Sección */}
            <div className="flex items-center gap-1.5 shrink-0">
              {selectorHeader ? (
                selectorHeader
              ) : (
                <h4 className={`text-xs font-extrabold flex items-center gap-1.5 ${colorBadge}`}>
                  <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{titulo}</span>
                </h4>
              )}
            </div>

            {/* 2. Buscador Inline Compacto en el Espacio Central */}
            <div className="flex-1 max-w-[180px] sm:max-w-[220px] relative mx-1">
              <Search className="w-3 h-3 text-stone-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busquedasSecciones[clave] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setBusquedasSecciones(prev => ({ ...prev, [clave]: val }));
                  setPaginaSecciones(prev => ({ ...prev, [clave]: 0 }));
                }}
                placeholder="Buscar lote..."
                className="w-full bg-white border border-cream-300 rounded-lg pl-6 pr-5 py-1 text-[10px] sm:text-[11px] text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-2xs"
              />
              {busquedasSecciones[clave] && (
                <button
                  type="button"
                  onClick={() => {
                    setBusquedasSecciones(prev => ({ ...prev, [clave]: '' }));
                    setPaginaSecciones(prev => ({ ...prev, [clave]: 0 }));
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* 3. Paginación / Flechitas */}
            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-stone-500 shrink-0">
              {listaFiltrada.length > 12 ? (
                <>
                  <button
                    type="button"
                    disabled={pagActual === 0}
                    onClick={() => cambiarPaginaSeccion(clave, -1, listaFiltrada.length)}
                    className="hover:text-teal-900 p-1 rounded-md bg-cream-200 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Ver anteriores 12"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-0.5">{pagActual + 1}/{totalPaginas}</span>
                  <button
                    type="button"
                    disabled={pagActual >= totalPaginas - 1}
                    onClick={() => cambiarPaginaSeccion(clave, 1, listaFiltrada.length)}
                    className="hover:text-teal-900 p-1 rounded-md bg-cream-200 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Ver siguientes 12"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : busquedaActiva ? (
                <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200">
                  {listaFiltrada.length}
                </span>
              ) : null}
            </div>

          </div>
        </div>

        {/* Cuadrícula de celdas o mensaje de no resultados */}
        {busquedaActiva && listaFiltrada.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 bg-white/60 rounded-xl border border-dashed border-cream-300 space-y-1">
            <p className="font-semibold text-stone-600">Sin coincidencias</p>
            <p className="text-[11px]">No se encontró ningún lote con "{busquedasSecciones[clave]}" en esta sección.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-1.5 sm:gap-2.5 lg:gap-3">
            {celdas.map((item, idx) => {
              const ocupado = item.historialDifuntos?.length > 0 || (item.titularNombre && item.titularNombre !== 'Disponible / Sin Titular' && item.titularNombre !== 'DISPONIBLE');
              const seleccionada = fosaSeleccionada?.codigo === item.codigo;
              const numeroDisplay = formatearNumeroFosa(item.codigo) || String(idx + 1).padStart(3, '0');

              return (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => {
                    setFosaSeleccionada(item);
                    setDocActivoIdx(0);
                  }}
                  className={`py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer select-none text-center ${
                    seleccionada
                      ? 'ring-4 ring-teal-400 border-white bg-teal-900 text-white scale-110 shadow-xl z-20 font-black'
                      : ocupado
                      ? 'bg-[#AE5238] border-[#8D3B23] text-white hover:bg-[#96422B] shadow-sm'
                      : 'bg-[#5C633E] border-[#444A29] text-white hover:bg-[#4E5432] shadow-sm'
                  }`}
                  title={`Lote: ${item.codigo} • ${ocupado ? 'Ocupado' : 'Libre'} (${item.titularNombre})`}
                >
                  <span className="font-mono font-black text-xs sm:text-sm leading-none mb-1 text-white">
                    {numeroDisplay}
                  </span>
                  
                  {ocupado ? (
                    <Archive className="w-3.5 h-3.5 text-white/95" />
                  ) : (
                    <Sprout className="w-3.5 h-3.5 text-white/95" />
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>
    );
  };

  const estaOcupado = fosaSeleccionada && (
    (fosaSeleccionada.historialDifuntos?.length > 0) || 
    (fosaSeleccionada.titularNombre && fosaSeleccionada.titularNombre !== 'Disponible / Sin Titular' && fosaSeleccionada.titularNombre !== 'DISPONIBLE')
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Contenedor Principal: Plano Geográfico Expandido (9 cols) + Detalle Compacto (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ========================================================= */}
        {/* 1. PLANO CARTOGRÁFICO GENERAL EXPANDIDO (9 cols)           */}
        {/* ========================================================= */}
        <div className="lg:col-span-9 bg-white p-5 sm:p-6 lg:p-7 rounded-3xl border border-cream-300 shadow-sm space-y-5">
          
          {/* Cabecera del Plano */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-cream-300">
            <div>
              <h2 className="text-base sm:text-xl font-black text-stone-900 flex items-center gap-2.5 tracking-tight">
                <span className="p-2 bg-teal-100 text-teal-800 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </span>
                Plano Geográfico: Panteón "La Soledad"
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Distribución espacial basada en la perspectiva del óleo general con buscador individual por sección.
              </p>
            </div>

            {/* Leyenda Libre vs Ocupado con colores intensos */}
            <div className="flex items-center gap-3.5 text-xs font-black bg-cream-100/80 px-4 py-2 rounded-xl border border-cream-300 shadow-2xs">
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-4 h-4 rounded-md bg-[#5C633E] border border-[#444A29] inline-block shadow-2xs" />
                <span>Libre</span>
              </div>
              <div className="flex items-center gap-2 text-stone-900">
                <span className="w-4 h-4 rounded-md bg-[#AE5238] border border-[#8D3B23] inline-block shadow-2xs" />
                <span>Ocupado</span>
              </div>
            </div>
          </div>

          {/* CUADRÍCULA CARTOGRÁFICA CON PASILLO CENTRAL CONTINUO */}
          <div className="space-y-4">
            
            {/* ------------------------------------------------------------- */}
            {/* FILA 1 (FONDO): NICHOS / SECC. 4 | PASILLO | SECCIÓN 3       */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              
              {/* Lado Izquierdo Fondo: Selector Nichos / Sección 4 */}
              <div className="flex-1 min-w-0">
                {cuadranteTopIzquierdo === 'nichos' ? (
                  renderCuadranteSeccion(
                    'Zona de Nichos',
                    'nichos',
                    datosPorSeccion.nichos,
                    'text-mustard-900',
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCuadranteTopIzquierdo('nichos')}
                        className="px-2.5 py-1 bg-mustard-500 text-white font-extrabold text-xs rounded-lg shadow-2xs cursor-pointer"
                      >
                        Nichos
                      </button>
                      <button
                        type="button"
                        onClick={() => setCuadranteTopIzquierdo('sec4')}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900 font-bold text-xs rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                      >
                        Sección 4
                      </button>
                    </div>
                  )
                ) : (
                  renderCuadranteSeccion(
                    'Sección 4 (Fondo)',
                    'sec4',
                    datosPorSeccion.sec4,
                    'text-teal-900',
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCuadranteTopIzquierdo('nichos')}
                        className="px-2.5 py-1 text-stone-600 hover:text-stone-900 font-bold text-xs rounded-lg hover:bg-cream-200 transition-colors cursor-pointer"
                      >
                        Nichos
                      </button>
                      <button
                        type="button"
                        onClick={() => setCuadranteTopIzquierdo('sec4')}
                        className="px-2.5 py-1 bg-teal-500 text-white font-extrabold text-xs rounded-lg shadow-2xs cursor-pointer"
                      >
                        Sección 4 (Fondo)
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Tramo 1 del Pasillo Central Delgado */}
              <div className="w-full md:w-9 lg:w-10 bg-cream-200/90 rounded-xl border border-cream-300 flex md:flex-col items-center justify-center p-1 shadow-2xs shrink-0 select-none py-3">
                <span className="text-[10px] font-black tracking-widest text-stone-700 uppercase flex md:flex-col items-center gap-1">
                  <span>P</span><span>A</span><span>S</span><span>I</span><span>L</span><span>L</span><span>O</span>
                </span>
              </div>

              {/* Lado Derecho Fondo: Sección 3 */}
              <div className="flex-1 min-w-0">
                {renderCuadranteSeccion('Sección 3 (Fondo)', 'sec3', datosPorSeccion.sec3, 'text-teal-900')}
              </div>

            </div>

            {/* ------------------------------------------------------------- */}
            {/* FILA 2 (MEDIO): SECCIÓN 1 | PASILLO CENTRAL | SECCIÓN 2       */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              
              {/* Lado Izquierdo Medio: Sección 1 */}
              <div className="flex-1 min-w-0">
                {renderCuadranteSeccion('Sección 1 (Centro)', 'sec1', datosPorSeccion.sec1, 'text-teal-900')}
              </div>

              {/* Tramo 2 del Pasillo Central Delgado */}
              <div className="w-full md:w-9 lg:w-10 bg-cream-200/90 rounded-xl border border-cream-300 flex md:flex-col items-center justify-center p-1 shadow-2xs shrink-0 select-none py-3">
                <span className="text-[10px] font-black tracking-widest text-stone-700 uppercase flex md:flex-col items-center gap-1">
                  <span className="text-olive-700 my-0.5"><Sprout className="w-3.5 h-3.5" /></span>
                  <span>C</span><span>E</span><span>N</span><span>T</span><span>R</span><span>A</span><span>L</span>
                </span>
              </div>

              {/* Lado Derecho Medio: Sección 2 Centro */}
              <div className="flex-1 min-w-0">
                {renderCuadranteSeccion('Sección 2 (Centro)', 'sec2_centro', datosPorSeccion.sec2_centro, 'text-teal-900')}
              </div>

            </div>

            {/* ------------------------------------------------------------- */}
            {/* FILA 3 (FRENTE): SECCIÓN 5 | PASILLO CENTRAL | SECCIÓN 2       */}
            {/* ------------------------------------------------------------- */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch">
              
              {/* Lado Izquierdo Frente: Sección 5 */}
              <div className="flex-1 min-w-0">
                {renderCuadranteSeccion('Sección 5 (Frente)', 'sec5', datosPorSeccion.sec5, 'text-teal-900')}
              </div>

              {/* Tramo 3 del Pasillo Central Delgado */}
              <div className="w-full md:w-9 lg:w-10 bg-cream-200/90 rounded-xl border border-cream-300 flex md:flex-col items-center justify-center p-1 shadow-2xs shrink-0 select-none py-3">
                <span className="text-[10px] font-black tracking-widest text-stone-700 uppercase flex md:flex-col items-center gap-1">
                  <span>C</span><span>A</span><span>L</span><span>Z</span><span>A</span><span>D</span><span>A</span>
                </span>
              </div>

              {/* Lado Derecho Frente: Sección 2 Frente */}
              <div className="flex-1 min-w-0">
                {renderCuadranteSeccion('Sección 2 (Frente)', 'sec2_frente', datosPorSeccion.sec2_frente, 'text-teal-900')}
              </div>

            </div>

            {/* ------------------------------------------------------------- */}
            {/* BASE / FACHADA: ACCESO PRINCIPAL                              */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-teal-600 text-white rounded-2xl border-2 border-teal-700 p-3.5 text-center shadow-md select-none">
              <div className="font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 text-white">
                <Building2 className="w-4 h-4 text-mustard-300" />
                <span>ACCESO PRINCIPAL</span>
                <Building2 className="w-4 h-4 text-mustard-300" />
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* 2. PANEL LATERAL DERECHO ("DETALLE") COMPACTO (3 cols)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-5 rounded-3xl border border-cream-300 shadow-sm flex flex-col justify-between space-y-4 lg:sticky lg:top-4 max-h-[calc(100vh-80px)] overflow-y-auto">
          
          <div className="space-y-4">
            
            {/* Cabecera del Panel Detalle */}
            <div className="text-center pb-3 border-b-2 border-cream-300">
              <h3 className="text-xs sm:text-sm font-black text-teal-900 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                Detalle del Espacio
              </h3>
            </div>

            {fosaSeleccionada ? (
              <div className="space-y-3 text-xs animate-fadeIn">
                
                {/* Lote / Código */}
                <div className="flex justify-between items-center py-1 border-b border-cream-200">
                  <span className="font-bold text-stone-500">Lote / Fosa:</span>
                  <span className="font-mono font-black text-sm text-teal-900 bg-teal-100 px-2 py-0.5 rounded-lg border border-teal-200" title={`Lote interno: ${fosaSeleccionada.codigo}`}>
                    {formatearNumeroFosa(fosaSeleccionada.codigo)}
                  </span>
                </div>

                {/* Sección */}
                <div className="flex justify-between items-center py-1 border-b border-cream-200">
                  <span className="font-bold text-stone-500">Sección:</span>
                  <span className="font-bold text-stone-800 text-right truncate max-w-[130px]">
                    {fosaSeleccionada.seccionNombre}
                  </span>
                </div>

                {/* Tipo de Espacio */}
                <div className="flex justify-between items-center py-1 border-b border-cream-200">
                  <span className="font-bold text-stone-500">Tipo:</span>
                  <span className="font-semibold text-stone-800">
                    {fosaSeleccionada.tipoEspacio}
                  </span>
                </div>

                {/* Estatus */}
                <div className="flex justify-between items-center py-1 border-b border-cream-200">
                  <span className="font-bold text-stone-500">Estatus:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                    estaOcupado 
                      ? 'bg-rust-100 text-rust-900 border-rust-300' 
                      : 'bg-olive-100 text-olive-800 border-olive-300'
                  }`}>
                    {estaOcupado ? 'Ocupado' : 'Libre'}
                  </span>
                </div>

                {/* Titular */}
                <div className="space-y-0.5 py-1 border-b border-cream-200">
                  <span className="block font-bold text-stone-500 text-[11px]">Titular:</span>
                  <p className="font-black text-stone-900 text-xs truncate" title={fosaSeleccionada.titularNombre}>
                    {fosaSeleccionada.titularNombre || 'Sin titular asignado'}
                  </p>
                  {fosaSeleccionada.titularTelefono && (
                    <div className="flex items-center gap-1 text-stone-600 text-[10px]">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span>{fosaSeleccionada.titularTelefono}</span>
                    </div>
                  )}
                </div>

                {/* Difuntos Inhumados */}
                <div className="space-y-1 py-1 border-b border-cream-200">
                  <span className="block font-bold text-stone-500 text-[11px]">
                    Inhumaciones ({fosaSeleccionada.historialDifuntos?.length || 0}):
                  </span>
                  {fosaSeleccionada.historialDifuntos?.length > 0 ? (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {fosaSeleccionada.historialDifuntos.map((dif, idx) => (
                        <div key={idx} className="p-2 bg-cream-50 rounded-xl border border-cream-200 space-y-0.5">
                          <p className="font-bold text-stone-900 truncate">{dif.nombre}</p>
                          <p className="text-[10px] text-stone-500">
                            {dif.fechaInhumacion ? `Fecha: ${dif.fechaInhumacion}` : 'Sin fecha'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-stone-400 italic text-[11px]">Sin difuntos inhumados</p>
                  )}
                </div>

                {/* Notas / Observaciones (Ubicado directamente debajo de Inhumaciones) */}
                {fosaSeleccionada.observaciones && (
                  <div className="space-y-0.5 py-1 border-b border-cream-200">
                    <span className="block font-bold text-stone-500 text-[10px] uppercase">Notas / Observaciones:</span>
                    <p className="text-[11px] text-stone-700 bg-cream-50 p-2 rounded-xl border border-cream-200 leading-relaxed max-h-20 overflow-y-auto">
                      {fosaSeleccionada.observaciones}
                    </p>
                  </div>
                )}

                {/* Historial de Pagos y Refrendos del Lote */}
                {(() => {
                  const finanzas = obtenerHistorialPagosFosa(fosaSeleccionada);
                  const estaAlCorriente = finanzas.estatusActual === 'Al Corriente';

                  return (
                    <div className="space-y-1.5 py-1 border-b border-cream-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800 uppercase tracking-wide">
                          <History className="w-3.5 h-3.5 text-teal-600" />
                          <span>Historial de Pagos</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                          estaAlCorriente
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {estaAlCorriente ? 'Al Corriente' : 'Con Adeudo'}
                        </span>
                      </div>

                      <div className="bg-cream-50 rounded-xl p-2.5 border border-cream-200 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-stone-500 font-medium">Total Aportado:</span>
                          <span className="font-mono font-black text-stone-900">
                            ${finanzas.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-stone-500">Último Pago:</span>
                          <span className="font-bold text-teal-800 truncate max-w-[130px]" title={finanzas.ultimoPago?.concepto}>
                            {finanzas.ultimoPago ? `${finanzas.ultimoPago.fecha}` : 'Sin registros'}
                          </span>
                        </div>

                        {finanzas.aniosPendientes.length > 0 && (
                          <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded-lg border border-rose-200 font-medium leading-tight">
                            Adeuda {finanzas.aniosPendientes.length} año(s) (${finanzas.adeudoEstimado.toFixed(2)} MXN)
                          </div>
                        )}

                        {onAbrirHistorial && (
                          <button
                            type="button"
                            onClick={() => onAbrirHistorial(fosaSeleccionada)}
                            className="w-full mt-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <History className="w-3 h-3 text-teal-700" />
                            <span>Ver Historial Completo ({finanzas.listaPagos.length} pagos)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* VISOR DE EXPEDIENTE DIGITAL */}
                {(() => {
                  const docsObj = fosaSeleccionada.expediente?.documentos || (fosaSeleccionada.expediente && typeof fosaSeleccionada.expediente === 'object' && !fosaSeleccionada.expediente.codigo ? fosaSeleccionada.expediente : {});
                  
                  const docsLista = Object.entries(docsObj)
                    .filter(([, val]) => val && (val.dataUrl || val.data_url || val.url || val.adjuntado || val.nombre))
                    .map(([key, val]) => ({
                      id: key,
                      docId: val.docId || key,
                      titulo: val.titulo || key,
                      categoria: val.categoria || 'general',
                      nombre: val.nombre || val.nombre_archivo || 'archivo.jpg',
                      tipo: val.tipo || val.tipo_mime || 'image/jpeg',
                      tamano: val.tamano || val.tamano_formateado || 'N/D',
                      dataUrl: val.dataUrl || val.data_url || val.url || '',
                      fechaSubida: val.fechaSubida || val.fecha_subida || ''
                    }));

                  const totalDocs = docsLista.length;
                  const docActual = docsLista[docActivoIdx % (totalDocs || 1)] || docsLista[0];

                  const handleDescargarDoc = (doc) => {
                    if (!doc?.dataUrl) return;
                    const enlace = document.createElement('a');
                    enlace.href = doc.dataUrl;
                    enlace.download = doc.nombre || `documento_${doc.docId || 'expediente'}.png`;
                    document.body.appendChild(enlace);
                    enlace.click();
                    document.body.removeChild(enlace);
                  };

                  return (
                    <div className="space-y-2 pt-1">
                      
                      {/* Barra Superior del Visor */}
                      <div className="flex items-center justify-between pb-1 border-b border-cream-200">
                        <div className="flex items-center gap-1.5">
                          <FileImage className="w-4 h-4 text-teal-600" />
                          <span className="font-black text-xs text-stone-900 uppercase tracking-wide">
                            Visor de Expediente
                          </span>
                        </div>
                        
                        {totalDocs > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-400">
                            {(docActivoIdx % totalDocs) + 1} de {totalDocs} docs
                          </span>
                        )}
                      </div>

                      {/* Pantalla / Canvas del Visor */}
                      {totalDocs > 0 && docActual ? (
                        <div className="space-y-2 bg-[#121516] p-2.5 rounded-2xl border border-stone-800 shadow-md">
                          
                          {/* Controles Flotantes del Visor (Zoom, Rotar, Descargar, Maximizar) */}
                          <div className="flex items-center justify-between text-stone-300 px-1 pb-1">
                            <span className="text-[11px] font-bold text-teal-300 truncate max-w-[130px]" title={docActual.titulo}>
                              {docActual.titulo}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setZoomNivel(prev => Math.min(prev + 0.25, 3))}
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                                title="Acercar (Zoom +)"
                              >
                                <ZoomIn className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setZoomNivel(prev => Math.max(prev - 0.25, 0.5))}
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                                title="Alejar (Zoom -)"
                              >
                                <ZoomOut className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRotacion(prev => (prev + 90) % 360)}
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                                title="Girar 90°"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDescargarDoc(docActual)}
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                                title="Descargar imagen original"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              {onAbrirExpediente && (
                                <button
                                  type="button"
                                  onClick={() => onAbrirExpediente(fosaSeleccionada, 'visor')}
                                  className="p-1 rounded bg-teal-700 hover:bg-teal-600 text-white transition-colors cursor-pointer"
                                  title="Pantalla completa"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Canvas de Visualización con Zoom y Navegación */}
                          <div className="relative w-full h-48 bg-stone-950 rounded-xl overflow-hidden flex items-center justify-center border border-stone-800">
                            {docActual.dataUrl ? (
                              <img 
                                src={docActual.dataUrl} 
                                alt={docActual.titulo}
                                style={{
                                  transform: `scale(${zoomNivel}) rotate(${rotacion}deg)`,
                                  transition: 'transform 0.15s ease-out'
                                }}
                                className="max-w-full max-h-full object-contain select-none pointer-events-none"
                              />
                            ) : (
                              <div className="text-center p-4 text-stone-400">
                                <FileText className="w-10 h-10 mx-auto text-teal-400 mb-1" />
                                <p className="text-xs font-bold text-stone-200">{docActual.nombre}</p>
                                <p className="text-[10px] text-stone-400 font-mono mt-0.5">{docActual.tamano}</p>
                              </div>
                            )}

                            {/* Flechas de Navegación Anterior / Siguiente */}
                            {totalDocs > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDocActivoIdx(prev => (prev > 0 ? prev - 1 : totalDocs - 1));
                                    setZoomNivel(1);
                                    setRotacion(0);
                                  }}
                                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer border border-white/20 shadow-lg"
                                  title="Documento anterior"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDocActivoIdx(prev => (prev + 1) % totalDocs);
                                    setZoomNivel(1);
                                    setRotacion(0);
                                  }}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer border border-white/20 shadow-lg"
                                  title="Siguiente documento"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Tira de Miniaturas Inferior */}
                          {totalDocs > 1 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar justify-center">
                              {docsLista.map((d, i) => {
                                const activo = (docActivoIdx % totalDocs) === i;
                                return (
                                  <button
                                    key={d.id || i}
                                    type="button"
                                    onClick={() => {
                                      setDocActivoIdx(i);
                                      setZoomNivel(1);
                                      setRotacion(0);
                                    }}
                                    className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                                      activo 
                                        ? 'ring-2 ring-teal-400 border-white scale-110 shadow-sm' 
                                        : 'opacity-50 hover:opacity-100 border-stone-700 bg-stone-900'
                                    }`}
                                    title={d.titulo}
                                  >
                                    {d.dataUrl ? (
                                      <img src={d.dataUrl} alt={d.titulo} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-[9px] font-black text-stone-300 flex items-center justify-center h-full">{i + 1}</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                        </div>
                      ) : (
                        <div className="py-6 px-3 text-center bg-stone-950 rounded-2xl border border-stone-800 space-y-1.5">
                          <FileImage className="w-8 h-8 mx-auto text-stone-600" />
                          <p className="text-xs font-bold text-stone-300">Visor de Expediente Digital</p>
                          <p className="text-[10px] text-stone-500">Sin imágenes o documentos digitalizados en este lote.</p>
                        </div>
                      )}

                    </div>
                  );
                })()}

              </div>
            ) : (
              <div className="text-center py-8 text-stone-400 text-xs">
                Selecciona un lote del plano cartográfico para ver su información detallada.
              </div>
            )}

          </div>

          {/* Acciones Rápidas del Lote */}
          {fosaSeleccionada && (
            <div className="pt-3 border-t-2 border-cream-200 space-y-2">
              {/* Botón: Adjuntar / Gestionar Expediente (FolderPlus) */}
              {onAbrirExpediente && (
                <button
                  type="button"
                  onClick={() => onAbrirExpediente(fosaSeleccionada, 'expediente')}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-teal-700"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Adjuntar / Gestionar Expediente</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onEditarFosa && onEditarFosa(fosaSeleccionada)}
                className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-teal-600"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Información del Lote</span>
              </button>

              {/* Botón: Ver Historial de Pagos y Refrendos (Admin y Operador que puede registrar pagos) */}
              {(esAdmin || puedeRegistrarPagos) && onAbrirHistorial && (
                <button
                  type="button"
                  onClick={() => onAbrirHistorial(fosaSeleccionada)}
                  className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer border border-teal-200"
                >
                  <History className="w-3.5 h-3.5 text-teal-700" />
                  <span>Historial de Pagos y Refrendos</span>
                </button>
              )}

              {/* Botón: Registrar Cobro / Refrendo (Admin y Operador que puede registrar pagos) */}
              {(esAdmin || puedeRegistrarPagos) && (
                <button
                  type="button"
                  onClick={() => setModalRecibo({ abierto: true, espacio: fosaSeleccionada })}
                  className="w-full py-2 bg-olive-500 hover:bg-olive-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border border-olive-600"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Registrar Cobro / Refrendo</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCedulaAImprimir(fosaSeleccionada)}
                className="w-full py-2 bg-cream-200 hover:bg-cream-300 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer border border-cream-300"
              >
                <Printer className="w-3.5 h-3.5 text-stone-600" />
                <span>Imprimir Título de Propiedad</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Modal de Título de Propiedad */}
      {cedulaAImprimir && (
        <ModalCedulaTitulo
          espacio={cedulaAImprimir}
          onCerrar={() => setCedulaAImprimir(null)}
        />
      )}

      {/* Modal de Cobro y Recibo de Caja */}
      {modalRecibo.abierto && (
        <ModalReciboPago
          espacio={modalRecibo.espacio}
          registrosFosas={registrosFosas}
          onCerrar={() => setModalRecibo({ abierto: false, espacio: null })}
          onRegistrarMovimiento={onRegistrarMovimiento}
          onActualizarFosa={onActualizarFosa}
        />
      )}

    </div>
  );
}
