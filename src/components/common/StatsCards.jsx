// src/components/common/StatsCards.jsx
import { Landmark, Archive, Sprout, Layers, Sparkles } from 'lucide-react';

export default function StatsCards({
  totalFosas = 1000,
  fosasOcupadas = 0,
  fosasDisponibles = 1000,
  totalNichos = 120,
  nichosOcupados = 0,
  nichosDisponibles = 120
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
      {/* Capacidad Fosas */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-[#2D6A4F] flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">CAPACIDAD FOSAS</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-stone-800">{totalFosas.toLocaleString()}</span>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Landmark className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Fosas Ocupadas */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-[#E03E3E] flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">FOSAS OCUPADAS</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-[#E03E3E]">{fosasOcupadas}</span>
          <div className="p-2 bg-rose-50 text-[#E03E3E] rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Fosas Disponibles */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-[#389868] flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">FOSAS DISPONIBLES</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-[#389868]">{fosasDisponibles}</span>
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Sprout className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Total Nichos */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-[#D2B79A] flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">TOTAL NICHOS</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-stone-800">{totalNichos}</span>
          <div className="p-2 bg-[#FAF7F2] text-[#88623A] rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Nichos Ocupados */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-purple-600 flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">NICHOS OCUPADOS</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-purple-700">{nichosOcupados}</span>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Archive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Nichos Disponibles */}
      <div className="bg-white p-4 rounded-xl border border-cream-200 shadow-2xs border-t-4 border-t-[#C49A6C] flex flex-col justify-between hover:shadow-md transition-shadow">
        <span className="text-[11px] font-bold text-stone-500 tracking-wider">NICHOS DISPONIBLES</span>
        <div className="flex items-center justify-between mt-2">
          <span className="text-2xl font-black text-[#C49A6C]">{nichosDisponibles}</span>
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
