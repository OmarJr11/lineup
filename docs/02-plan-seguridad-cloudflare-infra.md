# Parte 2: Protección Perimetral Externa con Cloudflare (Para implementar después)

> **Estado:** Fase futura / Perimetral  
> **Costo:** **$0 (100% Gratis en el Plan Free de Cloudflare)**  
> **Objetivo:** Mitigar ataques DDoS volumétricos (L3/L4/L7 masivos), ocultar la IP pública del VPS y filtrar tráfico malicioso a nivel global antes de que llegue a tu servidor.

---

## 1. ¿Por qué Cloudflare Free en lugar de AWS WAF?

| Característica | Cloudflare (Plan Free) | AWS WAF / Shield |
| :--- | :--- | :--- |
| **Costo mensual** | **$0** | AWS WAF (~$5 por regla + $0.60/millón req); Shield Advanced $3,000/mes |
| **Mitigación DDoS L3/L4** | Ilimitada y no medida | Incluida en Shield Standard |
| **Protección contra HTTP Floods L7** | Automática en Edge | Requiere configuración de reglas de pago |
| **Modo "Bajo Ataque"** | Sí (Desafío JS automático con 1 clic) | No (requiere automatización compleja) |
| **Certificado SSL/TLS** | Automático y gratuito | AWS Certificate Manager (limitado a servicios AWS) |

---

## 2. Pasos para Configurar Cloudflare (Paso a Paso)

### Paso 1: Crear cuenta y cambiar Nameservers
1. Crear una cuenta gratuita en [Cloudflare](https://www.cloudflare.com).
2. Agregar tu dominio (ej. `tudominio.com`).
3. En tu registrador de dominio (GoDaddy, Namecheap, Google Domains, etc.), cambiar los DNS Nameservers actuales por los que te asigne Cloudflare.

### Paso 2: Activar el Proxy (Nube Naranja)
En la sección **DNS** de Cloudflare:
- Asegúrate de que el registro `A` o `CNAME` que apunta a la API (ej. `api.tudominio.com`) tenga el estado **Proxied (Nube Naranja)** activado.
- Esto oculta la IP pública real de tu VPS de internet.

### Paso 3: Configurar SSL/TLS
En **SSL/TLS**:
- Seleccionar el modo **Full (Strict)** si Nginx tiene certificado SSL (Let's Encrypt o Cloudflare Origin CA).
- O modo **Full** si Nginx tiene un certificado autofirmado.

### Paso 4: Reglas de Seguridad y WAF Gratuitas
En **Security > WAF**:
1. **Regla de Rate Limiting (Cloudflare permite 1 regla gratuita de rate limit por dominio):**
   - Acción: **Managed Challenge** (desafío interactivo/JS en lugar de bloqueo directo para evitar falsos positivos).
   - Condición: Si una IP realiza más de 60 peticiones en 10 segundos hacia `/graphql` o `/auth/*`.
2. **Bot Fight Mode:**
   - Activar en **Security > Bots > Bot Fight Mode**. Bloquea bots conocidos de scraping y ataques automatizados.

### Paso 5: Activar "Under Attack Mode" (En caso de emergencia)
Si en algún momento el VPS sufre un ataque masivo y notas lentitud:
- En el panel de Cloudflare, activa con un solo clic el **Under Attack Mode**.
- Cloudflare mostrará una pantalla de verificación de 5 segundos a cada visitante nuevo antes de permitirle llegar al backend, mitigando el 99% de los ataques HTTP floods.

---

## 3. Ajuste en Nginx para Cloudflare (IP Real y Protección Directa)

Una vez que actives Cloudflare en el futuro, debes aplicar estos dos ajustes en tu VPS:

### 3.1 Restaurar la IP Real en Nginx
Para que Nginx y NestJS sigan viendo la IP real del usuario y no las IPs de Cloudflare:

En `/etc/nginx/conf.d/cloudflare.conf`:
```nginx
# IPs oficiales de Cloudflare (IPv4)
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

real_ip_header CF-Connecting-IP;
```

### 3.2 Cerrar el VPS a conexiones directas (Evitar Bypass de Cloudflare)
Para evitar que un atacante descubra la IP directa del VPS y se salte Cloudflare atacando los puertos 80/443:
- Configurar el firewall UFW de Ubuntu/Debian para permitir tráfico en 80/443 **únicamente proveniente de los rangos de IP de Cloudflare**.
- Mantener tu puerto SSH abierto solo para tu IP o con llaves seguras.
