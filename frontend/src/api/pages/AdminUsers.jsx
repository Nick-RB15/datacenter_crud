import { useEffect, useState } from 'react';
import api from '../client';
import { roleLabel } from '../utils/roles';
 
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
  });
 
  useEffect(() => {
    load();
  }, []);
 
  const load = async () => {
    const res = await api.get('/auth/users');
    setUsers(res.data);
  };
 
  const create = async (e) => {
    e.preventDefault();
    await api.post('/auth/register', form);
    setForm({ email: '', full_name: '', password: '', role: 'student' });
    load();
  };
 
  const changeRole = async (id, role) => {
    await api.patch(`/auth/users/${id}/role`, { role });
    load();
  };
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de usuarios y roles</h1>
 
      <form
        onSubmit={create}
        className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          required
          placeholder="Nombre completo"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <input
          required
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="student">Estudiante</option>
          <option value="teacher">Profesor</option>
          <option value="admin">Administrador</option>
        </select>
        <div className="md:col-span-2 lg:col-span-4 flex justify-end">
          <button className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition">
            Crear usuario
          </button>
        </div>
      </form>
 
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4 font-medium">Nombre</th>
              <th className="text-left p-4 font-medium">Email</th>
              <th className="text-left p-4 font-medium">Rol</th>
              <th className="text-left p-4 font-medium">Cambiar rol</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{u.full_name}</td>
                <td className="p-4 text-gray-600">{u.email}</td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                    {roleLabel[u.role] || u.role}
                  </span>
                </td>
                <td className="p-4">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none"
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Profesor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-4 text-sm text-gray-500">No hay usuarios registrados</p>
        )}
      </div>
    </div>
  );
}