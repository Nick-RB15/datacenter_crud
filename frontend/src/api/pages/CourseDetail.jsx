import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../client';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, FileText, Users } from 'lucide-react';
 
export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_date: '' });
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', due_date: '' });
 
  useEffect(() => {
    load();
  }, [id]);
 
  const load = async () => {
    const [cRes, aRes] = await Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/assignments`),
    ]);
    setCourse(cRes.data);
    setAssignments(aRes.data);
  };
 
  const canManage = user?.role === 'admin' || course?.teacher_id === user?.id;
 
  const createAssignment = async (e) => {
    e.preventDefault();
    await api.post(`/courses/${id}/assignments`, form);
    setForm({ title: '', description: '', due_date: '' });
    setShowAssign(false);
    load();
  };

  const startEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditForm({
      title: assignment.title,
      description: assignment.description || '',
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : '',
    });
  };

  const cancelEditAssignment = () => {
    setEditingAssignmentId(null);
    setEditForm({ title: '', description: '', due_date: '' });
  };

  const saveAssignmentEdit = async (e, assignmentId) => {
    e.preventDefault();
    await api.put(`/assignments/${assignmentId}`, editForm);
    cancelEditAssignment();
    load();
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('¿Eliminar esta asignación?')) return;
    await api.delete(`/assignments/${assignmentId}`);
    load();
  };
 
  const enroll = async () => {
    await api.post(`/courses/${id}/enroll`);
    load();
  };
 
  if (!course) {
    return <div className="p-8 text-gray-500">Cargando curso...</div>;
  }
 
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a cursos
      </button>
 
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="text-xs font-bold text-primary-600 uppercase mb-1">
          {course.code}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.name}</h1>
        <p className="text-gray-600 mb-4">{course.description || 'Sin descripción'}</p>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" /> {course.student_count} estudiantes
          </span>
          <span>Profesor: {course.teacher}</span>
        </div>
        {user?.role === 'student' && (
          <button
            onClick={enroll}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
          >
            Matricularme
          </button>
        )}
      </div>
 
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" /> Asignaciones
          </h2>
          {canManage && (
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              + Nueva
            </button>
          )}
        </div>
 
        {showAssign && (
          <form onSubmit={createAssignment} className="grid gap-3 mb-4">
            <input
              required
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              required
              type="datetime-local"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAssign(false)}
                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Guardar
              </button>
            </div>
          </form>
        )}
 
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 hover:bg-gray-50"
            >
              {editingAssignmentId === a.id ? (
                <form onSubmit={(e) => saveAssignmentEdit(e, a.id)} className="w-full space-y-2">
                  <input
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <input
                    required
                    type="datetime-local"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1.5 bg-primary-600 text-white rounded-lg">Guardar</button>
                    <button type="button" onClick={cancelEditAssignment} className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-gray-500">
                      Entrega:{' '}
                      {a.due_date
                        ? format(parseISO(a.due_date), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/assignments/${a.id}`}
                      className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Ver detalle
                    </Link>
                    {canManage && (
                      <>
                        <button onClick={() => startEditAssignment(a)} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">Editar</button>
                        <button onClick={() => deleteAssignment(a.id)} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-red-600">Eliminar</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-sm text-gray-500">Sin asignaciones</p>
          )}
        </div>
      </div>
    </div>
  );
}