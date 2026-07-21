# Guía de despliegue de DATACENTER_CRUD
 
## Despliegue manual en VPS
 
### 1. Preparar el servidor
 
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-venv python3-pip postgresql postgresql-contrib nginx git ufw build-essential libpq-dev nodejs npm
```
 
### 2. Crear usuario y base de datos
 
```bash
sudo -u postgres psql -c "CREATE USER datacenter_user WITH PASSWORD 'datacenter_pass';"
sudo -u postgres psql -c "CREATE DATABASE datacenter_db OWNER datacenter_user;"
```
 
### 3. Clonar y configurar
 
```bash
sudo mkdir -p /opt/datacenter_crud
sudo chown $USER:$USER /opt/datacenter_crud
git clone https://github.com/<usuario>/datacenter_crud.git /opt/datacenter_crud
cd /opt/datacenter_crud
 
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```
 
Crear `/opt/datacenter_crud/.env`:
 
```bash
DATABASE_URL=postgresql+psycopg2://datacenter_user:datacenter_pass@localhost:5432/datacenter_db
SECRET_KEY=<clave-larga-aleatoria>
JWT_SECRET_KEY=<otra-clave-larga-aleatoria>
```
 
### 4. Migraciones y datos de ejemplo
 
```bash
export FLASK_APP=backend.app
flask db upgrade
python -m backend.seed
```
 
### 5. Compilar frontend
 
```bash
cd /opt/datacenter_crud/frontend
npm install
npm run build
```
 
### 6. Servicio systemd
 
```bash
sudo cp /opt/datacenter_crud/deploy/gunicorn.service /etc/systemd/system/datacenter_crud.service
sudo systemctl daemon-reload
sudo systemctl enable datacenter_crud
sudo systemctl start datacenter_crud
```
 
### 7. Nginx
 
```bash
sudo cp /opt/datacenter_crud/deploy/nginx.conf /etc/nginx/sites-available/datacenter_crud
sudo ln -s /etc/nginx/sites-available/datacenter_crud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```
 
### 8. Firewall
 
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verifica:
sudo ufw status
 
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d eva.ejemplo.com
```
 
## Despliegue automático con GitHub Actions
 
### 1. Preparar GitHub

1. Sube el repositorio a GitHub.
2. Entra a Settings → Secrets and variables → Actions.
3. Crea estos secrets:
   - `VPS_HOST`: IP pública o hostname de tu VPS.
   - `VPS_USER`: usuario SSH de la VPS, por ejemplo `ubuntu`.
   - `VPS_SSH_KEY`: clave privada SSH en formato PEM.
   - `VPS_PORT`: puerto SSH, normalmente `22`.

### 2. Hacer push a main

```bash
git add .
git commit -m "Preparar despliegue"
git branch -M main
git remote add origin git@github.com:<usuario>/<repo>.git
git push -u origin main
```

### 3. Verificar el workflow

- GitHub Actions ejecuta tests y build.
- Si todo pasa, hace deploy por SSH a `/opt/datacenter_crud`.
- Revisa la pestaña Actions del repositorio.

### 4. Ajustar el dominio o IP

- Si tu VPS tiene IP, abre `http://TU_IP`.
- Si usas dominio, apunta `A` o `CNAME` al servidor y ajusta el bloque de Nginx.
 
## Backup Automático

```bash
# Copia el script de backup
sudo cp /opt/datacenter_crud/deploy/backup.sh /usr/local/bin/datacenter_backup.sh
sudo chmod +x /usr/local/bin/datacenter_backup.sh

# Crea el directorio de backups
sudo mkdir -p /backups/postgres
sudo chown postgres:postgres /backups/postgres

# Programa el backup diario a las 03:00 UTC
(sudo crontab -l 2>/dev/null; echo "0 3 * * * /bin/bash /opt/datacenter_crud/deploy/backup.sh") | sudo crontab -

# Verifica:
sudo crontab -l
```

### Restaurar un backup (en caso de emergencia)

```bash
# Listar backups disponibles
ls -lah /backups/postgres/

# Restaurar un backup específico
sudo -u postgres gunzip -c /backups/postgres/datacenter_crud_db-20260721-030000.sql.gz | psql -d datacenter_crud_db
```

## Rotación de Logs

```bash
# Crea configuración de logrotate
sudo tee /etc/logrotate.d/datacenter_crud > /dev/null <<'EOF'
/var/log/datacenter_crud/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
}
EOF
```

## Verificación final

Accede a `http://<IP>` o `https://<dominio>` y prueba las cuentas:

- `admin@eva.com` / `admin123`
- `teacher@eva.com` / `teacher123`
- `student@eva.com` / `student123`

## Monitoreo y Troubleshooting

### Ver estado de servicios
```bash
sudo systemctl status datacenter_crud nginx postgresql
```

### Ver logs en tiempo real
```bash
sudo journalctl -u datacenter_crud -f
sudo journalctl -u nginx -f
```

### La aplicación no inicia
```bash
sudo journalctl -u datacenter_crud -n 50 --no-pager
```

### Nginx no reinicia
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Base de datos no conecta
```bash
sudo -u postgres psql -d datacenter_crud_db -c "SELECT 1"
```

### Verificar que Gunicorn está escuchando
```bash
sudo netstat -tlnp | grep 5000
```

## Recomendación final para tu VPS

- Usa Ubuntu 22.04 o 24.04.
- Mantén PostgreSQL, Nginx y Gunicorn activos.
- Revisa los logs regularmente: `sudo journalctl -f`
- Usa un dominio propio si quieres acceso HTTPS.
- Para HTTPS, instala Certbot:
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d tudominio.com
  ```
- Aplica actualizaciones de seguridad regularmente:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
- Configura alertas de backup: revisa `/backups/postgres/` semanalmente.