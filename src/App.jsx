// src/App.jsx
import { useState, useEffect, useRef, useCallback } from 'react';

// Tiempo máximo de inactividad permitido antes de cerrar la sesión automáticamente (10 minutos)
const TIEMPO_MAXIMO_INACTIVIDAD_MS = 10 * 60 * 1000;

// Componentes comunes y autenticación
import Login from './components/auth/Login';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ContextMenu from './components/common/ContextMenu';
import ModalRegistroFosa from './components/modals/ModalRegistroFosa';
import ModalEditarFosa from './components/modals/ModalEditarFosa';
import ModalReciboPago from './components/modals/ModalReciboPago';
import ModalHistorialPagos from './components/modals/ModalHistorialPagos';
import ModalExpedienteElectronico from './components/modals/ModalExpedienteElectronico';
import ModalAlerta from './components/common/ModalAlerta';

// Vistas / Páginas
import Dashboard from './pages/Dashboard';
import ControlEspacios from './pages/ControlEspacios';
import PlanoGeneral from './pages/PlanoGeneral';
import FinanzasCaja from './pages/FinanzasCaja';
import ReportesIngresos from './pages/ReportesIngresos';

// Servicios de persistencia y base de datos
import { panteonService } from './services/panteonService';

// Constantes y datos iniciales
import { 
  SECCIONES_INICIALES, 
  DISTRIBUCION_PLANO_INICIAL, 
  REGISTROS_FOSAS_INICIALES,
  MOVIMIENTOS_FINANCIEROS_INICIALES
} from './constants/panteonData';

