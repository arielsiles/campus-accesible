# Historial de Cambios — Entorno de Desarrollo

> Registro cronológico de instalaciones, configuraciones y cambios en el entorno de desarrollo del proyecto **Campus GPS Accesible**.

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorías:** `Instalación`, `Configuración`, `Actualización`, `Eliminación`
- **Estado:** `OK`, `Pendiente`, `Deprecado`

---

## [2026-03-17] — Setup Inicial del Stack Tecnológico (Fase 1)

### Entorno Base (Preexistente)

| Software | Versión | Método | Estado |
|----------|---------|--------|--------|
| Windows 10 Pro | 10.0.19045 | Preinstalado | OK |
| Node.js | v22.17.1 | Preinstalado | OK |
| Git | 2.50.1 | Preinstalado | OK |
| Docker Desktop | 27.2.0 | Preinstalado | OK |
| Expo CLI | 6.3.10 | Preinstalado (global) | OK |
| Java 8 (Oracle) | 1.8.0_311 | Preinstalado | OK — Se conserva como JDK global del sistema |

### Instalación — pnpm

- **Categoría:** Instalación
- **Versión:** 9.15.9
- **Método:** `npm install -g pnpm@9`
- **Nota:** Se intentó primero vía `corepack enable` pero falló por permisos en `C:\Program Files\nodejs\`. Se usó npm como alternativa.
- **Verificación:** `pnpm -v` → `9.15.9`
- **Estado:** OK

### Instalación — JDK 17 (Eclipse Temurin)

- **Categoría:** Instalación
- **Versión:** 17.0.18+8 (OpenJDK, Temurin-17.0.18+8)
- **Método:** `winget install EclipseAdoptium.Temurin.17.JDK`
- **Ruta:** `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`
- **Nota:** Instalado en paralelo a Java 8. No modifica el `java` global del sistema. Se usa exclusivamente para Android/Gradle vía `JAVA_HOME`.
- **Verificación:** `"C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot\bin\java" -version` → `openjdk version "17.0.18"`
- **Estado:** OK

### Instalación — Android Studio

- **Categoría:** Instalación
- **Versión:** 2025.3.1.8 (Panda Patch 1)
- **Método:** `winget install Google.AndroidStudio`
- **Ruta:** `C:\Program Files\Android\Android Studio`
- **JDK bundled:** OpenJDK 21.0.9 (JBR, solo uso interno de Android Studio)
- **Verificación:** Directorio presente en `C:\Program Files\Android\Android Studio`
- **Estado:** OK

### Instalación — Android SDK Components

- **Categoría:** Instalación
- **Método:** `sdkmanager` (command-line tools descargadas manualmente)
- **Ruta SDK:** `C:\Users\Precision 7710\AppData\Local\Android\Sdk`

| Componente | Paquete | Versión |
|------------|---------|---------|
| Command-line Tools | `cmdline-tools;latest` | 11076708 |
| Platform Tools | `platform-tools` | 1.0.41 (ADB) |
| SDK Platform | `platforms;android-34` | Android 14 (API 34) |
| Build Tools | `build-tools;34.0.0` | 34.0.0 |
| Emulator | `emulator` | Última disponible |
| System Image | `system-images;android-34;google_apis;x86_64` | r14 |

- **Estado:** OK

### Configuración — AVD (Android Virtual Device)

- **Categoría:** Configuración
- **Nombre:** `Pixel_7_API_34`
- **Device:** Pixel 7 (Google)
- **Target:** Google APIs, Android 14 (API 34)
- **ABI:** x86_64
- **SD Card:** 512 MB
- **Ruta:** `C:\Users\Precision 7710\.android\avd\Pixel_7_API_34.avd`
- **Método:** `avdmanager create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;x86_64" -d "pixel_7"`
- **Estado:** OK

### Configuración — Variables de Entorno (User Scope)

- **Categoría:** Configuración
- **Método:** `[System.Environment]::SetEnvironmentVariable(..., 'User')`

| Variable | Valor |
|----------|-------|
| `ANDROID_HOME` | `C:\Users\Precision 7710\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot` |
| `PATH` (adiciones) | `%ANDROID_HOME%\platform-tools` ; `%ANDROID_HOME%\emulator` |

- **Nota:** `JAVA_HOME` apunta a Temurin 17 para Gradle/Android. El `java` global del sistema sigue siendo Java 8 (`C:\Program Files (x86)\Common Files\Oracle\Java\javapath\java.exe`).
- **Estado:** OK — Efectivo en nuevas sesiones de terminal.

---

## [2026-03-17] — Inicialización del Proyecto (Monorepo)

