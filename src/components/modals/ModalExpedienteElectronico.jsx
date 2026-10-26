// src/components/modals/ModalExpedienteElectronico.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  UploadCloud, 
  Eye, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  FileCheck, 
  ShieldCheck, 
  Folder, 
  FolderPlus, 
  User, 
  Calendar, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  Plus,
  FileImage
} from 'lucide-react';
import { 
  DOCUMENTOS_REQUERIDOS, 
  calcularEstadoExpediente, 
  leerArchivoParaExpediente 
} from '../../constants/expedienteConfig';
import ModalAlerta from '../common/ModalAlerta';
import { panteonService } from '../../services/panteonService';

export default function ModalExpedienteElectronico({
  abierto = false,
  isOpen = false,
  espacio = null,
  fosa = null,
  modoInicial = 'expediente', // 'expediente' (adjuntar/gestionar) | 'visor' (abrir visor de documentos directo)
  onCerrar,
  onClose,
  onActualizarEspacio
}) {
  const visible = abierto || isOpen;
  const item = espacio || fosa;

  // Estado del expediente local (para permitir cambios reactivos inmediatos)
  const [documentos, setDocumentos] = useState({});
  const [cargandoId, setCargandoId] = useState(null);
  const [vistaActual, setVistaActual] = useState('cuadricula'); // 'cuadricula' (cuadros de carga directos) | 'tabla'
  const [filtroCategoria, setFiltroCategoria] = useState('todos'); // 'todos' | 'difunto' | 'titular' | 'adicional'
  
  // Estado para el Visor / Lightbox de Documentos
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [modoActual, setModoActual] = useState(modoInicial);
  const [difuntoActivoIdx, setDifuntoActivoIdx] = useState(0);

  // Modal para agregar documento adicional personalizado
  const [mostrarModalDocAdicional, setMostrarModalDocAdicional] = useState(false);
  const [nuevoDocAdicional, setNuevoDocAdicional] = useState({
    titulo: '',
    categoria: 'adicional'
  });

  // Estado de Alerta/Confirmación Modal
  const [alertaConfig, setAlertaConfig] = useState(null);

  const handleClose = useCallback(() => {
    if (onCerrar) onCerrar();
    if (onClose) onClose();
  }, [onCerrar, onClose]);

  // Cargar documentos del espacio recibido desde IndexedDB
  useEffect(() => {
    let activo = true;

    async function cargarYConfigurar() {
      if (visible && item) {
        let docsIniciales = { ...(item.expediente?.documentos || item.expediente || {}) };

        // Consultar base de datos IndexedDB para asegurar la versión persistida más reciente
        if (item.codigo) {
          try {
            const [expPersistido, adjuntosPersistidos] = await Promise.all([
              panteonService.obtenerExpediente(item.codigo),
              panteonService.obtenerAdjuntos(item.codigo)
            ]);

            if (activo) {
              if (expPersistido && expPersistido.documentos) {
                docsIniciales = {
                  ...docsIniciales,
                  ...expPersistido.documentos
                };
              }

              if (Array.isArray(adjuntosPersistidos) && adjuntosPersistidos.length > 0) {
                for (const adj of adjuntosPersistidos) {
                  const idDoc = adj.docId || adj.id;
                  if (idDoc) {
                    docsIniciales[idDoc] = {
                      id: idDoc,
                      adjuntado: true,
                      ...adj
                    };
                  }
                }
              }
            }
          } catch (e) {
            console.error('Error al sincronizar expediente con DB:', e);
          }
        }

        if (!activo) return;

        setDocumentos(docsIniciales);
        setModoActual(modoInicial);
        setVistaActual('cuadricula');

        // Construir lista de adjuntos disponibles para el visor
        const adjuntos = Object.entries(docsIniciales)
          .filter(([, data]) => !!data && (data.adjuntado || !!data.dataUrl))
          .map(([idDoc, data]) => {
            const configReq = DOCUMENTOS_REQUERIDOS.find(d => d.id === idDoc);
            return {
              id: idDoc,
              titulo: data.titulo || configReq?.titulo || idDoc,
              descripcion: data.descripcion || configReq?.descripcion || '',
              categoria: data.categoria || configReq?.categoria || 'adicional',
              ...data
            };
          });

        if (modoInicial === 'visor') {
          if (adjuntos.length > 0) {
            setDocumentoSeleccionado(adjuntos[0]);
            setZoomNivel(1);
            setRotacion(0);
          } else {
            setDocumentoSeleccionado(null);
            setAlertaConfig({
              tipo: 'info',
              titulo: 'Expediente Sin Documentos',
              mensaje: 'Este lote aún no cuenta con documentos o imágenes adjuntas en su expediente. A continuación puedes adjuntarlos.',
              textoBotonPrincipal: 'Adjuntar Documentos',
              onAceptar: () => {
                setModoActual('expediente');
                setAlertaConfig(null);
              }
            });
          }
        } else {
          setDocumentoSeleccionado(null);
        }
      }
    }

    cargarYConfigurar();
    return () => { activo = false; };
  }, [visible, item, modoInicial]);

  // Lista de todos los documentos actualmente adjuntados para la tabla y visor
  const listaAdjuntos = useMemo(() => {
    const todosMap = new Map();

    // 1. Incorporar documentos de la lista fija requerida si están adjuntados
    DOCUMENTOS_REQUERIDOS.forEach(doc => {
      const data = documentos[doc.id];
      if (data && (data.adjuntado || data.dataUrl)) {
        todosMap.set(doc.id, {
          ...doc,
          ...data,
          esRequerido: true
        });
      }
    });

    // 2. Incorporar cualquier otro documento adicional presente en el objeto
    Object.entries(documentos).forEach(([key, data]) => {
      if (data && (data.adjuntado || data.dataUrl) && !todosMap.has(key)) {
        todosMap.set(key, {
          id: key,
          titulo: data.titulo || key,
          descripcion: data.descripcion || 'Documento complementario',
          categoria: data.categoria || 'adicional',
          esRequerido: false,
          ...data
        });
      }
    });

    return Array.from(todosMap.values());
  }, [documentos]);

  // Índice del documento actualmente visualizado en el visor
  const indiceActual = useMemo(() => {
    if (!documentoSeleccionado || listaAdjuntos.length === 0) return -1;
    return listaAdjuntos.findIndex(d => d.id === documentoSeleccionado.id);
  }, [documentoSeleccionado, listaAdjuntos]);

  // Cerrar el visor de documentos
  const handleCerrarVisor = useCallback(() => {
    setDocumentoSeleccionado(null);
    if (modoActual === 'visor') {
      handleClose();
    }
  }, [modoActual, handleClose]);

  // Navegación secuencial de documentos en el visor
  const handleNavegarDocumento = useCallback((direccion) => {
    if (listaAdjuntos.length <= 1 || indiceActual === -1) return;
    
    let nuevoIndice;
    if (direccion === 'siguiente') {
      nuevoIndice = (indiceActual + 1) % listaAdjuntos.length;
    } else {
      nuevoIndice = (indiceActual - 1 + listaAdjuntos.length) % listaAdjuntos.length;
    }

    setDocumentoSeleccionado(listaAdjuntos[nuevoIndice]);
    setZoomNivel(1);
    setRotacion(0);
  }, [listaAdjuntos, indiceActual]);

  // Teclado: Escape para cerrar, Flechas para navegar documentos
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!visible) return;

      if (e.key === 'Escape') {
        if (alertaConfig) {
          setAlertaConfig(null);
        } else if (mostrarModalDocAdicional) {
          setMostrarModalDocAdicional(false);
        } else if (documentoSeleccionado) {
          handleCerrarVisor();
        } else {
          handleClose();
        }
      } else if (documentoSeleccionado && listaAdjuntos.length > 1) {
        if (e.key === 'ArrowRight') {
          handleNavegarDocumento('siguiente');
        } else if (e.key === 'ArrowLeft') {
          handleNavegarDocumento('anterior');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, documentoSeleccionado, listaAdjuntos, indiceActual, modoActual, alertaConfig, mostrarModalDocAdicional, handleClose, handleCerrarVisor, handleNavegarDocumento]);

  if (!visible || !item) return null;

  // Cálculo de estado del expediente
  const estadoExp = calcularEstadoExpediente({ documentos });

  // Manejador de subida de archivo para una ranura o documento adicional
  const handleSubirArchivo = async (docId, archivo, infoDoc = {}) => {
    if (!archivo || !item.codigo) return;
    setCargandoId(docId);

    try {
      const datosArchivo = await leerArchivoParaExpediente(archivo);
      
      const objetoArchivoFinal = {
        id: docId,
        docId: docId,
        adjuntado: true,
        codigo: item.codigo,
        titularNombre: item.titularNombre || 'Sin titular registrado',
        difuntoNombre: item.historialDifuntos?.[0]?.nombre || 'Sin difunto registrado',
        titulo: infoDoc.titulo || docId,
        categoria: infoDoc.categoria || 'general',
        ...datosArchivo
      };

      const nuevosDocumentos = {
        ...documentos,
        [docId]: objetoArchivoFinal
      };

      setDocumentos(nuevosDocumentos);

      // 1. Guardar de forma inmediata en la tabla dedicada de IndexedDB
      await panteonService.guardarAdjunto(item.codigo, docId, objetoArchivoFinal);

      // 2. Sincronizar el expediente general
      await panteonService.guardarExpediente(item.codigo, {
        documentos: nuevosDocumentos,
        ultimaActualizacion: new Date().toISOString()
      });

      // 3. Notificar al estado global
      if (onActualizarEspacio) {
        const espacioActualizado = {
          ...item,
          expediente: {
            ...(item.expediente || {}),
            documentos: nuevosDocumentos,
            ultimaActualizacion: new Date().toISOString()
          }
        };
        onActualizarEspacio(espacioActualizado);
      }
    } catch (err) {
      console.error('Error al procesar archivo:', err);
      setAlertaConfig({
        tipo: 'error',
        titulo: 'Error al Procesar Archivo',
        mensaje: 'Hubo un error al procesar el archivo. Por favor intenta con otra imagen o archivo PDF válido.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
    } finally {
      setCargandoId(null);
    }
  };

  // Manejador para solicitar confirmación de eliminación
  const handleEliminarArchivo = (docId) => {
    setAlertaConfig({
      tipo: 'eliminar',
      titulo: 'Eliminar Documento',
      mensaje: '¿Estás seguro de que deseas eliminar este documento del expediente digital? Esta acción no se puede deshacer.',
      textoBotonPrincipal: 'Eliminar',
      textoBotonSecundario: 'Cancelar',
      onAceptar: () => {
        ejecutarEliminacion(docId);
        setAlertaConfig(null);
      },
      onCancelar: () => setAlertaConfig(null)
    });
  };

  // Ejecución de la eliminación de un archivo en DB y estado
  const ejecutarEliminacion = async (docId) => {
    const nuevosDocumentos = { ...documentos };
    delete nuevosDocumentos[docId];

    setDocumentos(nuevosDocumentos);

    if (item.codigo) {
      await panteonService.eliminarAdjunto(item.codigo, docId);
    }

    if (onActualizarEspacio) {
      const espacioActualizado = {
        ...item,
        expediente: {
          ...(item.expediente || {}),
          documentos: nuevosDocumentos,
          ultimaActualizacion: new Date().toISOString()
        }
      };
      onActualizarEspacio(espacioActualizado);
    }

    if (documentoSeleccionado && documentoSeleccionado.id === docId) {
      handleCerrarVisor();
    }
  };

  // Descargar archivo
  const handleDescargar = (doc) => {
    if (!doc?.dataUrl) return;
    const enlace = document.createElement('a');
    enlace.href = doc.dataUrl;
    enlace.download = doc.nombre || `documento_${doc.id}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  // Abrir visor de documentos
  const handleAbrirVisor = (docInfo, archivoData) => {
    setDocumentoSeleccionado({
      ...docInfo,
      ...archivoData
    });
    setZoomNivel(1);
    setRotacion(0);
  };

  // Abrir visor en el primer documento disponible
  const handleAbrirGaleriaCompleta = () => {
    if (listaAdjuntos.length === 0) {
      setAlertaConfig({
        tipo: 'info',
        titulo: 'Sin Documentos Adjuntos',
        mensaje: 'Aún no hay documentos adjuntos en este expediente. Puedes adjuntarlos a continuación.',
        textoBotonPrincipal: 'Entendido',
        onAceptar: () => setAlertaConfig(null)
      });
      return;
    }
    setDocumentoSeleccionado(listaAdjuntos[0]);
    setZoomNivel(1);
    setRotacion(0);
  };

  // Filtrado de documentos a mostrar en la vista de cuadrícula
  const docsFiltrados = DOCUMENTOS_REQUERIDOS.filter(doc => {
    if (filtroCategoria === 'todos') return true;
    return doc.categoria === filtroCategoria;
  });

  const getIconComponent = (iconoNombre) => {
    switch (iconoNombre) {
      case 'FileCheck': return FileCheck;
      case 'ShieldCheck': return ShieldCheck;
      default: return FileText;
    }
  };

  const listaDifuntos = item.historialDifuntos || [];
  const difuntoActual = listaDifuntos[difuntoActivoIdx] || listaDifuntos[0] || null;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-5xl xl:max-w-6xl w-full overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        
        {/* 1. Cabecera Principal del Modal (Verde Bosque #152822) */}
        <div className="bg-[#152822] text-white px-6 py-4.5 flex items-center justify-between shrink-0 border-b border-[#234238]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-800/80 border border-teal-500/50 flex items-center justify-center text-teal-200">
              <Folder className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base tracking-tight text-white">
                  Expediente Electrónico Digital
                </h2>
                <span className="bg-teal-900/90 text-teal-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-teal-600/60">
                  {item.codigo}
                </span>
              </div>
              <p className="text-[11px] text-teal-200/80">
                Panteón La Soledad • {item.seccionNombre} • {item.tipoEspacio}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Opción para ver los documentos adjuntos en visor */}
            <button
              type="button"
              onClick={handleAbrirGaleriaCompleta}
              disabled={listaAdjuntos.length === 0}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${
                listaAdjuntos.length > 0
                  ? 'bg-teal-700 hover:bg-teal-600 text-white border-teal-400/50 shadow-xs cursor-pointer ring-1 ring-white/10'
                  : 'bg-teal-900/50 text-teal-300/40 border-teal-800/40 cursor-not-allowed'
              }`}
              title={listaAdjuntos.length > 0 ? 'Abrir visor de documentos adjuntos' : 'No hay documentos adjuntos aún'}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver en Visor ({listaAdjuntos.length})</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar expediente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Resumen del Titular, Difunto y Barra de Progreso del Expediente */}
        <div className="bg-cream-100/70 p-5 border-b border-cream-300 shrink-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Ficha Titular */}
            <div className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-black text-teal-900 text-[11px] uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Titular Concesionario</span>
              </div>
              <div className="font-bold text-stone-900 text-sm">
                {item.titularNombre || 'Sin titular registrado'}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                {item.titularTelefono ? `Tel: ${item.titularTelefono}` : 'Sin teléfono'} {item.titularCorreo ? `• ${item.titularCorreo}` : ''}
              </div>
            </div>

            {/* Ficha Difunto */}
            <div className="bg-white p-3.5 rounded-2xl border border-cream-300 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-rust-900 text-[11px] uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-rust-600" />
                  <span>Persona Finada / Inhumación</span>
                </div>
                {listaDifuntos.length > 1 && (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    {listaDifuntos.length} Inhumaciones
                  </span>
                )}
              </div>
              <div className="font-bold text-stone-900 text-sm truncate">
                {difuntoActual ? difuntoActual.nombre : 'Sin difunto asignado (Espacio disponible)'}
              </div>
              <div className="text-[11px] text-stone-500">
                {difuntoActual?.fechaInhumacion ? `Inhumación: ${difuntoActual.fechaInhumacion}` : 'Fecha de inhumación no especificada'}
                {difuntoActual?.curp ? ` • CURP: ${difuntoActual.curp}` : ''}
              </div>
              {listaDifuntos.length > 1 && (
                <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-cream-200">
                  <span className="text-[10px] text-stone-400 font-medium">Ver:</span>
                  {listaDifuntos.map((dif, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDifuntoActivoIdx(idx)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                        difuntoActivoIdx === idx
                          ? 'bg-teal-700 text-white'
                          : 'bg-cream-100 text-stone-700 hover:bg-cream-200'
                      }`}
                    >
                      {idx + 1}. {dif.nombre.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Barra de Progreso y Estatus de Cumplimiento */}
          <div className="bg-white p-4 rounded-2xl border border-cream-300 shadow-2xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-700">Estado de Documentación:</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  estadoExp.estatus === 'Completo'
                    ? 'bg-olive-100 text-olive-800 border-olive-300'
                    : estadoExp.estatus === 'Incompleto'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-stone-100 text-stone-600 border-stone-300'
                }`}>
                  {estadoExp.estatus === 'Completo' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-olive-600" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {estadoExp.estatus} ({estadoExp.totalAdjuntados} de {estadoExp.totalRequeridos} normativos • {listaAdjuntos.length} total)
                </span>
              </div>

              <div className="font-black text-stone-800 text-xs font-mono">
                {estadoExp.porcentaje}% completado
              </div>
            </div>

            {/* Barra Visual */}
            <div className="w-full h-2.5 bg-cream-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  estadoExp.estatus === 'Completo' ? 'bg-olive-500' : 'bg-teal-500'
                }`}
                style={{ width: `${estadoExp.porcentaje}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3. Selector de Vista (Tabla de Adjuntos vs Cuadrícula de Ranuras) y Filtros */}
        <div className="px-6 pt-3 pb-2 border-b border-cream-200 flex items-center justify-between gap-2 shrink-0 bg-white flex-wrap">
          
          {/* Alternador de Vista (Cuadrícula / Tabla) */}
          <div className="flex items-center gap-1.5 bg-cream-100 p-1 rounded-xl border border-cream-300">
            <button
              type="button"
              onClick={() => setVistaActual('cuadricula')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                vistaActual === 'cuadricula'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Ver cuadros para adjuntar documentación"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-teal-600" />
              <span>Cuadros de Carga ({DOCUMENTOS_REQUERIDOS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('tabla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                vistaActual === 'tabla'
                  ? 'bg-white text-teal-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Ver tabla detallada de imágenes y documentos adjuntos"
            >
              <TableIcon className="w-3.5 h-3.5 text-teal-600" />
              <span>Tabla de Documentos ({listaAdjuntos.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón para añadir documento / foto adicional */}
            <button
              type="button"
              onClick={() => setMostrarModalDocAdicional(true)}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-teal-200"
              title="Adjuntar otro documento o fotografía (monumento, constancia, etc.)"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Adjuntar Otro Archivo</span>
            </button>

            {listaAdjuntos.length > 0 && (
              <button
                type="button"
                onClick={handleAbrirGaleriaCompleta}
                className="px-3 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-cream-300"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Explorar Visor</span>
              </button>
            )}
          </div>
        </div>

        {/* 4. Contenido Principal: VISTA DE TABLA o VISTA DE CUADRÍCULA */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-cream-50/50">
          
          {/* ========================================================================= */}
          {/* VISTA A: TABLA DE DOCUMENTOS E IMÁGENES ADJUNTAS */}
          {/* ========================================================================= */}
          {vistaActual === 'tabla' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="font-bold text-stone-800 flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-teal-600" />
                  <span>Documentos e Imágenes Almacenadas en la Base de Datos ({listaAdjuntos.length})</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Persistencia permanente en IndexedDB • Disponibles en el visor
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-cream-300 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-cream-100 text-stone-900 font-black border-b border-cream-300 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3 text-center">Vista Previa</th>
                        <th className="py-3 px-4">Documento / Trámite</th>
                        <th className="py-3 px-4">Archivo / Formato</th>
                        <th className="py-3 px-4">Tamaño</th>
                        <th className="py-3 px-4">Fecha de Subida</th>
                        <th className="py-3 px-3 text-center">Estado</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-200">
                      {listaAdjuntos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-stone-400">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <FolderPlus className="w-8 h-8 text-stone-300" />
                              <p className="font-medium text-xs">No hay imágenes o documentos adjuntos en este expediente.</p>
                              <button
                                type="button"
                                onClick={() => setVistaActual('cuadricula')}
                                className="mt-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Adjuntar Documentación Requerida
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        listaAdjuntos.map((doc) => {
                          const esImg = doc.tipo?.startsWith('image/') || doc.dataUrl?.startsWith('data:image/');
                          const esPdf = doc.tipo?.includes('pdf') || doc.nombre?.toLowerCase().endsWith('.pdf');

                          return (
                            <tr key={doc.id} className="hover:bg-cream-50/80 transition-colors group">
                              {/* 1. Miniatura */}
                              <td className="py-2.5 px-3 text-center">
                                <div 
                                  onClick={() => handleAbrirVisor(doc, doc)}
                                  className="w-11 h-11 mx-auto rounded-lg overflow-hidden border border-cream-300 bg-stone-100 flex items-center justify-center cursor-pointer group/thumb relative shadow-2xs"
                                  title="Clic para abrir en el visor"
                                >
                                  {esImg && doc.dataUrl ? (
                                    <img src={doc.dataUrl} alt={doc.titulo} className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform" />
                                  ) : (
                                    <div className="text-teal-700 flex flex-col items-center">
                                      <FileText className="w-4 h-4" />
                                      <span className="text-[7px] font-black uppercase">{esPdf ? 'PDF' : 'DOC'}</span>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              </td>

                              {/* 2. Documento / Trámite */}
                              <td className="py-2.5 px-4">
                                <div className="font-bold text-stone-900 text-xs">
                                  {doc.titulo}
                                </div>
                                <div className="text-[10px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                                  <span className="capitalize">{doc.categoria || 'general'}</span>
                                  {doc.esRequerido ? (
                                    <span className="text-[9px] font-bold text-rust-700 bg-rust-100 px-1 py-0.2 rounded">Normativo</span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-teal-700 bg-teal-100 px-1 py-0.2 rounded">Adicional</span>
                                  )}
                                </div>
                              </td>

                              {/* 3. Nombre y Formato */}
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-stone-800 text-xs truncate max-w-[180px]" title={doc.nombre}>
                                  {doc.nombre || 'Documento digitalizado'}
                                </div>
                                <div className="text-[10px] text-stone-400 font-mono">
                                  {doc.tipo || 'image/png'}
                                </div>
                              </td>

                              {/* 4. Tamaño */}
                              <td className="py-2.5 px-4 text-stone-600 font-mono text-[11px]">
                                {doc.tamano || 'N/D'}
                              </td>

                              {/* 5. Fecha de Subida */}
                              <td className="py-2.5 px-4">
                                <div className="text-stone-800 font-medium text-[11px]">
                                  {doc.fechaSubida || 'Hoy'}
                                </div>
                                {doc.horaSubida && (
                                  <div className="text-[9px] text-stone-400 font-mono">
                                    {doc.horaSubida}
                                  </div>
                                )}
                              </td>

                              {/* 6. Estado */}
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-olive-100 text-olive-800 border border-olive-300">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-olive-600" />
                                  Guardado
                                </span>
                              </td>

                              {/* 7. Acciones */}
                              <td className="py-2.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAbrirVisor(doc, doc)}
                                    className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 cursor-pointer transition-colors"
                                    title="Ver en Visor de Pantalla Completa"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-sky-700" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDescargar(doc)}
                                    className="p-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 text-stone-700 border border-cream-300 cursor-pointer transition-colors"
                                    title="Descargar archivo original"
                                  >
                                    <Download className="w-3.5 h-3.5 text-stone-600" />
                                  </button>

                                  <label
                                    className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 cursor-pointer transition-colors"
                                    title="Reemplazar archivo"
                                  >
                                    <UploadCloud className="w-3.5 h-3.5 text-teal-700" />
                                    <input
                                      type="file"
                                      accept="image/*,application/pdf"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                          handleSubirArchivo(doc.id, e.target.files[0], doc);
                                        }
                                      }}
                                    />
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleEliminarArchivo(doc.id)}
                                    className="p-1.5 rounded-lg bg-rust-50 hover:bg-rust-100 text-rust-700 border border-rust-200 cursor-pointer transition-colors"
                                    title="Eliminar documento del expediente"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rust-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VISTA B: CUADRÍCULA DE RANURAS NORMATIVAS (6 DOCUMENTOS REQUERIDOS) */}
          {/* ========================================================================= */}
          {vistaActual === 'cuadricula' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs pb-1">
                <button
                  type="button"
                  onClick={() => setFiltroCategoria('todos')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filtroCategoria === 'todos'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                  }`}
                >
                  Todos los Documentos ({DOCUMENTOS_REQUERIDOS.length})
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroCategoria('difunto')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filtroCategoria === 'difunto'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                  }`}
                >
                  Difunto (4)
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroCategoria('titular')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filtroCategoria === 'titular'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-cream-100 text-stone-600 hover:bg-cream-200'
                  }`}
                >
                  Titular (2)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docsFiltrados.map((docConfig) => {
                  const archivoData = documentos[docConfig.id];
                  const estaAdjuntado = !!archivoData && (archivoData.adjuntado || !!archivoData.dataUrl);
                  const IconComponent = getIconComponent(docConfig.icono);
                  const esCargando = cargandoId === docConfig.id;
                  const esImagen = archivoData?.tipo?.startsWith('image/') || archivoData?.dataUrl?.startsWith('data:image/');
                  const esPdf = archivoData?.tipo?.includes('pdf') || archivoData?.nombre?.toLowerCase().endsWith('.pdf');

                  return (
                    <div 
                      key={docConfig.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        estaAdjuntado 
                          ? 'bg-white border-olive-300 shadow-xs ring-1 ring-olive-400/20' 
                          : 'bg-white border-cream-300 hover:border-teal-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        
                        {/* Encabezado del documento */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            estaAdjuntado ? 'bg-olive-100 text-olive-800' : 'bg-cream-100 text-stone-500'
                          }`}>
                            {estaAdjuntado ? <CheckCircle2 className="w-5 h-5 text-olive-600" /> : <IconComponent className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-xs text-stone-900 truncate">
                                {docConfig.titulo}
                              </h3>
                              {docConfig.obligatorio && (
                                <span className="text-[9px] font-bold text-rust-700 bg-rust-100 px-1.5 py-0.2 rounded">
                                  Requerido
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-2">
                              {docConfig.descripcion}
                            </p>
                          </div>
                        </div>

                      </div>

                      {/* Estado y contenido de la ranura */}
                      {estaAdjuntado ? (
                        /* Documento Adjuntado */
                        <div className="mt-3 pt-3 border-t border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          
                          {/* Miniatura y Metadatos */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {esImagen && archivoData.dataUrl ? (
                              <div 
                                onClick={() => handleAbrirVisor(docConfig, archivoData)}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-cream-300 bg-stone-100 shrink-0 cursor-pointer group relative"
                                title="Ver en grande"
                              >
                                <img src={archivoData.dataUrl} alt={docConfig.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => handleAbrirVisor(docConfig, archivoData)}
                                className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0 text-teal-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                title="Ver documento"
                              >
                                <FileText className="w-5 h-5" />
                                <span className="text-[8px] font-bold uppercase">{esPdf ? 'PDF' : 'DOC'}</span>
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-stone-900 truncate" title={archivoData.nombre}>
                                {archivoData.nombre || 'Documento digitalizado'}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {archivoData.tamano || 'N/D'} • Subido: {archivoData.fechaSubida || 'Hoy'}
                              </div>
                            </div>
                          </div>

                          {/* Botones de Acción */}
                          <div className="flex items-center gap-1.5 shrink-0 justify-end">
                            <button
                              type="button"
                              onClick={() => handleAbrirVisor(docConfig, archivoData)}
                              className="px-2.5 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Previsualizar documento en el visor"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              <span className="hidden sm:inline">Ver</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDescargar(archivoData)}
                              className="p-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                              title="Descargar archivo"
                            >
                              <Download className="w-3.5 h-3.5 text-stone-600" />
                            </button>

                            <label 
                              className="p-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                              title="Reemplazar archivo"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-teal-600" />
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleSubirArchivo(docConfig.id, e.target.files[0], docConfig);
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleEliminarArchivo(docConfig.id)}
                              className="p-1.5 bg-rust-50 hover:bg-rust-100 text-rust-700 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      ) : (
                        /* Ranura Vacía / Pendiente */
                        <div className="mt-3 pt-3 border-t border-cream-200">
                          <label className={`w-full py-3 px-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            esCargando 
                              ? 'bg-cream-100 border-teal-400 animate-pulse text-teal-700' 
                              : 'border-cream-300 hover:border-teal-500 hover:bg-teal-50/50 text-stone-600 hover:text-teal-900'
                          }`}>
                            <UploadCloud className="w-4 h-4 text-teal-600" />
                            <span className="text-xs font-bold">
                              {esCargando ? 'Guardando en base de datos...' : 'Adjuntar Documento o Foto'}
                            </span>
                            <input
                              type="file"
                              disabled={esCargando}
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleSubirArchivo(docConfig.id, e.target.files[0], docConfig);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Documentos adicionales que ya han sido adjuntados */}
                {listaAdjuntos
                  .filter(doc => !doc.esRequerido && (filtroCategoria === 'todos' || filtroCategoria === 'adicional'))
                  .map((docExtra) => {
                    const esImagen = docExtra.tipo?.startsWith('image/') || docExtra.dataUrl?.startsWith('data:image/');
                    const esPdf = docExtra.tipo?.includes('pdf') || docExtra.nombre?.toLowerCase().endsWith('.pdf');

                    return (
                      <div 
                        key={docExtra.id}
                        className="p-4 rounded-2xl border border-teal-300 bg-white shadow-xs ring-1 ring-teal-400/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-teal-100 text-teal-800">
                              <CheckCircle2 className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-xs text-stone-900 truncate">
                                  {docExtra.titulo}
                                </h3>
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded">
                                  Adicional
                                </span>
                              </div>
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                {docExtra.descripcion || 'Documento complementario digitalizado'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {esImagen && docExtra.dataUrl ? (
                              <div 
                                onClick={() => handleAbrirVisor(docExtra, docExtra)}
                                className="w-12 h-12 rounded-lg overflow-hidden border border-cream-300 bg-stone-100 shrink-0 cursor-pointer group relative"
                                title="Ver en grande"
                              >
                                <img src={docExtra.dataUrl} alt={docExtra.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            ) : (
                              <div 
                                onClick={() => handleAbrirVisor(docExtra, docExtra)}
                                className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0 text-teal-800 cursor-pointer hover:bg-teal-100 transition-colors"
                                title="Ver documento"
                              >
                                <FileText className="w-5 h-5" />
                                <span className="text-[8px] font-bold uppercase">{esPdf ? 'PDF' : 'DOC'}</span>
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs text-stone-900 truncate" title={docExtra.nombre}>
                                {docExtra.nombre || 'Documento digitalizado'}
                              </div>
                              <div className="text-[10px] text-stone-500">
                                {docExtra.tamano || 'N/D'} • Subido: {docExtra.fechaSubida || 'Hoy'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 justify-end">
                            <button
                              type="button"
                              onClick={() => handleAbrirVisor(docExtra, docExtra)}
                              className="px-2.5 py-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Previsualizar documento en el visor"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600" />
                              <span className="hidden sm:inline">Ver</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDescargar(docExtra)}
                              className="p-1.5 bg-cream-100 hover:bg-cream-200 text-stone-700 rounded-lg transition-colors cursor-pointer"
                              title="Descargar archivo"
                            >
                              <Download className="w-3.5 h-3.5 text-stone-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarArchivo(docExtra.id)}
                              className="p-1.5 bg-rust-50 hover:bg-rust-100 text-rust-700 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Cuadro interactivo para adjuntar documento o fotografía adicional */}
                {(filtroCategoria === 'todos' || filtroCategoria === 'adicional') && (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/30 hover:bg-teal-50/70 transition-all flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-stone-900">
                          Otro Documento / Fotografía Adicional
                        </h3>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Monumento, comprobante de pago, constancia de defunción o fotografía del lote.
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-teal-200/60">
                      <button
                        type="button"
                        onClick={() => setMostrarModalDocAdicional(true)}
                        className="w-full py-2.5 px-4 bg-white border border-teal-300 hover:border-teal-600 hover:bg-teal-50 text-teal-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4 text-teal-600" />
                        <span>+ Adjuntar Archivo Adicional</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* 5. Pie de Modal */}
        <div className="bg-cream-100/80 px-6 py-3.5 border-t border-cream-300 flex items-center justify-between text-xs shrink-0">
          <div className="text-stone-500 font-medium">
            Todos los documentos se guardan de forma permanente en la base de datos (PostgreSQL e IndexedDB).
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>

      {/* 6. Modal / Lightbox Visor de Documentos con Navegación Secuencial */}
      {documentoSeleccionado && (
        <div 
          onClick={handleCerrarVisor}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 z-60 animate-fadeIn"
        >
          {/* Barra Superior del Visor con Navegación */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-stone-900/95 text-white px-5 py-3 rounded-2xl flex items-center justify-between shadow-xl border border-stone-700 flex-wrap gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white truncate">
                  {documentoSeleccionado.titulo}
                </h3>
                {listaAdjuntos.length > 0 && indiceActual !== -1 && (
                  <span className="text-[10px] font-mono bg-stone-800 text-teal-300 px-2 py-0.5 rounded border border-stone-600">
                    {indiceActual + 1} de {listaAdjuntos.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 truncate">
                Lote: {item.codigo} • Archivo: {documentoSeleccionado.nombre || 'Documento digital'} ({documentoSeleccionado.tamano || 'N/D'})
              </p>
            </div>

            {/* Controles del visor */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Botones Anterior / Siguiente si hay más de 1 documento */}
              {listaAdjuntos.length > 1 && (
                <div className="flex items-center gap-1 mr-2 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
                  <button
                    type="button"
                    onClick={() => handleNavegarDocumento('anterior')}
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Documento anterior (Flecha izquierda)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavegarDocumento('siguiente')}
                    className="p-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Documento siguiente (Flecha derecha)"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setZoomNivel(prev => Math.max(0.5, prev - 0.25))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-stone-300 min-w-[45px] text-center">
                {Math.round(zoomNivel * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setZoomNivel(prev => Math.min(3, prev + 0.25))}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setRotacion(prev => (prev + 90) % 360)}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Girar 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDescargar(documentoSeleccionado)}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Descargar archivo"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCerrarVisor}
                className="p-1.5 bg-rust-600 hover:bg-rust-700 text-white rounded-lg transition-colors cursor-pointer ml-1"
                title="Cerrar visor (Escape)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área Central de Visualización con Controles de Flecha Laterales */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center w-full max-w-4xl p-2 sm:p-4 overflow-auto relative"
          >
            {/* Flecha Flotante Izquierda */}
            {listaAdjuntos.length > 1 && (
              <button
                type="button"
                onClick={() => handleNavegarDocumento('anterior')}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all cursor-pointer z-10 hidden sm:flex items-center justify-center"
                title="Ver documento anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Contenido Visual */}
            {documentoSeleccionado.tipo?.startsWith('image/') || documentoSeleccionado.dataUrl?.startsWith('data:image/') ? (
              <img
                src={documentoSeleccionado.dataUrl}
                alt={documentoSeleccionado.titulo}
                style={{
                  transform: `scale(${zoomNivel}) rotate(${rotacion}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full h-[70vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <iframe
                  src={documentoSeleccionado.dataUrl}
                  title={documentoSeleccionado.titulo}
                  className="w-full flex-1 border-0"
                />
              </div>
            )}

            {/* Flecha Flotante Derecha */}
            {listaAdjuntos.length > 1 && (
              <button
                type="button"
                onClick={() => handleNavegarDocumento('siguiente')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 shadow-2xl transition-all cursor-pointer z-10 hidden sm:flex items-center justify-center"
                title="Ver siguiente documento"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Carrusel de Miniaturas Inferior */}
          {listaAdjuntos.length > 1 && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-stone-900/90 p-2 rounded-2xl border border-stone-700 flex items-center justify-center gap-2 overflow-x-auto"
            >
              {listaAdjuntos.map((docItem) => {
                const esActivo = docItem.id === documentoSeleccionado.id;
                const esImg = docItem.tipo?.startsWith('image/') || docItem.dataUrl?.startsWith('data:image/');

                return (
                  <button
                    key={docItem.id}
                    type="button"
                    onClick={() => {
                      setDocumentoSeleccionado(docItem);
                      setZoomNivel(1);
                      setRotacion(0);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                      esActivo
                        ? 'bg-teal-600 text-white border-teal-400 ring-2 ring-teal-400/40 shadow-md'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    {esImg && docItem.dataUrl ? (
                      <img src={docItem.dataUrl} alt="" className="w-5 h-5 rounded object-cover" />
                    ) : (
                      <FileText className="w-4 h-4 text-teal-300" />
                    )}
                    <span className="truncate max-w-[130px]">{docItem.titulo}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pie Informativo */}
          <div className="text-[11px] text-stone-400 text-center mt-2">
            Panteón La Soledad • Expediente Digital Catastral
          </div>
        </div>
      )}

      {/* 7. Modal Secundario: Adjuntar Documento Adicional Personalizado */}
      {mostrarModalDocAdicional && (
        <div 
          onClick={() => setMostrarModalDocAdicional(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-70 animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-cream-300 shadow-2xl max-w-md w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" />
                <span>Adjuntar Documento Adicional</span>
              </h3>
              <button
                type="button"
                onClick={() => setMostrarModalDocAdicional(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Nombre o Título del Documento *</label>
                <input
                  type="text"
                  placeholder="Ej: Foto del Monumento / Constancia / Poder"
                  value={nuevoDocAdicional.titulo}
                  onChange={(e) => setNuevoDocAdicional({ ...nuevoDocAdicional, titulo: e.target.value })}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl p-2.5 text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-stone-700">Seleccionar Imagen o PDF *</label>
                <label className="w-full py-4 border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-100/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-teal-900">
                  <UploadCloud className="w-6 h-6 text-teal-600" />
                  <span className="font-bold text-xs">Hacer clic para elegir archivo</span>
                  <span className="text-[10px] text-stone-500">Imágenes (JPG, PNG, WEBP) o PDF</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const tituloFinal = nuevoDocAdicional.titulo.trim() || e.target.files[0].name.replace(/\.[^/.]+$/, '');
                        const docIdGenerado = `doc_adicional_${Date.now()}`;
                        handleSubirArchivo(docIdGenerado, e.target.files[0], {
                          titulo: tituloFinal,
                          categoria: 'adicional'
                        });
                        setMostrarModalDocAdicional(false);
                        setNuevoDocAdicional({ titulo: '', categoria: 'adicional' });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMostrarModalDocAdicional(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal de Alerta / Notificación / Confirmación Centrado */}
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

