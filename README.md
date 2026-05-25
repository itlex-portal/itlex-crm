# it.lex CRM Portal

Portal CRM completo con panel admin y portal del cliente.

## Lo que incluye

- **Panel admin**: Gestión de clientes, garantías, licitaciones, subsanes y centro de alertas
- **Portal del cliente**: Cada cliente ingresa y ve solo su información
- **Alertas automáticas**: Vencimientos de garantías (30/60/90 días), licitaciones por cerrar, subsanes pendientes
- **Base de datos real**: Supabase (gratuito hasta 500MB)

---

## Setup en 4 pasos

### Paso 1 — Crear base de datos en Supabase

1. Ve a **https://supabase.com** y crea una cuenta gratuita
2. Clic en **"New project"** → pon un nombre (ej: `itlex-crm`) → elige región más cercana → crea
3. Espera ~2 minutos a que el proyecto esté listo
4. Ve a **SQL Editor** → **New query**
5. Copia y pega todo el contenido de `/supabase/schema.sql` → clic en **Run**
6. Ve a **Settings → API** y copia:
   - `Project URL` (algo como `https://xyz.supabase.co`)
   - `anon public` key

### Paso 2 — Subir código a GitHub

1. Ve a **https://github.com/itlex-portal** e inicia sesión
2. Crea un nuevo repositorio: `itlex-crm` (público)
3. Sube todos los archivos de esta carpeta al repositorio

### Paso 3 — Configurar secrets en GitHub

1. En el repositorio de GitHub ve a **Settings → Secrets and variables → Actions**
2. Agrega estos dos secrets:
   - `REACT_APP_SUPABASE_URL` → pega el Project URL de Supabase
   - `REACT_APP_SUPABASE_ANON_KEY` → pega el anon key de Supabase
3. Activa GitHub Pages: **Settings → Pages → Source → GitHub Actions**

### Paso 4 — Crear el primer usuario admin

1. Ve a **Supabase → Authentication → Users → Add user**
2. Pon tu email y contraseña
3. Copia el UUID del usuario creado
4. Ve a **SQL Editor** y corre:
   ```sql
   INSERT INTO profiles (id, role) VALUES ('PEGA-TU-UUID-AQUI', 'admin');
   ```
5. ¡Listo! Ingresa al portal con ese email/contraseña

---

## Crear acceso para un cliente

1. Ingresa como admin al portal
2. Ve a **Clientes** → selecciona el cliente → **🔑 Crear acceso**
3. El sistema genera credenciales automáticamente
4. Entrega el email y contraseña al cliente
5. El cliente ingresa y ve **solo su información**

---

## URL del portal

Una vez publicado estará en:
`https://itlex-portal.github.io/itlex-crm`

---

## Alertas automáticas por email (opcional)

Para envío automático de emails cuando se acercan vencimientos, ver la carpeta `/supabase/functions/` (requiere plan Supabase Pro o usar resend.com gratis).

---

## Stack técnico
- React 18
- Supabase (PostgreSQL + Auth)
- GitHub Pages (hosting gratuito)
- GitHub Actions (deploy automático)
