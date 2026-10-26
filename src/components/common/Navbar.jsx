// src/components/common/Navbar.jsx
import { Landmark } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-slate-900 text-white px-6 py-3.5 flex justify-between items-center shadow-md border-b border-slate-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
          <Landmark className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-wide text-white leading-tight">
            Panteón La Soledad
          </h1>
          <p className="text-xs text-slate-400">Sistema Catastral y Administrativo</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold bg-blue-700/80 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md border border-blue-500/40 shadow-sm transition-colors">
          Módulo de Control
        </span>
      </div>
    </nav>
  );
}
