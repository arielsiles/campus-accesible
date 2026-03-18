# Setup Técnico — Fase 1

> Guía paso a paso para ir de Windows 10 limpio a entorno de desarrollo funcional.

---

## 1. Prerequisitos

| Software | Versión | Instalación | Verificación |
|----------|---------|-------------|-------------|
| Node.js | 20 LTS (20.x) | [nodejs.org](https://nodejs.org) | `node -v` |
| pnpm | 9.x | `corepack enable && corepack prepare pnpm@latest --activate` | `pnpm -v` |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) | `git --version` |
| PostgreSQL | 16+ | Docker (recomendado) o instalador nativo | `psql --version` |
| PostGIS | 3.4+ | Incluido en imagen Docker | `SELECT PostGIS_Version();` |
| Android Studio | Ladybug+ | [developer.android.com](https://developer.android.com/studio) | SDK Manager |
| Java JDK | 17 | Incluido en Android Studio o [Adoptium](https://adoptium.net) | `java --version` |
| Claude Code | latest | `npm install -g @anthropic-ai/claude-code` | `claude --version` |
| Docker Desktop | latest (recomendado) | [docker.com](https://www.docker.com/products/docker-desktop) | `docker --version` |

---

## 2. Setup Android Development

### 2.1 Instalar Android Studio

1. Descargar e instalar Android Studio (Ladybug o superior)
2. En el instalador, asegurarse de incluir: Android SDK, Android SDK Platform, Android Virtual Device

### 2.2 Configurar SDK

1. Abrir Android Studio → Settings → Languages & Frameworks → Android SDK
2. SDK Platforms: instalar **Android 14 (API 34)**
3. SDK Tools: instalar:
   - Android SDK Build-Tools 34
   - Android SDK Command-line Tools
   - Android Emulator
   - Android SDK Platform-Tools

### 2.3 Variables de Entorno

Añadir a variables de entorno del sistema (Windows):

```
ANDROID_HOME = C:\Users\<tu-usuario>\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
```

Añadir a PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
```

Verificar: `adb --version`

### 2.4 Crear AVD (Android Virtual Device)

1. Android Studio → Device Manager → Create Virtual Device
2. Seleccionar **Pixel 7** (o similar)
3. System Image: **API 34** (x86_64, con Google APIs)
4. Finalizar y arrancar el emulador para verificar

---

## 3. PostgreSQL + PostGIS

### Opción A: Docker (Recomendada)

Crear `docker-compose.yml` en la raíz del proyecto:

```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: campus-gps-db
    environment:
      POSTGRES_USER: campus_gps
      POSTGRES_PASSWORD: campus_gps_dev
      POSTGRES_DB: campus_gps
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Comandos:
```bash
# Arrancar la base de datos
docker compose up -d

# Verificar conexión
docker exec -it campus-gps-db psql -U campus_gps -c "SELECT PostGIS_Version();"

# Parar
docker compose down

# Parar y borrar datos
docker compose down -v
```

### Opción B: Instalación Nativa Windows

1. Descargar PostgreSQL 16+ de [postgresql.org](https://www.postgresql.org/download/windows/)
2. Durante instalación, marcar Stack Builder
3. Tras instalar, abrir Stack Builder → Seleccionar tu instalación → Spatial Extensions → PostGIS 3.4
4. Crear base de datos:
```sql
CREATE DATABASE campus_gps;
\c campus_gps
CREATE EXTENSION postgis;
```

---

## 4. Inicialización del Proyecto

### 4.1 Git Init

```bash
cd "D:/Projects/Orientacion Universitaria/development"
git init
```

### 4.2 Configuración Git para Windows

`.gitattributes`:
```
* text=auto eol=lf
*.{cmd,bat} text eol=crlf
```

`.gitignore`:
```
node_modules/
dist/
.env
.env.local
*.tsbuildinfo
.turbo/
.expo/
android/
ios/
*.apk
*.ipa
.DS_Store
Thumbs.db
```

### 4.3 pnpm Workspace

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'server'
```

### 4.4 Root package.json

```json
{
  "name": "campus-gps-accesible",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:migrate": "pnpm --filter server db:migrate",
    "db:seed": "pnpm --filter server db:seed",
    "db:studio": "pnpm --filter server db:studio"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5.4"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  }
}
```

### 4.5 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 4.6 Estructura de Carpetas

```bash
mkdir -p apps/mobile/src/{components,screens,services,hooks,store}
mkdir -p packages/shared-types/src
mkdir -p server/src/routes
mkdir -p server/prisma
mkdir -p data/routes
mkdir -p data/schemas
mkdir -p .github/workflows
```

### 4.7 packages/shared-types/package.json

```json
{
  "name": "@campus-gps/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4"
  }
}
```

### 4.8 server/package.json

```json
{
  "name": "@campus-gps/server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@campus-gps/shared-types": "workspace:*",
    "@prisma/client": "^6",
    "hono": "^4",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "prisma": "^6",
    "tsx": "^4",
    "typescript": "^5.4",
    "vitest": "^2"
  }
}
```

### 4.9 apps/mobile/package.json

```json
{
  "name": "@campus-gps/mobile",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "build": "echo 'Mobile build handled by EAS'",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@campus-gps/shared-types": "workspace:*",
    "@maplibre/maplibre-react-native": "^10",
    "expo": "~52.0.0",
    "expo-location": "~18.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "zustand": "^5"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "^5.4",
    "vitest": "^2"
  }
}
```

> **Nota:** Las versiones de Expo, React y React Native deben coincidir con las que proporciona `create-expo-app`. Ajustar tras crear el proyecto.

---

## 5. Setup Expo Mobile

### 5.1 Crear App Expo

Si se prefiere crear con `create-expo-app` (alternativa a copiar package.json manualmente):

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
```

### 5.2 Instalar Dependencias Adicionales

```bash
cd apps/mobile
npx expo install expo-location
pnpm add @maplibre/maplibre-react-native zustand
pnpm add -D vitest
```

### 5.3 Configurar Metro para Monorepo

Crear `apps/mobile/metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
```

---

## 6. Setup Server

### 6.1 Instalar Dependencias

```bash
cd server
pnpm install
```

### 6.2 Configurar Prisma

```bash
cd server
npx prisma init
```

Esto crea `prisma/schema.prisma`. Reemplazar su contenido con el schema definido en `SPEC-FASE-1.md` sección 4.2.

### 6.3 Primera Migración

```bash
# Asegurar que PostgreSQL + PostGIS está corriendo
cd server
npx prisma migrate dev --name init
```

### 6.4 Seed Script

Crear `server/prisma/seed.ts` con datos de la ruta de prueba (Medicina → Metro Ciudad Universitaria).

```bash
pnpm db:seed
```

---

## 7. Variables de Entorno

### `.env.example` (raíz del proyecto y server/)

```env
# Base de datos
DATABASE_URL="postgresql://campus_gps:campus_gps_dev@localhost:5432/campus_gps?schema=public"

# Servidor
PORT=3000
CORS_ORIGIN="http://localhost:8081"

# Mobile (Expo public)
EXPO_PUBLIC_API_URL="http://10.0.2.2:3000"
EXPO_PUBLIC_MAP_STYLE_URL="https://demotiles.maplibre.org/style.json"
```

> **Nota Android Emulator:** El emulador Android accede al localhost de la máquina host via `10.0.2.2`. Por eso `EXPO_PUBLIC_API_URL` usa esa IP en lugar de `localhost`.

---

## 8. Comandos de Desarrollo Diario

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Inicia todos los servicios (Expo + Server) |
| `pnpm test` | Ejecuta todos los tests (Vitest) |
| `pnpm lint` | Lint de todos los packages (ESLint) |
| `pnpm typecheck` | Verificación de tipos TypeScript |
| `pnpm build` | Build de todos los packages |
| `pnpm db:migrate` | Ejecutar migraciones Prisma |
| `pnpm db:seed` | Seed de datos de prueba |
| `pnpm db:studio` | Abrir Prisma Studio (GUI de DB) |
| `docker compose up -d` | Arrancar PostgreSQL |
| `docker compose down` | Parar PostgreSQL |

---

## 9. Troubleshooting Windows

### Long Paths

Si tienes errores de paths largos:
```bash
git config --system core.longpaths true
```

### PowerShell Execution Policy

Si scripts de npm/pnpm no ejecutan:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Line Endings

El `.gitattributes` ya fuerza LF. Si tienes problemas:
```bash
git config --global core.autocrlf input
```

### Metro File Watching

Si Metro bundler no detecta cambios:
```bash
# En apps/mobile/metro.config.js, añadir:
config.watcher = { additionalExts: ['ts', 'tsx'] };
```

Si Watchman no funciona, Metro usa polling automáticamente en Windows.

### Android Emulator GPU

Si el emulador está lento:
1. Device Manager → Edit → Show Advanced Settings
2. Emulated Performance → Graphics: **Hardware - GLES 2.0**
3. Verificar que la virtualización está habilitada en BIOS (Intel VT-x / AMD-V)

### MapLibre Native Module

Si MapLibre no compila:
1. Verificar que `ANDROID_HOME` y `JAVA_HOME` están configurados
2. Limpiar cache: `cd apps/mobile/android && ./gradlew clean`
3. Si persiste, ejecutar el spike de validación (ver `GOBERNANZA-PROYECTO.md`, Spike 1)

### pnpm + Monorepo

Si pnpm no resuelve workspaces:
```bash
# En la raíz
pnpm install --force
```

Si hay conflictos de hoisting, añadir a `.npmrc`:
```
shamefully-hoist=true
```

---

## 10. Script de Verificación

Ejecutar este checklist para validar que todo está instalado:

```bash
echo "=== Verificación de Entorno ==="
echo "Node.js: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "Git: $(git --version)"
echo "Java: $(java --version 2>&1 | head -1)"
echo "Docker: $(docker --version 2>/dev/null || echo 'No instalado')"
echo "Android SDK: ${ANDROID_HOME:-'No configurado'}"

# Verificar PostgreSQL via Docker
docker exec campus-gps-db psql -U campus_gps -c "SELECT PostGIS_Version();" 2>/dev/null \
  && echo "PostGIS: OK" \
  || echo "PostGIS: No disponible (arrancar docker compose up -d)"

# Verificar emulador Android
adb devices 2>/dev/null | grep -q "emulator" \
  && echo "Android Emulator: Corriendo" \
  || echo "Android Emulator: No corriendo"

echo "=== Fin Verificación ==="
```
