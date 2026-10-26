// src/components/common/Sidebar.jsx
import { 
  Home, 
  Folder, 
  Search, 
  CircleDollarSign, 
  BarChart3, 
  Settings, 
  Map, 
  ChevronRight, 
  X,
  Sprout
} from 'lucide-react';
import logoPanteon from '../../assets/logo-panteon.jpg';

export default function Sidebar({
  pestanaActiva = 'dashboard',
  onCambiarPestana,
  menuColapsado = false,
  onToggleColapsar,
  mobileAbierto = false,
  onCerrarMobile
}) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: Home,
      hasChevron: false
    },
    {
      id: 'espacios',
      label: 'Registros',
      icon: Folder,
      hasChevron: true
    },
    {
      id: 'busqueda',
      label: 'Búsqueda',
      icon: Search,
      hasChevron: true
    },
    {
      id: 'mapa',
      label: 'Plano General',
      icon: Map,
      hasChevron: true
    },
    {
      id: 'finanzas',
      label: 'Pagos',
      icon: CircleDollarSign,
      hasChevron: true
    },
    {
      id: 'reportes',
      label: 'Reportes',
      icon: BarChart3,
      hasChevron: true
    },
    {
      id: 'importador',
      label: 'Configuración',
      icon: Settings,
      hasChevron: true
    }
  ];

  const handleItemClick = (id) => {
    if (id === 'busqueda') {
      onCambiarPestana('espacios');
    } else {
      onCambiarPestana(id);
    }
  };

  const isItemActive = (id) => {
    if (id === 'dashboard' && pestanaActiva === 'dashboard') return true;
    if (id === 'espacios' && pestanaActiva === 'espacios') return true;
    if (id === 'mapa' && pestanaActiva === 'mapa') return true;
    if (id === 'finanzas' && pestanaActiva === 'finanzas') return true;
    if (id === 'reportes' && pestanaActiva === 'reportes') return true;
    if (id === 'importador' && pestanaActiva === 'importador') return true;
    return false;
  };

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 md:static transition-all duration-300 md:translate-x-0 ${
        mobileAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } ${
        menuColapsado ? 'md:w-20' : 'md:w-64'
      } w-72 h-full bg-[#152822] text-white shadow-2xl md:shadow-xl select-none flex flex-col justify-between border-r border-[#1e3830] shrink-0`}
    >
      
      {/* 1. Cabecera con Logotipo Oficial e Identidad Institucional */}
      <div>
        <div className={`p-4 sm:p-5 border-b border-[#1f3a31] flex items-center justify-between ${menuColapsado ? 'md:justify-center' : 'justify-between'}`}>
          
          <button 
            type="button"
            onClick={onToggleColapsar}
            className={`flex items-center gap-3 cursor-pointer text-left group transition-all ${menuColapsado ? 'md:justify-center' : ''}`}
            title={menuColapsado ? 'Haz clic para expandir el menú' : 'Haz clic para colapsar el menú'}
          >
            {/* Emblema Circular con Borde Dorado / Arena */}
            <div className="w-11 h-11 rounded-full overflow-hidden shadow-md border-2 border-[#D2B79A] shrink-0 bg-[#0f1d19] flex items-center justify-center group-hover:scale-105 group-hover:border-white transition-all ring-2 ring-black/20">
              <img src={logoPanteon} alt="Panteón La Soledad" className="w-full h-full object-cover" />
            </div>

            {(!menuColapsado || mobileAbierto) && (
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#F5F3EF] tracking-tight truncate leading-tight group-hover:text-[#D2B79A] transition-colors">
                  Panteón La Soledad
                </h2>
                <p className="text-[11px] text-[#8EA299] tracking-wider truncate font-medium mt-0.5">
                  Sistema de Administración
                </p>
              </div>
            )}
          </button>

          {/* Botón cerrar en móvil */}
          {onCerrarMobile && (
            <button
              type="button"
              onClick={onCerrarMobile}
              className="p-1.5 rounded-xl text-[#8EA299] hover:text-white hover:bg-white/10 md:hidden cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}

        </div>

        {/* 2. Lista de Navegación */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const activo = isItemActive(item.id);

            if (menuColapsado && !mobileAbierto) {
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activo 
                      ? 'bg-[#D2B79A] text-[#152822] font-black shadow-md' 
                      : 'text-[#8EA299] hover:bg-[#1C332B] hover:text-[#F5F3EF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activo
                    ? 'bg-[#D2B79A] text-[#152822] font-bold shadow-md'
                    : 'text-[#A0B3AB] hover:bg-[#1C332B] hover:text-[#F5F3EF]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${activo ? 'text-[#152822]' : 'text-[#8EA299]'}`} />
                  <span className="truncate text-[13px]">{item.label}</span>
                </div>
                {item.hasChevron && !activo && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#6E857C] shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Pie del Sidebar: Ilustración Botánica y Frase "Dignidad en cada recuerdo" */}
      <div className="p-4 border-t border-[#1f3a31] bg-[#12231E]/60 text-center">
        {(!menuColapsado || mobileAbierto) ? (
          <div className="flex flex-col items-center justify-center space-y-1 py-1">
            <div className="flex items-center justify-center text-[#D2B79A]/80 mb-0.5">
              <svg width="38" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
                <path d="M2 10C8 10 14 7 20 2C20 8 16 14 10 16" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M38 10C32 10 26 7 20 2C20 8 24 14 30 16" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="10" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <p className="font-cursive text-xl text-[#D2B79A] tracking-wide leading-tight">
              Dignidad en cada recuerdo
            </p>
          </div>
        ) : (
          <div className="flex justify-center text-[#D2B79A]/70 py-1" title="Dignidad en cada recuerdo">
            <Sprout className="w-5 h-5" />
          </div>
        )}
      </div>

    </aside>
  );
}