### Configuración — Git Init

- **Categoría:** Configuración
- **Repositorio:** `D:\Projects\Orientacion Universitaria\development`
- **Archivos creados:**
  - `.gitattributes` — Fuerza LF en todos los archivos, CRLF solo en `.cmd`/`.bat`
  - `.gitignore` — Excluye `node_modules/`, `dist/`, `.env`, `.expo/`, `android/`, `ios/`, etc.
- **Estado:** OK

### Configuración — Monorepo (Turborepo + pnpm Workspaces)

- **Categoría:** Configuración
- **Archivos creados:**

| Archivo | Descripción |
|---------|-------------|
| `package.json` | Root package, scripts de Turbo, `packageManager: pnpm@9.15.9`, `engines: >=20` |
| `pnpm-workspace.yaml` | Workspaces: `apps/*`, `packages/*`, `server` |
| `turbo.json` | Tareas: `build`, `dev`, `test`, `lint`, `typecheck` |
| `tsconfig.json` | Base TS config: strict, ES2022, bundler resolution |
| `.env.example` | Template de variables de entorno |
| `.env` | Variables de entorno locales (copiado de `.env.example`) |
| `docker-compose.yml` | PostgreSQL 16 + PostGIS 3.4 en contenedor |

- **Estado:** OK

### Configuración — Paquete `@campus-gps/shared-types`

- **Categoría:** Configuración
- **Ruta:** `packages/shared-types/`
- **Archivos:** `package.json`, `tsconfig.json`, `src/index.ts` (placeholder)
- **Estado:** OK

### Configuración — Paquete `@campus-gps/server`

- **Categoría:** Configuración
- **Ruta:** `server/`
- **Archivos:** `package.json`, `tsconfig.json`, `.env`
- **Dependencias:** Hono 4, Prisma 6, Zod 3, tsx 4, Vitest 2
- **Estado:** OK

### Configuración — Paquete `@campus-gps/mobile`

- **Categoría:** Configuración
- **Ruta:** `apps/mobile/`
- **Archivos:** `package.json`, `tsconfig.json`, `metro.config.js`
- **Dependencias:** Expo 52, React Native 0.76, MapLibre React Native 10, Zustand 5, Vitest 2
- **Estado:** OK

### Estructura de Carpetas

```
development/
├── apps/mobile/src/{components,screens,services,hooks,store}
├── packages/shared-types/src/
├── server/src/routes/
├── server/prisma/
├── data/{routes,schemas}/
├── .github/workflows/
└── docs/
```

### Instalación — Dependencias (pnpm install)

- **Categoría:** Instalación
- **Método:** `pnpm install` (desde raíz del monorepo)
- **Paquetes instalados:** 856 dependencias resueltas
- **Dependencias root:** Turborepo 2.8.17, TypeScript 5.9.3
- **Warnings:** 10 subdependencias deprecadas (babel plugins, glob, rimraf, etc.) — no críticas
- **Estado:** OK

### Pendiente — PostgreSQL + PostGIS (Docker)

- **Categoría:** Configuración
- **Nota:** Docker Desktop no estaba corriendo al momento de la inicialización. Se creó `docker-compose.yml` con la imagen `postgis/postgis:16-3.4`. Ejecutar `docker compose up -d` cuando Docker Desktop esté activo.
- **Estado:** Pendiente

### Configuración — Habilitación de Virtual Machine Platform

- **Categoría:** Configuración
- **Problema:** Docker Desktop mostraba error: *"Virtual Machine Platform not enabled"*
- **Causa:** La feature de Windows `VirtualMachinePlatform` no estaba habilitada. WSL y Hyper-V sí estaban activos.
- **Método:** `dism /online /enable-feature /featurename:VirtualMachinePlatform /norestart` (PowerShell como administrador)
- **Requisito:** Reiniciar el equipo para que surta efecto.
- **Estado:** OK

---

## [2026-03-18] — Docker Desktop y Base de Datos (Fase 1)

### Corrección — WMI Win32_OptionalFeature

- **Categoría:** Corrección
- **Problema:** Tras reiniciar, Docker Desktop seguía mostrando *"Virtual Machine Platform not enabled"* a pesar de que la feature estaba habilitada.
- **Causa raíz:** La clase WMI `Win32_OptionalFeature` no estaba registrada en el repositorio WMI. Docker Desktop consulta WMI para verificar features y fallaba con *"Clase no válida"*.
- **Método:** Recompilación del MOF que contiene la clase:
  ```
  mofcomp C:\Windows\System32\wbem\cimwin32.mof
  ```
