// src/components/permiso/VistaDocumentoPermisoTumba.jsx
import virgenSoledadImg from '../../assets/permiso/virgen-soledad.png';
import selloComisionImg from '../../assets/permiso/sello-comision.png';
import esquinaOrnamentalImg from '../../assets/permiso/esquina-ornamental.png';
import divisorBordeHImg from '../../assets/permiso/divisor-borde-h.png';
import divisorBordeVImg from '../../assets/permiso/divisor-borde-v.png';
import divisorFirmaImg from '../../assets/permiso/divisor-firma.png';
import firmaPresidenteImg from '../../assets/permiso/firma-presidente.png';
import firmaSecretarioImg from '../../assets/permiso/firma-secretario.png';
import firmaTesoreroImg from '../../assets/permiso/firma-tesorero.png';
import firmaVocal1Img from '../../assets/permiso/firma-vocal1.png';
import firmaVocal2Img from '../../assets/permiso/firma-vocal2.png';

/**
 * Componente de firma individual con imagen digital opcional y separador ornamental.
 */
function BloqueFirmaComision({
  firmante,
  imagenFirma,
  mostrarFirmaDigital,
  conRecuadro = false
}) {
  if (!firmante?.visible) {
    return <div />;
  }

  return (
    <div
      className={`flex flex-col items-center justify-end text-center px-2 py-2 ${
        conRecuadro ? 'border border-stone-900 bg-white/40 print:bg-transparent' : ''
      }`}
    >
      <div className="h-14 flex items-end justify-center w-full mb-0.5">
        {mostrarFirmaDigital && imagenFirma && (
          <img
            src={imagenFirma}
            alt={`Firma ${firmante.cargo}`}
            className="max-h-14 max-w-[155px] object-contain pointer-events-none select-none"
          />
        )}
      </div>

      <img
        src={divisorFirmaImg}
        alt=""
        className="w-44 max-w-full h-auto object-contain mb-1 pointer-events-none select-none"
      />

      <p className="text-[11px] sm:text-xs font-extrabold text-stone-950 leading-tight font-sans">
        {firmante.nombre || ' '}
      </p>
      <p className="text-[11px] font-bold text-stone-900 leading-tight font-sans">
        {firmante.cargo || ' '}
      </p>
    </div>
  );
}

/**
 * Formato oficial imprimible del Permiso de Arreglo de Tumba del Panteón La Soledad.
 * Replica fielmente la estructura, diagrama de medidas, condiciones, sello, marca de agua,
 * marcos ornamentales y firmas de la Comisión.
 */
