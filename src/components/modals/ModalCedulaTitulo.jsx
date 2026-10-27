// src/components/modals/ModalCedulaTitulo.jsx
import { Printer, X, Award } from 'lucide-react';
import logoPanteon from '../../assets/logo-panteon.jpg';

export default function ModalCedulaTitulo({ espacio, onCerrar }) {
  if (!espacio) return null;

  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
      
      {/* Contenedor del Modal */}
      <div className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-h-none print:rounded-none">
        
        {/* Barra de Acciones del Modal (Oculta al imprimir) */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-100 text-teal-800 rounded-xl">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-stone-900">
                Cédula Oficial de Título de Concesión
              </h2>
              <p className="text-xs text-stone-500">
                Formato oficial membretado para expedición y entrega al titular concesionario.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-teal-600"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Imprimir Cédula</span>
            </button>
            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-cream-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DOCUMENTO OFICIAL IMPRIMIBLE (CÉDULA / TÍTULO DE PROPIEDAD)   */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-[#FAF8F5] p-8 sm:p-10 rounded-2xl border-4 border-double border-cream-300 space-y-6 print:border-4 print:border-stone-800 print:bg-white text-stone-900 shadow-inner font-serif">
          
          {/* Membrete Superior Institucional */}
          <div className="text-center space-y-1.5 border-b-2 border-teal-600 pb-5">
            <div className="inline-flex items-center justify-center mb-1">
              <img 
                src={logoPanteon} 
                alt="Panteón La Soledad" 
                className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-md p-0.5 bg-white" 
              />
            </div>
            <div className="text-[11px] font-sans font-black uppercase tracking-widest text-teal-900">
              República Mexicana • Estado de México • Municipio de Cuautitlán Izcalli
            </div>
            <div className="text-xs font-sans font-bold text-stone-600">
              Dirección de Servicios Públicos y Panteones
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight pt-2">
              PANTEÓN LA SOLEDAD
            </h1>
            <div className="text-xs font-sans font-semibold text-stone-500">
              San Francisco Tepojaco, Cuautitlán Izcalli
            </div>
            <div className="pt-2">
              <span className="inline-block bg-teal-100 text-teal-900 border border-teal-300 text-xs font-sans font-extrabold uppercase px-4 py-1 rounded-full">
                TÍTULO DE CONCESIÓN DE USO A PERPETUIDAD
              </span>
            </div>
          </div>

          {/* Folio y Fecha */}
          <div className="flex justify-between items-center text-xs font-sans text-stone-600 pb-2">
            <div>
              <strong>FOLIO OFICIAL:</strong> <span className="font-mono text-teal-900 font-bold">TIT-{espacio.codigo}</span>
            </div>
            <div>
              <strong>FECHA DE EXPEDICIÓN:</strong> {fechaHoy}
            </div>
          </div>

          {/* Declaración Jurídica */}
          <div className="text-justify text-xs sm:text-sm leading-relaxed space-y-4">
            <p>
              Por medio del presente documento oficial, la Administración del <strong>Panteón La Soledad</strong>, con fundamento en los reglamentos de panteones y cementerios vigentes, otorga el presente <strong>TÍTULO DE CONCESIÓN Y DERECHO DE USO</strong> del espacio funerario que a continuación se describe:
            </p>
          </div>

          {/* Ficha Técnica del Espacio */}
          <div className="bg-white p-5 rounded-2xl border-2 border-cream-300 space-y-3 font-sans text-xs shadow-2xs">
            
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-cream-200 pb-3">
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Código / Lote:</span>
                <span className="font-mono font-black text-base text-teal-900">{espacio.codigo}</span>
              </div>
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Sección:</span>
                <span className="font-bold text-stone-800">{espacio.seccionNombre}</span>
              </div>
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Tipo de Espacio:</span>
                <span className="font-bold text-stone-800">{espacio.tipoEspacio}</span>
              </div>
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Construcción:</span>
                <span className="font-bold text-stone-800">
                  {espacio.tipoConstruccion === 'Sellada' 
                    ? `Sellada${espacio.fechaSellado ? ` (${espacio.fechaSellado})` : ''}` 
                    : 'Sencilla'}
                </span>
              </div>
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Estatus de Cobro:</span>
                <span className="font-bold text-olive-800">{espacio.estatusPago || 'Al Corriente'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">Titular Concesionario(a):</span>
                <span className="font-extrabold text-stone-900 text-sm">{espacio.titularNombre || 'Sin titular registrado'}</span>
                {espacio.titularTelefono && (
                  <div className="text-[11px] text-stone-500">Teléfono: {espacio.titularTelefono}</div>
                )}
              </div>
              <div>
                <span className="block text-stone-500 font-bold text-[10px] uppercase">
                  {espacio.historialDifuntos && espacio.historialDifuntos.length > 1
                    ? `Difuntos Inhumados (${espacio.historialDifuntos.length}):`
                    : 'Difunto(a) Inhumado(a):'}
                </span>
                {espacio.historialDifuntos && espacio.historialDifuntos.length > 0 ? (
                  <div className="space-y-1 mt-0.5">
                    {espacio.historialDifuntos.map((dif, idx) => (
                      <div key={idx} className="text-xs">
                        <span className="font-extrabold text-stone-900">{dif.nombre}</span>
                        {(dif.fechaInhumacion || dif.fechaDefuncion) && (
                          <span className="text-[10px] text-stone-500 ml-1.5 font-mono">
                            ({dif.fechaInhumacion || dif.fechaDefuncion})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-extrabold text-stone-900 text-sm">Espacio libre / Disponible</span>
                )}
              </div>
            </div>

          </div>

          {/* Cláusulas Administrativas */}
          <div className="text-[11px] text-stone-600 leading-normal space-y-2 border-t border-cream-300 pt-4">
            <p>
              <strong>1. Obligaciones del Titular:</strong> Mantener al corriente el pago anual por concepto de refrendo y mantenimiento de áreas comunes en los meses de enero a marzo de cada ejercicio fiscal.
            </p>
            <p>
              <strong>2. Derechos:</strong> El titular concesionario tiene la facultad exclusiva para autorizar futuras inhumaciones, exhumaciones o colocación de monumentos en el espacio concesionado.
            </p>
          </div>

          {/* Firmas y Sellos Oficiales */}
          <div className="grid grid-cols-2 gap-12 pt-12 text-center text-xs font-sans">
            <div className="border-t-2 border-stone-800 pt-2 space-y-1">
              <div className="font-black text-stone-900">ADMINISTRACIÓN GENERAL</div>
              <div className="text-[10px] text-stone-500">Panteón La Soledad</div>
            </div>
            <div className="border-t-2 border-stone-800 pt-2 space-y-1">
              <div className="font-black text-stone-900">CONCESIONARIO(A) TITULAR</div>
              <div className="text-[10px] text-stone-500">{espacio.titularNombre || 'Firma de Aceptación'}</div>
            </div>
          </div>

          <div className="text-center text-[10px] text-stone-400 font-sans pt-6 border-t border-cream-200">
            Documento expedido por el Sistema de Gestión Catastral del Panteón La Soledad • Válido para trámites oficiales y administrativos.
          </div>

        </div>

      </div>

    </div>
  );
}
