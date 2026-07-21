#!/bin/bash
set -e
 
# Script de provisionamiento base. Ejecutar como root en un VPS Ubuntu limpio.
 
export DEBIAN_FRONTEND=noninteractive
export PGPORT="${PGPORT:-5432}"
apt-get update && apt-get upgrade -y
apt-get install -y python3 python3-venv python3-pip \
  postgresql postgresql-contrib nginx git ufw \
  build-essential libpq-dev
 
# Base de datos
PG_CONF=$(find /etc/postgresql -path "*/main/postgresql.conf" 2>/dev/null | head -n 1)
if [ -n "$PG_CONF" ]; then
  sed -i "s/^#\?port = .*/port = 5432/" "$PG_CONF"
  systemctl restart postgresql
fi
sudo -u postgres psql -c "CREATE USER datacenter_crud_user WITH PASSWORD 'datacenter_pass';" || true
sudo -u postgres psql -c "CREATE DATABASE datacenter_crud_db OWNER datacenter_crud_user;" || true
 
# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
 
# Aplicación
APP_DIR="/opt/datacenter_crud"
if [ ! -d "$APP_DIR" ]; then
  echo "Clona el repositorio en $APP_DIR y vuelve a ejecutar el script."
  exit 1
fi
 
cd "$APP_DIR"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
 
cd "$APP_DIR/frontend"
npm ci
npm run build
 
cd "$APP_DIR"
export FLASK_APP=backend.app
flask db upgrade
python -m backend.seed
 
# Servicios
cp "$APP_DIR/deploy/gunicorn.service" /etc/systemd/system/datacenter_crud.service
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/datacenter_crud
ln -sf /etc/nginx/sites-available/datacenter_crud /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

systemctl daemon-reload
systemctl enable datacenter_crud
systemctl start datacenter_crud
systemctl restart nginx
 
# Backup
cp "$APP_DIR/deploy/backup.sh" /usr/local/bin/datacenter_crud-backup.sh
chmod +x /usr/local/bin/datacenter_crud-backup.sh
(crontab -l 2>/dev/null || true; echo "0 3 * * * /usr/local/bin/datacenter_crud-backup.sh") | crontab -
 
echo "Provisionamiento completado."