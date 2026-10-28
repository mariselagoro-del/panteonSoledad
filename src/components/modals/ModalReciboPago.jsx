// src/components/modals/ModalReciboPago.jsx
import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Receipt, 
  CheckCircle2, 
  FileCheck,
  Search,
  ArrowLeft,
  Scissors
} from 'lucide-react';
import plantillaLimpia from '../../assets/recibo-fondo-limpio.jpg';
import ModalAlerta from '../common/ModalAlerta';
import { agregarPagoAFosa } from '../../utils/pagosUtils';
import { coincideEspacioConBusqueda, formatearNumeroFosa } from '../../utils/busquedaUtils';

const CONCEPTOS_PREDEFINIDOS = [
  { label: 'Refrendo Anual 2026 ($250.00 MXN)', concepto: 'Refrendo Anual de Fosa 2026', monto: 250.0 },
  { label: 'Refrendo Anual 2025 / Rezago ($250.00 MXN)', concepto: 'Refrendo Anual Extemporáneo 2025', monto: 250.0 },
  { label: 'Derechos de Inhumación / Sepelio ($1,500.00 MXN)', concepto: 'Derechos de Inhumación y Sepelio', monto: 1500.0 },
  { label: 'Mantenimiento General de Áreas ($300.00 MXN)', concepto: 'Cuota de Mantenimiento de Pasillos y Jardinería', monto: 300.0 },
  { label: 'Concesión de Nicho para Cenizas ($3,500.00 MXN)', concepto: 'Título de Concesión de Nicho', monto: 3500.0 },
  { label: 'Expedición de Duplicado de Título ($200.00 MXN)', concepto: 'Reposición y Duplicado de Cédula de Título', monto: 200.0 },
  { label: 'Permiso de Construcción / Monumento ($450.00 MXN)', concepto: 'Permiso de Obra para Monumento / Lápida', monto: 450.0 },
  { label: 'Derechos de Exhumación / Traslado ($800.00 MXN)', concepto: 'Derechos de Exhumación y Traslado de Restos', monto: 800.0 },
  { label: 'Otro Concepto Personalizado...', concepto: '', monto: '' }
];

/**
 * Componente que renderiza el formato físico idéntico con datos sobrepuestos en sus líneas.
 */
