# Regalo IA Montblanc — página web (Vercel + Supabase)

Página del regalo de fin de año para clientes externos. El cliente responde 3 preguntas,
recibe un roadmap de IA + un curso de cortesía, y deja su registro (nombre, email, empresa).
Ese registro se guarda en **Supabase** y le llega un aviso a José por correo.

- **Hosting:** Vercel (sitio estático, sin build).
- **Registro:** el navegador inserta directo en una tabla de Supabase, protegida con RLS
  (política "insert sí, select no": cualquiera puede registrarse, nadie puede leer los datos).

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | La página (mismo diseño del artifact). |
| `config.js` | URL y anon key de Supabase. **Editar antes de desplegar.** |
| `supabase.sql` | Crea la tabla `solicitudes` + las políticas RLS. Pegar en Supabase. |
| `supabase/functions/notificar-solicitud/` | Edge Function que avisa por correo a José en cada registro. |
| `.gitignore` | Evita subir secretos/entornos. |

## Pasos de despliegue

### 1. Supabase
1. Crear (o elegir) un proyecto Supabase de la organización Montblanc.
2. `SQL Editor` → `New query` → pegar el contenido de **`supabase.sql`** → `Run`.
3. `Project Settings` → `API` → copiar **Project URL** y la **anon public key**.

> ⚠️ En plan gratuito el proyecto se pausa tras 7 días sin uso. Si la campaña es intermitente,
> usar el Supabase pago que ya tenga Montblanc o tenerlo presente.

### 2. Configurar la página
- Editar **`config.js`** y reemplazar los dos marcadores `__...__` por la URL y la anon key.
  (La anon key es pública; puede ir en el repo. La `service_role` secreta NUNCA se sube.)

### 3. GitHub + Vercel
1. Crear un repo **privado** en la organización Montblanc y subir esta carpeta.
2. En Vercel: `Add New` → `Project` → importar el repo.
   - Framework preset: **Other** · Build command: *(vacío)* · Output directory: `.` (raíz).
3. Deploy. Vercel re-despliega solo con cada `git push`.
4. (Opcional) `Settings` → `Domains` → apuntar `regalo.montblancchile.com`.

### 4. Aviso por correo a José (Edge Function + Resend)
Los registros siempre quedan en `Table Editor` → `solicitudes`. Para que además lleguen por correo:

1. **Cuenta Resend** (https://resend.com, gratis) → crea una **API key** (empieza con `re_`).
   Para pruebas puedes enviar desde `onboarding@resend.dev`; para producción, verifica el
   dominio `montblancchile.com` en Resend y usa un remitente de ese dominio.
2. **Desplegar la función** (con Supabase CLI, desde esta carpeta):
   ```bash
   supabase functions deploy notificar-solicitud --no-verify-jwt
   ```
3. **Secrets de la función** (Supabase → Edge Functions → Secrets):
   - `RESEND_API_KEY` = la key de Resend
   - `NOTIFY_TO` = `j.arroyo@montblancchile.com`
   - `NOTIFY_FROM` = remitente verificado (o `Regalo IA Montblanc <onboarding@resend.dev>` para probar)
   - `WEBHOOK_SECRET` = un texto secreto cualquiera (lo repites en el paso 4)
4. **Database Webhook** (Supabase → Database → Webhooks → *Create*):
   - Tabla `public.solicitudes`, evento **INSERT**.
   - Tipo **Supabase Edge Functions** → función `notificar-solicitud`.
   - En *HTTP Headers* agrega `x-webhook-secret` con el mismo valor del paso 3.
5. Prueba insertando una fila (o completando el formulario) y revisa que llegue el correo.

### 5. Probar
- Completar el flujo y enviar un registro de prueba → verificar que aparece la fila en Supabase.
- Probar la **descarga del roadmap** y el formulario en celular.
- Confirmar que **no** se pueden leer registros desde el navegador (RLS funcionando).

## Leer los registros
- Rápido: `Table Editor` → `solicitudes`.
- O en `SQL Editor`:
  ```sql
  select creado_en, nombre, empresa, email, curso
  from public.solicitudes order by creado_en desc;
  ```
