import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student@eva.com');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="card p-8 rounded-3xl w-full max-w-md"
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center text-white">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-1">
          Ambiente Virtual de Aprendizaje
        </h1>
        <p className="text-center text-gray-400 mb-6">Inicia sesión en tu cuenta</p>

        {error && (
          <div className="mb-4 p-3 bg-red-950 text-red-400 text-sm rounded-lg border border-red-900">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="usuario@eva.com"
        />

        <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          placeholder="••••••••"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white p-3 rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2 transition"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Entrar
        </button>

        <div className="mt-6 p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-400 space-y-1">
          <p className="font-medium text-gray-300">Cuentas de prueba:</p>
          <p>admin@eva.com / admin123</p>
          <p>teacher@eva.com / teacher123</p>
          <p>student@eva.com / student123</p>
        </div>
      </form>
    </div>
  );
}