function ReciboFisico({
  folio,
  noTumba,
  seccion,
  monto,
  nombreTitular,
  nombreDifunto,
  concepto,
  direccion,
  fechaPago,
  telefonoContacto,
  tipoCopia = 'ORIGINAL'
}) {
  const [anio, mes, dia] = (fechaPago || new Date().toISOString().split('T')[0]).split('-');
  const montoNumerico = Number(monto) || 0;
  const montoFormateado = montoNumerico.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div 
      className="relative flex-1 w-full max-w-[430px] aspect-[596/912] bg-contain bg-center bg-no-repeat select-none text-black font-sans shadow-md print:shadow-none print:max-w-none print:w-[122mm] print:h-[186mm] print:aspect-[596/912] print:shrink-0"
      style={{ backgroundImage: `url(${plantillaLimpia})` }}
    >
      {/* Etiqueta de Tipo de Copia */}
      <span className="absolute right-4 top-2 text-[9px] font-mono font-bold text-stone-600 bg-white/85 px-1.5 py-0.5 rounded shadow-2xs print:text-[8px] print:right-3 print:top-1">
        {tipoCopia}
      </span>

      {/* 1. Folio */}
      <div 
        className="absolute text-red-700 font-mono font-black text-[11px] sm:text-xs print:text-[11px] leading-none"
        style={{ left: '81.5%', top: '20.4%' }}
      >
        {folio}
      </div>

      {/* 2. No. Tumba */}
      <div 
        className="absolute font-mono font-black text-[9px] sm:text-[11px] text-stone-900 truncate print:text-[9px] leading-none"
        style={{ left: '21%', top: '23.8%', maxWidth: '16%' }}
      >
        {noTumba}
      </div>

      {/* 3. Sección */}
      <div 
        className="absolute font-bold text-[9px] sm:text-[11px] text-stone-900 truncate print:text-[9px] leading-none"
        style={{ left: '47.0%', top: '23.8%', maxWidth: '15%' }}
      >
        {seccion}
      </div>

      {/* 4. Cantidad */}
      <div 
        className="absolute font-mono font-black text-[9px] sm:text-[11px] text-stone-900 truncate print:text-[9px] leading-none"
        style={{ left: '73.5%', top: '23.8%', maxWidth: '20%' }}
      >
        ${montoFormateado}
      </div>

      {/* 5. Titular o Responsable */}
      <div 
        className="absolute font-bold text-[9px] sm:text-[11px] text-stone-900 uppercase truncate print:text-[9px] leading-none"
        style={{ left: '36%', top: '27.8%', maxWidth: '56%' }}
        title={nombreTitular}
      >
        {nombreTitular}
      </div>

      {/* 6. Nombre del Difunto */}
      <div 
        className="absolute font-bold text-[9px] sm:text-[11px] text-stone-900 uppercase truncate print:text-[9px] leading-none"
        style={{ left: '35%', top: '31.8%', maxWidth: '57%' }}
        title={nombreDifunto}
      >
        {nombreDifunto || 'N/A'}
      </div>

      {/* 7. Concepto */}
      <div 
        className="absolute font-bold text-[9px] sm:text-[11px] text-stone-900 uppercase truncate print:text-[9px] leading-none"
        style={{ left: '24%', top: '36.0%', maxWidth: '68%' }}
        title={concepto}
      >
        {concepto}
      </div>

      {/* 8. Dirección */}
      <div 
        className="absolute font-semibold text-[8px] sm:text-[10px] text-stone-900 uppercase truncate print:text-[8px] leading-none"
        style={{ left: '24%', top: '44.0%', maxWidth: '68%' }}
        title={direccion}
      >
        {direccion || 'SAN FRANCISCO TEPOJACO, CUAUTITLÁN IZCALLI'}
      </div>

      {/* 9. Fecha: Día, Mes, Año */}
      <div 
        className="absolute font-mono font-bold text-[9px] sm:text-[11px] text-stone-900 print:text-[9px] leading-none"
        style={{ left: '17.2%', top: '55.6%' }}
      >
        {dia}
      </div>
      <div 
        className="absolute font-mono font-bold text-[9px] sm:text-[11px] text-stone-900 print:text-[9px] leading-none"
        style={{ left: '25.5%', top: '55.6%' }}
      >
        {mes}
      </div>
      <div 
        className="absolute font-mono font-bold text-[9px] sm:text-[11px] text-stone-900 print:text-[9px] leading-none"
        style={{ left: '34.8%', top: '55.6%' }}
      >
        {anio}
      </div>

      {/* 10. Teléfono */}
      <div 
        className="absolute font-mono font-bold text-[9px] sm:text-[11px] text-stone-900 print:text-[9px] leading-none"
        style={{ left: '56.0%', top: '55.6%', maxWidth: '36%' }}
      >
        {telefonoContacto || 'S/N'}
      </div>

    </div>
  );
}

