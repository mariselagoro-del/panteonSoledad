// src/pages/RegistroDifuntos.jsx
import { useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';

export default function RegistroDifuntos({ registrosFosas = [], onEditarRegistro, onAbrirModalRegistro }) {
  const [busqueda, setBusqueda] = useState('');

  const registrosFiltrados = registrosFosas.filter(fosa => {
    const texto = busqueda.toLowerCase();
    const difunto = (fosa.difunto || '').toLowerCase();
    const numero = (fosa.numero || '').toLowerCase();
    return difunto.includes(texto) || numero.includes(texto);
  });

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">Padrón y Control de Fosas</h2>
        <button 
          onClick={onAbrirModalRegistro}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Nueva Fosa
        </button>
      </div>

      <div>
        <input 
          type="text"
          placeholder="Buscar por difunto o número de fosa..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
          <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-3 px-3.5">Identificador</th>
              <th className="py-3 px-3.5">Difunto / Titular</th>
              <th className="py-3 px-3.5">Estatus</th>
              <th className="py-3 px-3.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 px-3 text-center text-slate-400">
                  <Search className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                  No se encontraron registros disponibles.
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((fosa, index) => {
                const ocupado = fosa.estatus === 'Ocupado';
                return (
                  <tr key={fosa.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5 font-bold text-blue-700">{fosa.numero}</td>
                    <td className="py-3 px-3.5 text-slate-800">{fosa.difunto || 'Sin asignar'}</td>
                    <td className="py-3 px-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        ocupado ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {fosa.estatus || 'Disponible'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button 
                        onClick={() => onEditarRegistro && onEditarRegistro(fosa)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}