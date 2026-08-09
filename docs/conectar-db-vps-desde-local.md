# Conectar la base de datos del VPS desde tu computadora

Esta guía explica cómo usar el Postgres que corre en Docker en tu **VPS** desde tu **computadora local**, para:

1. **Probar la app** (Nest / APIs) en local contra la DB del VPS  
2. **Conectar DBeaver en tu PC** a esa misma DB (no instalar DBeaver en el VPS)  
3. **Usar un usuario de solo lectura** en DBeaver  

---

## Idea general (léelo una vez)

Tu PC y el VPS son máquinas distintas. Postgres en Docker **no** debe quedar abierto a internet.

Por eso:

1. En el VPS, Postgres solo escucha en `127.0.0.1:5432` (solo el propio VPS).  
2. Desde tu PC abres un **túnel SSH**.  
3. Ese túnel crea un puerto en el **localhost de TU PC**.  
4. DBeaver o tu `.env` local se conectan a `localhost` **en tu PC**, y el tráfico viaja por SSH hasta la DB del VPS.

```
Tu PC                          VPS
┌─────────────────────┐        ┌──────────────────────────────┐
│ DBeaver / Nest      │        │                              │
│ localhost:5433      │──SSH──▶│ 127.0.0.1:5432 → Docker db   │
│ (o túnel de DBeaver)│        │                              │
└─────────────────────┘        └──────────────────────────────┘
```

Cuando en DBeaver o en el `.env` pones `localhost` / `127.0.0.1`, es el **localhost de tu computadora**, no “entrar al VPS a mano”.

---

## Requisitos previos

- Acceso SSH al VPS (`usuario` + IP o dominio).  
- El proyecto desplegado con Docker Compose en el VPS.  
- El archivo `.env` del VPS con: `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`.  
- En el `docker-compose.yml` del VPS, el servicio `db` debe tener:

```yaml
db:
  image: postgres:18
  restart: always
  ports:
    - "127.0.0.1:5432:5432"
  environment:
    POSTGRES_DB: ${DB_NAME}
    POSTGRES_USER: ${DB_USERNAME}
    POSTGRES_PASSWORD: ${DB_PASSWORD}
  volumes:
    - pgdata:/var/lib/postgresql
```

Si acabas de cambiar el compose, en el VPS ejecuta:

```bash
docker compose up -d db
```

Comprueba que el puerto quedó solo en localhost del VPS:

```bash
docker compose ps
# o
ss -tlnp | grep 5432
```

Deberías ver algo ligado a `127.0.0.1:5432`, **no** a `0.0.0.0:5432`.

---

## Paso 0 — Crear el usuario de solo lectura (en el VPS)

Haz esto **una sola vez**. Este usuario es el que usará DBeaver.

1. Conéctate al VPS por SSH.  
2. Entra al contenedor de Postgres (sustituye user y db por los de tu `.env`):

```bash
docker compose exec db psql -U TU_DB_USERNAME -d TU_DB_NAME
```

3. Ejecuta (cambia `PASSWORD_FUERTE` y `TU_DB_NAME`):

```sql
CREATE ROLE dbeaver_ro WITH LOGIN PASSWORD 'PASSWORD_FUERTE';

GRANT CONNECT ON DATABASE TU_DB_NAME TO dbeaver_ro;
GRANT USAGE ON SCHEMA public TO dbeaver_ro;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO dbeaver_ro;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO dbeaver_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO dbeaver_ro;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO dbeaver_ro;
```

4. Sal de `psql` con `\q`.

**Qué puede hacer `dbeaver_ro`:** solo `SELECT` (leer).  
**Qué no puede:** `INSERT`, `UPDATE`, `DELETE`, migraciones, crear tablas, etc.

Guarda la password en un lugar seguro. La vas a usar solo en DBeaver.

---

## Item 1 — Probar la app en local contra la DB del VPS

Objetivo: correr Nest en tu PC (`pnpm run start:dev:...`) usando los datos reales (o de staging) que viven en el VPS.

### 1.1 Abrir el túnel SSH (en tu PC)

Abre una terminal **en tu computadora** y deja el comando corriendo:

```bash
ssh -N -L 5433:127.0.0.1:5432 usuario@IP_DEL_VPS
```

Qué significa cada parte:

| Parte | Significado |
|--------|-------------|
| `-N` | No abre shell remota; solo el túnel |
| `-L 5433:127.0.0.1:5432` | En **tu PC**, el puerto `5433` reenvía a `127.0.0.1:5432` **del VPS** |
| `usuario@IP_DEL_VPS` | Tu acceso SSH normal |

Si usas clave `.pem`:

```bash
ssh -i /ruta/a/tu-clave.pem -N -L 5433:127.0.0.1:5432 usuario@IP_DEL_VPS
```

Mientras esa terminal esté abierta, en tu PC existe:

`localhost:5433` → Postgres del VPS.

### 1.2 Configurar el `.env` local

En el `.env` de tu proyecto **en tu PC**:

```env
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USERNAME=TU_DB_USERNAME
DB_PASSWORD=TU_DB_PASSWORD
DB_NAME=TU_DB_NAME
```

Notas:

- `DB_HOST` y `DB_PORT` apuntan al **localhost de tu PC** (el túnel).  
- Para la app, usa el usuario **normal** del `.env` del VPS (con permisos de escritura), no `dbeaver_ro`, si vas a crear/actualizar datos o correr migraciones.  
- Si solo quieres leer desde la app, puedes usar `dbeaver_ro`.