export default function ModalReciboPago({
  espacio,
  registrosFosas = [],
  onCerrar,
  onRegistrarMovimiento,
  onActualizarFosa
}) {
  const pagoInicial = espacio?._pagoSeleccionado || null;
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(() => espacio || null);
  const [busquedaFosa, setBusquedaFosa] = useState('');
  const [mostrarReciboImprimible, setMostrarReciboImprimible] = useState(() => !!pagoInicial);

  // Datos del formulario de pago
  const [folio, setFolio] = useState(() => pagoInicial?.folio || `${Math.floor(1000 + Math.random() * 9000)}`);
  const [fechaPago, setFechaPago] = useState(() => pagoInicial?.fecha || new Date().toISOString().split('T')[0]);
  const [conceptoSeleccionado, setConceptoSeleccionado] = useState(() => {
    if (pagoInicial?.concepto) {
      const encontrado = CONCEPTOS_PREDEFINIDOS.find(c => c.concepto === pagoInicial.concepto);
      return encontrado ? encontrado.concepto : '';
    }
    return CONCEPTOS_PREDEFINIDOS[0].concepto;
  });
  const [conceptoPersonalizado, setConceptoPersonalizado] = useState(() => {
    if (pagoInicial?.concepto) {
      const encontrado = CONCEPTOS_PREDEFINIDOS.find(c => c.concepto === pagoInicial.concepto);
      return encontrado ? '' : pagoInicial.concepto;
    }
    return '';
  });
  const [monto, setMonto] = useState(() => pagoInicial?.monto !== undefined ? String(pagoInicial.monto) : String(CONCEPTOS_PREDEFINIDOS[0].monto));
  const [metodoPago, setMetodoPago] = useState(() => pagoInicial?.metodoPago || 'Efectivo en Caja');
  
  const [nombreTitular, setNombreTitular] = useState(() => pagoInicial?.titular || espacio?.titularNombre || '');
  const [nombreDifunto, setNombreDifunto] = useState(() => espacio?.historialDifuntos?.[0]?.nombre || '');
  const [direccion, setDireccion] = useState('San Francisco Tepojaco, Cuautitlán Izcalli, Edo. Méx.');
  const [telefonoContacto, setTelefonoContacto] = useState(() => espacio?.titularTelefono || '');
  const [observaciones, setObservaciones] = useState(() => pagoInicial?.observaciones || '');
  const [alertaConfig, setAlertaConfig] = useState(null);

  // Lista filtrada para buscar fosa si no venía preseleccionada (busca código, titular o cualquier difunto)
  const fosasFiltradas = useMemo(() => {
    if (!busquedaFosa.trim()) return [];
    return registrosFosas
      .map(r => {
        const res = coincideEspacioConBusqueda(r, busquedaFosa);
        if (res.coincide) {
          return {
            ...r,
            _difuntoCoincidente: res.difuntoCoincidente
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [registrosFosas, busquedaFosa]);

  // Soporte para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar]);

  const handleSeleccionarFosa = (item) => {
    setEspacioSeleccionado(item);
    setNombreTitular(item.titularNombre || '');
    setNombreDifunto(item._difuntoCoincidente?.nombre || item.historialDifuntos?.[0]?.nombre || '');
    setTelefonoContacto(item.titularTelefono || '');
    setBusquedaFosa('');
  };

  const handleConceptoChange = (e) => {
    const val = e.target.value;
    setConceptoSeleccionado(val);
    const encontrado = CONCEPTOS_PREDEFINIDOS.find(c => c.concepto === val);
    if (encontrado && encontrado.monto !== '') {
      setMonto(String(encontrado.monto));
    }
  };

  const conceptoFinal = conceptoSeleccionado || conceptoPersonalizado || 'Pago de Servicios Funerarios';
  const montoNumerico = Number(monto) || 0;

  const handleRegistrarPago = (e) => {
    e.preventDefault();

    if (!montoNumerico || montoNumerico <= 0) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Monto Inválido',
        mensaje: 'Por favor ingresa un monto válido mayor a $0.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    if (!nombreTitular.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Dato Requerido',
        mensaje: 'Por favor especifica el nombre del titular o responsable que realiza el pago.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const nuevoPagoFosa = {
      id: Date.now(),
      folio: folio,
      fecha: fechaPago,
      concepto: conceptoFinal,
      categoria: conceptoFinal.includes('Refrendo') ? 'Refrendo' : 'Servicio',
      monto: montoNumerico,
      metodoPago: metodoPago,
      titular: nombreTitular,
      estatus: 'Pagado',
      observaciones: observaciones
    };

    // 1. Registrar movimiento en la caja del panteón
    if (onRegistrarMovimiento) {
      onRegistrarMovimiento({
        id: Date.now(),
        tipo: 'Ingreso',
        categoria: nuevoPagoFosa.categoria,
        concepto: `${conceptoFinal} - Lote ${espacioSeleccionado?.codigo || 'General'} (${nombreTitular})`,
        monto: montoNumerico,
        metodoPago: metodoPago,
        fecha: fechaPago,
        folio: folio,
        observaciones: observaciones
      });
    }

    // 2. Actualizar el estatus y el historial de pagos de la fosa
    if (espacioSeleccionado && onActualizarFosa) {
      const fosaConPago = agregarPagoAFosa(espacioSeleccionado, nuevoPagoFosa);
      onActualizarFosa({
        ...fosaConPago,
        titularNombre: nombreTitular,
        titularTelefono: telefonoContacto
      });
    }

    // 3. Mostrar los 2 recibos oficiales imprimibles inmediatamente
    setMostrarReciboImprimible(true);
  };

  const handleSoloReflejarPagoEnSistema = (e) => {
    if (e) e.preventDefault();

    if (!conceptoFinal.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Concepto Requerido',
        mensaje: 'Por favor selecciona o escribe el concepto del cobro a reflejar.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    if (!montoNumerico || montoNumerico <= 0) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Monto Inválido',
        mensaje: 'Por favor ingresa un monto válido mayor a $0.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    if (!nombreTitular.trim()) {
      setAlertaConfig({
        tipo: 'advertencia',
        titulo: 'Dato Requerido',
        mensaje: 'Por favor especifica el nombre del titular o responsable que realiza el pago.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }

    const nuevoPagoFosa = {
      id: Date.now(),
      folio: folio,
      folioFisico: folio.replace(/^REC-|^FIS-/, ''),
      origen: 'recibo_fisico',
      fecha: fechaPago,
      concepto: conceptoFinal,
      categoria: conceptoFinal.includes('Refrendo') ? 'Refrendo' : 'Servicio',
      monto: montoNumerico,
      metodoPago: metodoPago,
      titular: nombreTitular,
      estatus: 'Pagado',
      observaciones: observaciones || 'Pago reflejado en sistema según comprobante físico.'
    };

    // 1. Registrar movimiento en la caja del panteón
    if (onRegistrarMovimiento) {
      onRegistrarMovimiento({
        id: Date.now(),
        tipo: 'Ingreso',
        categoria: nuevoPagoFosa.categoria,
        concepto: `${conceptoFinal} (Recibo #${folio}) - Lote ${espacioSeleccionado?.codigo || 'General'} (${nombreTitular})`,
        monto: montoNumerico,
        metodoPago: metodoPago,
        fecha: fechaPago,
        folio: folio,
        observaciones: nuevoPagoFosa.observaciones
      });
    }

    // 2. Actualizar el estatus y el historial de pagos de la fosa
    if (espacioSeleccionado && onActualizarFosa) {
      const fosaConPago = agregarPagoAFosa(espacioSeleccionado, nuevoPagoFosa);
      onActualizarFosa({
        ...fosaConPago,
        titularNombre: nombreTitular,
        titularTelefono: telefonoContacto
      });
    }

    // 3. Notificar y cerrar sin abrir vista imprimible
    setAlertaConfig({
      tipo: 'exito',
      titulo: '¡Pago Reflejado en el Sistema!',
      mensaje: `El pago de $${montoNumerico.toLocaleString('es-MX', { minimumFractionDigits: 2 })} con folio ${folio} ha sido registrado y reflejado en el sistema exitosamente sin necesidad de impresión.`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => {
        setAlertaConfig(null);
        if (onCerrar) onCerrar();
      }
    });
  };

  const handleImprimirRecibo = () => {
    window.print();
  };

  return (
    <div 
      onClick={onCerrar}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl border border-cream-300 shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col print:p-0 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:my-0 print:bg-transparent ${
          mostrarReciboImprimible ? 'max-w-5xl w-full' : 'max-w-2xl w-full'
        }`}
      >
        
        {/* ========================================================= */}
        {/* VISTA 1: FORMULARIO DE COBRO Y EMISIÓN (Oculta al imprimir)*/}
        {/* ========================================================= */}
        {!mostrarReciboImprimible ? (
          <div className="overflow-y-auto">
            {/* Cabecera Modal (Deep Teal #225D65) */}
            <div className="bg-teal-500 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-white" />
                <div>
                  <h3 className="font-black text-sm tracking-wide">
                    Cobro y Emisión de Recibo de Pago
                  </h3>
                  <p className="text-[11px] text-cream-100">
                    Panteón La Soledad • Folio: {folio}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCerrar}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de Pago */}
            <form onSubmit={handleRegistrarPago} className="p-6 space-y-4 text-xs">
              
              {/* Buscador de Fosa (si no venía preseleccionada) */}
              {!espacioSeleccionado ? (
                <div className="p-4 bg-cream-50 rounded-2xl border border-cream-300 space-y-2">
                  <label className="block font-bold text-stone-700">Buscar Fosa, Titular o Difunto *</label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ej: F1-042, Gómez, Sánchez, Salvador..."
                      value={busquedaFosa}
                      onChange={(e) => setBusquedaFosa(e.target.value)}
                      className="w-full bg-white border border-cream-300 rounded-xl pl-9 pr-3 py-2 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  {fosasFiltradas.length > 0 && (
                    <div className="bg-white border border-cream-300 rounded-xl divide-y divide-cream-200 overflow-hidden shadow-xs mt-1">
                      {fosasFiltradas.map(f => (
                        <button
                          type="button"
                          key={f.id}
                          onClick={() => handleSeleccionarFosa(f)}
                          className="w-full text-left p-2.5 hover:bg-cream-100 flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-900">Fosa {formatearNumeroFosa(f.codigo)}</span>
                              <span className="font-bold text-stone-800">{f.titularNombre || 'Sin titular'}</span>
                            </div>
                            {f._difuntoCoincidente && (
                              <div className="text-[11px] text-teal-700 font-medium mt-0.5">
                                Difunto: <strong>{f._difuntoCoincidente.nombre}</strong>
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400">{f.seccionNombre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Fosa Seleccionada Card */
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-teal-600 text-white font-mono font-black text-xs rounded-lg">
                      Fosa {formatearNumeroFosa(espacioSeleccionado.codigo)}
                    </span>
                    <div>
                      <p className="font-bold text-stone-900">{espacioSeleccionado.titularNombre || 'Sin titular registrado'}</p>
                      <p className="text-[10px] text-stone-500">{espacioSeleccionado.seccionNombre} • {espacioSeleccionado.tipoEspacio}</p>
                    </div>
                  </div>
                  {!espacio && (
                    <button
                      type="button"
                      onClick={() => setEspacioSeleccionado(null)}
                      className="text-[11px] text-teal-700 font-bold hover:underline cursor-pointer"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              )}

              {/* Titular y Difunto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Nombre del Titular o Responsable *</label>
                  <input
                    type="text"
                    required
                    value={nombreTitular}
                    onChange={(e) => setNombreTitular(e.target.value)}
                    placeholder="Nombre completo del titular"
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-700">Nombre del Difunto Inhumado</label>
                    {espacioSeleccionado?.historialDifuntos?.length > 1 && (
                      <span className="text-[10px] text-teal-700 font-bold">
                        {espacioSeleccionado.historialDifuntos.length} difuntos en lote
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={nombreDifunto}
                    onChange={(e) => setNombreDifunto(e.target.value)}
                    placeholder="Nombre del difunto"
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  {espacioSeleccionado?.historialDifuntos?.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-stone-400 font-medium">Seleccionar:</span>
                      {espacioSeleccionado.historialDifuntos.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNombreDifunto(d.nombre || '')}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                            nombreDifunto === d.nombre
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-cream-100 text-stone-700 border-cream-300 hover:bg-cream-200'
                          }`}
                        >
                          {d.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dirección y Teléfono */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Dirección del Titular</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="San Francisco Tepojaco, Cuautitlán Izcalli"
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Concepto y Monto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-bold text-stone-700">Concepto del Pago *</label>
                  <select
                    value={conceptoSeleccionado}
                    onChange={handleConceptoChange}
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  >
                    {CONCEPTOS_PREDEFINIDOS.map((c, idx) => (
                      <option key={idx} value={c.concepto}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Monto ($ MXN) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-stone-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      placeholder="250.00"
                      className="w-full bg-white border border-cream-300 rounded-xl pl-8 pr-3 py-2.5 font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Si seleccionó Otro concepto */}
              {!conceptoSeleccionado && (
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Escribe el Concepto Personalizado *</label>
                  <input
                    type="text"
                    required
                    value={conceptoPersonalizado}
                    onChange={(e) => setConceptoPersonalizado(e.target.value)}
                    placeholder="Ej: Permiso especial para monumento..."
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              )}

              {/* Fecha, Folio y Método de Pago */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    value={fechaPago}
                    onChange={(e) => setFechaPago(e.target.value)}
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Folio del Recibo</label>
                  <input
                    type="text"
                    required
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 font-mono font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-stone-700">Forma de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  >
                    <option value="Efectivo en Caja">Efectivo en Caja</option>
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Observaciones o Notas Adicionales</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles adicionales del comprobante..."
                  className="w-full bg-white border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-200 flex-wrap">
                <button
                  type="button"
                  onClick={onCerrar}
                  className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                {/* Botón: Ya Pagó (Solo reflejar sin imprimir recibo electrónico) */}
                <button
                  type="button"
                  onClick={handleSoloReflejarPagoEnSistema}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs border border-emerald-700 flex items-center gap-2 cursor-pointer transition-colors"
                  title="Registrar el pago en el sistema sin abrir la vista de impresión (tienen recibos físicos)"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                  <span>Ya Pagó (Solo Reflejar en Sistema)</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-olive-500 hover:bg-olive-600 text-white font-bold rounded-xl shadow-xs border border-olive-600 flex items-center gap-2 cursor-pointer"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Registrar Pago y Ver 2 Recibos Oficiales</span>
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* ========================================================= */
          /* VISTA 2: FORMATO OFICIAL (2 RECIBOS LADO A LADO EN CARTA)  */
          /* ========================================================= */
          <div className="flex flex-col h-full overflow-y-auto bg-stone-100 print:bg-white print:p-0">
            
            {/* Barra superior con botón de imprimir (Oculta al imprimir) */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-cream-300 print:hidden bg-white sticky top-0 z-20 shadow-xs">
              <div className="flex items-center gap-2 text-olive-800 font-bold text-xs">
                <CheckCircle2 className="w-5 h-5 text-olive-600 shrink-0" />
                <div>
                  <span className="text-stone-900 font-black">Vista Previa • 2 Recibos en Hoja Carta (Horizontal)</span>
                  <p className="text-[10px] text-stone-500 font-normal">Original y Copia con formato y firmas idénticas</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarReciboImprimible(false)}
                  className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-cream-300"
                  title="Modificar datos del pago"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Modificar Datos</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimirRecibo}
                  className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border border-teal-600"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Imprimir 2 Recibos</span>
                </button>

                <button
                  type="button"
                  onClick={onCerrar}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-cream-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ------------------------------------------------------- */}
            {/* HOJA TAMAÑO CARTA CON 2 RECIBOS LADO A LADO             */}
            {/* ------------------------------------------------------- */}
            <div className="p-4 sm:p-6 overflow-y-auto flex justify-center items-center">
              <div className="print-page-duo w-full max-w-[920px] bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-stone-200 print:shadow-none print:border-none print:p-0 print:max-w-none flex flex-col sm:flex-row items-center justify-center gap-4 print:gap-4">
                
                {/* 1. RECIBO IZQUIERDO (ORIGINAL CONTRIBUYENTE) */}
                <ReciboFisico
                  tipoCopia="ORIGINAL (CONTRIBUYENTE)"
                  folio={folio}
                  noTumba={formatearNumeroFosa(espacioSeleccionado?.codigo) || 'N/A'}
                  seccion={espacioSeleccionado?.seccionNombre || 'General'}
                  monto={monto}
                  nombreTitular={nombreTitular}
                  nombreDifunto={nombreDifunto}
                  concepto={conceptoFinal}
                  direccion={direccion}
                  fechaPago={fechaPago}
                  telefonoContacto={telefonoContacto}
                />

                {/* 2. LÍNEA DE CORTE VERTICAL EN MEDIO */}
                <div className="hidden sm:flex flex-col items-center justify-center relative px-2 self-stretch select-none text-stone-500 text-[10px] font-sans font-bold print:flex">
                  <div className="h-full border-l-2 border-dashed border-stone-400 absolute inset-y-0" />
                  <span className="relative bg-white py-2 px-1 rounded-md border border-stone-300 shadow-2xs flex flex-col items-center gap-1 text-stone-700 my-auto print:bg-white print:border-none">
                    <Scissors className="w-3.5 h-3.5 text-stone-600" />
                    <span className="[writing-mode:vertical-lr] tracking-widest text-[8px]">CORTAR AQUÍ</span>
                  </span>
                </div>

                {/* Separador para móviles */}
                <div className="sm:hidden w-full flex items-center justify-center py-2 text-[10px] font-bold text-stone-500 relative">
                  <div className="w-full border-t border-dashed border-stone-400 absolute inset-x-0" />
                  <span className="relative bg-white px-2 py-0.5 rounded border border-stone-300 text-[9px] flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> CORTAR AQUÍ
                  </span>
                </div>

                {/* 3. RECIBO DERECHO (COPIA ADMINISTRACIÓN) */}
                <ReciboFisico
                  tipoCopia="COPIA (ADMINISTRACIÓN)"
                  folio={folio}
                  noTumba={formatearNumeroFosa(espacioSeleccionado?.codigo) || 'N/A'}
                  seccion={espacioSeleccionado?.seccionNombre || 'General'}
                  monto={monto}
                  nombreTitular={nombreTitular}
                  nombreDifunto={nombreDifunto}
                  concepto={conceptoFinal}
                  direccion={direccion}
                  fechaPago={fechaPago}
                  telefonoContacto={telefonoContacto}
                />

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal de Alerta / Validación Centrado */}
      {alertaConfig && (
        <ModalAlerta
          abierto={!!alertaConfig}
          tipo={alertaConfig.tipo}
          titulo={alertaConfig.titulo}
          mensaje={alertaConfig.mensaje}
          textoBotonPrincipal={alertaConfig.textoBotonPrincipal}
          textoBotonSecundario={alertaConfig.textoBotonSecundario}
          onAceptar={alertaConfig.onAceptar}
          onCancelar={alertaConfig.onCancelar}
          onCerrar={() => setAlertaConfig(null)}
        />
      )}
    </div>
  );
}
