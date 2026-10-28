// src/utils/pagosUtils.js
// Utilidades de normalización y cálculo financiero de pagos para Panteón La Soledad

export const ANIO_ACTUAL = 2026;
export const CUOTA_REFRENDO_ANUAL = 250.0;
export const CUOTA_MTTO_ANUAL = 250.0;
export const CUOTA_FAENA_ANUAL = 250.0;

/**
 * Determina el año base para la evaluación de refrendos de una fosa.
 * Por defecto evalúa los últimos 5 años de rezago (2020 a 2026).
 * Si la persona fue inhumada posteriormente (ej. 2023), inicia en el año de inhumación.
 */
export function obtenerAnioInicioEvaluacion(espacio) {
  let anioBase = 2020;

  if (espacio?.anioInhumacion) {
    const y = Number(espacio.anioInhumacion);
    if (!isNaN(y) && y > 2020) {
      anioBase = y;
    }
  } else if (Array.isArray(espacio?.historialDifuntos) && espacio.historialDifuntos.length > 0) {
    let primerAnioDifunto = null;
    for (const d of espacio.historialDifuntos) {
      const fecha = d.fechaInhumacion || d.fechaDefuncion;
      if (fecha) {
        const y = Number(String(fecha).slice(0, 4));
        if (!isNaN(y) && y > 1900 && (!primerAnioDifunto || y < primerAnioDifunto)) {
          primerAnioDifunto = y;
        }
      }
    }
    if (primerAnioDifunto && primerAnioDifunto > 2020) {
      anioBase = primerAnioDifunto;
    }
  }

  return anioBase;
}

/**
 * Normaliza y combina el historial de mantenimientos/refrendos y los pagos de recibos de una fosa.
 * @param {Object} espacio - Objeto fosa/espacio
 * @returns {Object} Datos consolidados con historial normalizado y métricas
 */