export default function App() {
  // 1. Estado de Sesión y Autenticación Administrativa
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    const sesion = localStorage.getItem('panteon_session') || sessionStorage.getItem('panteon_session');
    if (sesion) {
      try {
        return JSON.parse(sesion);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [motivoLogout, setMotivoLogout] = useState(null);
  const ultimoAccesoRef = useRef(0);
  const timerInactividadRef = useRef(null);

  // 2. Estado de Navegación y UI
  const [pestanaActiva, setPestanaActiva] = useState('dashboard'); // 'dashboard' | 'espacios' | 'busqueda' | 'mapa' | 'finanzas' | 'reportes'
  const [menuColapsado, setMenuColapsado] = useState(false);
  const [menuMobileAbierto, setMenuMobileAbierto] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');

  // 3. Estados de Datos Centrales
  const [registrosFosas, setRegistrosFosas] = useState(REGISTROS_FOSAS_INICIALES);
  const [secciones] = useState(SECCIONES_INICIALES);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState('Todas');
  const [distribucionPlano, setDistribucionPlano] = useState(DISTRIBUCION_PLANO_INICIAL);
  const [movimientosFinancieros, setMovimientosFinancieros] = useState(MOVIMIENTOS_FINANCIEROS_INICIALES);

  // 4. Modales y Menús Emergentes
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [registroAEditar, setRegistroAEditar] = useState(null);
  const [reciboModalItem, setReciboModalItem] = useState(null);
  const [fosaHistorialModal, setFosaHistorialModal] = useState(null);
  const [expedienteModal, setExpedienteModal] = useState({
    abierto: false,
    espacio: null,
    modoInicial: 'expediente' // 'expediente' (adjuntar/gestionar) | 'visor' (abrir visor directo)
  });
  const [alertaGlobal, setAlertaGlobal] = useState(null);
  const [menuContextual, setMenuContextual] = useState({
    visible: false,
    x: 0,
    y: 0,
    itemSeleccionado: null
  });

  // Cargar datos persistentes de la Base de Datos (IndexedDB) al iniciar
  useEffect(() => {
    let montado = true;
    async function cargarDatosPersistentes() {
      try {
        const [fosasDB, movsDB] = await Promise.all([
          panteonService.obtenerEspacios(),
          panteonService.obtenerMovimientosFinancieros()
        ]);
        if (montado) {
          if (Array.isArray(fosasDB) && fosasDB.length > 0) {
            setRegistrosFosas(fosasDB);
          }
          if (Array.isArray(movsDB) && movsDB.length > 0) {
            setMovimientosFinancieros(movsDB);
          }
        }
      } catch (err) {
        console.error('Error al inicializar datos desde base de datos:', err);
      }
    }
    cargarDatosPersistentes();
    return () => { montado = false; };
  }, []);

  // Escuchar cierre de menú contextual al hacer clic en cualquier parte
  useEffect(() => {
    const handleCerrarMenu = () => {
      if (menuContextual.visible) {
        setMenuContextual({ visible: false, x: 0, y: 0, itemSeleccionado: null });
      }
    };
    window.addEventListener('click', handleCerrarMenu);
    return () => window.removeEventListener('click', handleCerrarMenu);
  }, [menuContextual.visible]);

  // Handlers de Autenticación
  const handleLogout = useCallback((motivo = null) => {
    setUsuarioAutenticado(null);
    localStorage.removeItem('panteon_session');
    sessionStorage.removeItem('panteon_session');
    setModalRegistroAbierto(false);
    setRegistroAEditar(null);
    setReciboModalItem(null);
    setFosaHistorialModal(null);
    setExpedienteModal({ abierto: false, espacio: null, modoInicial: 'expediente' });
    setMenuContextual({ visible: false, x: 0, y: 0, itemSeleccionado: null });
    if (motivo) {
      setMotivoLogout(motivo);
    }
  }, []);

  const handleLogin = (datosUsuario) => {
    setMotivoLogout(null);
    ultimoAccesoRef.current = Date.now();
    setUsuarioAutenticado(datosUsuario);
    if (datosUsuario.recordar) {
      localStorage.setItem('panteon_session', JSON.stringify(datosUsuario));
    } else {
      sessionStorage.setItem('panteon_session', JSON.stringify(datosUsuario));
    }
  };

  // Detector de Inactividad: Cierra la sesión automáticamente tras 10 minutos sin interacción
  useEffect(() => {
    if (!usuarioAutenticado) return;

    // Reinicia el temporizador de inactividad
    const reiniciarTemporizador = () => {
      ultimoAccesoRef.current = Date.now();
      if (timerInactividadRef.current) {
        clearTimeout(timerInactividadRef.current);
      }
      timerInactividadRef.current = setTimeout(() => {
        handleLogout('Tu sesión ha finalizado automáticamente por 10 minutos de inactividad.');
      }, TIEMPO_MAXIMO_INACTIVIDAD_MS);
    };

    // Verificación de respaldo (útil si la computadora entra en reposo o la pestaña estuvo en segundo plano)
    const verificarInactividad = () => {
      const tiempoTranscurrido = Date.now() - ultimoAccesoRef.current;
      if (tiempoTranscurrido >= TIEMPO_MAXIMO_INACTIVIDAD_MS) {
        handleLogout('Tu sesión ha finalizado automáticamente por 10 minutos de inactividad.');
      } else {
        const tiempoRestante = TIEMPO_MAXIMO_INACTIVIDAD_MS - tiempoTranscurrido;
        if (timerInactividadRef.current) {
          clearTimeout(timerInactividadRef.current);
        }
        timerInactividadRef.current = setTimeout(() => {
          handleLogout('Tu sesión ha finalizado automáticamente por 10 minutos de inactividad.');
        }, tiempoRestante);
      }
    };

    // Eventos del usuario que cuentan como actividad en el sistema
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Throttle ligero para no ejecutar reiniciarTemporizador cientos de veces por segundo en mousemove
    let ultimoRegistro = 0;
    const manejadorActividad = () => {
      const ahora = Date.now();
      if (ahora - ultimoRegistro > 1000) {
        ultimoRegistro = ahora;
        reiniciarTemporizador();
      }
    };

    // Iniciar temporizador inicial
    reiniciarTemporizador();

    // Registrar escuchadores globales
    eventos.forEach(evento => {
      window.addEventListener(evento, manejadorActividad, { passive: true });
    });

    // Detectar cuando el usuario regresa a la pestaña
    const handleVisibilidad = () => {
      if (document.visibilityState === 'visible') {
        verificarInactividad();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilidad);
    window.addEventListener('focus', verificarInactividad);

    // Chequeo periódico cada 30 segundos
    const intervaloVerificacion = setInterval(verificarInactividad, 30000);

    return () => {
      if (timerInactividadRef.current) {
        clearTimeout(timerInactividadRef.current);
      }
      clearInterval(intervaloVerificacion);
      eventos.forEach(evento => {
        window.removeEventListener(evento, manejadorActividad);
      });
      document.removeEventListener('visibilitychange', handleVisibilidad);
      window.removeEventListener('focus', verificarInactividad);
    };
  }, [usuarioAutenticado, handleLogout]);

  // Handlers de Negocio con Persistencia en Base de Datos
  const handleGuardarRegistro = async (nuevoRegistro) => {
    const registroCompleto = {
      ...nuevoRegistro,
      id: nuevoRegistro.id || Date.now(),
      codigo: nuevoRegistro.codigo || nuevoRegistro.numeroEspacio || `F-${Date.now().toString().slice(-4)}`
    };

    setRegistrosFosas(prev => [registroCompleto, ...prev]);

    // Guardar en la base de datos permanente
    await panteonService.guardarEspacio(registroCompleto);
    if (registroCompleto.codigo && registroCompleto.expediente) {
      await panteonService.guardarExpediente(registroCompleto.codigo, registroCompleto.expediente);
    }

    setAlertaGlobal({
      tipo: 'exito',
      titulo: 'Registro Exitoso',
      mensaje: `¡Fosa registrada exitosamente con el código ${registroCompleto.codigo}! Los documentos y datos se han guardado en la base de datos.`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => setAlertaGlobal(null)
    });
  };

  const handleActualizarRegistro = async (registroModificado) => {
    setRegistrosFosas(prev => prev.map(item => item.id === registroModificado.id ? registroModificado : item));

    if (fosaHistorialModal && (fosaHistorialModal.id === registroModificado.id || fosaHistorialModal.codigo === registroModificado.codigo)) {
      setFosaHistorialModal(registroModificado);
    }

    // Guardar en la base de datos permanente
    await panteonService.guardarEspacio(registroModificado);

    setAlertaGlobal({
      tipo: 'exito',
      titulo: 'Fosa Actualizada',
      mensaje: `¡Fosa ${registroModificado.codigo} actualizada correctamente en la base de datos!`,
      textoBotonPrincipal: 'Aceptar',
      onAceptar: () => setAlertaGlobal(null)
    });
  };

  const handleAbrirHistorial = (espacio, opciones = {}) => {
    const espacioMasReciente = (registrosFosas || []).find(r => r.id === espacio?.id || (r.codigo && r.codigo === espacio?.codigo)) || espacio;
    setFosaHistorialModal({ ...espacioMasReciente, _opcionesHistorial: opciones });
  };

  const handleAbrirExpediente = (espacio, modo = 'expediente') => {
    const espacioMasReciente = (registrosFosas || []).find(r => r.id === espacio?.id || (r.codigo && r.codigo === espacio?.codigo)) || espacio;
    setExpedienteModal({
      abierto: true,
      espacio: espacioMasReciente,
      modoInicial: modo
    });
  };

  const handleActualizarExpediente = async (espacioActualizado) => {
    setRegistrosFosas(prev => prev.map(item => {
      const matchId = item.id && espacioActualizado.id && String(item.id) === String(espacioActualizado.id);
      const matchCodigo = item.codigo && espacioActualizado.codigo && item.codigo.trim().toUpperCase() === espacioActualizado.codigo.trim().toUpperCase();
      return (matchId || matchCodigo) ? espacioActualizado : item;
    }));

    if (expedienteModal.espacio) {
      const modalMatch = (expedienteModal.espacio.id && espacioActualizado.id && String(expedienteModal.espacio.id) === String(espacioActualizado.id)) ||
                         (expedienteModal.espacio.codigo && espacioActualizado.codigo && expedienteModal.espacio.codigo.trim().toUpperCase() === espacioActualizado.codigo.trim().toUpperCase());
      if (modalMatch) {
        setExpedienteModal(prev => ({ ...prev, espacio: espacioActualizado }));
      }
    }

    if (registroAEditar) {
      const editMatch = (registroAEditar.id && espacioActualizado.id && String(registroAEditar.id) === String(espacioActualizado.id)) ||
                        (registroAEditar.codigo && espacioActualizado.codigo && registroAEditar.codigo.trim().toUpperCase() === espacioActualizado.codigo.trim().toUpperCase());
      if (editMatch) {
        setRegistroAEditar(espacioActualizado);
      }
    }

    // Guardar en la base de datos permanente (fosa + expediente con todos los archivos adjuntos)
    await panteonService.guardarEspacio(espacioActualizado);
    if (espacioActualizado.codigo && espacioActualizado.expediente) {
      await panteonService.guardarExpediente(espacioActualizado.codigo, espacioActualizado.expediente);
    }
  };

  const handleRegistrarMovimiento = async (nuevoMov) => {
    setMovimientosFinancieros(prev => [nuevoMov, ...prev]);
    await panteonService.registrarMovimiento(nuevoMov);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setMenuContextual({ visible: true, x: e.clientX, y: e.clientY, itemSeleccionado: item });
  };

  const handleEditarCeldaSeccion = (celdaId) => {
    const celdaActual = distribucionPlano.find(c => c.celda === celdaId);
    const nuevoNombre = prompt(
      `Indica qué sección o área va en la Casilla #${celdaId} (Columna ${celdaActual?.col}, Fila ${celdaActual?.fila}):`,
      celdaActual?.nombreSeccion || ''
    );
    if (nuevoNombre !== null && nuevoNombre.trim() !== '') {
      setDistribucionPlano(prev => prev.map(c => c.celda === celdaId ? { ...c, nombreSeccion: nuevoNombre.trim() } : c));
    }
  };

  // Métricas calculadas
  const totalConAdeudo = (registrosFosas || []).filter(r => r.estatusPago === 'Con Adeudo').length;

  const totalIngresos = (movimientosFinancieros || [])
    .filter(m => (m.tipo === 'Ingreso' || m.tipo_movimiento === 'Ingreso'))
    .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

  const totalEgresos = (movimientosFinancieros || [])
    .filter(m => (m.tipo === 'Egreso' || m.tipo_movimiento === 'Egreso'))
    .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);

  const saldoEnCaja = totalIngresos - totalEgresos;

  // Si no hay sesión activa, mostramos la pantalla de Login
  if (!usuarioAutenticado) {
    return <Login onLogin={handleLogin} mensajeInactividad={motivoLogout} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] text-stone-800 antialiased font-sans relative">
      
      {/* Overlay Backdrop para Menú Móvil */}
      {menuMobileAbierto && (
        <div 
          onClick={() => setMenuMobileAbierto(false)} 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden animate-fadeIn" 
        />
      )}

      {/* Sidebar Dual Moderno Responsivo */}
      <Sidebar
        pestanaActiva={pestanaActiva}
        onCambiarPestana={(tab) => {
          setPestanaActiva(tab);
          setMenuMobileAbierto(false);
        }}
        totalEspacios={registrosFosas.length}
        saldoCaja={saldoEnCaja}
        menuColapsado={menuColapsado}
        onToggleColapsar={() => setMenuColapsado(prev => !prev)}
        mobileAbierto={menuMobileAbierto}
        onCerrarMobile={() => setMenuMobileAbierto(false)}
      />

      {/* Contenedor Principal (Header + Vistas de Contenido) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Header Superior Corporativo con Buscador Universal */}
        <Header
          pestanaActiva={pestanaActiva}
          busquedaGlobal={busquedaGlobal}
          onBusquedaChange={setBusquedaGlobal}
          registrosFosas={registrosFosas}
          onSeleccionarFosa={(item) => setRegistroAEditar(item)}
          onNavegarAPadron={(query) => {
            setBusquedaGlobal(query);
            setPestanaActiva('busqueda');
          }}
          totalConAdeudo={totalConAdeudo}
          usuarioActual={usuarioAutenticado}
          onCerrarSesion={handleLogout}
          onToggleMobileMenu={() => setMenuMobileAbierto(prev => !prev)}
        />

        {/* Área con Scroll de la Vista Activa */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="w-full max-w-[1920px] mx-auto space-y-6">

            {/* Vista 1: Dashboard Ejecutivo Estilo SaaS */}
            {pestanaActiva === 'dashboard' && (
              <Dashboard
                registrosFosas={registrosFosas}
                movimientosFinancieros={movimientosFinancieros}
                onCambiarPestana={setPestanaActiva}
                onAbrirModalRegistro={() => setModalRegistroAbierto(true)}
              />
            )}

            {/* Vista 2: Padrón de Fosas y Nichos / Búsqueda */}
            {(pestanaActiva === 'espacios' || pestanaActiva === 'busqueda') && (
              <ControlEspacios
                secciones={secciones}
                seccionSeleccionada={seccionSeleccionada}
                onCambiarSeccion={setSeccionSeleccionada}
                registrosFosas={registrosFosas}
                busquedaGlobal={busquedaGlobal}
                onBusquedaChange={setBusquedaGlobal}
                onAbrirModalRegistro={() => setModalRegistroAbierto(true)}
                onSeleccionarRegistro={setRegistroAEditar}
                onAbrirExpediente={handleAbrirExpediente}
                onAbrirHistorial={handleAbrirHistorial}
                onContextMenu={handleContextMenu}
                onRegistrarMovimiento={handleRegistrarMovimiento}
                onActualizarFosa={handleActualizarRegistro}
                enfocarBusqueda={pestanaActiva === 'busqueda'}
              />
            )}

            {/* Vista 3: Plano General del Panteón */}
            {pestanaActiva === 'mapa' && (
              <PlanoGeneral
                distribucionPlano={distribucionPlano}
                registrosFosas={registrosFosas}
                onEditarCeldaSeccion={handleEditarCeldaSeccion}
                onEditarFosa={setRegistroAEditar}
                onAbrirExpediente={handleAbrirExpediente}
                onAbrirHistorial={handleAbrirHistorial}
                onRegistrarMovimiento={handleRegistrarMovimiento}
                onActualizarFosa={handleActualizarRegistro}
              />
            )}

            {/* Vista 4: Control de Caja y Gastos */}
            {pestanaActiva === 'finanzas' && (
              <FinanzasCaja
                movimientos={movimientosFinancieros}
                onRegistrarMovimiento={handleRegistrarMovimiento}
              />
            )}

            {/* Vista 5: Reportes y Estadísticas de Ocupación */}
            {pestanaActiva === 'reportes' && (
              <ReportesIngresos
                registrosFosas={registrosFosas}
                secciones={secciones}
                movimientosFinancieros={movimientosFinancieros}
                onVolver={() => setPestanaActiva('dashboard')}
              />
            )}

          </div>
        </main>

      </div>

      {/* Menú Contextual (Clic derecho en cualquier fosa) */}
      {menuContextual.visible && (
        <ContextMenu
          x={menuContextual.x}
          y={menuContextual.y}
          registro={menuContextual.itemSeleccionado}
          onEditar={(item) => setRegistroAEditar(item)}
          onAbrirExpediente={handleAbrirExpediente}
          onAbrirHistorial={handleAbrirHistorial}
          onEmitirRecibo={(item) => setReciboModalItem(item)}
          onImprimirTitulo={(item) => setRegistroAEditar(item)}
          onClose={() => setMenuContextual({ visible: false, x: 0, y: 0, itemSeleccionado: null })}
        />
      )}

      {/* Modal de Registro de Nueva Fosa */}
      <ModalRegistroFosa
        abierto={modalRegistroAbierto}
        onClose={() => setModalRegistroAbierto(false)}
        secciones={secciones}
        registrosActuales={registrosFosas}
        onGuardar={handleGuardarRegistro}
      />

      {/* Modal de Edición de Fosa */}
      {registroAEditar && (
        <ModalEditarFosa
          registro={registroAEditar}
          onClose={() => setRegistroAEditar(null)}
          onGuardar={handleActualizarRegistro}
          onAbrirExpediente={handleAbrirExpediente}
          onAbrirHistorial={handleAbrirHistorial}
        />
      )}

      {/* Modal de Cobro y Recibo Oficial de Pago */}
      {reciboModalItem && (
        <ModalReciboPago
          espacio={reciboModalItem}
          registrosFosas={registrosFosas}
          onCerrar={() => setReciboModalItem(null)}
          onRegistrarMovimiento={handleRegistrarMovimiento}
          onActualizarFosa={handleActualizarRegistro}
        />
      )}

      {/* Modal de Historial de Pagos y Refrendos por Tumba */}
      {fosaHistorialModal && (
        <ModalHistorialPagos
          abierto={!!fosaHistorialModal}
          espacio={fosaHistorialModal}
          onCerrar={() => setFosaHistorialModal(null)}
          onEmitirRecibo={(item) => {
            setReciboModalItem(item);
          }}
          onRegistrarMovimiento={handleRegistrarMovimiento}
          onActualizarFosa={(fosaActualizada) => {
            setFosaHistorialModal(fosaActualizada);
            handleActualizarRegistro(fosaActualizada);
          }}
        />
      )}

      {/* Modal de Expediente Electrónico Digital */}
      {expedienteModal.abierto && (
        <ModalExpedienteElectronico
          abierto={expedienteModal.abierto}
          espacio={expedienteModal.espacio}
          modoInicial={expedienteModal.modoInicial}
          onCerrar={() => setExpedienteModal({ abierto: false, espacio: null, modoInicial: 'expediente' })}
          onActualizarEspacio={handleActualizarExpediente}
        />
      )}

      {/* Modal de Alerta / Notificación Global Centrado */}
      {alertaGlobal && (
        <ModalAlerta
          abierto={!!alertaGlobal}
          tipo={alertaGlobal.tipo}
          titulo={alertaGlobal.titulo}
          mensaje={alertaGlobal.mensaje}
          textoBotonPrincipal={alertaGlobal.textoBotonPrincipal}
          textoBotonSecundario={alertaGlobal.textoBotonSecundario}
          onAceptar={alertaGlobal.onAceptar}
          onCancelar={alertaGlobal.onCancelar}
          onCerrar={() => setAlertaGlobal(null)}
        />
      )}

    </div>
  );
}