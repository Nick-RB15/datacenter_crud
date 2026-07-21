import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../client';
import { Calendar as CalendarIcon, Clock, FileText, Search } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
 
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    loadData();
  }, [currentMonth]);
 
  const loadData = async () => {
    setLoading(true);
    try {
      const [tlRes, calRes] = await Promise.all([
        api.get('/dashboard/timeline'),
        api.get(
          `/dashboard/calendar?start=${startOfMonth(currentMonth).toISOString()}&end=${endOfMonth(
            currentMonth
          ).toISOString()}`
        ),
      ]);
      setTimeline(tlRes.data);
      setEvents(calRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  const filtered = timeline.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.course.toLowerCase().includes(search.toLowerCase())
  );
 
  const firstName = user?.full_name?.split(' ')[0] || 'Usuario';
 
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(addDays(calendarStart, i));
  }
 
  const today = new Date();
 
  const hasEvent = (date) =>
    events.some((e) => {
      const s = parseISO(e.start);
      return (
        s.getDate() === date.getDate() &&
        s.getMonth() === date.getMonth() &&
        s.getFullYear() === date.getFullYear()
      );
    });
 
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Hi, {firstName.toUpperCase()}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenido a tu Entorno Virtual de Aprendizaje
        </p>
      </div>
 
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" /> Timeline
              </h2>
              <div className="flex gap-2">
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none">
                  <option>All</option>
                </select>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white outline-none">
                  <option>Sort by dates</option>
                </select>
              </div>
            </div>
 
            <div className="relative mb-5">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by activity type or name"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
 
            {loading ? (
              <p className="text-gray-500 text-sm">Cargando actividades...</p>
            ) : (
              <div className="space-y-4">
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-500">No hay actividades próximas</p>
                )}
                {filtered.map((item) => {
                  const date = parseISO(item.date);
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition"
                    >
                      <div className="flex sm:flex-col items-center sm:items-center gap-2 sm:gap-0 min-w-[4rem]">
                        <span className="text-xs font-semibold text-gray-500 uppercase">
                          {format(date, 'EEEE', { locale: es })}
                        </span>
                        <span className="text-2xl font-bold text-primary-600">
                          {format(date, 'd')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Clock className="w-3 h-3" />
                          {format(date, 'HH:mm')}
                        </div>
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{item.detail}</p>
                        <p className="text-xs text-primary-600 mt-1 font-medium">
                          {item.course}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/assignments/${item.id}`)}
                        className="self-start sm:self-center shrink-0 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition"
                      >
                        Add submission
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
 
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary-600" /> Calendar
              </h2>
              <select className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none">
                <option>All courses</option>
              </select>
            </div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                ◄
              </button>
              <span className="font-semibold capitalize text-sm">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                ►
              </button>
            </div>
 
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                const isToday =
                  date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
                const eventDay = hasEvent(date);
                return (
                  <div
                    key={i}
                    className={`h-9 flex flex-col items-center justify-center rounded-lg text-sm transition ${
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                    } ${
                      isToday
                        ? 'bg-primary-100 text-primary-700 font-bold'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {date.getDate()}
                    {eventDay && (
                      <span className="w-1 h-1 bg-primary-500 rounded-full mt-0.5"></span>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="mt-5 w-full py-2 border border-primary-600 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-50 transition">
              New event
            </button>
          </div>
 
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-lg p-5 text-white">
            <h3 className="font-semibold mb-1">¿Necesitas ayuda?</h3>
            <p className="text-sm text-primary-100 mb-4">
              Consulta los recursos de tu curso o contacta a tu profesor.
            </p>
            <button className="px-4 py-2 bg-white text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition">
              Ver recursos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}