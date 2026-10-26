// src/components/common/ContextMenu.jsx
import { useEffect, useRef } from 'react';
import { Pencil, Printer, Receipt, Eye, FolderPlus, History, CheckCircle2 } from 'lucide-react';

export default function ContextMenu({
  x,
  y,
  registro,
  onEditar,
  onEmitirRecibo,
  onImprimirTitulo,
  onAbrirExpediente,
  onAbrirHistorial,
  onClose
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!registro) return null;

  return (
    <div
      ref={menuRef}
      style={{ top: `${y}px`, left: `${x}px` }}
      className="fixed z-50 bg-white border border-cream-300 shadow-2xl rounded-2xl p-1.5 min-w-[230px] text-xs font-semibold text-stone-800 animate-in fade-in zoom-in-95"
    >
      <div className="px-3 py-1.5 border-b border-cream-200 text-[10px] uppercase font-bold text-stone-400">
        Lote: {registro.codigo}
      </div>

      <div className="space-y-0.5 mt-1">
        {/* 1. Ver Visor de Documentos */}
        <button
          type="button"
          onClick={() => { if (onAbrirExpediente) onAbrirExpediente(registro, 'visor'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-sky-50 text-stone-700 hover:text-sky-900 transition-colors text-left cursor-pointer"
        >
          <Eye className="w-4 h-4 text-sky-600" />
          <span>Ver Visor de Documentos</span>
        </button>

        {/* 2. Adjuntar / Gestionar Documentos */}
        <button
          type="button"
          onClick={() => { if (onAbrirExpediente) onAbrirExpediente(registro, 'expediente'); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cream-100 text-stone-700 hover:text-stone-900 transition-colors text-left cursor-pointer"
        >
          <FolderPlus className="w-4 h-4 text-teal-600" />
          <span>Adjuntar / Expediente Digital</span>
        </button>

        {/* Opción rápida: Registrar que Ya Pagó (Recibo Físico) */}
        {registro.estatusPago === 'Con Adeudo' && (
          <button
            type="button"
            onClick={() => { if (onAbrirHistorial) onAbrirHistorial(registro, { filtro: 'Adeudos' }); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-800 hover:text-emerald-950 font-bold transition-colors text-left cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Registrar que Ya Pagó</span>
          </button>
        )}

        {/* 3. Emitir Recibo de Pago */}
        <button
          type="button"
          onClick={() => { if (onEmitirRecibo) onEmitirRecibo(registro); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cream-100 text-stone-700 hover:text-stone-900 transition-colors text-left cursor-pointer"
        >
          <Receipt className="w-4 h-4 text-olive-600" />
          <span>Emitir Recibo de Pago</span>
        </button>

        {/* 4. Historial de Pagos y Refrendos */}
        <button
          type="button"
          onClick={() => { if (onAbrirHistorial) onAbrirHistorial(registro); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-teal-50 text-stone-700 hover:text-teal-900 transition-colors text-left cursor-pointer"
        >
          <History className="w-4 h-4 text-teal-600" />
          <span>Historial de Pagos</span>
        </button>

        {/* 5. Editar Lote / Difuntos */}
        <button
          type="button"
          onClick={() => { onEditar(registro); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cream-100 text-stone-700 hover:text-stone-900 transition-colors text-left cursor-pointer"
        >
          <Pencil className="w-4 h-4 text-teal-600" />
          <span>Editar Lote / Difuntos</span>
        </button>

        {/* 5. Imprimir Cédula de Título */}
        <button
          type="button"
          onClick={() => { onImprimirTitulo(registro); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-cream-100 text-stone-700 hover:text-stone-900 transition-colors text-left cursor-pointer"
        >
          <Printer className="w-4 h-4 text-teal-600" />
          <span>Imprimir Cédula de Título</span>
        </button>
      </div>
    </div>
  );
}