### 1.3 Arrancar la app

Con el túnel aún abierto:

```bash
pnpm run start:dev:users
# o el servicio que estés probando
```

Si falla la conexión:

- Revisa que el túnel SSH siga vivo.  
- Confirma user/password/db del `.env`.  
- Confirma en el VPS que `db` está arriba: `docker compose ps`.

---

## Item 2 — Conectar DBeaver en tu PC (no en el VPS)

Objetivo: ver tablas y hacer consultas desde DBeaver instalado en **tu computadora**.

DBeaver tiene túnel SSH integrado: no hace falta dejar el comando `ssh -L` abierto **para DBeaver** (sí lo necesitas para el Item 1).

### 2.1 Nueva conexión

1. Abre DBeaver en tu PC.  
2. **Database → New Database Connection**.  
3. Elige **PostgreSQL** → Next.

### 2.2 Pestaña Main

| Campo | Valor |
|--------|--------|
| Host | `127.0.0.1` |
| Port | `5432` |
| Database | `TU_DB_NAME` (el de tu `.env`) |
| Username | `dbeaver_ro` (ver Item 3) |
| Password | la password de `dbeaver_ro` |

El Host `127.0.0.1` es correcto: DBeaver hablará con el extremo local del túnel SSH que él mismo abre.

### 2.3 Pestaña SSH

1. Marca **Use SSH Tunnel**.  
2. Completa:

| Campo | Valor |
|--------|--------|
| Host/IP | IP o dominio del **VPS** |
| Port | `22` (o el puerto SSH que uses) |
| User Name | tu usuario SSH del VPS |
| Authentication Method | Password **o** Public Key |

Si usas clave privada:

- Elige **Public Key**.  
- Selecciona tu archivo de clave privada (por ejemplo `.pem` o `id_rsa`).

3. Pulsa **Test tunnel configuration** (si aparece) y luego **Test Connection** en Main.  
4. Si pide descargar drivers de PostgreSQL, acepta.  
5. **Finish**.

### 2.4 Comprobar

Deberías ver el árbol de la base, schemas y tablas. Estás en DBeaver **local**, mirando datos del VPS.

---

## Item 3 — Usuario de solo lectura para DBeaver

Ya lo creaste en el **Paso 0**. Resumen:

| Uso | Usuario | Permisos |
|-----|---------|----------|
| DBeaver | `dbeaver_ro` | Solo lectura (`SELECT`) |
| App Nest en local (pruebas con escritura) | `DB_USERNAME` del `.env` | Lectura y escritura |

En DBeaver **siempre** usa `dbeaver_ro` para no modificar datos por error.

Si más adelante creas tablas nuevas y `dbeaver_ro` no las ve, vuelve a otorgar selects:

```bash
docker compose exec db psql -U TU_DB_USERNAME -d TU_DB_NAME
```

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dbeaver_ro;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO dbeaver_ro;
```

(Los `ALTER DEFAULT PRIVILEGES` del Paso 0 cubren tablas **nuevas** creadas por el mismo rol que ejecutó ese `ALTER`; si las crea otro rol, puede hacer falta repetir el `GRANT SELECT ON ALL ...`.)

---

## Resumen rápido

| # | Qué quieres | Dónde lo configuras | Host que usas | Usuario |
|---|-------------|---------------------|---------------|---------|
| 1 | Probar Nest en local | Terminal SSH + `.env` local | `127.0.0.1` puerto `5433` en **tu PC** | user normal del `.env` |
| 2 | DBeaver en tu PC | Main + pestaña SSH de DBeaver | `127.0.0.1` puerto `5432` en Main | `dbeaver_ro` |
| 3 | Solo lectura | Creado una vez en el VPS con SQL | — | `dbeaver_ro` |

---

## Seguridad — qué no hacer

- No pongas en el compose: `ports: - "5432:5432"` (abre Postgres a todo internet).  
- No uses el usuario admin de Postgres en DBeaver del día a día.  
- No subas passwords al repo; déjalas en `.env` o en el gestor de DBeaver.  
- Cierra el túnel SSH del Item 1 cuando termines de probar.

---

## Problemas frecuentes

### “Connection refused” en local

- El túnel SSH no está abierto (Item 1).  
- En DBeaver, la pestaña SSH no está bien configurada (Item 2).  
- En el VPS, el servicio `db` no está corriendo o no tiene `127.0.0.1:5432:5432`.

### “Password authentication failed”

- User/password incorrectos.  
- Estás usando `dbeaver_ro` con la password del user admin (o al revés).

### “Permission denied for table …”

- Es normal con `dbeaver_ro` si intentas escribir.  
- Si falla un `SELECT`, falta el `GRANT SELECT` de esa tabla (ver Item 3).

### El túnel SSH pide passphrase cada vez

- Usa el agent de SSH de tu SO, o en DBeaver guarda la clave / passphrase en su almacén seguro.

---

## Checklist final

- [ ] En el VPS, `db` publica `127.0.0.1:5432:5432`  
- [ ] Existe el rol `dbeaver_ro` con solo `SELECT`  
- [ ] Item 1: `ssh -L 5433:...` abierto + `.env` local con `DB_PORT=5433`  
- [ ] Item 2: DBeaver en tu PC con SSH Tunnel hacia el VPS  
- [ ] Item 3: DBeaver usa `dbeaver_ro`, no el user admin  
