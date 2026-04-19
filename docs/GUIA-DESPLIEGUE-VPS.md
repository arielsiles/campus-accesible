# Guia de Despliegue — Campus GPS Accesible

> Plan paso a paso para instalar el backend en un VPS Linode, compilar la APK y conectar la app movil al servidor remoto.
> **Fecha:** 2026-04-08 | **Autor:** Equipo Campus GPS
> **Prerequisito:** VPS Linode con Ubuntu 24.04 LTS, minimo 2 GB RAM

---

## Indice

1. [Fase A: Preparar el VPS](#fase-a-preparar-el-vps)
2. [Fase B: Instalar software base](#fase-b-instalar-software-base)
3. [Fase C: Configurar PostgreSQL + PostGIS](#fase-c-configurar-postgresql--postgis)
4. [Fase D: Clonar y configurar el proyecto](#fase-d-clonar-y-configurar-el-proyecto)
5. [Fase E: Configurar Nginx + SSL](#fase-e-configurar-nginx--ssl)
6. [Fase F: Proceso del servidor con PM2](#fase-f-proceso-del-servidor-con-pm2)
7. [Fase G: Compilar APK apuntando al VPS](#fase-g-compilar-apk-apuntando-al-vps)
8. [Fase H: Instalar APK en el telefono](#fase-h-instalar-apk-en-el-telefono)
9. [Fase I: Verificacion y pruebas](#fase-i-verificacion-y-pruebas)
10. [Referencia rapida de comandos](#referencia-rapida-de-comandos)

---

## Fase A: Preparar el VPS

### A.1 — Acceder al VPS por SSH

```bash
# Desde tu PC local (reemplaza IP_DEL_VPS con la IP real)
ssh root@IP_DEL_VPS
```

### A.2 — Actualizar el sistema

```bash
apt update && apt upgrade -y
```

### A.3 — Crear usuario de aplicacion (no usar root en produccion)

```bash
adduser campusgps --disabled-password --gecos ""
usermod -aG sudo campusgps

# Permitir SSH con clave del root
mkdir -p /home/campusgps/.ssh
cp /root/.ssh/authorized_keys /home/campusgps/.ssh/
chown -R campusgps:campusgps /home/campusgps/.ssh
chmod 700 /home/campusgps/.ssh
chmod 600 /home/campusgps/.ssh/authorized_keys
```

### A.4 — Configurar firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
ufw status
```

### A.5 — Configurar timezone

```bash
timedatectl set-timezone America/La_Paz  # Ajustar a tu zona
```

---

## Fase B: Instalar software base

### B.1 — Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # Debe mostrar v20.x.x
```

### B.2 — pnpm 9.x

```bash
npm install -g pnpm@9
pnpm -v   # Debe mostrar 9.x.x
```

### B.3 — PM2 (gestor de procesos Node.js)

```bash
npm install -g pm2
```

### B.4 — Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### B.5 — Certbot (SSL gratuito con Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
```

### B.6 — Git

```bash
apt install -y git
```

### B.7 — Herramientas de compilacion (para bcryptjs y dependencias nativas)

```bash
apt install -y build-essential python3
```

### B.8 — Verificar todo instalado

```bash
echo "=== Verificacion ==="
node -v        # v20.x
pnpm -v        # 9.x
pm2 -v         # 5.x
nginx -v       # nginx/1.x
certbot --version
git --version
echo "=== OK ==="
```

---

## Fase C: Configurar PostgreSQL + PostGIS

### C.1 — Instalar PostgreSQL 16 + PostGIS

```bash
# Agregar repositorio oficial de PostgreSQL
apt install -y gnupg2
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
apt update

apt install -y postgresql-16 postgresql-16-postgis-3
```

### C.2 — Iniciar y habilitar PostgreSQL

```bash
systemctl enable postgresql
systemctl start postgresql
systemctl status postgresql  # Debe estar active (running)
```

### C.3 — Crear base de datos y usuario

```bash
sudo -u postgres psql <<'SQL'
-- Crear usuario
CREATE USER campus_gps WITH PASSWORD 'CAMBIAR_PASSWORD_SEGURO';

-- Crear base de datos
CREATE DATABASE campus_gps OWNER campus_gps;

-- Habilitar PostGIS
\c campus_gps
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verificar
SELECT PostGIS_Version();

\q
SQL
```

> **IMPORTANTE:** Reemplaza `CAMBIAR_PASSWORD_SEGURO` con un password real seguro.
> Anota este password — lo usaras en el archivo `.env`.

### C.4 — Verificar conexion

```bash
psql -U campus_gps -d campus_gps -h localhost -c "SELECT PostGIS_Version();"
# Pedira el password que acabas de crear
```

---

## Fase D: Clonar y configurar el proyecto

### D.1 — Cambiar al usuario de la app

```bash
su - campusgps
```

### D.2 — Clonar el repositorio

```bash
cd ~
git clone https://github.com/TU_USUARIO/campus-gps-accesible.git app
cd app

# O si el repo es privado, usar SSH o token:
# git clone https://TOKEN@github.com/TU_USUARIO/campus-gps-accesible.git app
```

> **Alternativa sin GitHub:** Desde tu PC local, sube el codigo con `scp`:
> ```bash
> # En tu PC local (PowerShell/Git Bash):
> cd "d:/Projects/Orientacion Universitaria/development"
> tar --exclude=node_modules --exclude=.expo --exclude=android --exclude=ios --exclude=dist -czf campus-gps.tar.gz .
> scp campus-gps.tar.gz campusgps@IP_DEL_VPS:~/
>
> # En el VPS:
> su - campusgps
> mkdir -p ~/app && cd ~/app
> tar xzf ~/campus-gps.tar.gz
> ```

### D.3 — Instalar dependencias

```bash
cd ~/app
pnpm install
```

### D.4 — Crear archivo .env del servidor

```bash
cat > ~/app/server/.env <<'EOF'
# Base de datos
DATABASE_URL="postgresql://campus_gps:CAMBIAR_PASSWORD_SEGURO@localhost:5432/campus_gps?schema=public"

# Servidor
PORT=3000
CORS_ORIGIN="*"

# JWT
JWT_SECRET="CAMBIAR_A_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA"

# Anthropic API (para descripcion con IA — opcional)
ANTHROPIC_API_KEY=""

# Node environment
NODE_ENV=production
EOF
```

> **Reemplazar:**
> - `CAMBIAR_PASSWORD_SEGURO` → password de PostgreSQL del paso C.3
> - `CAMBIAR_A_UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA` → generar con: `openssl rand -hex 32`

### D.5 — Crear archivo .npmrc (requerido por el monorepo)

```bash
# Verificar que existe
cat ~/app/.npmrc
# Debe contener: node-linker=hoisted
# Si no existe:
echo "node-linker=hoisted" > ~/app/.npmrc
```

### D.6 — Sincronizar schema con la base de datos

```bash
cd ~/app/server
npx prisma db push
```

### D.7 — Ejecutar seed (datos iniciales)

```bash
cd ~/app/server
npx tsx prisma/seed.ts
```

Debe mostrar:
```
Seed complete:
  Campus: "Ciudad Universitaria (UCM)"
  Admin: admin@campusgps.dev (password: admin123)
  Route 1: "Medicina → Metro Ciudad Universitaria" — 5 waypoints, 4 segments
  ...
```

### D.8 — Compilar el servidor

```bash
cd ~/app/server
npx tsc
```

### D.9 — Probar que el servidor arranca

```bash
cd ~/app/server
node dist/index.js &

# Probar endpoint de salud
curl http://localhost:3000/api/health
# Debe retornar: {"status":"ok", ...}

# Detener el proceso de prueba
kill %1
```

---

## Fase E: Configurar Nginx + SSL

### E.1 — Opcion A: Con dominio propio (recomendado)

Si tienes un dominio (ej. `api.campusgps.dev`), apunta un registro DNS tipo A a la IP del VPS.

```bash
# Verificar que el DNS apunta correctamente (puede tardar unos minutos)
dig api.campusgps.dev +short
# Debe mostrar la IP del VPS
```

### E.2 — Crear configuracion Nginx

```bash
sudo tee /etc/nginx/sites-available/campusgps > /dev/null <<'NGINX'
server {
    listen 80;
    server_name api.campusgps.dev;  # CAMBIAR a tu dominio

    # Redirigir HTTP → HTTPS (se activa despues de certbot)
    # return 301 https://$host$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
NGINX
```

> **CAMBIAR** `api.campusgps.dev` por tu dominio real en las lineas `server_name`.

### E.3 — Activar el sitio

```bash
sudo ln -sf /etc/nginx/sites-available/campusgps /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t          # Verificar sintaxis
sudo systemctl reload nginx
```

### E.4 — Obtener certificado SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d api.campusgps.dev --non-interactive --agree-tos -m leclauapp@gmail.com
```

> Certbot modifica automaticamente la config de Nginx para HTTPS.

### E.5 — Verificar HTTPS

```bash
curl https://api.campusgps.dev/api/health
# Si el servidor no esta corriendo aun, inicialo primero (Fase F)
```

### E.6 — Renovacion automatica de SSL

```bash
# Certbot ya instala un timer de renovacion automatica
sudo systemctl status certbot.timer
```

### E.7 — Opcion B: Sin dominio (solo IP)

Si no tienes dominio, puedes usar la IP directamente (sin SSL, solo para pruebas):

```bash
sudo tee /etc/nginx/sites-available/campusgps > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
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
NGINX

sudo ln -sf /etc/nginx/sites-available/campusgps /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

> **Nota:** Sin HTTPS la app movil puede tener problemas en produccion.
> Para pruebas de campo con HTTP, la URL seria `http://IP_DEL_VPS/api`.

---

## Fase F: Proceso del servidor con PM2

### F.1 — Crear configuracion PM2

```bash
cat > ~/app/ecosystem.config.js <<'EOF'
module.exports = {
  apps: [{
    name: 'campus-gps-api',
    cwd: './server',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/home/campusgps/logs/api-error.log',
    out_file: '/home/campusgps/logs/api-out.log',
    time: true,
  }],
};
EOF

mkdir -p ~/logs
```

### F.2 — Iniciar el servidor

```bash
cd ~/app
pm2 start ecosystem.config.js
```

### F.3 — Verificar que esta corriendo

```bash
pm2 status
# Debe mostrar: campus-gps-api | online

pm2 logs campus-gps-api --lines 5
# Debe mostrar: Server running on http://0.0.0.0:3000

# Probar desde fuera
curl http://localhost:3000/api/health
```

### F.4 — Configurar inicio automatico al reiniciar VPS

```bash
pm2 save
pm2 startup
# Ejecutar el comando que PM2 te indica (sudo env PATH=...)
```

### F.5 — Comandos utiles de PM2

```bash
pm2 status                    # Ver estado
pm2 logs campus-gps-api       # Ver logs en tiempo real
pm2 restart campus-gps-api    # Reiniciar
pm2 stop campus-gps-api       # Detener
pm2 delete campus-gps-api     # Eliminar proceso
```

---

## Fase G: Compilar APK apuntando al VPS

> **Esta fase se ejecuta en tu PC local (Windows), NO en el VPS.**

### G.1 — Actualizar la URL de la API en el codigo

Editar `apps/mobile/src/services/apiClient.ts`:

```typescript
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://api.campusgps.dev/api";
  //                                  ^^^^^^^^^^^^^^^^^^^^^^^^
  //                   CAMBIAR a tu dominio o http://IP_DEL_VPS/api
```

### G.2 — Regenerar el proyecto Android (si es necesario)

```bash
cd "d:/Projects/Orientacion Universitaria/development/apps/mobile"

# Limpiar y regenerar
npx expo prebuild --platform android --clean
```

### G.3 — Exportar el bundle JavaScript

```bash
cd "d:/Projects/Orientacion Universitaria/development/apps/mobile"

npx expo export --platform android
```

Esto genera `dist/_expo/static/js/android/*.hbc` (el bundle Hermes compilado).

### G.4 — Copiar el bundle al proyecto Android

```bash
# Crear directorio de assets si no existe
mkdir -p android/app/src/main/assets

# Copiar el bundle (el nombre exacto puede variar)
cp dist/_expo/static/js/android/*.hbc android/app/src/main/assets/index.android.bundle
```

### G.5 — Compilar la APK

```bash
cd android

# Windows:
.\gradlew.bat assembleDebug

# El APK se genera en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

> **Nota:** Requiere Android SDK y Java 17+ instalados localmente.
> Si no los tienes, instalar Android Studio que incluye ambos.

### G.6 — Verificar que el APK existe

```bash
ls -la app/build/outputs/apk/debug/app-debug.apk
# Debe existir y pesar ~30-60 MB
```

---

## Fase H: Instalar APK en el telefono

### H.1 — Opcion A: Por cable USB (ADB)

```bash
# Conectar telefono por USB con "Depuracion USB" activada
# En tu PC local:
adb devices                    # Verificar que se detecta
adb install -r "d:/Projects/Orientacion Universitaria/development/apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk"
```

### H.2 — Opcion B: Transferir APK y instalar manualmente

1. Copiar `app-debug.apk` al telefono (cable USB, WhatsApp, email, Drive, etc.)
2. En el telefono: abrir el archivo APK
3. Permitir "Instalar apps de fuentes desconocidas" si lo pide
4. Instalar

### H.3 — Permisos necesarios en el telefono

Despues de instalar, ir a **Ajustes → Apps → Campus GPS Accesible → Permisos**:
- **Ubicacion**: Permitir siempre / Mientras se usa
- **Camara**: Permitir (para fases futuras)

---

## Fase I: Verificacion y pruebas

### I.1 — Verificar el servidor desde el telefono

Abrir el navegador del telefono y visitar:
```
https://api.campusgps.dev/api/health
```
Debe retornar:
```json
{"status":"ok","timestamp":"...","routes":3}
```

### I.2 — Abrir la app

1. Abrir "Campus GPS Accesible"
2. Debe mostrar la pantalla de **Login**
3. Opciones:
   - **Iniciar sesion**: admin@campusgps.dev / admin123
   - **Crear cuenta**: registrar nuevo usuario
   - **Continuar sin cuenta**: modo solo lectura

### I.3 — Seleccionar campus

1. Despues del login, aparece **Selecciona tu campus**
2. Debe mostrar "Ciudad Universitaria (UCM)" con 3 rutas
3. Pulsar para entrar al mapa

### I.4 — Verificar funcionalidades

| Test | Accion | Resultado esperado |
|------|--------|--------------------|
| Mapa | Abrir app | Mapa centrado en tu ubicacion GPS |
| Rutas | Pulsar "Rutas (3)" | Lista de 3 rutas seed |
| Navegacion | Buscar destino → Navegar | Instrucciones turn-by-turn |
| Grabar ruta | Pulsar "Grabar" | Grabacion GPS activa |
| Editar ruta | Pulsar "Editar" | Editor visual en mapa |
| Reportar | Pulsar "Reportar" | Formulario de incidencia |
| Perfil | Pulsar icono usuario (arriba izq) | Pantalla de perfil |
| Accesibilidad | Activar TalkBack | Todos los botones tienen labels en espanol |

### I.5 — Verificar logs del servidor

```bash
# En el VPS:
pm2 logs campus-gps-api --lines 20
```

---

## Referencia rapida de comandos

### Desde tu PC local

```bash
# Conectar al VPS
ssh campusgps@IP_DEL_VPS

# Subir codigo actualizado
cd "d:/Projects/Orientacion Universitaria/development"
tar --exclude=node_modules --exclude=.expo --exclude=android --exclude=ios --exclude=dist -czf campus-gps.tar.gz .
scp campus-gps.tar.gz campusgps@IP_DEL_VPS:~/

# Compilar APK
cd apps/mobile && npx expo export --platform android
cp dist/_expo/static/js/android/*.hbc android/app/src/main/assets/index.android.bundle
cd android && .\gradlew.bat assembleDebug

# Instalar en telefono
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Desde el VPS (como usuario campusgps)

```bash
# Actualizar codigo
cd ~/app
tar xzf ~/campus-gps.tar.gz
pnpm install
cd server && npx tsc

# Actualizar base de datos
cd ~/app/server
npx prisma db push
npx tsx prisma/seed.ts

# Reiniciar servidor
pm2 restart campus-gps-api

# Ver logs
pm2 logs campus-gps-api

# Ver estado
pm2 status

# Verificar salud
curl http://localhost:3000/api/health
```

### Script de deploy rapido (crear en el VPS)

```bash
cat > ~/deploy.sh <<'SCRIPT'
#!/bin/bash
set -e
echo "=== Deploying Campus GPS API ==="

cd ~/app

# Actualizar desde tar
if [ -f ~/campus-gps.tar.gz ]; then
  echo "[1/5] Extracting code..."
  tar xzf ~/campus-gps.tar.gz
  rm ~/campus-gps.tar.gz
fi

echo "[2/5] Installing dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

echo "[3/5] Compiling TypeScript..."
cd server && npx tsc

echo "[4/5] Syncing database schema..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push

echo "[5/5] Restarting server..."
cd ~/app
pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js

echo "=== Deploy complete ==="
pm2 status
curl -s http://localhost:3000/api/health | head -1
SCRIPT

chmod +x ~/deploy.sh
```

Uso: `~/deploy.sh`

---

## Troubleshooting

### El servidor no arranca

```bash
# Ver error exacto
cd ~/app/server && node dist/index.js
# Si falla por DB:
psql -U campus_gps -d campus_gps -h localhost -c "SELECT 1;"
# Si falla por puerto:
sudo lsof -i :3000
```

### Error de conexion desde la app

1. Verificar que Nginx esta corriendo: `sudo systemctl status nginx`
2. Verificar que PM2 esta corriendo: `pm2 status`
3. Verificar firewall: `sudo ufw status`
4. Verificar URL en apiClient.ts: debe apuntar al VPS
5. Probar desde navegador del telefono: `https://api.campusgps.dev/api/health`

### Error SSL / HTTPS

```bash
# Verificar certificado
sudo certbot certificates
# Renovar manualmente
sudo certbot renew --dry-run
```

### PostgreSQL no acepta conexiones

```bash
sudo systemctl status postgresql
sudo journalctl -u postgresql --no-pager -n 20
# Verificar que pg_hba.conf permite conexion local:
sudo grep -v '^#' /etc/postgresql/16/main/pg_hba.conf | grep -v '^$'
```

### La app muestra "Error de red" o no carga rutas

1. Verificar conexion a internet del telefono
2. Verificar URL en apiClient.ts (debe ser `https://dominio/api` o `http://IP/api`)
3. Probar misma URL en el navegador del telefono
4. Ver logs: `pm2 logs campus-gps-api`

---

*Documento creado: 2026-04-08 — Campus GPS Accesible*
