// src/components/auth/Login.jsx
import { useState } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle
} from 'lucide-react';
import logoPanteon from '../../assets/logo-panteon.jpg';

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!usuario.trim() || !contrasena.trim()) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setCargando(true);

    setTimeout(() => {
      const usuarioLimpio = usuario.trim().toLowerCase();
      const passLimpia = contrasena.trim();

      if (
        (usuarioLimpio === 'admin' && (passLimpia === 'admin' || passLimpia === 'panteon' || passLimpia === 'soledad')) ||
        (usuarioLimpio === 'administrador' && (passLimpia === 'admin' || passLimpia === 'panteon'))
      ) {
        onLogin({
          nombre: 'Administrador General',
          usuario: usuarioLimpio,
          rol: 'Administrador Unipersonal',
          recordar: recordarSesion
        });
      } else {
        setError('Usuario o contraseña incorrectos. Verifica tus datos de acceso.');
        setCargando(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#FAF8F5] select-none">
      
      {/* Tarjeta Principal de Login */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl border border-cream-200 shadow-xl p-8 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* 1. Emblema Institucional Oficial */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-1">
              <img 
                src={logoPanteon} 
                alt="Panteón La Soledad" 
                className="w-20 h-20 rounded-full object-cover border-2 border-[#D2B79A] shadow-md p-0.5 bg-white" 
              />
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#152822] uppercase">
              Panteón La Soledad
            </h1>
            
            <p className="text-[11px] text-stone-500 font-medium pt-1">
              San Francisco Tepojaco, Cuautitlán Izcalli
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-olive-900 bg-olive-100 px-3 py-1 rounded-full border border-olive-300">
                <ShieldCheck className="w-3.5 h-3.5 text-olive-700" />
                Acceso Administrativo Seguro
              </span>
            </div>
          </div>

          {/* 2. Mensaje de Error */}
          {error && (
            <div className="p-3 bg-rust-100 border border-rust-300 text-rust-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rust-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 3. Formulario de Acceso */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Usuario */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Usuario del Sistema
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ingresa tu usuario..."
                  required
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">
                Contraseña o PIN
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Ingresa tu contraseña..."
                  required
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl pl-10 pr-10 py-2.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 rounded cursor-pointer"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Casilla Recordar Sesión */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                  className="w-4 h-4 rounded border-cream-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>

            {/* Botón de Ingreso (Verde Bosque Institucional #152822) */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-[#152822] hover:bg-[#1E3A31] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#152822] disabled:opacity-50 mt-2"
            >
              <span>{cargando ? 'Verificando credenciales...' : 'Ingresar al Sistema'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>

          </form>

          {/* 4. Pie Informativo */}
          <div className="pt-4 border-t border-cream-200 text-center">
            <p className="text-[10px] text-stone-400">
              Módulo protegido • Control Catastral y Financiero
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