- **Verificación:** `Get-CimInstance Win32_OptionalFeature | Where Name -eq VirtualMachinePlatform` → `InstallState: 1`
- **Estado:** OK

### Corrección — WSL2 Distros de Docker

- **Categoría:** Corrección
- **Problema:** Docker Desktop fallaba con *"Docker Desktop distro installation failed"* — las distros WSL `docker-desktop` y `docker-desktop-data` estaban corruptas.
- **Método:**
  1. `wsl --unregister docker-desktop` y `wsl --unregister docker-desktop-data`
  2. `wsl.exe --install --no-distribution` (re-registra componentes WSL2)
  3. Reinicio del equipo
  4. Docker Desktop recrea las distros automáticamente al arrancar
- **Nota:** La distro Ubuntu preexistente no fue afectada.
- **Estado:** OK

### Actualización — WSL

- **Categoría:** Actualización
- **Versión:** 2.6.3
- **Método:** `wsl --update`
- **Estado:** OK

### Configuración — Docker Desktop Activo

- **Categoría:** Configuración
- **Imagen:** `postgis/postgis:16-3.4`
- **Contenedor:** `campus-gps-db`
- **Método:** `docker compose up -d`
- **Puertos:** `5432:5432`
- **Credenciales:** `campus_gps / campus_gps_dev` (base de datos: `campus_gps`)
- **Verificación:** `docker exec campus-gps-db psql -U campus_gps -c "SELECT PostGIS_Version();"` → `3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`
- **Estado:** OK

### Configuración — Prisma Schema y Migración Inicial [FR-008]

- **Categoría:** Configuración
- **Archivo:** `server/prisma/schema.prisma`
- **Modelos creados:**

| Modelo | Tabla | Campos clave |
|--------|-------|-------------|
| `Route` | `routes` | id, name, description, timestamps |
| `Waypoint` | `waypoints` | waypointId, name, description, waypointType (enum), lat/lng, order |
| `RouteSegment` | `route_segments` | segmentId, name, surfaceType, elevationChange, riskLevel, order |

- **Enum `WaypointType`:** BUILDING, ENTRANCE, INTERSECTION, BUS_STOP, METRO, LANDMARK, PARKING, ACCESSIBILITY_FEATURE
- **Extensiones:** PostGIS (vía `postgresqlExtensions` preview feature)
- **Migración:** `20260318041450_init` aplicada con `prisma migrate dev --name init`
- **Prisma Client:** v6.19.2 generado
- **Estado:** OK

### Configuración — Seed de Datos de Prueba [FR-008]

- **Categoría:** Configuración
- **Archivo:** `server/prisma/seed.ts`
- **Ruta de prueba:** Medicina → Metro Ciudad Universitaria
- **Datos insertados:**

| Tipo | Cantidad | Detalle |
|------|----------|---------|
| Routes | 1 | `test-route-1`: Facultad de Medicina → Metro Ciudad Universitaria |
| Waypoints | 5 | Medicina, Odontología, Farmacia, Parada bus Farmacia, Metro CU |
| Segments | 4 | Segmentos paved entre cada par de waypoints consecutivos |

- **Método:** `pnpm --filter server db:seed`
- **Configuración:** Añadido bloque `prisma.seed` en `server/package.json`
- **Estado:** OK

---

## Resumen del Entorno — Estado Actual

| Requisito (SETUP-TECNICO-FASE-1.md) | Versión Instalada | Cumple |
|--------------------------------------|-------------------|--------|
| Node.js 20 LTS (>=20) | 22.17.1 | Sí |
| pnpm 9.x | 9.15.9 | Sí |
| Git 2.40+ | 2.50.1 | Sí |
| PostgreSQL 16+ (Docker) | 16 (postgis/postgis:16-3.4) | Sí |
| PostGIS 3.4+ | 3.4 | Sí |
| Turborepo | 2.8.17 | Sí |
| TypeScript | 5.9.3 | Sí |
| Android Studio Ladybug+ | 2025.3.1.8 (Panda) | Sí |
| Java JDK 17 | 17.0.18 (Temurin) | Sí |
| Docker Desktop | 27.2.0 | Sí |
| Prisma Client | 6.19.2 | Sí |

---

## Hardware del Equipo

| Componente | Especificación |
|------------|---------------|
| Equipo | Dell Precision 7710 |
| CPU | Intel Core i7-6820HQ @ 2.70 GHz (4C/8T) |
| RAM | 32 GB |
| GPU dedicada | NVIDIA Quadro M3000M |
| GPU integrada | Intel HD Graphics 530 |
| Disco C: | 477 GB SSD |
| Disco D: | 932 GB SSD |
| SO | Windows 10 Pro 10.0.19045 |
