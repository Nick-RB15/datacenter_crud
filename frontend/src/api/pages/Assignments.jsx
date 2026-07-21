import { useEffect, useState } from 'react';
import api from '../client';
import { format, parseISO } from 'date-fns';
 
export default function Assignments() {
  const [courses, setCourses] = useState([]);
 
  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data));
  }, []);
 
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Asignaciones y entregas</h1>
      <div className="space-y-6">
        {courses.map((course) => (
          <CourseAssignments key={course.id} course={course} />
        ))}
        {courses.length === 0 && <p className="text-gray-500">No hay cursos disponibles</p>}
      </div>
    </div>
  );
}
 
function CourseAssignments({ course }) {
  const [assignments, setAssignments] = useState([]);
 
  useEffect(() => {
    api.get(`/courses/${course.id}/assignments`).then((res) => setAssignments(res.data));
  }, [course.id]);
 
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5">
      <h2 className="text-lg font-semibold mb-2">
        {course.code} - {course.name}
      </h2>
      <div className="space-y-3">
        {assignments.map((a) => (
          <div
            key={a.id}
            className="border border-gray-100 rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-medium">{a.title}</h3>
              <p className="text-sm text-gray-500">
                Entrega: {a.due_date ? format(parseISO(a.due_date), 'dd/MM/yyyy HH:mm') : '-'}
              </p>
            </div>
            <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">
              {a.submission_count} entregas
            </span>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-gray-500">Sin asignaciones</p>}
      </div>
    </div>
  );
}