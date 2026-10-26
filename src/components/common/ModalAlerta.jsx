// src/components/common/ModalAlerta.jsx
import { useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  HelpCircle, 
  Trash2
} from 'lucide-react';

export default function ModalAlerta({
  abierto = false,
  isOpen = false,
  tipo = 'info', // 'info' | 'advertencia' | 'exito' | 'error' | 'confirmacion' | 'eliminar'
  titulo = 'Aviso del Sistema',
  mensaje = '',
  textoBotonPrincipal = 'Aceptar',
  textoBotonSecundario = 'Cancelar',
  onAceptar,
  onCancelar,
  onCerrar
}) {
  const visible = abierto || isOpen;

  const handleClose = useCallback(() => {
    if (onCerrar) onCerrar();
    if (onCancelar) onCancelar();
  }, [onCerrar, onCancelar]);

  const handleAceptar = () => {
    if (onAceptar) onAceptar();
    if (onCerrar) onCerrar();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  if (!visible) return null;

  const getTipoConfig = () => {
    switch (tipo) {
      case 'exito':
        return {
          icono: CheckCircle2,
          colorIcono: 'text-olive-600',
          bgIcono: 'bg-olive-100 border-olive-200',
          colorBoton: 'bg-olive-600 hover:bg-olive-700 text-white border-olive-700'
        };
      case 'advertencia':
        return {
          icono: AlertCircle,
          colorIcono: 'text-amber-600',
          bgIcono: 'bg-amber-100 border-amber-200',
          colorBoton: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
        };
      case 'error':
      case 'eliminar':
        return {
          icono: tipo === 'eliminar' ? Trash2 : AlertCircle,
          colorIcono: 'text-rust-600',
          bgIcono: 'bg-rust-100 border-rust-200',
          colorBoton: 'bg-rust-600 hover:bg-rust-700 text-white border-rust-700'
        };
      case 'confirmacion':
        return {
          icono: HelpCircle,
          colorIcono: 'text-teal-600',
          bgIcono: 'bg-teal-100 border-teal-200',
          colorBoton: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700'
        };
      case 'info':
      default:
        return {
          icono: Info,
          colorIcono: 'text-teal-600',
          bgIcono: 'bg-teal-100 border-teal-200',
          colorBoton: 'bg-teal-600 hover:bg-teal-700 text-white border-teal-700'
        };
    }
  };

  const config = getTipoConfig();
  const IconComponent = config.icono;
  const esConfirmacion = tipo === 'confirmacion' || tipo === 'eliminar' || Boolean(onCancelar && onAceptar);

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-70 animate-fadeIn"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-cream-300 shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95 my-auto"
      >
        {/* Icono Central */}
        <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border shadow-xs ${config.bgIcono}`}>
          <IconComponent className={`w-7 h-7 ${config.colorIcono}`} />
        </div>

        {/* Textos */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-stone-900 tracking-tight">
            {titulo}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed px-2">
            {mensaje}
          </p>
        </div>

        {/* Botones de Acción */}
        <div className={`flex items-center gap-2.5 pt-2 ${esConfirmacion ? 'justify-center' : 'justify-center'}`}>
          {esConfirmacion && (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 bg-cream-100 hover:bg-cream-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer border border-cream-300 flex-1 max-w-[140px]"
            >
              {textoBotonSecundario}
            </button>
          )}

          <button
            type="button"
            onClick={handleAceptar}
            className={`px-5 py-2.5 font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer border flex-1 ${config.colorBoton} ${!esConfirmacion ? 'max-w-[180px]' : 'max-w-[140px]'}`}
          >
            {textoBotonPrincipal}
          </button>
        </div>

      </div>
    </div>
  );
}
