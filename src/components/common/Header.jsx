import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Bell, 
  X, 
  Archive, 
  Sprout, 
  ArrowRight, 
  Menu, 
  Power, 
  User, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { coincideEspacioConBusqueda } from '../../utils/busquedaUtils';

export default function Header({
  busquedaGlobal = '',
  onBusquedaChange,
  registrosFosas = [],
  onSeleccionarFosa,
  onNavegarAPadron,
  totalConAdeudo = 0,
  usuarioActual = null,
  esAdmin = true,
  onCerrarSesion,
  onToggleMobileMenu
}) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Filtrado de resultados en tiempo real para el buscador superior (busca en cualquier difunto)
  const resultadosBusqueda = useMemo(() => {
    if (!busquedaGlobal || busquedaGlobal.trim().length === 0) return [];

    const matches = [];
    for (const r of (registrosFosas || [])) {
      const matchEval = coincideEspacioConBusqueda(r, busquedaGlobal);
      if (matchEval.coincide) {
        matches.push({
          ...r,
          _difuntoCoincidente: matchEval.difuntoCoincidente
        });
      }
    }
    return matches;
  }, [registrosFosas, busquedaGlobal]);

  // Manejar clic fuera para cerrar el dropdown
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Atajo de teclado global Ctrl+K / Cmd+K para enfocar el buscador
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownAbierto(true);
      }
      if (e.key === 'Escape') {
        setDropdownAbierto(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSeleccionarResultado = (item) => {
    setDropdownAbierto(false);
    if (onSeleccionarFosa) {
      onSeleccionarFosa(item);
    }
  };

  const handleIrAPadronCompleto = () => {
    setDropdownAbierto(false);
    if (onNavegarAPadron) {
      onNavegarAPadron(busquedaGlobal);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleIrAPadronCompleto();
    }
  };

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const fechaCapitalizada = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1);

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-[#EBE6DD] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      
      {/* 1. Saludo de Bienvenida y Botón Menú Mobile */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-1.5 -ml-1 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 md:hidden cursor-pointer transition-colors"
            title="Abrir menú de navegación"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#152822] text-[#D2B79A] flex items-center justify-center font-bold text-xs shadow-xs border border-[#234238]">
            {esAdmin ? <ShieldCheck className="w-4 h-4 text-[#D2B79A]" /> : <User className="w-4 h-4 text-[#D2B79A]" />}
          </div>
          <div>
            <div className="text-xs sm:text-sm font-semibold text-stone-700">
              Bienvenido(a), <span className="font-bold text-[#152822]">{usuarioActual?.nombre || 'Administrador'}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                esAdmin 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300'
              }`}>
                {esAdmin ? <ShieldCheck className="w-3 h-3 text-amber-700" /> : <UserCheck className="w-3 h-3 text-emerald-700" />}
                <span>{usuarioActual?.rolEtiqueta || (esAdmin ? 'Administrador General' : 'Operador Catastral')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Buscador Universal Rápido con Dropdown Interactivo */}
      <div ref={searchContainerRef} className="flex-1 max-w-md min-w-[260px] relative">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={busquedaGlobal}
            onFocus={() => setDropdownAbierto(true)}
            onChange={(e) => {
              if (onBusquedaChange) onBusquedaChange(e.target.value);
              setDropdownAbierto(true);
            }}
            onKeyDown={handleKeyDownInput}
            placeholder="Buscar por código de fosa, titular, difunto o sección..."
            className="w-full bg-cream-50/80 border border-cream-300 rounded-xl pl-9 pr-8 py-2 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-2xs"
          />

          {busquedaGlobal && (
            <button
              type="button"
              onClick={() => {
                if (onBusquedaChange) onBusquedaChange('');
                setDropdownAbierto(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Floating Dropdown de Resultados en Tiempo Real */}
        {dropdownAbierto && busquedaGlobal.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-cream-300 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 text-xs">
            
            <div className="px-3.5 py-2 bg-cream-100/70 border-b border-cream-200 flex items-center justify-between font-bold text-stone-600 text-[11px]">
              <span>Resultados encontrados: {resultadosBusqueda.length}</span>
              <span className="text-[10px] text-stone-400 font-normal">Presiona Enter para ver todos</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-cream-100">
              {resultadosBusqueda.length === 0 ? (
                <div className="p-4 text-center text-stone-400 italic">
                  No se encontraron fosas o difuntos con "{busquedaGlobal}".
                </div>
              ) : (
                resultadosBusqueda.slice(0, 8).map((item) => {
                  const ocupado = item.historialDifuntos?.length > 0 || item.estatusOcupacion === 'Ocupado';
                  const difuntoAMostrar = item._difuntoCoincidente || item.historialDifuntos?.[0];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSeleccionarResultado(item)}
                      className="w-full p-3 hover:bg-cream-50/80 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`p-1.5 rounded-lg ${ocupado ? 'bg-rust-100 text-rust-800' : 'bg-olive-100 text-olive-800'}`}>
                          {ocupado ? <Archive className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-teal-900 group-hover:text-teal-700">
                              {item.codigo}
                            </span>
                            <span className="text-[10px] text-stone-400 font-medium">
                              {item.seccionNombre}
                            </span>
                          </div>
                          <div className="font-bold text-stone-900 truncate">
                            {item.titularNombre || 'Sin titular'}
                          </div>
                          {difuntoAMostrar && (
                            <div className="text-[10px] text-stone-600 truncate flex items-center gap-1">
                              <span className="font-bold text-teal-800">Difunto:</span>
                              <span className="font-medium text-stone-800">{difuntoAMostrar.nombre}</span>
                              {item.historialDifuntos?.length > 1 && (
                                <span className="text-[9px] text-stone-400">
                                  (+{item.historialDifuntos.length - 1} en lote)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {esAdmin ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.estatusPago === 'Al Corriente'
                              ? 'bg-olive-100 text-olive-800 border-olive-300'
                              : 'bg-rust-100 text-rust-800 border-rust-300'
                          }`}>
                            {item.estatusPago || 'Al Corriente'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border bg-cream-100 text-stone-700 border-cream-300">
                            {item.tipoConstruccion === 'Sellada' ? 'Sellada' : item.tipoEspacio || 'Fosa'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer de navegación rápida al Padrón */}
            {resultadosBusqueda.length > 0 && (
              <button
                type="button"
                onClick={handleIrAPadronCompleto}
                className="w-full py-2.5 px-4 bg-cream-100 hover:bg-cream-200 text-teal-900 font-bold text-xs flex items-center justify-center gap-1.5 border-t border-cream-200 transition-colors cursor-pointer"
              >
                <span>Ver todos los {resultadosBusqueda.length} resultados en el Padrón</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

          </div>
        )}
      </div>

      {/* 3. Selector de Fecha y Botón de Salir (Power) */}
      <div className="flex items-center gap-3">
        
        {/* Fecha con Icono de Calendario */}
        <div className="flex items-center gap-2 bg-[#FAF8F5] border border-stone-200/90 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-700 shadow-2xs">
          <Calendar className="w-4 h-4 text-stone-500" />
          <span className="hidden sm:inline capitalize">{fechaCapitalizada}</span>
          <span className="sm:hidden">{new Date().toLocaleDateString('es-MX')}</span>
        </div>

        {/* Notificaciones de Adeudo (Solo Administrador) */}
        {esAdmin && totalConAdeudo > 0 && (
          <button
            type="button"
            onClick={() => {
              if (onNavegarAPadron) onNavegarAPadron('Con Adeudo');
            }}
            className="relative p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer border border-stone-200/80 bg-white"
            title={`${totalConAdeudo} cuentas con refrendo pendiente`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
        )}

        {/* Botón de Apagar / Cerrar Sesión */}
        {onCerrarSesion && (
          <button
            type="button"
            onClick={onCerrarSesion}
            className="p-2 rounded-xl text-stone-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer border border-stone-200/90 bg-white shadow-2xs"
            title="Cerrar sesión"
          >
            <Power className="w-4 h-4" />
          </button>
        )}

      </div>

    </header>
  );
}
