
import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../src/api/context/AuthContext';
import api from '../src/api/client';
import {
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from 'lucide-react';
 
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
 
  useEffect(() => {
    if (!user) return;
    api.get('/dashboard/notifications').then((res) => setNotifications(res.data));
  }, [user]);
 
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
 
  const unread = notifications.filter((n) => !n.read).length;
 
  const markRead = async (id) => {
    await api.patch(`/dashboard/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };
 
  const navItems = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Cursos', to: '/courses', icon: BookOpen },
    ...(user?.role === 'teacher' || user?.role === 'admin'
      ? [{ label: 'Asignaciones', to: '/assignments', icon: Calendar }]
      : []),
    ...(user?.role === 'admin'
      ? [{ label: 'Usuarios', to: '/admin/users', icon: Users }]
      : []),
  ];
 
  const initials = user?.full_name
    ?.split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NR';
 
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6 md:gap-10">
            <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg shrink-0">
              <BookOpen className="w-6 h-6" />
              <span className="hidden sm:inline">Ambiente Virtual de Aprendizaje</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              {navItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-1.5 hover:text-primary-600 transition ${
                    location.pathname === n.to ? 'text-primary-600' : ''
                  }`}
                >
                  <n.icon className="w-4 h-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
 
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white border rounded-xl shadow-lg p-2 z-50">
                  {notifications.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500">Sin notificaciones</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`w-full text-left p-3 text-sm border-b last:border-0 hover:bg-gray-50 rounded-lg ${
                          n.read ? 'opacity-60' : ''
                        }`}
                      >
                        <p className="font-medium text-gray-900">{n.title}</p>
                        <p className="text-gray-500 text-xs line-clamp-2">{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
 
            <div className="hidden sm:flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border hover:bg-gray-50">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
              <div className="text-xs text-left leading-tight">
                <p className="font-medium text-gray-900 truncate max-w-[100px]">{user?.full_name}</p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="p-1 text-gray-400 hover:text-red-600">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
 
            <button
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
 
        {mobileMenu && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-2">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-2 py-2 text-gray-700 hover:text-primary-600"
              >
                <n.icon className="w-4 h-4" /> {n.label}
              </Link>
            ))}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2 py-2 text-red-600 w-full"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        )}
      </header>
 
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}