// src/components/cedula/VistaDocumentoCedula.jsx
import logoPanteon from '../../assets/logo-panteon.jpg';

/**
 * Documento oficial imprimible de Cédula / Título de Concesión.
 * Recibe los datos editables del lote/concesión y la plantilla institucional.
 * Diseñado y calibrado para ajustarse exactamente a 1 hoja tamaño Carta en impresión.
 */
export default function VistaDocumentoCedula({ datosCedula, plantilla }) {
  const difuntos = Array.isArray(datosCedula?.difuntos)
    ? datosCedula.difuntos.filter((d) => d && (d.nombre?.trim() || d.fecha?.trim()))
    : [];

  return (
    <div className="bg-[#FAF8F5] p-6 sm:p-10 rounded-2xl border-4 border-double border-cream-300 space-y-6 text-stone-900 shadow-inner font-serif print:bg-white print:p-5 print:space-y-3 print:border-2 print:border-stone-800 print:shadow-none print:rounded-none print:max-h-[258mm] print:overflow-hidden print:break-inside-avoid print:page-break-inside-avoid print:box-border">
      {/* Membrete Superior Institucional */}
      <div className="text-center space-y-1.5 border-b-2 border-teal-600 pb-5 print:pb-2.5 print:space-y-0.5">
        <div className="inline-flex items-center justify-center mb-1 print:mb-0.5">
          <img
            src={logoPanteon}
            alt="Panteón La Soledad"
            className="w-16 h-16 rounded-full object-cover border-2 border-teal-600 shadow-md p-0.5 bg-white print:w-12 print:h-12 print:shadow-none"
          />
        </div>
        {plantilla.encabezadoSuperior && (
          <div className="text-[11px] font-sans font-black uppercase tracking-widest text-teal-900 print:text-[10px]">
            {plantilla.encabezadoSuperior}
          </div>
        )}
        {plantilla.direccionAdministrativa && (
          <div className="text-xs font-sans font-bold text-stone-600 print:text-[10px]">
            {plantilla.direccionAdministrativa}
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight pt-2 print:pt-0.5 print:text-xl">
          {plantilla.nombrePanteon || 'PANTEÓN LA SOLEDAD'}
        </h1>
        {plantilla.ubicacionPanteon && (
          <div className="text-xs font-sans font-semibold text-stone-500 print:text-[10px]">
            {plantilla.ubicacionPanteon}
          </div>
        )}
        {plantilla.tituloDocumento && (
          <div className="pt-2 print:pt-1">
            <span className="inline-block bg-teal-100 text-teal-900 border border-teal-300 text-xs font-sans font-extrabold uppercase px-4 py-1 rounded-full print:px-3 print:py-0.5 print:text-[10px]">
              {plantilla.tituloDocumento}
            </span>
          </div>
        )}
      </div>

      {/* Folio y Fecha */}
      <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-sans text-stone-600 pb-2 print:pb-0.5 print:text-[11px]">
        <div>
          <strong>FOLIO OFICIAL:</strong>{' '}
          <span className="font-mono text-teal-900 font-bold">
            {datosCedula.folioOficial || 'TIT-0000'}
          </span>
        </div>
        <div>
          <strong>FECHA DE EXPEDICIÓN:</strong> {datosCedula.fechaExpedicion || ''}
        </div>
      </div>

      {/* Declaración Jurídica */}
      {plantilla.declaracionJuridica && (
        <div className="text-justify text-xs sm:text-sm leading-relaxed space-y-4 print:text-[11px] print:leading-snug print:space-y-1">
          <p>{plantilla.declaracionJuridica}</p>
        </div>
      )}

      {/* Ficha Técnica del Espacio */}
      <div className="bg-white p-5 rounded-2xl border-2 border-cream-300 space-y-3 font-sans text-xs shadow-2xs print:p-3 print:space-y-1.5 print:rounded-lg print:border-stone-400 print:shadow-none print:text-[11px]">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-cream-200 pb-3 print:pb-1.5 print:gap-2">
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Número de Fosa:
            </span>
            <span className="font-mono font-black text-base print:text-sm text-teal-900">
              {datosCedula.numeroFosa || 'N/D'}
            </span>
          </div>
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">Sección:</span>
            <span className="font-bold text-stone-800">
              {datosCedula.seccionNombre || 'Sin especificar'}
            </span>
          </div>
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Tipo de Espacio:
            </span>
            <span className="font-bold text-stone-800">{datosCedula.tipoEspacio || 'Fosa'}</span>
          </div>
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Construcción:
            </span>
            <span className="font-bold text-stone-800">
              {datosCedula.construccionTexto || 'Sencilla'}
            </span>
          </div>
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Estatus de Cobro:
            </span>
            <span className="font-bold text-olive-800">
              {datosCedula.estatusPago || 'Al Corriente'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 print:pt-0.5 print:gap-2">
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Titular Concesionario(a):
            </span>
            <span className="font-extrabold text-stone-900 text-sm print:text-xs">
              {datosCedula.titularNombre || 'Sin titular registrado'}
            </span>
            {datosCedula.titularTelefono && (
              <div className="text-[11px] print:text-[10px] text-stone-500">
                Teléfono: {datosCedula.titularTelefono}
              </div>
            )}
          </div>
          <div>
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              {difuntos.length > 1
                ? `Difuntos Inhumados (${difuntos.length}):`
                : 'Difunto(a) Inhumado(a):'}
            </span>
            {difuntos.length > 0 ? (
              <div className="space-y-1 mt-0.5 print:space-y-0.5">
                {difuntos.map((dif, idx) => (
                  <div key={idx} className="text-xs print:text-[10px]">
                    <span className="font-extrabold text-stone-900">{dif.nombre}</span>
                    {dif.parentesco && (
                      <span className="text-[10px] print:text-[9px] text-teal-800 ml-1 font-semibold">
                        [{dif.parentesco}]
                      </span>
                    )}
                    {dif.fecha && (
                      <span className="text-[10px] print:text-[9px] text-stone-500 ml-1.5 font-mono">
                        ({dif.tipoServicio ? `${dif.tipoServicio}: ` : ''}
                        {dif.fecha})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="font-extrabold text-stone-900 text-sm print:text-xs">
                Espacio libre / Disponible
              </span>
            )}
          </div>
        </div>

        {datosCedula.observacionesCedula && datosCedula.observacionesCedula.trim() !== '' && (
          <div className="pt-2 print:pt-1 border-t border-cream-200 text-xs print:text-[10px]">
            <span className="block text-stone-500 font-bold text-[10px] print:text-[9px] uppercase">
              Observaciones / Anotaciones Oficiales:
            </span>
            <p className="text-stone-800 font-medium whitespace-pre-line mt-0.5">
              {datosCedula.observacionesCedula}
            </p>
          </div>
        )}
      </div>

      {/* Cláusulas Administrativas */}
      {(plantilla.clausula1Texto || plantilla.clausula2Texto) && (
        <div className="text-[11px] print:text-[10px] text-stone-600 leading-normal print:leading-snug space-y-2 print:space-y-1 border-t border-cream-300 pt-4 print:pt-2">
          {plantilla.clausula1Texto && (
            <p>
              {plantilla.clausula1Titulo && <strong>{plantilla.clausula1Titulo} </strong>}
              {plantilla.clausula1Texto}
            </p>
          )}
          {plantilla.clausula2Texto && (
            <p>
              {plantilla.clausula2Titulo && <strong>{plantilla.clausula2Titulo} </strong>}
              {plantilla.clausula2Texto}
            </p>
          )}
        </div>
      )}

      {/* Firmas y Sellos Oficiales */}
      <div className="grid grid-cols-2 gap-12 print:gap-8 pt-12 print:pt-5 text-center text-xs print:text-[11px] font-sans">
        <div className="border-t-2 border-stone-800 pt-2 print:pt-1 space-y-1 print:space-y-0.5">
          <div className="font-black text-stone-900">
            {plantilla.firmaAdminTitulo || 'ADMINISTRACIÓN GENERAL'}
          </div>
          <div className="text-[10px] print:text-[9px] text-stone-500">
            {plantilla.firmaAdminSubtitulo || 'Panteón La Soledad'}
          </div>
        </div>
        <div className="border-t-2 border-stone-800 pt-2 print:pt-1 space-y-1 print:space-y-0.5">
          <div className="font-black text-stone-900">
            {plantilla.firmaTitularTitulo || 'CONCESIONARIO(A) TITULAR'}
          </div>
          <div className="text-[10px] print:text-[9px] text-stone-500">
            {datosCedula.firmaTitularSubtitulo ||
              datosCedula.titularNombre ||
              'Firma de Aceptación'}
          </div>
        </div>
      </div>

      {plantilla.piePagina && (
        <div className="text-center text-[10px] print:text-[9px] text-stone-400 font-sans pt-6 print:pt-2 border-t border-cream-200">
          {plantilla.piePagina}
        </div>
      )}
    </div>
  );
}
