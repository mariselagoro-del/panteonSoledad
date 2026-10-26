// src/pages/MapaFosas.jsx
export default function MapaFosas({ registrosFosas = [], onSeleccionarLote }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Plano General de Fosas Individuales</h2>
        <p className="text-xs text-slate-500 mt-1">
          Visualización de lotes. Haz clic en cualquiera para consultar o editar sus datos.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {registrosFosas.length === 0 ? (
          <p className="text-xs text-slate-400 col-span-full py-8 text-center">No hay fosas registradas para mostrar en el plano.</p>
        ) : (
          registrosFosas.map((fosa, index) => {
            const ocupado = fosa.estatus === 'Ocupado';
            return (
              <div 
                key={fosa.id || index} 
                onClick={() => onSeleccionarLote && onSeleccionarLote(fosa)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] ${
                  ocupado 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-bold text-sm text-slate-800">{fosa.numero}</div>
                <p className={`text-xs mt-1 truncate font-medium ${ocupado ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {fosa.difunto || 'Disponible'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}