# DATACENTER_CRUD
 
Aplicación full-stack para gestión académica y operativa con autenticación JWT, gestión de roles (estudiante, profesor, administrador), cursos, asignaciones, entregas, calificaciones y un dashboard con timeline y calendario.
 
## Stack
 
- **Frontend:** React + Vite + Tailwind CSS + React Router
- **Backend:** Python 3.10 + Flask + Flask-SQLAlchemy + Flask-Migrate + Flask-JWT-Extended + Flask-CORS
- **Base de datos:** SQLite (dev) / PostgreSQL (prod)
- **Servidor de aplicaciones:** Gunicorn
- **Servidor web/proxy inverso:** Nginx
- **CI/CD:** GitHub Actions + SSH al VPS
- **Contenedores:** Docker + Docker Compose
 
## Estructura del proyecto
 
```
.
├── backend/               # API Flask
│   ├── app.py             # Application factory
│   ├── auth.py            # Auth + gestión de roles
│   ├── courses.py         # Cursos y matrículas
│   ├── assignments.py     # Asignaciones y entregas
│   ├── events.py          # Eventos del calendario
│   ├── dashboard.py       # Timeline y calendario unificados
│   ├── models.py          # Modelos SQLAlchemy
│   ├── seed.py            # Datos de ejemplo
│   └── tests/             # Tests con pytest
├── frontend/              # SPA React
│   ├── src/
│   │   ├── pages/         # Login, Dashboard, Cursos, AdminUsers, AssignmentDetail...
│   │   ├── components/    # Layout, ProtectedRoute
│   │   ├── context/       # AuthContext
│   │   └── api/client.js  # Axios con token
│   └── package.json
├── migrations/            # Alembic
├── docs/                  # Informe y guía de despliegue
├── deploy/                # Scripts y configuraciones
├── Dockerfile
├── docker-compose.yml
└── entrypoint.sh
```
 
## Requisitos
 
- Python 3.10+
- Node.js 18+ / npm
- Docker y Docker Compose (opcional)
 
## Ejecutar localmente
 
### 1. Backend
 
```bash
cd /home/ubuntu/repos/eva-universidad
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
export FLASK_APP=backend.app
flask db upgrade
python -m backend.seed
flask run --host=0.0.0.0 --port=5000
```
 
### 2. Frontend
 
```bash
cd frontend
npm install
npm run dev
```
 
La app estará en `http://localhost:5173` y apunta al backend en `http://localhost:5000` gracias al proxy de Vite.
 
### 3. Cuentas de prueba
 
| Rol          | Email               | Contraseña  |
|--------------|---------------------|-------------|
| Administrador| `admin@eva.com`     | `admin123`  |
| Profesor     | `teacher@eva.com`   | `teacher123`|
| Estudiante   | `student@eva.com`   | `student123`|
 
## Ejecutar con Docker Compose
 
```bash
docker compose up --build -d
```
 
Esto levanta PostgreSQL + Flask/Gunicorn con el frontend embebido. Accede a `http://localhost:5000`.
 
## Build de producción
 
```bash
cd frontend
npm install
npm run build
```
 
El backend sirve automáticamente el directorio `frontend/dist` desde `/`.
 
## Tests
 
```bash
source venv/bin/activate
python -m pytest backend/tests -v
```
 
## Variables de entorno
 
| Variable        | Descripción                                  | Ejemplo (dev) |
|-----------------|----------------------------------------------|---------------|
| `DATABASE_URL`  | URI de SQLAlchemy                            | `sqlite:///{path}` |
| `SECRET_KEY`    | Clave de sesión/CSRF de Flask                | `...` |
| `JWT_SECRET_KEY`| Clave de firma de tokens JWT                 | `...` |
 
## Despliegue en VPS
 
Sigue la guía completa en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) y el workflow de CI/CD en [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

### Resumen rápido

1. Sube el proyecto a GitHub en la rama `main`.
2. Crea los secrets en GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`.
3. En la VPS instala dependencias, crea el usuario de PostgreSQL y el archivo `.env`.
4. Clona el repositorio en `/opt/datacenter_crud`.
5. Ejecuta el flujo de despliegue con GitHub Actions o manualmente.
6. Verifica que la app quede disponible en `http://TU_IP` o `https://TU_DOMINIO`.
 
## Autor
 
Proyecto académico recreado con React, mejoras visuales y gestión de roles.