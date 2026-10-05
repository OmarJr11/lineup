# Guía de Variables de Entorno: Seguridad y Rate Limiting

Esta guía describe todas las variables de entorno incorporadas para la seguridad contra ataques DoS/DDoS, rate limiting con Redis y protección de consultas GraphQL en el backend de Lineup.

Todas estas variables cuentan con **valores por defecto seguros (fallbacks)** definidos en el esquema Joi de validación ([`core/common/config/validating-env.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/core/common/config/validating-env.ts#L37-L48)). Por tanto, **la aplicación arrancará normalmente incluso si no defines ninguna en tu archivo `.env`**.

---

## 1. Tabla de Variables de Entorno

| Variable | Tipo | Valor por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `REDIS_HOST` | `string` | `localhost` (en VPS: `redis`) | Host o dirección IP del servidor Redis. En Docker Compose es el nombre del servicio `redis`. |
| `REDIS_PORT` | `number` | `6379` | Puerto donde escucha Redis. |
| `REDIS_PASSWORD` | `string` | *(vacío)* | Contraseña de autenticación de Redis (si está configurada con `requirepass`). |
| `THROTTLE_TTL_SHORT` | `number` | `1000` | Ventana de tiempo para ráfagas cortas en milisegundos (1 segundo). |
| `THROTTLE_LIMIT_SHORT` | `number` | `15` | Máximo de peticiones permitidas por IP en la ventana corta (ej. máx 15 req/seg). |
| `THROTTLE_TTL_MEDIUM` | `number` | `10000` | Ventana de tiempo a mediano plazo en milisegundos (10 segundos). |
| `THROTTLE_LIMIT_MEDIUM` | `number` | `60` | Máximo de peticiones permitidas por IP en la ventana media (ej. máx 60 req en 10 seg). |
| `THROTTLE_TTL_LONG` | `number` | `60000` | Ventana de tiempo a largo plazo en milisegundos (1 minuto). |
| `THROTTLE_LIMIT_LONG` | `number` | `300` | Máximo de peticiones permitidas por IP por minuto (ej. máx 300 req/min). |
| `GQL_DEPTH_LIMIT` | `number` | `6` | Máxima profundidad de anidación permitida en consultas GraphQL (evita bucles infinitos). |

---

## 2. Plantilla para Desarrollo Local (`.env`)

Si estás trabajando en tu máquina local con Node.js o Docker local:

```env
# ==============================================================================
# SEGURIDAD, REDIS Y RATE LIMITING (DESARROLLO LOCAL)
# ==============================================================================

# Conexión a Redis local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting (Límites flexibles para desarrollo y pruebas)
THROTTLE_TTL_SHORT=1000
THROTTLE_LIMIT_SHORT=25
THROTTLE_TTL_MEDIUM=10000
THROTTLE_LIMIT_MEDIUM=100
THROTTLE_TTL_LONG=60000
THROTTLE_LIMIT_LONG=500

# GraphQL Depth Limit
GQL_DEPTH_LIMIT=6
```

---

## 3. Plantilla para Producción en VPS con Docker (`.env`)

En tu VPS, los contenedores corren dentro de la red interna de Docker Compose donde el servicio de Redis se llama `redis`:

```env
# ==============================================================================
# SEGURIDAD, REDIS Y RATE LIMITING (PRODUCCIÓN / VPS)
# ==============================================================================

# Conexión interna de Docker Compose al servicio redis:8
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Nivel 1: Ráfagas (Máximo 15 peticiones en 1 segundo por IP)
THROTTLE_TTL_SHORT=1000
THROTTLE_LIMIT_SHORT=15

# Nivel 2: Ráfagas medianas (Máximo 60 peticiones en 10 segundos por IP)
THROTTLE_TTL_MEDIUM=10000
THROTTLE_LIMIT_MEDIUM=60

# Nivel 3: Peticiones continuas (Máximo 300 peticiones por minuto por IP)
THROTTLE_TTL_LONG=60000
THROTTLE_LIMIT_LONG=300

# GraphQL Query Depth Limit (Rechaza consultas con más de 6 niveles de anidación)
GQL_DEPTH_LIMIT=6
```

---

## 4. Cómo ajustar los límites según la situación

### Caso A: Campaña de marketing o tráfico masivo legítimo
Si esperas un evento con miles de usuarios reales navegando activamente y no deseas que usuarios intensivos reciban `429 Too Many Requests`:
```env
THROTTLE_LIMIT_SHORT=30
THROTTLE_LIMIT_MEDIUM=120
THROTTLE_LIMIT_LONG=600
```
*Aplica reiniciando los contenedores: `docker compose restart api-users api-businesses api-admin`.*

### Caso B: Servidor bajo sospecha de ataque DoS / Scraping agresivo
Si detectas tráfico anómalo o uso abusivo de bots en el VPS:
```env
THROTTLE_LIMIT_SHORT=8
THROTTLE_LIMIT_MEDIUM=30
THROTTLE_LIMIT_LONG=120
GQL_DEPTH_LIMIT=4
```
*Esto reduce drásticamente el consumo de CPU y memoria de Node.js cortando las peticiones en seco a nivel de Redis.*

---

## 5. Pruebas Automáticas Relacionadas

Puedes verificar el correcto funcionamiento de esta configuración ejecutando:

```bash
# Tests unitarios
pnpm exec jest core/common/guards/gql-throttler.guard.spec.ts core/common/config/throttler.config.spec.ts

# Test E2E de Rate Limiting y Depth Limit
pnpm exec jest --config ./apps/users/test/jest-e2e.json apps/users/test/security-throttler.e2e-spec.ts
```
