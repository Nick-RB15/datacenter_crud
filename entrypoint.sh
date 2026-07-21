#!/bin/bash
set -e
 
flask db upgrade
python -m backend.seed
 
exec gunicorn -w 4 -b 0.0.0.0:5000 backend.wsgi:app