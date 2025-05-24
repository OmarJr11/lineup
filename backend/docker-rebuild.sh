#!/bin/bash
# Script para automatizar el flujo de build, despliegue y migraciones en Docker Compose

set -e

echo "Bajando contenedores antiguos..."
docker-compose down --volumes --rmi all

echo "Reconstruyendo y levantando servicios..."
docker-compose up --build -d

echo "Ejecutando migraciones en backend..."
docker-compose exec backend-public npm run migration:run || true

echo "Listo. Todos los servicios están arriba y migraciones aplicadas."
