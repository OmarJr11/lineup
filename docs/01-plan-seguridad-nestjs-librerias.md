# Parte 1: Implementación en Código y Servidor Local (NestJS + GraphQL + Redis + Nginx)

> **Estado:** Fase inmediata de implementación  
> **Objetivo:** Proteger la aplicación contra ataques DoS de Capa 7, fuerza bruta y queries abusivas de GraphQL usando el Redis local de Docker y Nginx.

---

## 1. Librerías a Instalar

Ejecutar en la raíz del proyecto con `pnpm`:

```bash
# 1. Rate Limiting de NestJS + almacenamiento en Redis + cliente ioredis
pnpm add @nestjs/throttler @nest-lab/throttler-storage-redis ioredis

# 2. Tipos de desarrollo
pnpm add -D @types/ioredis

# 3. Protección de consultas profundas para GraphQL (Evita bucles y anidación infinita)
pnpm add graphql-depth-limit
pnpm add -D @types/graphql-depth-limit

# 4. Seguridad de cabeceras HTTP en Express
pnpm add helmet
```

---

## 2. Implementación en Código (NestJS & Core)

### 2.1 Guard Híbrido GraphQL + REST: `GqlThrottlerGuard`
Dado que el proyecto utiliza GraphQL ([`@nestjs/graphql`](file:///c:/Users/om.gonzalez/Desktop/lineup/package.json)), el `ThrottlerGuard` nativo intentará extraer el request mediante `context.switchToHttp()`, lo cual devuelve `undefined` en resolvers GraphQL.

Crear el archivo en [`core/common/guards/gql-throttler.guard.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/core/common/guards):

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    // Soporte para GraphQL Context (Apollo)
    if (ctx && ctx.req) {
      return { req: ctx.req, res: ctx.res };
    }

    // Soporte para controladores REST tradicionales
    return super.getRequestResponse(context);
  }
}
```

---

### 2.2 Configuración del `ThrottlerModule` con Redis de Docker
En tu [`docker-compose.yml`](file:///c:/Users/om.gonzalez/Desktop/lineup/docker-compose.yml#L15), el contenedor `redis` ya está disponible bajo la red interna.

Configurar en cada módulo principal ([`apps/users/src/users.module.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/apps/users/src/users.module.ts), `businesses.module.ts`, `admin.module.ts`):

```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from '../../../core/common/guards/gql-throttler.guard';

// Dentro de @Module({ imports: [ ... ] })
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const redisHost = configService.get<string>('REDIS_HOST', 'redis');
    const redisPort = configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = configService.get<string>('REDIS_PASSWORD', '');

    const redis = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
    });

    return {
      throttlers: [
        { name: 'short', ttl: 1000, limit: 15 },    // Máx 15 peticiones por segundo (ráfagas)
        { name: 'medium', ttl: 10000, limit: 60 },  // Máx 60 peticiones por 10 segundos
        { name: 'long', ttl: 60000, limit: 300 },   // Máx 300 peticiones por minuto
      ],
      storage: new ThrottlerStorageRedisService(redis),
    };
  },
}),

// Dentro de providers: [ ... ]
providers: [
  {
    provide: APP_GUARD,
    useClass: GqlThrottlerGuard,
  },
]
```

---

### 2.3 Blindaje de GraphQL (Depth Limit & Introspection)
En [`apps/users/src/users.module.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/apps/users/src/users.module.ts#L52):

```typescript
import depthLimit from 'graphql-depth-limit';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  resolvers: { JSON: GraphQLJSON },
  autoSchemaFile: true,
  // Desactivar playground e introspección en producción para evitar escaneo de esquema
  playground: process.env.NODE_ENV !== EnvironmentsEnum.Production,
  debug: process.env.NODE_ENV !== EnvironmentsEnum.Production,
  introspection: process.env.NODE_ENV !== EnvironmentsEnum.Production,
  sortSchema: true,
  context: ({ req, res }) => ({ req, res }),
  // Limita la anidación recursiva a 6 niveles máximo
  validationRules: [depthLimit(6)],
}),
```

---

### 2.4 Habilitar `trust proxy` y `helmet` en `main.ts`
En [`apps/users/src/main.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/apps/users/src/main.ts), [`apps/businesses/src/main.ts`](file:///c:/Users/om.gonzalez/Desktop/lineup/apps/businesses/src/main.ts) y `apps/admin/src/main.ts`:

```typescript
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

// Asegurar el tipo NestExpressApplication
const app = await NestFactory.create<NestExpressApplication>(UsersModule, { bodyParser: false });

// 1. Confiar en el proxy (Nginx en el VPS) para extraer la IP real del usuario
app.set('trust proxy', 1);

// 2. Cabeceras HTTP de seguridad
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === EnvironmentsEnum.Production ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));
```

---

### 2.5 Reglas personalizadas en Endpoints sensibles (Fuerza Bruta)
Para resolvers de login, registro o envío de códigos:

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

// Restricción severa para login (ej. máximo 5 intentos por minuto)
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Mutation(() => AuthResponse)
async login(...) { ... }

// Saltear throttling en webhooks internos o tareas seguras si aplica
@SkipThrottle()
@Query(() => HealthCheck)
async healthCheck() { ... }
```

---

## 3. Configuración en el VPS (Nginx como Escudo Local)

En el archivo de configuración de Nginx en tu VPS (`/etc/nginx/sites-available/...`):

```nginx
# 1. Zona de memoria para rate limit por IP (10 peticiones/seg con ráfaga tolerada de 20)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    server_name api.tudominio.com;

    # Timeouts contra ataques lentos (Slowloris)
    client_body_timeout 10s;
    client_header_timeout 10s;
    keepalive_timeout 30s;
    send_timeout 10s;

    # Máximo 20 conexiones simultáneas por IP
    limit_conn conn_limit 20;

    location / {
        # Aplica el rate limit inmediatamente a nivel de Nginx
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Checklist de Pruebas Locales y de Validación
- [ ] Ejecutar `pnpm install` con las nuevas librerías.
- [ ] Probar compilación del proyecto (`pnpm build`).
- [ ] Lanzar peticiones rápidas seguidas (ej. con un bucle `curl` o Postman) para validar que tras superar el límite se recibe el status **`429 Too Many Requests`**.
- [ ] Probar una consulta GraphQL con más de 6 niveles anidados y verificar que devuelva error de validación de profundidad.
