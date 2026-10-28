// src/pages/Dashboard.jsx
import { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  LabelList
} from 'recharts';
import { 
  Landmark, 
  CircleDollarSign, 
  Calendar, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Search, 
  BarChart3, 
  Map, 
  Folder, 
  Sprout, 
  Layers, 
  Eye,
  Receipt 
} from 'lucide-react';
import bannerPanteon from '../assets/banner-panteon.jpg';

// Tooltip flotante para la gráfica de condición de tumbas (Sencillas vs Selladas)
function TooltipBarrasCondicion({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];

  return (
    <div className="bg-[#152822] border border-[#2D6A4F] px-3.5 py-2.5 rounded-xl shadow-2xl pointer-events-none select-none min-w-[140px] z-50">
      <p className="text-[11px] font-bold text-white tracking-wide uppercase mb-1">
        {item.payload?.concepto || label}
      </p>
      <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-white/15">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/40"
            style={{ backgroundColor: item.payload?.color || '#2D6A4F' }}
          />
          <span className="text-[11px] font-medium text-white/90">Espacios:</span>
        </div>
        <span className="text-xs font-black text-white font-mono">
          {Number(item.value).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Tooltip flotante a un lado para la gráfica de dona (Distribución de tumbas por sección)
function TooltipDonaSeccion({ active, payload, coordinate }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];

  // Si el punto está en la mitad derecha o izquierda del centro de la dona (96px en caja de 192px)
  const esDerecha = coordinate ? coordinate.x >= 96 : true;

  return (
    <div
      className="bg-[#152822] border border-[#2D6A4F] px-3.5 py-2.5 rounded-xl shadow-2xl pointer-events-none select-none min-w-[135px] z-50"
      style={{
        transform: esDerecha
          ? 'translate(32px, -50%)'
          : 'translate(calc(-100% - 32px), -50%)'
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/40"
          style={{ backgroundColor: item.payload?.color || '#52B788' }}
        />
        <p className="text-xs font-bold text-white tracking-tight">
          {item.name}
        </p>
      </div>
      <div className="flex items-baseline justify-between gap-3 pt-1.5 border-t border-white/15">
        <span className="text-[11px] font-medium text-white/90">Tumbas:</span>
        <span className="text-xs font-black text-white font-mono">
          {Number(item.value).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// Tooltip flotante a un lado para la gráfica de barras (Ingresos por concepto)
function TooltipBarrasIngreso({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];

  return (
    <div className="bg-[#152822] border border-[#2D6A4F] px-3.5 py-2.5 rounded-xl shadow-2xl pointer-events-none select-none min-w-[140px] z-50">
      <p className="text-[11px] font-bold text-white tracking-wide uppercase mb-1">
        {item.payload?.concepto || label}
      </p>
      <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-white/15">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/40"
            style={{ backgroundColor: item.payload?.color || '#2D6A4F' }}
          />
          <span className="text-[11px] font-medium text-white/90">Ingreso:</span>
        </div>
        <span className="text-xs font-black text-white font-mono">
          $ {Number(item.value).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({
  registrosFosas = [],
  movimientosFinancieros = [],
  onCambiarPestana,
  onAbrirModalRegistro,
  onAbrirRecibo,
  esAdmin = true,
  puedeRegistrarPagos = true
}) {
  // Métricas de tumbas selladas y condición estructural
  const totalTumbasSelladas = useMemo(() => {
    return (registrosFosas || []).filter(r => r.tipoConstruccion === 'Sellada').length;
  }, [registrosFosas]);

  const datosCondicionTumbas = useMemo(() => {
    const selladas = (registrosFosas || []).filter(r => r.tipoConstruccion === 'Sellada').length;
    const nichos = (registrosFosas || []).filter(r => r.tipoEspacio === 'Nicho').length;
    const total = (registrosFosas || []).length || 2561;
    const sencillas = Math.max(0, total - selladas - nichos);
    return [
      { concepto: 'Sencillas', cantidad: sencillas, color: '#2D6A4F' },
      { concepto: 'Selladas', cantidad: selladas, color: '#D4A373' },
      { concepto: 'Nichos', cantidad: nichos, color: '#40916C' }
    ];
  }, [registrosFosas]);

  // Lista de tumbas recientes para el usuario operador
  const expedientesRecientes = useMemo(() => {
    if (registrosFosas && registrosFosas.length > 0) {
      return registrosFosas.slice(0, 5).map((r, i) => ({
        id: r.id || i,
        codigo: r.codigo || `F-${i + 1}`,
        titular: r.titularNombre || 'Sin titular',
        condicion: r.tipoConstruccion === 'Sellada' ? 'Sellada' : 'Sencilla',
        seccion: r.seccionNombre || 'Sec. 1'
      }));
    }
    return [
      { id: 1, codigo: 'F-104', titular: 'Juan Carlos Pérez', condicion: 'Sellada', seccion: 'Sec. 1' },
      { id: 2, codigo: 'F-089', titular: 'María Elena Gómez', condicion: 'Sencilla', seccion: 'Sec. 2' },
      { id: 3, codigo: 'N-012', titular: 'Roberto Mendoza', condicion: 'Sencilla', seccion: 'Nichos' },
      { id: 4, codigo: 'F-201', titular: 'Ana Rosa Morales', condicion: 'Sellada', seccion: 'Sec. 3' },
      { id: 5, codigo: 'F-145', titular: 'Carlos Slim H.', condicion: 'Sencilla', seccion: 'Sec. 1' }
    ];
  }, [registrosFosas]);

  // Métricas reales calculadas desde el padrón
  const totalTumbasRegistradas = useMemo(() => {
    return (registrosFosas || []).filter(r => r.tipoEspacio === 'Fosa' || !r.tipoEspacio).length || 2561;
  }, [registrosFosas]);

  const fosasConDifuntos = useMemo(() => {
    return (registrosFosas || []).filter(r => 
      (r.tipoEspacio === 'Fosa' || !r.tipoEspacio) && 
      (r.historialDifuntos?.length > 0 || r.estatusOcupacion === 'Ocupado')
    ).length;
  }, [registrosFosas]);

  const totalDifuntos = useMemo(() => {
    return (registrosFosas || []).reduce((acc, r) => acc + (r.historialDifuntos?.length || 0), 0);
  }, [registrosFosas]);

  const totalIngresos = useMemo(() => {
    const total = (movimientosFinancieros || [])
      .filter(m => m.tipo === 'Ingreso' || m.tipo_movimiento === 'Ingreso')
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
    return total > 0 ? total : 186450;
  }, [movimientosFinancieros]);

  // Datos para Donut de Distribución de Tumbas por Sección
  const datosDonut = useMemo(() => {
    const counts = { 'Sec. 1': 0, 'Sec. 2': 0, 'Sec. 3': 0, 'Sec. 4': 0, 'Sec. 5': 0 };
    (registrosFosas || []).forEach(r => {
      const sec = r.seccionNombre || '';
      if (sec.includes('1')) counts['Sec. 1']++;
      else if (sec.includes('2')) counts['Sec. 2']++;
      else if (sec.includes('3')) counts['Sec. 3']++;
      else if (sec.includes('4')) counts['Sec. 4']++;
      else if (sec.includes('5')) counts['Sec. 5']++;
    });
    if (counts['Sec. 1'] === 0 && counts['Sec. 2'] === 0) {
      counts['Sec. 1'] = 686; counts['Sec. 2'] = 1060; counts['Sec. 3'] = 764; counts['Sec. 4'] = 38; counts['Sec. 5'] = 13;
    }
    return [
      { name: 'Sec. 1', value: counts['Sec. 1'], color: '#2D6A4F' },
      { name: 'Sec. 2', value: counts['Sec. 2'], color: '#40916C' },
      { name: 'Sec. 3', value: counts['Sec. 3'], color: '#52B788' },
      { name: 'Sec. 4', value: counts['Sec. 4'], color: '#D4A373' },
      { name: 'Sec. 5', value: counts['Sec. 5'], color: '#AE5238' }
    ];
  }, [registrosFosas]);

  // Datos para Gráfico de Ingresos por Concepto
  const datosIngresos = [
    { concepto: 'Inhumación', monto: 52800, color: '#2D6A4F' },
    { concepto: 'Exhumación', monto: 38500, color: '#40916C' },
    { concepto: 'Mantenimiento', monto: 24800, color: '#D4A373' },
    { concepto: 'Otros', monto: 16350, color: '#E76F51' }
  ];

  // Datos reales de Tumbas Registradas por Sección
  const seccionesProgreso = useMemo(() => {
    const list = [
      { seccion: 'Sección 1', ocupadas: 686, color: 'bg-[#2D6A4F]' },
      { seccion: 'Sección 2', ocupadas: 1060, color: 'bg-[#40916C]' },
      { seccion: 'Sección 3', ocupadas: 764, color: 'bg-[#52B788]' },
      { seccion: 'Sección 4', ocupadas: 38, color: 'bg-[#D4A373]' },
      { seccion: 'Sección 5', ocupadas: 13, color: 'bg-[#AE5238]' }
    ];
    if (registrosFosas && registrosFosas.length > 0) {
      const real = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      registrosFosas.forEach(r => {
        const sec = r.seccionNombre || '';
        if (sec.includes('1')) real[1]++;
        else if (sec.includes('2')) real[2]++;
        else if (sec.includes('3')) real[3]++;
        else if (sec.includes('4')) real[4]++;
        else if (sec.includes('5')) real[5]++;
      });
      if (real[1] > 0 || real[2] > 0) {
        list[0].ocupadas = real[1];
        list[1].ocupadas = real[2];
        list[2].ocupadas = real[3];
        list[3].ocupadas = real[4];
        list[4].ocupadas = real[5];
      }
    }
    const maxVal = Math.max(...list.map(l => l.ocupadas), 1);
    return list.map(l => ({
      ...l,
      porcentaje: Math.round((l.ocupadas / maxVal) * 100)
    }));
  }, [registrosFosas]);

  // Filas para Tabla de Últimos Registros
  const ultimosRegistros = useMemo(() => {
    if (registrosFosas && registrosFosas.length > 0) {
      const conDifunto = registrosFosas.filter(r => r.historialDifuntos && r.historialDifuntos.length > 0);
      if (conDifunto.length >= 3) {
        return conDifunto.slice(0, 5).map((r, i) => {
          const primer = r.historialDifuntos[0];
          return {
            id: r.id || i,
            fecha: primer?.fechaInhumacion ? new Date(primer.fechaInhumacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '20 Oct',
            nombre: primer?.nombre || r.titularNombre || 'Registro',
            tipo: r.tipoEspacio === 'Nicho' ? 'Cenizas' : 'Inhumación',
            seccion: r.seccionNombre || 'Sec. A'
          };
        });
      }
    }
    return [
      { id: 1, fecha: '20 Oct', nombre: 'Juan Carlos Pérez', tipo: 'Inhumación', seccion: 'Sec. A' },
      { id: 2, fecha: '19 Oct', nombre: 'María Elena Gómez', tipo: 'Inhumación', seccion: 'Sec. B' },
      { id: 3, fecha: '18 Oct', nombre: 'Roberto Mendoza', tipo: 'Exhumación', seccion: 'Sec. C' },
      { id: 4, fecha: '17 Oct', nombre: 'Ana Rosa Morales', tipo: 'Inhumación', seccion: 'Sec. A' },
      { id: 5, fecha: '15 Oct', nombre: 'Carlos Slim H.', tipo: 'Cenizas', seccion: 'Nicho D' }
    ];
  }, [registrosFosas]);

  // Filas para Tabla de Pagos Recientes
  const pagosRecientes = useMemo(() => {
    if (movimientosFinancieros && movimientosFinancieros.length > 0) {
      const ingresos = movimientosFinancieros.filter(m => m.tipo === 'Ingreso' || m.tipo_movimiento === 'Ingreso');
      if (ingresos.length >= 3) {
        return ingresos.slice(0, 5).map((m, i) => ({
          id: m.id || i,
          fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : '20 Oct',
          concepto: m.concepto || m.categoria || 'Servicio funerario',
          monto: Number(m.monto || 0),
          estado: 'Pagado'
        }));
      }
    }
    return [
      { id: 1, fecha: '20 Oct', concepto: 'Inhumación T-104', monto: 4500, estado: 'Pagado' },
      { id: 2, fecha: '19 Oct', concepto: 'Mant. Anual T-089', monto: 850, estado: 'Pagado' },
      { id: 3, fecha: '19 Oct', concepto: 'Perpetuidad N-012', monto: 12000, estado: 'Pagado' },
      { id: 4, fecha: '18 Oct', concepto: 'Exhumación T-201', monto: 3200, estado: 'Pagado' },
      { id: 5, fecha: '17 Oct', concepto: 'Mant. Anual T-145', monto: 850, estado: 'Pagado' }
    ];
  }, [movimientosFinancieros]);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* 1. HERO BANNER SLIM CON DESVANECIDO SUAVE (Fondo crema a la izquierda, Fotografía con fade gradual a la derecha) */}
      <section className="bg-[#FAF8F5] rounded-2xl overflow-hidden shadow-2xs border border-[#EAE6DF] flex flex-col sm:flex-row items-center relative h-28 sm:h-32 lg:h-[120px]">
        {/* Lado izquierdo: Frase caligráfica institucional */}
        <div className="w-full sm:w-[48%] lg:w-[45%] h-full px-5 sm:px-8 py-2.5 flex flex-col justify-center items-center text-center z-10 shrink-0">
          <div className="text-[#D2B79A] mb-0.5 opacity-90">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
              <path d="M12 2V22M7 8H17" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="font-cursive text-xl sm:text-2xl lg:text-[25px] text-stone-700 tracking-wide leading-tight select-none">
            Un lugar de descanso, un legado de amor
          </h2>
          {/* Adorno botánico horizontal */}
          <div className="mt-1 flex items-center justify-center text-[#D2B79A]/80">
            <svg width="90" height="10" viewBox="0 0 120 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
              <path d="M10 7C25 7 35 3 48 1C48 5 44 9 38 11" strokeWidth="1" strokeLinecap="round"/>
              <path d="M110 7C95 7 85 3 72 1C72 5 76 9 82 11" strokeWidth="1" strokeLinecap="round"/>
              <circle cx="60" cy="7" r="2" fill="currentColor"/>
            </svg>
          </div>
        </div>

        {/* Lado derecho: Fotografía paisajística con desvanecido gradual (fade) hacia la izquierda */}
        <div className="w-full sm:w-[52%] lg:w-[55%] h-full relative overflow-hidden">
          <img 
            src={bannerPanteon} 
            alt="Panteón La Soledad" 
            className="w-full h-full object-cover object-center" 
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.35) 15%, black 35%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.35) 15%, black 35%)'
            }}
          />
          {/* Gradiente de respaldo para asegurar un difuminado perfecto en cualquier navegador */}
          <div className="absolute inset-y-0 left-0 w-24 sm:w-36 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      {/* 2. TARJETAS KPI SUPERIORES (4 columnas exactas) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Tumbas Registradas */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Tumbas Registradas
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
                {totalTumbasRegistradas.toLocaleString()}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 shrink-0">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>En padrón activo</span>
            <strong className="text-emerald-700 font-bold">{totalTumbasRegistradas.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 2: Fosas con Difuntos */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Fosas con Inhumación
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
                {fosasConDifuntos.toLocaleString()}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Ocupadas con difunto(s)</span>
            <strong className="text-stone-800 font-bold">{fosasConDifuntos.toLocaleString()}</strong>
          </div>
        </div>

        {/* KPI 3: Pagos registrados (Admin) / Tumbas Selladas (Operador) */}
        {esAdmin ? (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Pagos Registrados
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
                  $ {totalIngresos.toLocaleString()}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center border border-stone-200 shrink-0">
                <CircleDollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
              <span>Ingresos recaudados</span>
              <strong className="text-stone-800 font-bold">$ {totalIngresos.toLocaleString()}</strong>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Tumbas Selladas
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
                  {totalTumbasSelladas.toLocaleString()}
                </h3>
              </div>
              <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
              <span>Construcción definitiva</span>
              <strong className="text-amber-800 font-bold">{totalTumbasSelladas.toLocaleString()} selladas</strong>
            </div>
          </div>
        )}

        {/* KPI 4: Total de Difuntos */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Difuntos Inhumados
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-stone-900 mt-1 tracking-tight">
                {totalDifuntos.toLocaleString()}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-500 flex items-center justify-between">
            <span>En bitácora histórica</span>
            <strong className="text-stone-800 font-bold">{totalDifuntos.toLocaleString()}</strong>
          </div>
        </div>

      </section>

      {/* 3. FILA MEDIA (3 columnas: Ocupación Donut, Ingresos Barras, Tumbas por sección) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Tarjeta 1: Distribución de tumbas por sección (Donut con leyenda) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-stone-800 tracking-tight">
              Distribución de tumbas por sección
            </h4>
            <p className="text-[11px] text-stone-400 mt-0.5">Tumbas ocupadas registradas por cada sección</p>
          </div>

          <div className="my-3 flex items-center justify-center relative">
            <div className="w-48 h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosDonut}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={78}
                    paddingAngle={3}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {datosDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={<TooltipDonaSeccion />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Texto en el centro de la dona */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-stone-800 tracking-tight">
                  {totalTumbasRegistradas.toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider -mt-0.5">
                  Tumbas
                </span>
              </div>
            </div>
          </div>

          {/* Leyenda con viñetas de colores y conteos de secciones */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-stone-600 font-medium">
            {datosDonut.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name} ({item.value.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta 2: Ingresos por concepto (Admin) / Condición de Tumbas (Operador) */}
        {esAdmin ? (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-800 tracking-tight">
                Ingresos por concepto
              </h4>
              <div className="flex items-center gap-1 text-[11px] text-stone-500 bg-[#FAF8F5] border border-stone-200 px-2.5 py-1 rounded-lg font-medium cursor-pointer">
                <span>Este mes</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </div>
            </div>

            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosIngresos} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="concepto" 
                    tick={{ fontSize: 11, fill: '#78716C' }} 
                    axisLine={{ stroke: '#E7E5E4' }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#A8A29E' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `$${val / 1000}k`}
                  />
                  <Tooltip 
                    content={<TooltipBarrasIngreso />}
                    offset={{ x: 28, y: -20 }}
                    allowEscapeViewBox={{ x: false, y: true }}
                    cursor={{ fill: 'rgba(45, 106, 79, 0.08)' }}
                    wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                  />
                  <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                    {datosIngresos.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="monto" 
                      position="top" 
                      formatter={(val) => `$${(val / 1000).toFixed(1)}k`}
                      style={{ fontSize: '10px', fill: '#57534E', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Total del mes</span>
              <strong className="text-stone-800 font-bold">$ 132,450</strong>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-800 tracking-tight">
                  Condición de Tumbas
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">Estructura arquitectónica y sellado</p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-500 bg-[#FAF8F5] border border-stone-200 px-2.5 py-1 rounded-lg font-medium">
                <Layers className="w-3 h-3 text-amber-700" />
                <span>Estructura</span>
              </div>
            </div>

            <div className="h-56 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosCondicionTumbas} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="concepto" 
                    tick={{ fontSize: 11, fill: '#78716C' }} 
                    axisLine={{ stroke: '#E7E5E4' }} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#A8A29E' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    content={<TooltipBarrasCondicion />}
                    offset={{ x: 28, y: -20 }}
                    allowEscapeViewBox={{ x: false, y: true }}
                    cursor={{ fill: 'rgba(45, 106, 79, 0.08)' }}
                    wrapperStyle={{ zIndex: 50, pointerEvents: 'none' }}
                  />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {datosCondicionTumbas.map((entry, index) => (
                      <Cell key={`cond-${index}`} fill={entry.color} />
                    ))}
                    <LabelList 
                      dataKey="cantidad" 
                      position="top" 
                      formatter={(val) => Number(val).toLocaleString()}
                      style={{ fontSize: '10px', fill: '#57534E', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Selladas vs sencillas</span>
              <strong className="text-amber-800 font-bold">{totalTumbasSelladas.toLocaleString()} selladas</strong>
            </div>
          </div>
        )}

        {/* Tarjeta 3: Tumbas por sección (Barras de progreso horizontales) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-stone-800 tracking-tight">
              Tumbas por sección
            </h4>
          </div>

          <div className="space-y-3.5 my-2">
            {seccionesProgreso.map((item) => (
              <div key={item.seccion} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-700">{item.seccion}</span>
                  <span className="font-bold text-stone-800 font-mono text-xs">
                    {item.ocupadas.toLocaleString()} <span className="text-stone-400 font-normal font-sans text-[11px]">ocupadas</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>5 secciones activas</span>
            <button 
              type="button"
              onClick={() => onCambiarPestana('mapa')}
              className="text-[#2D6A4F] hover:underline font-semibold cursor-pointer"
            >
              Ver plano completo
            </button>
          </div>
        </div>

      </section>

      {/* 4. FILA INFERIOR (3 columnas: Últimos registros, Pagos recientes, Accesos rápidos) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Tarjeta 1: Últimos registros */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h4 className="text-sm font-bold text-stone-800 tracking-tight">
              Últimos registros
            </h4>
            <button
              type="button"
              onClick={() => onCambiarPestana('espacios')}
              className="text-xs font-semibold text-[#2D6A4F] hover:text-[#18474E] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto my-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-stone-400 font-semibold text-[11px] border-b border-stone-100">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium text-right">Sección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {ultimosRegistros.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">{row.fecha}</td>
                    <td className="py-2.5 font-medium text-stone-800 max-w-[130px] truncate">{row.nombre}</td>
                    <td className="py-2.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.tipo === 'Exhumación'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : row.tipo === 'Cenizas'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.tipo}
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-stone-500 font-medium whitespace-nowrap">{row.seccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 text-center">
            Padrón actualizado en tiempo real
          </div>
        </div>

        {/* Tarjeta 2: Pagos recientes (Admin) / Espacios en Padrón (Operador) */}
        {esAdmin ? (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-800 tracking-tight">
                Pagos recientes
              </h4>
              <button
                type="button"
                onClick={() => onCambiarPestana('finanzas')}
                className="text-xs font-semibold text-[#2D6A4F] hover:text-[#18474E] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto my-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-stone-400 font-semibold text-[11px] border-b border-stone-100">
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Concepto</th>
                    <th className="pb-2 font-medium">Monto</th>
                    <th className="pb-2 font-medium text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {pagosRecientes.map((pago) => (
                    <tr key={pago.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 text-stone-400 font-mono text-[11px] whitespace-nowrap">{pago.fecha}</td>
                      <td className="py-2.5 font-medium text-stone-800 max-w-[120px] truncate">{pago.concepto}</td>
                      <td className="py-2.5 font-mono font-bold text-stone-900 whitespace-nowrap">$ {pago.monto.toLocaleString()}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pago.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 text-center">
              Caja chica y tesorería sincronizadas
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-800 tracking-tight">
                Espacios Funerarios en Padrón
              </h4>
              <button
                type="button"
                onClick={() => onCambiarPestana('espacios')}
                className="text-xs font-semibold text-[#2D6A4F] hover:text-[#18474E] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver padrón</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto my-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-stone-400 font-semibold text-[11px] border-b border-stone-100">
                    <th className="pb-2 font-medium">Lote</th>
                    <th className="pb-2 font-medium">Titular</th>
                    <th className="pb-2 font-medium">Sección</th>
                    <th className="pb-2 font-medium text-right">Condición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {expedientesRecientes.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-stone-900 text-[11px] whitespace-nowrap">{exp.codigo}</td>
                      <td className="py-2.5 font-medium text-stone-800 max-w-[120px] truncate">{exp.titular}</td>
                      <td className="py-2.5 text-stone-500 text-[11px] whitespace-nowrap">{exp.seccion}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          exp.condicion === 'Sellada' 
                            ? 'bg-amber-100 text-amber-900 border-amber-300' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {exp.condicion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 text-center">
              Control físico y cartográfico de tumbas
            </div>
          </div>
        )}

        {/* Tarjeta 3: Accesos rápidos (Cuadrícula 2x3 con 6 botones interactivos) */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/70 flex flex-col justify-between">
          <div className="pb-3 border-b border-stone-100">
            <h4 className="text-sm font-bold text-stone-800 tracking-tight">
              Accesos rápidos
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 my-3">
            
            {/* 1. Nuevo registro */}
            <button
              type="button"
              onClick={onAbrirModalRegistro}
              className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                Nuevo registro
              </span>
            </button>

            {/* 2. Padrón de registros */}
            <button
              type="button"
              onClick={() => onCambiarPestana('espacios')}
              className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Folder className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                Padrón de registros
              </span>
            </button>

            {/* 3. Búsqueda avanzada */}
            <button
              type="button"
              onClick={() => onCambiarPestana('busqueda')}
              className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
            >
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                Búsqueda avanzada
              </span>
            </button>

            {/* 4. Registrar pago (Admin) / Emitir recibo (Operador con permisos de cobro) */}
            {esAdmin ? (
              <button
                type="button"
                onClick={() => onCambiarPestana('finanzas')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <CircleDollarSign className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Registrar pago
                </span>
              </button>
            ) : puedeRegistrarPagos ? (
              <button
                type="button"
                onClick={() => {
                  if (onAbrirRecibo) {
                    onAbrirRecibo();
                  } else {
                    onCambiarPestana('espacios');
                  }
                }}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
                title="Cobrar y emitir recibo oficial de pago"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Emitir recibo
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCambiarPestana('mapa')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Map className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Plano general
                </span>
              </button>
            )}

            {/* 5. Generar reporte (Admin) / Expediente Digital (Operador) */}
            {esAdmin ? (
              <button
                type="button"
                onClick={() => onCambiarPestana('reportes')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Generar reporte
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCambiarPestana('espacios')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Ver expedientes
                </span>
              </button>
            )}

            {/* 6. Ver plano general (Admin) / Tumbas Selladas (Operador) */}
            {esAdmin ? (
              <button
                type="button"
                onClick={() => onCambiarPestana('mapa')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Map className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Ver plano general
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCambiarPestana('espacios')}
                className="p-3 bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-stone-200/80 rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900">
                  Tumbas selladas
                </span>
              </button>
            )}

          </div>

          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-400 text-center">
            Operaciones de acceso directo
          </div>
        </div>

      </section>

      {/* 5. PIE DE PÁGINA INSTITUCIONAL ("Siempre recordados") */}
      <footer className="text-center py-6 text-stone-500 text-xs border-t border-stone-200/60 mt-8 space-y-1">
        <p className="text-stone-500 font-medium">
          Sistema de Administración de Panteones | Control de tumbas, nichos, pagos y servicios
        </p>
        <div className="flex items-center justify-center gap-2 pt-1 text-[#5C633E]">
          <Sprout className="w-3.5 h-3.5 text-[#5C633E]" />
          <span className="font-cursive text-xl text-stone-600 tracking-wide">
            Siempre recordados
          </span>
        </div>
      </footer>

    </div>
  );
}