export default function VistaDocumentoPermisoTumba({ datosPermiso = {}, plantilla = {} }) {
  const largo = datosPermiso.largoAutorizado || plantilla.largoPredeterminado || '2.30 m';
  const ancho = datosPermiso.anchoAutorizado || plantilla.anchoPredeterminado || '1.30 m';
  const advertencia = datosPermiso.advertencia ?? plantilla.advertenciaPredeterminada ?? 'NO SE PUEDEN REALIZAR NICHOS';
  const condiciones = Array.isArray(plantilla.condiciones) ? plantilla.condiciones : [];
  const firmantes = plantilla.firmantes || {};

  return (
    <div className="permiso-hoja-carta relative w-full max-w-[816px] min-h-[1040px] mx-auto bg-white text-stone-950 shadow-md border border-stone-200 print:shadow-none print:border-none print:max-w-none print:w-[205mm] print:min-h-[268mm] overflow-hidden select-text">
      {/* Marco Ornamental (Esquinas y Divisores) */}
      {plantilla.mostrarBordesOrnamentales !== false && (
        <div className="pointer-events-none select-none">
          {/* Esquina Superior Izquierda */}
          <img
            src={esquinaOrnamentalImg}
            alt=""
            className="absolute top-1.5 left-1.5 w-36 sm:w-44 h-auto -scale-y-100 z-10"
          />
          {/* Esquina Superior Derecha */}
          <div className="absolute top-1.5 right-1.5 w-36 sm:w-44 z-10 -scale-x-100">
            <img
              src={esquinaOrnamentalImg}
              alt=""
              className="w-full h-auto -scale-y-100"
            />
          </div>
          {/* Esquina Inferior Izquierda */}
          <img
            src={esquinaOrnamentalImg}
            alt=""
            className="absolute bottom-1.5 left-1.5 w-36 sm:w-44 h-auto z-10"
          />
          {/* Esquina Inferior Derecha */}
          <img
            src={esquinaOrnamentalImg}
            alt=""
            className="absolute bottom-1.5 right-1.5 w-36 sm:w-44 h-auto -scale-x-100 z-10"
          />

          {/* Divisor Superior Central */}
          <img
            src={divisorBordeHImg}
            alt=""
            className="absolute top-2.5 left-1/2 -translate-x-1/2 w-60 sm:w-72 h-auto -scale-y-100 z-10"
          />
          {/* Divisor Inferior Central */}
          <img
            src={divisorBordeHImg}
            alt=""
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-60 sm:w-72 h-auto -scale-y-100 z-10"
          />

          {/* Divisor Lateral Izquierdo */}
          <img
            src={divisorBordeVImg}
            alt=""
            className="absolute top-1/2 -left-48 -translate-y-1/2 w-[420px] h-auto rotate-90 z-10 opacity-90"
          />
          {/* Divisor Lateral Derecho */}
          <img
            src={divisorBordeVImg}
            alt=""
            className="absolute top-1/2 -right-48 -translate-y-1/2 w-[420px] h-auto -rotate-90 z-10 opacity-90"
          />
        </div>
      )}

      {/* Marca de Agua Central: Virgen de la Soledad */}
      {plantilla.mostrarMarcaAgua !== false && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 pt-10">
          <img
            src={virgenSoledadImg}
            alt=""
            className="max-h-[760px] w-auto object-contain opacity-20"
          />
        </div>
      )}

      {/* Contenido Principal del Formato */}
      <div className="relative z-20 px-10 sm:px-14 pt-9 pb-12 flex flex-col justify-between min-h-[1040px] print:min-h-[268mm]">
        <div>
          {/* Sello y Título Institucional */}
          <header className="text-center mb-4">
            {plantilla.mostrarSello !== false && (
              <div className="flex justify-center mb-1">
                <img
                  src={selloComisionImg}
                  alt="Sello Comisión Panteón La Soledad"
                  className="h-20 sm:h-24 w-auto object-contain pointer-events-none select-none"
                />
              </div>
            )}
            <h1 className="font-serif font-bold text-3xl sm:text-[34px] text-stone-950 tracking-wide leading-tight">
              {plantilla.tituloEncabezado || 'Panteón La Soledad'}
            </h1>
            {plantilla.mostrarSubtitulo && plantilla.subtituloPermiso && (
              <p className="font-serif font-bold text-sm uppercase tracking-[0.2em] text-[#002060] mt-1">
                {plantilla.subtituloPermiso}
              </p>
            )}
          </header>

          {/* Datos del Titular, Fosa, Difunto, Donación y Expedición */}
          <section className="font-serif font-bold text-lg sm:text-[21px] leading-relaxed space-y-2.5 mb-5">
            {/* Línea 1: Tumba y Sección */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2 items-baseline">
              <div className="sm:col-span-6 flex items-baseline gap-2">
                <span className="text-[#002060] shrink-0">Tumba:</span>
                <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                  {datosPermiso.tumba || '\u00A0'}
                </span>
              </div>
              <div className="sm:col-span-6 flex items-baseline gap-2">
                <span className="text-[#002060] shrink-0">Sección:</span>
                <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                  {datosPermiso.seccion || '\u00A0'}
                </span>
              </div>
            </div>

            {/* Línea 2: T/Responsable */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#002060] shrink-0">T/Responsable:</span>
              <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                {datosPermiso.responsable || '\u00A0'}
              </span>
            </div>

            {/* Línea 3: Difunto */}
            <div className="flex items-baseline gap-2">
              <span className="text-[#002060] shrink-0">Difunto:</span>
              <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                {datosPermiso.difunto || '\u00A0'}
              </span>
            </div>

            {/* Línea 4: Donación y Expedición */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-2 items-baseline">
              <div className="sm:col-span-5 flex items-baseline gap-1.5">
                <span className="text-[#002060] shrink-0">Donación:</span>
                <span className="text-stone-950 font-sans font-bold text-lg">$</span>
                <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                  {datosPermiso.donacion || '\u00A0'}
                </span>
              </div>
              <div className="sm:col-span-7 flex items-baseline gap-2">
                <span className="text-[#002060] shrink-0">Expedición:</span>
                <span className="flex-1 text-stone-950 border-b border-stone-400/80 px-1.5 min-h-[28px] text-base sm:text-lg font-bold">
                  {datosPermiso.expedicion || '\u00A0'}
                </span>
              </div>
            </div>

            {/* Observaciones opcionales */}
            {datosPermiso.observaciones && (
              <div className="flex items-baseline gap-2 pt-0.5 text-sm font-sans">
                <span className="text-[#002060] font-bold shrink-0">Observaciones:</span>
                <span className="text-stone-800 font-semibold border-b border-stone-300 flex-1 px-1">
                  {datosPermiso.observaciones}
                </span>
              </div>
            )}
          </section>

          {/* Advertencia y Plano Gráfico de Medidas Autorizadas */}
          <section className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center mb-5">
            {/* Izquierda: Diagrama Técnico de Tumba (Largo x Ancho) */}
            <div className="sm:col-span-7 pt-1">
              {/* Encabezado horizontal con medida Largo */}
              <div className="flex items-center gap-2 pl-6 mb-1">
                <div className="flex-1 h-[2px] bg-stone-900" />
                <div className="text-center font-serif font-bold text-sm leading-tight text-stone-950 px-1">
                  <div>Largo</div>
                  <div>{largo}</div>
                </div>
                <div className="flex-1 h-[2px] bg-stone-900" />
              </div>

              {/* Línea vertical lateral + Rectángulo exterior e interior */}
              <div className="flex items-stretch gap-2.5">
                {/* Cota vertical lateral */}
                <div className="w-[1.5px] bg-stone-900 ml-2" />

                {/* Rectángulo Exterior de Fosa */}
                <div className="flex-1 border-[4px] border-stone-950 p-2 flex items-center gap-3 min-h-[82px]">
                  <div className="text-center font-serif font-bold text-xs sm:text-[13px] leading-tight text-stone-950 shrink-0 pl-1">
                    <div>Ancho</div>
                    <div>{ancho}</div>
                  </div>
                  {/* Rectángulo Interior (Lápida / Guarnición) */}
                  <div className="flex-1 border-[2.5px] border-stone-950 h-[54px] mr-4" />
                </div>
              </div>
            </div>

            {/* Derecha: Advertencia NO NICHOS + Resumen MEDIDAS AUTORIZADAS */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center text-center space-y-3">
              {plantilla.mostrarAdvertencia !== false && advertencia && (
                <div className="bg-[#FFFF00] px-3 py-1">
                  <span className="font-serif font-bold text-[#FF0000] text-sm sm:text-base tracking-wide uppercase">
                    {advertencia}
                  </span>
                </div>
              )}

              <div className="font-sans text-xs font-extrabold text-stone-950 space-y-0.5 leading-snug">
                <div className="tracking-wide uppercase">
                  {plantilla.tituloMedidas || 'MEDIDAS AUTORIZADAS'}
                </div>
                <div>Largo: {largo}</div>
                <div>Ancho: {ancho}</div>
              </div>
            </div>
          </section>

          {/* Sección de Condiciones */}
          <section className="px-2 sm:px-4 mb-5">
            <h2 className="text-center font-sans font-extrabold text-sm sm:text-base underline uppercase tracking-wider text-stone-950 mb-2.5">
              {plantilla.tituloCondiciones || 'CONDICIONES'}
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-[13px] font-sans font-bold text-stone-950 leading-snug text-center max-w-[660px] mx-auto">
              {condiciones.map((condicion, idx) => (
                <li
                  key={idx}
                  className={idx === condiciones.length - 1 ? 'underline decoration-1 underline-offset-2' : ''}
                >
                  {condicion}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Bloque de Firmas de la Comisión (Fila 1: 3 columnas, Fila 2: 2 columnas) */}
        <footer className="space-y-3 pt-2">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
            <BloqueFirmaComision
              firmante={firmantes.secretario}
              imagenFirma={firmaSecretarioImg}
              mostrarFirmaDigital={plantilla.mostrarFirmasDigitales !== false}
            />
            <BloqueFirmaComision
              firmante={firmantes.presidente}
              imagenFirma={firmaPresidenteImg}
              mostrarFirmaDigital={plantilla.mostrarFirmasDigitales !== false}
              conRecuadro
            />
            <BloqueFirmaComision
              firmante={firmantes.tesorero}
              imagenFirma={firmaTesoreroImg}
              mostrarFirmaDigital={plantilla.mostrarFirmasDigitales !== false}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end">
            <BloqueFirmaComision
              firmante={firmantes.vocal1}
              imagenFirma={firmaVocal1Img}
              mostrarFirmaDigital={plantilla.mostrarFirmasDigitales !== false}
            />
            <div />
            <BloqueFirmaComision
              firmante={firmantes.vocal2}
              imagenFirma={firmaVocal2Img}
              mostrarFirmaDigital={plantilla.mostrarFirmasDigitales !== false}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
