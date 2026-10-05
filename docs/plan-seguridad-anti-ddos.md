# Plan de Seguridad y Mitigación DoS / DDoS — Índice General

Este plan ha sido dividido en dos fases independientes para facilitar su ejecución paso a paso:

---

### [Parte 1: Implementación en Código y Servidor Local (NestJS + GraphQL + Redis + Nginx)](file:///c:/Users/om.gonzalez/Desktop/lineup/docs/01-plan-seguridad-nestjs-librerias.md)
> **Fase Inmediata (Trabajo actual)**
- Instalación de librerías (`@nestjs/throttler`, `@nest-lab/throttler-storage-redis`, `ioredis`, `graphql-depth-limit`, `helmet`).
- Creación del guard híbrido `GqlThrottlerGuard` para soportar GraphQL y REST.
- Configuración de almacenamiento distribuido usando el contenedor `redis:8` ya existente en Docker Compose.
- Blindaje de GraphQL (límite de profundidad a 6 niveles y deshabilitación de introspección en producción).
- Configuración de `trust proxy` en Express y reglas de rate limiting y Slowloris en Nginx local.

---

### [Parte 2: Protección Perimetral Externa con Cloudflare (Para implementar después)](file:///c:/Users/om.gonzalez/Desktop/lineup/docs/02-plan-seguridad-cloudflare-infra.md)
> **Fase Futura (Sin costo - Plan Free de Cloudflare)**
- Mitigación de ataques volumétricos masivos (L3/L4/L7) en la red Edge de Cloudflare antes de que toquen el VPS.
- Ocultamiento de la IP pública del servidor mediante DNS Proxy (Nube Naranja).
- Configuración de WAF, Bot Fight Mode y "Under Attack Mode".
- Configuración de Nginx para restaurar la IP real (`CF-Connecting-IP`) y bloqueo de acceso directo mediante UFW.

---

### [Guía de Variables de Entorno: Seguridad y Rate Limiting](file:///c:/Users/om.gonzalez/Desktop/lineup/docs/variables-entorno-seguridad.md)
- Tabla completa de variables (`REDIS_*`, `THROTTLE_*`, `GQL_DEPTH_LIMIT`).
- Plantilla para `.env` local y plantilla para `.env` de producción en VPS con Docker.
- Recomendaciones de ajuste para picos de tráfico vs modo defensivo.
