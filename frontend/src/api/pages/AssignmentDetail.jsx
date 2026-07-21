import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../client';
import { useAuth } from '../context/AuthContext';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, FileText, Send, User } from 'lucide-react';
 
export default function AssignmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
 
  useEffect(() => {
    load();
  }, [id]);
 
  const load = async () => {
    const [aRes, sRes] = await Promise.all([
      api.get(`/assignments/${id}`),
      api.get(`/assignments/${id}/submissions`),
    ]);
    setAssignment(aRes.data);
    setSubmissions(sRes.data);
    if (user?.role === 'student') {
      const mine = sRes.data.find((s) => s.student_id === user.id);
      if (mine) {
        setContent(mine.content || '');
        setFileUrl(mine.file_url || '');
      }
    }
  };
 
  const submit = async (e) => {
    e.preventDefault();
    await api.post(`/assignments/${id}/submissions`, {
      content,
      file_url: fileUrl,
    });
    load();
  };
 
  const grade = async (subId, gradeVal, feedbackVal) => {
    await api.patch(`/assignments/submissions/${subId}`, {
      grade: gradeVal,
      feedback: feedbackVal,
    });
    load();
  };
 
  if (!assignment) {
    return <div className="p-8 text-gray-500">Cargando asignación...</div>;
  }
 
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
 
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <p className="text-sm text-primary-600 font-medium">{assignment.course}</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4">{assignment.description || 'Sin descripción'}</p>
        <p className="text-sm text-gray-500">
          Fecha de entrega:{' '}
          {assignment.due_date
            ? format(parseISO(assignment.due_date), 'dd/MM/yyyy HH:mm')
            : '-'}
        </p>
      </div>
 
      {user?.role === 'student' && (
        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-600" /> Tu entrega
          </h2>
          <textarea
            placeholder="Escribe tu respuesta o comentarios..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 mb-3 outline-none focus:ring-2 focus:ring-primary-500"
            rows="4"
          />
          <input
            placeholder="URL de archivo o recurso (opcional)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition">
            Enviar entrega
          </button>
        </form>
      )}
 
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Entregas de estudiantes
          </h2>
          {submissions.length === 0 && (
            <p className="text-gray-500 text-sm">Sin entregas aún</p>
          )}
          {submissions.map((s) => (
            <div key={s.id} className="border border-gray-100 rounded-xl p-4 mb-3">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{s.student}</p>
                    <p className="text-xs text-gray-500">
                      {s.submitted_at
                        ? format(parseISO(s.submitted_at), 'dd/MM/yyyy HH:mm')
                        : '-'}
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const gradeVal = e.target.grade.value;
                    const feedbackVal = e.target.feedback.value;
                    grade(s.id, gradeVal, feedbackVal);
                  }}
                  className="flex flex-wrap gap-2 items-center"
                >
                  <input
                    name="grade"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    defaultValue={s.grade ?? ''}
                    placeholder="Nota"
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    name="feedback"
                    defaultValue={s.feedback || ''}
                    placeholder="Feedback"
                    className="border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                    Calificar
                  </button>
                </form>
              </div>
              <p className="text-sm text-gray-700 mt-3">{s.content}</p>
              {s.file_url && (
                <a
                  href={s.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary-600 hover:underline mt-1 inline-block"
                >
                  Ver archivo adjunto
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}