export function obtenerHistorialPagosFosa(espacio) {
  if (!espacio) {
    return {
      listaPagos: [],
      totalPagado: 0,
      ultimoPago: null,
      aniosPagados: [],
      aniosPendientes: [],
      adeudoEstimado: 0,
      estatusActual: 'Al Corriente'
    };
  }

  const lista = [];
  const aniosCubiertosSet = new Set();

  // 1. Extraer pagos registrados en recibos oficiales (historialPagos)
  const pagos = Array.isArray(espacio.historialPagos) ? espacio.historialPagos : [];
  const idsEnPagos = new Set(pagos.map((p) => String(p.id)).filter(Boolean));
  const foliosEnPagos = new Set(pagos.map((p) => String(p.folio || '').trim().toUpperCase()).filter(Boolean));

  // 2. Extraer mantenimientos anuales del dataset o persistencia
  const mantenimientos = Array.isArray(espacio.historialMantenimientos)
    ? espacio.historialMantenimientos
    : [];

  mantenimientos.forEach((m, idx) => {
    const anio = Number(m.anio) || null;
    if (anio && m.estatus !== 'Pendiente') {
      aniosCubiertosSet.add(anio);
    }

    // Evitar duplicar en la lista visual y en el total si este mantenimiento se generó de un recibo
    const folioMant = String(m.folio || '').trim().toUpperCase();
    const pagoIdMant = m.pagoId ? String(m.pagoId) : null;
    const yaEnPagos = (pagoIdMant && idsEnPagos.has(pagoIdMant)) || (folioMant && foliosEnPagos.has(folioMant));

    if (!yaEnPagos) {
      const txt = `${m.concepto || ''} ${m.folio || ''}`.toLowerCase();
      const esFaena = txt.includes('faena');
      const categoria = m.categoria || (esFaena ? 'Faena' : 'MTTO');

      lista.push({
        id: m.id || `mant-${espacio.codigo || espacio.id}-${m.anio || idx}`,
        folio: m.folio || `REF-${m.anio || 'HIST'}`,
        anio: anio,
        fecha: m.fecha || (anio ? `${anio}-01-15` : 'N/D'),
        concepto: m.concepto || (esFaena ? `Cuota de Faena ${anio || ''}` : `Mantenimiento de Fosa ${anio || ''}`).trim(),
        categoria: categoria,
        monto: Number(m.monto) || (esFaena ? CUOTA_FAENA_ANUAL : CUOTA_MTTO_ANUAL),
        metodoPago: m.metodoPago || 'Efectivo en Caja',
        titular: m.titular || espacio.titularNombre || 'Titular Registrado',
        estatus: m.estatus || 'Pagado',
        observaciones: m.observaciones || (esFaena ? 'Cumplimiento o cuota de faena comunitaria.' : 'Cuota anual de mantenimiento catastral (MTTO).'),
        origen: 'mantenimiento'
      });
    }
  });

  // 3. Procesar pagos registrados en recibos oficiales (historialPagos)
  pagos.forEach((p, idx) => {
    const txtPago = `${p.concepto || ''} ${p.observaciones || ''}`.toLowerCase();
    let catPago = p.categoria;
    if (!catPago || catPago === 'Refrendo') {
      if (txtPago.includes('faena') && (txtPago.includes('mtto') || txtPago.includes('mantenimiento'))) {
        catPago = 'MTTO + Faena';
      } else if (txtPago.includes('faena')) {
        catPago = 'Faena';
      } else if (txtPago.includes('mtto') || txtPago.includes('mantenimiento') || txtPago.includes('refrendo')) {
        catPago = 'MTTO';
      } else {
        catPago = p.categoria || (p.concepto?.includes('Refrendo') ? 'MTTO' : 'Servicio');
      }
    }

    // Si el pago especifica una lista de años cubiertos
    if (Array.isArray(p.anios) && p.anios.length > 0) {
      p.anios.forEach((a) => {
        const aNum = Number(a);
        if (aNum) aniosCubiertosSet.add(aNum);
      });
    } else if (
      (catPago === 'Refrendo' || catPago === 'MTTO' || catPago === 'MTTO + Faena') &&
      p.anio &&
      !p.esAbonoParcial &&
      p.marcarAlCorriente !== false
    ) {
      // Sólo si fue asignado de forma unívoca a un año y no fue un abono parcial
      aniosCubiertosSet.add(Number(p.anio));
    }

    lista.push({
      id: p.id || `pago-${espacio.codigo || espacio.id}-${idx}`,
      folio: p.folio || `REC-${Date.now().toString().slice(-4)}`,
      anio: p.anio || null,
      fecha: p.fecha || new Date().toISOString().split('T')[0],
      concepto: p.concepto || 'Pago de Servicios Funerarios',
      categoria: catPago,
      monto: Number(p.monto) || 0,
      metodoPago: p.metodoPago || 'Efectivo en Caja',
      titular: p.titular || espacio.titularNombre || 'Titular Registrado',
      estatus: p.estatus || 'Pagado',
      observaciones: p.observaciones || '',
      origen: p.origen || 'recibo'
    });
  });

  // 3. Ordenar lista cronológicamente descendente (más recientes primero)
  lista.sort((a, b) => {
    const fechaA = a.fecha || '';
    const fechaB = b.fecha || '';
    if (fechaA !== fechaB) return fechaB.localeCompare(fechaA);
    const anioA = a.anio || 0;
    const anioB = b.anio || 0;
    return anioB - anioA;
  });

  // 4. Métricas acumuladas
  const totalPagado = lista.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  const ultimoPago = lista.length > 0 ? lista[0] : null;

  // 5. Análisis de Años y Adeudos
  const aniosPagados = Array.from(aniosCubiertosSet).sort((a, b) => a - b);

  // Fosa disponible o sin difuntos ni titular no genera adeudo
  const esDisponible = (espacio.estatusOcupacion === 'Disponible' || !espacio.estatusOcupacion) &&
    (!espacio.historialDifuntos || espacio.historialDifuntos.length === 0) &&
    (!espacio.titularNombre || espacio.titularNombre.toLowerCase().includes('disponible') || espacio.titularNombre.toLowerCase().includes('sin titular'));

  if (esDisponible) {
    return {
      listaPagos: lista,
      totalPagado,
      ultimoPago,
      aniosPagados,
      aniosPendientes: [],
      adeudoEstimado: 0,
      estatusActual: 'Al Corriente'
    };
  }

  // Año de inicio de evaluación fijo para no brincar rezagos cuando se pague año actual
  const anioInicioEvaluacion = obtenerAnioInicioEvaluacion(espacio);

  const aniosPendientes = [];
  for (let y = anioInicioEvaluacion; y <= ANIO_ACTUAL; y++) {
    if (!aniosCubiertosSet.has(y)) {
      aniosPendientes.push(y);
    }
  }

  const adeudoEstimado = aniosPendientes.length * CUOTA_REFRENDO_ANUAL;
  const estatusActual = aniosPendientes.length === 0 ? 'Al Corriente' : 'Con Adeudo';

  return {
    listaPagos: lista,
    totalPagado,
    ultimoPago,
    aniosPagados,
    aniosPendientes,
    adeudoEstimado,
    estatusActual
  };
}

