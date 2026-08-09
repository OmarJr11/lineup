# Importar productos desde CSV / Excel

Guía para frontend: cómo usar el endpoint de importación de productos en la API de **businesses**.

## Resumen

| | |
|---|---|
| **Método** | `POST` |
| **URL** | `{BASE_URL_BUSINESSES}/files/upload-document` |
| **App** | `api-businesses` (puerto local por defecto: `3002`) |
| **Auth** | Sesión de business (JWT + token válido) |
| **Content-Type** | `multipart/form-data` |
| **Campo del archivo** | `file` |
| **Tamaño máximo** | `100 MB` |
| **Procesamiento** | Asíncrono (cola BullMQ + Gemini) |

> No existe una mutation GraphQL para esto. Es un endpoint REST.

Ejemplo de URL local:

```text
POST http://localhost:3002/files/upload-document
```

---

## Qué hace

1. Recibe un documento (CSV, Excel, PDF, etc.).
2. Encola el archivo para procesarlo en background.
3. Responde de inmediato con éxito de upload.
4. Un worker extrae productos con Gemini y los crea en el business autenticado.
5. Los productos quedan en estado **`PENDING`**, sin imágenes y sin catálogo (`idCatalog: null`).

El frontend **no debe esperar** a que los productos existan en la misma respuesta. Tras el `201`, conviene avisar al usuario y refrescar/listar productos (filtrando por `PENDING` si aplica).

---

## Autenticación

El request debe ir autenticado como business. El backend acepta el token en este orden:

1. Cookie (p. ej. `token`, o cookies con prefijo `lineup_businesses_` que terminen en `token`)
2. Header `token: <access_token>`
3. Header `Authorization: Bearer <access_token>`

Para apps web con cookies de sesión (mismo dominio / `credentials: 'include'`), normalmente basta con enviar cookies.

Para mobile o clientes sin cookies, usa:

```http
Authorization: Bearer <access_token>
```

o:

```http
token: <access_token>
```

El JWT de business debe incluir el contexto del negocio (`businessId`). Ese valor se usa al crear los productos importados.

---

## Request

### Headers

| Header | Requerido | Valor |
|---|---|---|
| `Authorization` o `token` o cookie de sesión | Sí | Token de business válido |
| `Content-Type` | Automático | `multipart/form-data` (lo setea el browser / cliente HTTP) |

> No setees `Content-Type: multipart/form-data` a mano en `fetch`/`axios` con `FormData`: el boundary se rompe. Deja que el cliente lo calcule.

### Body (`multipart/form-data`)

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `file` | `File` / `Blob` | Sí | Documento a importar |

No hay otros campos de body.

### Formatos aceptados

| Extensión | Soporte |
|---|---|
| `.csv` | Sí (procesado por chunks) |
| `.xlsx` | Sí |
| `.xls` | Sí |
| `.pdf` | Sí |
| `.xml` | Sí |
| `.txt` | Sí |
| `.json` | Sí |

No se aceptan imágenes, video ni audio como documento de importación.

---

## Response

### Éxito (upload encolado)

HTTP **201** (Nest por defecto en `@Post`):

```json
{
  "code": 710100,
  "status": true,
  "message": "The File(s) has been successfully uploaded."
}
```

Esto confirma que el archivo se recibió y se encoló. **No** incluye la lista de productos importados.

### Errores relevantes

| Código de negocio | HTTP típico | Significado |
|---|---|---|
| `700106` | 400 | Falta el archivo (`file`) |
| `700102` | 406 | Extensión no aceptada |
| `700105` | 400 | El documento no se pudo parsear a productos (puede ocurrir en el worker; el upload inicial puede haber respondido OK) |
| `700199` | 500 | Error genérico de upload |
| — | 401 | Token ausente o inválido |

Respuestas de error siguen la forma:

```json
{
  "code": 700106,
  "status": false,
  "message": "File is required for product import."
}
```

---

