# syntax=docker/dockerfile:1
FROM node:20-alpine AS frontend
 
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --production=false
COPY frontend/ ./
RUN npm run build
 
FROM python:3.10-slim AS backend
 
WORKDIR /app
 
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*
 
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
 
COPY backend/ ./backend/
COPY migrations/ ./migrations/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
 
COPY --from=frontend /frontend/dist ./frontend/dist
 
ENV FLASK_APP=backend.app
ENV PYTHONPATH=/app
 
EXPOSE 5000
 
CMD ["/entrypoint.sh"]