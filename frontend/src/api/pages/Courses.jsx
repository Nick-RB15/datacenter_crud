import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../client';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Users } from 'lucide-react';
 
export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ code: '', name: '', description: '' });
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    load();
  }, []);
 
  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/courses');
      setCourses(res.data);
    } finally {
      setLoading(false);
    }
  };
 
  const create = async (e) => {
    e.preventDefault();
    await api.post('/courses', form);
    setForm({ code: '', name: '', description: '' });
    setShowForm(false);
    load();
  };

  const startEdit = (course) => {
    setEditingId(course.id);
    setEditForm({ code: course.code, name: course.name, description: course.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ code: '', name: '', description: '' });
  };

  const saveEdit = async (e, id) => {
    e.preventDefault();
    await api.put(`/courses/${id}`, editForm);
    cancelEdit();
    load();
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('¿Eliminar este curso?')) return;
    await api.delete(`/courses/${id}`);
    load();
  };
 
  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );
 
  const canCreate = user?.role === 'teacher' || user?.role === 'admin';
 
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cursos</h1>
        {canCreate && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition"
          >
            <Plus className="w-4 h-4" /> Nuevo curso
          </button>
        )}
      </div>
 
      {showForm && (
        <form
          onSubmit={create}
          className="bg-white p-5 rounded-2xl shadow-sm border mb-6 grid gap-4"
        >
          <div className="grid md:grid-cols-3 gap-4">
            <input
              required
              placeholder="Código"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              required
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancelar
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700">
              Guardar
            </button>
          </div>
        </form>
      )}
 
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cursos..."
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
 
      {loading ? (
        <p className="text-gray-500">Cargando cursos...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border hover:shadow-md transition">
              {editingId === c.id ? (
                <form onSubmit={(e) => saveEdit(e, c.id)} className="space-y-3">
                  <input
                    required
                    value={editForm.code}
                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-2 bg-primary-600 text-white rounded-lg">Guardar</button>
                    <button type="button" onClick={cancelEdit} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <Link to={`/courses/${c.id}`} className="block">
                    <div className="text-xs font-bold text-primary-600 uppercase mb-1">
                      {c.code}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{c.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {c.description || 'Sin descripción'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {c.student_count}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full truncate max-w-[140px]">
                        {c.teacher}
                      </span>
                    </div>
                  </Link>
                  {canCreate && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => startEdit(c)} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">Editar</button>
                      <button onClick={() => deleteCourse(c.id)} className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 text-red-600">Eliminar</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}