## Qué se crea en backend

Por cada producto detectado:

- `title`, `subtitle`, `description`
- `variations` (opcional)
- `isPrimary` (opcional)
- `images`: `[]`
- `status`: `PENDING`
- `idCatalog`: `null`

Campos esperados por la IA al parsear:

```json
[
  {
    "title": "Camiseta básica",
    "subtitle": "Algodón",
    "description": "Camiseta unisex de algodón peinado",
    "variations": [
      {
        "title": "Talla",
        "options": [{ "value": "S" }, { "value": "M" }, { "value": "L" }]
      }
    ],
    "isPrimary": false
  }
]
```

El frontend luego puede:

1. Listar productos `PENDING`.
2. Permitir edición (catálogo, imágenes, stock, etc.).
3. Publicar / activar cuando el merchant confirme.

---

## Ejemplos de uso

### `fetch` (web)

```ts
async function importProductsDocument(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BUSINESSES_API_URL}/files/upload-document`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include', // si usas cookies de sesión
      // headers: { Authorization: `Bearer ${accessToken}` }, // alternativa
    },
  );

  const data = await response.json();

  if (!response.ok || data.status !== true) {
    throw new Error(data?.message ?? 'No se pudo importar el documento');
  }
}
```

### `axios`

```ts
import axios from 'axios';

async function importProductsDocument(file: File): Promise<void> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post(
    `${process.env.NEXT_PUBLIC_BUSINESSES_API_URL}/files/upload-document`,
    formData,
    {
      withCredentials: true,
      // headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (data.status !== true) {
    throw new Error(data.message ?? 'No se pudo importar el documento');
  }
}
```

### Input file en React

```tsx
function ImportProductsButton() {
  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert('El archivo supera el límite de 100 MB');
      return;
    }

    const allowed = /\.(csv|xlsx|xls|pdf|xml|txt|json)$/i;
    if (!allowed.test(file.name)) {
      alert('Formato no soportado');
      return;
    }

    await importProductsDocument(file);
    alert(
      'Documento recibido. Los productos se están procesando y aparecerán como pendientes.',
    );
  }

  return (
    <input
      type="file"
      accept=".csv,.xlsx,.xls,.pdf,.xml,.txt,.json"
      onChange={handleChange}
    />
  );
}
```

### `curl`

```bash
curl -X POST "http://localhost:3002/files/upload-document" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@./catalogo.csv"
```

---

## UX recomendada en frontend

1. Validar extensión y tamaño **antes** de subir.
2. Mostrar loading solo durante el upload HTTP (segundos), no durante el parseo IA.
3. Tras éxito, mostrar mensaje tipo: *“Importación en proceso. Los productos aparecerán como pendientes.”*
4. Refrescar el listado de productos (polling corto o refetch manual).
5. Destacar productos `PENDING` para revisión (asignar catálogo, subir imágenes, completar datos).
6. No asumir que todos los productos del archivo se crearán al instante; CSV grandes se procesan por chunks en background.

---

## Notas técnicas útiles

- Endpoint: `apps/businesses/src/files/files.controller.ts` → `POST files/upload-document`
- Lógica de parseo: `core/modules/files/files-imports.service.ts`
- Worker: `core/consumers/files.consumer.ts` (`UploadDocumentFile`)
- CSV: se parte en chunks de hasta **120 filas** para evitar truncamiento de salida de Gemini
- Este endpoint es distinto de `POST /files/upload` (ese sube archivos a S3; no importa productos)

---

## Checklist rápido para integrar

- [ ] Apuntar al API de **businesses** (`:3002` en local)
- [ ] Enviar `multipart/form-data` con el campo `file`
- [ ] Incluir auth de business (cookie / Bearer / header `token`)
- [ ] Aceptar solo extensiones permitidas
- [ ] Manejar respuesta `code: 710100` como “encolado”, no “productos ya creados”
- [ ] Refrescar productos `PENDING` después del upload