/**
 * Calcula de forma rápida el estatus de pago de un espacio ('Al Corriente', 'Con Adeudo', 'Abandonada').
 */
export function calcularEstatusPagoFosa(espacio) {
  if (!espacio) return 'Al Corriente';
  if (espacio.estatusPago === 'Abandonada') return 'Abandonada';
  return obtenerHistorialPagosFosa(espacio).estatusActual;
}

/**
 * Agrega un nuevo pago al objeto fosa preservando la inmutabilidad y aplicando el principio contable
 * de antigüedad para abonos parciales (se cubren los años más antiguos primero y la fosa se mantiene 'Con Adeudo').
 */
export function agregarPagoAFosa(espacio, nuevoPago) {
  if (!espacio) return espacio;

  const historialPagosActual = Array.isArray(espacio.historialPagos) ? [...espacio.historialPagos] : [];
  const historialMantenimientosActual = Array.isArray(espacio.historialMantenimientos)
    ? [...espacio.historialMantenimientos]
    : [];

  // 1. Obtener situación de adeudos antes de este pago
  const situacionActual = obtenerHistorialPagosFosa(espacio);
  const aniosPendientes = [...situacionActual.aniosPendientes];
  const monto = Number(nuevoPago.monto) || 0;

  // 2. Determinar si es liquidación total forzada o si cubre el adeudo completo
  const esLiquidacionForzada = nuevoPago.marcarAlCorriente === true;
  const cubreTotalidad = situacionActual.adeudoEstimado > 0 && monto >= situacionActual.adeudoEstimado;
  const esLiquidacion = esLiquidacionForzada || (cubreTotalidad && nuevoPago.marcarAlCorriente !== false);

  // 3. Determinar qué años cubre este pago
  let aniosCubiertos = [];

  if (Array.isArray(nuevoPago.anios) && nuevoPago.anios.length > 0) {
    // Si se enviaron años específicos
    aniosCubiertos = nuevoPago.anios.map(Number);
  } else if (esLiquidacion) {
    // Si liquida todo, cubre todos los años pendientes
    aniosCubiertos = [...aniosPendientes];
  } else if (
    nuevoPago.categoria === 'Refrendo' ||
    nuevoPago.categoria === 'MTTO' ||
    nuevoPago.categoria === 'Faena' ||
    nuevoPago.categoria === 'MTTO + Faena' ||
    nuevoPago.concepto?.toLowerCase().includes('refrendo') ||
    nuevoPago.concepto?.toLowerCase().includes('mantenimiento') ||
    nuevoPago.concepto?.toLowerCase().includes('mtto') ||
    nuevoPago.concepto?.toLowerCase().includes('faena') ||
    nuevoPago.concepto?.toLowerCase().includes('abono')
  ) {
    // Es un abono o pago parcial: se cubren los años más antiguos primero
    const cuotaAnual = CUOTA_REFRENDO_ANUAL;
    const numAniosCubiertos = Math.floor(monto / cuotaAnual);

    if (numAniosCubiertos > 0 && aniosPendientes.length > 0) {
      aniosCubiertos = aniosPendientes.slice(0, numAniosCubiertos);
    } else if (nuevoPago.anio && !isNaN(Number(nuevoPago.anio))) {
      aniosCubiertos = [Number(nuevoPago.anio)];
    }
  }

  // 4. Normalizar el objeto de pago para historialPagos
  const esAbono = !esLiquidacion && (aniosPendientes.length === 0 || aniosCubiertos.length < aniosPendientes.length);
  const pagoNormalizado = {
    id: nuevoPago.id || Date.now(),
    folio: nuevoPago.folio || `REC-${Date.now().toString().slice(-4)}`,
    folioFisico: nuevoPago.folioFisico || '',
    origen: nuevoPago.origen || 'recibo',
    fecha: nuevoPago.fecha || new Date().toISOString().split('T')[0],
    concepto: nuevoPago.concepto || 'Refrendo Anual de Fosa',
    categoria: nuevoPago.categoria || 'Refrendo',
    monto: monto,
    metodoPago: nuevoPago.metodoPago || 'Efectivo en Caja',
    titular: nuevoPago.titular || espacio.titularNombre || '',
    estatus: 'Pagado',
    anios: aniosCubiertos,
    anio: aniosCubiertos.length > 0 ? aniosCubiertos[0] : null,
    esAbonoParcial: esAbono,
    marcarAlCorriente: esLiquidacion,
    observaciones: nuevoPago.observaciones || ''
  };

  historialPagosActual.unshift(pagoNormalizado);

  // 5. Actualizar historialMantenimientos con los años cubiertos vinculados a este pago
  if (aniosCubiertos.length > 0) {
    const montoPorAnio = monto > 0 ? monto / aniosCubiertos.length : CUOTA_REFRENDO_ANUAL;

    aniosCubiertos.forEach((yr) => {
      const idxExistente = historialMantenimientosActual.findIndex((m) => Number(m.anio) === yr);
      if (idxExistente >= 0) {
        historialMantenimientosActual[idxExistente] = {
          ...historialMantenimientosActual[idxExistente],
          pagoId: pagoNormalizado.id,
          estatus: 'Pagado',
          monto: montoPorAnio,
          fecha: pagoNormalizado.fecha,
          folio: pagoNormalizado.folio
        };
      } else {
        historialMantenimientosActual.push({
          id: `mant-${espacio.codigo || espacio.id}-${yr}`,
          pagoId: pagoNormalizado.id,
          anio: yr,
          monto: montoPorAnio,
          fecha: pagoNormalizado.fecha,
          estatus: 'Pagado',
          folio: pagoNormalizado.folio
        });
      }
    });
    historialMantenimientosActual.sort((a, b) => Number(a.anio) - Number(b.anio));
  }

  // 6. Determinar el estatus final de la fosa
  const aniosRestantes = aniosPendientes.filter((yr) => !aniosCubiertos.includes(yr));
  let nuevoEstatusPago;

  if (espacio.estatusPago === 'Abandonada') {
    nuevoEstatusPago = 'Abandonada';
  } else if ((esLiquidacion || aniosRestantes.length === 0) && nuevoPago.marcarAlCorriente !== false) {
    nuevoEstatusPago = 'Al Corriente';
  } else {
    nuevoEstatusPago = 'Con Adeudo';
  }

  return {
    ...espacio,
    historialPagos: historialPagosActual,
    historialMantenimientos: historialMantenimientosActual,
    estatusPago: nuevoEstatusPago
  };
}

/**
 * Elimina un pago del historial de una fosa y recalcula su estatus financiero.
 */
export function eliminarPagoDeFosa(espacio, pagoId) {
  if (!espacio) return espacio;

  const historialPagosActual = (espacio.historialPagos || []).filter((p) => String(p.id) !== String(pagoId));
  const historialMantenimientosActual = (espacio.historialMantenimientos || []).filter(
    (m) => String(m.id) !== String(pagoId) && String(m.folio) !== String(pagoId)
  );

  const fosaModificada = {
    ...espacio,
    historialPagos: historialPagosActual,
    historialMantenimientos: historialMantenimientosActual
  };

  return {
    ...fosaModificada,
    estatusPago: calcularEstatusPagoFosa(fosaModificada)
  };
}
