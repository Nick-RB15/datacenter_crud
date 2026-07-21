# Arquitectura de DATACENTER_CRUD

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                     INTERNET                                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    HTTP/HTTPS (Puerto 80/443)
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTE                                │
│                   (Navegador Web)                               │
│                  SPA React + Vite                               │
│          Frontend + Estado reactivo (AuthContext)               │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    Solicitudes HTTP/JSON
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         VPS (Linux)                             │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │          NGINX (Reverse Proxy)  Puerto 80/443               │ │
│ │  • Sirve archivos estáticos (SPA)                           │ │
│ │  • Proxy reverso → Gunicorn:5000                           │ │
│ │  • Cache headers                                            │ │
│ │  • Compresión GZIP                                          │ │
│ │  • Headers de seguridad                                     │ │
│ └────────────┬──────────────────────────────────────────────┘ │
│              │                                                  │
│              │  localhost:5000                                 │
│              ▼                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │        GUNICORN (4 workers) - App Server                    │ │
│ │                                                              │ │
│ │  ┌──────────────────────────────────────────────────────┐  │ │
│ │  │         FLASK (Backend API)                          │  │ │
│ │  │  • Autenticación JWT                                 │  │ │
│ │  │  • Gestión de Roles                                  │  │ │
│ │  │  • CRUD: Cursos, Asignaciones, Entregas             │  │ │
│ │  │  • Dashboard, Timeline, Calendario                   │  │ │
│ │  │  • Endpoints RESTful                                 │  │ │
│ │  └───────────────────────┬────────────────────────────┘  │ │
│ │                          │                               │ │
│ │                  SQLAlchemy ORM                          │ │
│ │                          │                               │ │
│ └──────────────────────────┼───────────────────────────────┘ │
│                            │                                  │
│                  localhost:5433 / 5432                         │
│                            │                                  │
│ ┌──────────────────────────▼───────────────────────────────┐ │
│ │        PostgreSQL (Base de Datos)                        │ │
│ │                                                          │ │
│ │  • Tablas:                                               │ │
│ │    - users (id, email, full_name, role_id)              │ │
│ │    - roles (id, name)                                    │ │
│ │    - courses (id, code, name, teacher_id)               │ │
│ │    - enrollments (id, user_id, course_id)               │ │
│ │    - assignments (id, course_id, title, due_date)       │ │
│ │    - submissions (id, assignment_id, student_id, grade) │ │
│ │    - events (id, course_id, title, start, end)          │ │
│ │    - notifications (id, user_id, title, message, read)  │ │
│ │                                                          │ │
│ │  • Usuario: datacenter_crud_user                         │ │
│ │  • BD: datacenter_crud_db                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │             FIREWALL (UFW)                                  │ │
│ │  • Permite: 22 (SSH), 80 (HTTP), 443 (HTTPS)               │ │
│ │  • Deniega: Todo lo demás                                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │           SISTEMA (systemd)                                 │ │
│ │  • datacenter_crud.service (Gunicorn)                       │ │
│ │  • nginx.service                                            │ │
│ │  • postgresql.service                                       │ │
│ │  • Logs en /var/log/                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │           BACKUPS AUTOMÁTICOS                               │ │
│ │  • Cron: 03:00 UTC cada día                                 │ │
│ │  • pg_dump → /backups/postgres/                             │ │
│ │  • Retención: 7 días                                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Autenticación (Login)
```
Cliente (Login.jsx)
  ↓ POST /api/auth/login
Backend (auth.py)
  ↓ Verifica contraseña
PostgreSQL
  ↓ Devuelve JWT token
Cliente (localStorage)
  ↓ Guarda token
Requests futuras incluyen: "Authorization: Bearer {token}"
```

### 2. CRUD de Cursos
```
Cliente (Courses.jsx)
  ↓ GET /api/courses
Backend (courses.py → @jwt_required)
  ↓ Query: SELECT * FROM courses WHERE teacher_id = current_user
PostgreSQL
  ↓ [{"id": 1, "code": "PV-2026-1", ...}]
Cliente
  ↓ Renderiza lista y permite editar/eliminar
Cliente → PUT /api/courses/{id} o DELETE /api/courses/{id}
Backend → Actualiza DB → 200 OK
Cliente → Refresca lista
```

### 3. CRUD de Asignaciones
```
Cliente (CourseDetail.jsx)
  ↓ GET /api/courses/{course_id}/assignments
Backend
  ↓ Query: SELECT * FROM assignments WHERE course_id = {course_id}
PostgreSQL
  ↓ Retorna asignaciones
Cliente
  ↓ POST /api/courses/{course_id}/assignments
Backend
  ↓ INSERT + returnsjson
PostgreSQL
  ↓ Crea asignación
Cliente → Refresca lista
```

## Comunicación con el Servidor

### Stack Frontend
- **React 18**: Interfaz de usuario
- **Vite**: Build tool + Dev server
- **Axios**: HTTP client con interceptores JWT
- **Tailwind CSS**: Estilos
- **React Router**: Navegación SPA
- **date-fns**: Formateo de fechas

### Stack Backend
- **Flask 3.0**: Framework web
- **SQLAlchemy 2.0**: ORM
- **Flask-Migrate (Alembic)**: Migraciones
- **Flask-JWT-Extended**: Tokens JWT
- **Flask-CORS**: Cross-Origin requests
- **psycopg2**: Driver PostgreSQL
- **Gunicorn**: WSGI server

## Integración CI/CD

```
GitHub Repository (main)
    ↓ git push
GitHub Actions
    ├─ Test (pytest backend)
    ├─ Build (npm run build frontend)
    └─ Deploy (SSH a VPS)
        ↓
VPS (/opt/datacenter_crud)
    ├─ git pull
    ├─ pip install
    ├─ npm install && npm run build
    ├─ flask db upgrade
    ├─ systemctl restart datacenter_crud
    └─ systemctl reload nginx
        ↓
App actualizada en vivo
```

## Seguridad

### Autenticación y Autorización
- **JWT tokens** con expiración de 24h
- **Roles basados en acceso (RBAC)**: admin, teacher, student
- **@jwt_required()** en endpoints protegidos
- **@role_required("teacher", "admin")** para acciones sensibles

### Base de Datos
- **Usuario dedicado** para PostgreSQL (datacenter_crud_user)
- **Conexión SSL opcional** en producción
- **Pool de conexiones** en Gunicorn

### Servidor Web
- **HTTPS/SSL** (recomendado con Certbot)
- **Headers de seguridad** en Nginx
- **Firewall UFW** (solo puertos 22, 80, 443)
- **SSH por clave pública** (no contraseña)

### Respaldos
- **Backup automático** de PostgreSQL cada 3 AM UTC
- **Compresión gzip** para ahorrar espacio
- **Retención de 7 días**
- **Almacenamiento en /backups/postgres** (fuera del directorio de la app)

## Escalabilidad Futura

### Mejoras posibles:
1. **Load Balancer**: HAProxy/Nginx upstream con múltiples servidores
2. **Redis**: Caché de sesiones JWT y datos frecuentes
3. **CDN**: CloudFront/Cloudflare para estáticos
4. **Monitoreo**: Prometheus + Grafana para métricas
5. **Logging centralizado**: ELK (Elasticsearch, Logstash, Kibana)
6. **Auto-scaling**: Kubernetes o Docker Swarm
