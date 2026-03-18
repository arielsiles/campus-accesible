# Especificación de Desarrollo — Fase 1: Fundación y Prototipo Básico

> **Versión:** 1.0 | **Fecha:** 2026-03-11 | **Estado:** Draft
> **Prefijo IDs:** FR-NNN (funcionales), NFR-NNN (no funcionales)

---

## 1. Alcance

### En Scope (Fase 1)

Las 8 tareas fundacionales del plan maestro:
- Monorepo con Turborepo + pnpm
- App Expo con TypeScript
- Mapa con MapLibre GL
- Geolocalización GPS
- Modelo de datos GeoJSON
- Servidor básico (Hono + Prisma + PostGIS)
- Ruta de prueba con waypoints estáticos
- CI/CD con GitHub Actions

### Fuera de Scope

- Audio 3D espacializado
- Motor de routing (pathfinding)
- Perfiles de accesibilidad (visual, movilidad, intelectual, auditivo)
- Panel de administración web
- Sistema de incidencias
- Autenticación de usuarios
- Navegación turn-by-turn
- Internacionalización / lectura fácil

---

## 2. Requisitos Funcionales

### FR-001: Monorepo Structure

**Descripción:** Monorepo con Turborepo y pnpm workspaces que gestione todos los packages del proyecto.

**Criterios de aceptación:**

```gherkin
Given el repositorio clonado
When ejecuto `pnpm install`
Then todas las dependencias se resuelven sin errores

Given el monorepo instalado
When ejecuto `turbo build`
Then shared-types, mobile y server compilan exitosamente

Given la estructura de carpetas
When inspecciono el proyecto
Then existen: apps/mobile/, server/, packages/shared-types/
```

**Archivos requeridos:** `package.json` (root), `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.gitattributes`

---

### FR-002: Mobile App Boots

**Descripción:** App Expo con TypeScript arranca en emulador Android sin errores.

**Criterios de aceptación:**

```gherkin
Given el entorno de desarrollo configurado
When ejecuto `pnpm dev` en apps/mobile
Then Expo inicia y la app se abre en emulador Android sin errores de compilación

Given la app arrancada
When inspecciono la consola
Then no hay warnings de TypeScript strict mode
```

**Archivos requeridos:** `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/App.tsx`

---

### FR-003: Map Renders

**Descripción:** MapLibre GL muestra un mapa centrado en Ciudad Universitaria.

**Criterios de aceptación:**

```gherkin
Given la app arrancada en emulador
When se carga MapScreen
Then MapLibre GL renderiza un mapa visible en < 3s

Given el mapa renderizado
When inspecciono las coordenadas del centro
Then el mapa está centrado en Ciudad Universitaria (lat: 40.4468, lng: -3.7264)

Given el mapa renderizado
When interactúo con zoom/pan
Then el mapa responde fluidamente a gestos táctiles

Given el componente MapView
When un screen reader lo inspecciona
Then anuncia "Mapa del campus universitario" (accessibilityLabel)
```

**Archivos requeridos:** `apps/mobile/src/screens/MapScreen.tsx`, `apps/mobile/src/components/MapView.tsx`

---

### FR-004: GPS Position

**Descripción:** Marker del usuario visible en el mapa, actualizado en tiempo real.

**Criterios de aceptación:**

```gherkin
Given la app con permisos de ubicación concedidos
When el GPS obtiene posición
Then un marker azul indica la posición del usuario en el mapa

Given el marker de ubicación visible
When el usuario se mueve
Then el marker se actualiza cada ≤ 1 segundo

Given la app sin permisos de ubicación
When se abre MapScreen
Then se muestra PermissionRequestModal explicando por qué se necesita ubicación

Given el componente UserLocationMarker
When un screen reader lo inspecciona
Then anuncia "Tu ubicación actual" (accessibilityLabel)
```

**Archivos requeridos:** `apps/mobile/src/components/UserLocationMarker.tsx`, `apps/mobile/src/components/PermissionRequestModal.tsx`, `apps/mobile/src/services/locationService.ts`, `apps/mobile/src/hooks/useLocation.ts`, `apps/mobile/src/store/locationStore.ts`

---

### FR-005: Static Route

**Descripción:** Ruta de prueba renderizada como polyline con waypoint markers.

**Criterios de aceptación:**

```gherkin
Given datos de ruta cargados desde la API
When MapScreen renderiza la ruta
Then una polyline azul conecta todos los segmentos de la ruta

Given la ruta renderizada
When inspecciono los waypoints
Then cada waypoint tiene un marker con icono según su tipo

Given un waypoint marker
When un screen reader lo inspecciona
Then anuncia el nombre del waypoint en español (accessibilityLabel)

Given la ruta renderizada
When toco un waypoint marker
Then se muestra nombre y descripción del waypoint
```

**Archivos requeridos:** `apps/mobile/src/components/RoutePolyline.tsx`, `apps/mobile/src/components/WaypointMarker.tsx`, `apps/mobile/src/services/routeService.ts`, `apps/mobile/src/hooks/useRoutes.ts`, `apps/mobile/src/hooks/useRoute.ts`

---

### FR-006: GeoJSON Data Model

**Descripción:** Schema GeoJSON completo para rutas del campus con validación.

**Criterios de aceptación:**

```gherkin
Given un archivo GeoJSON de ruta
When lo valido contra el schema
Then pasa si contiene FeatureCollection con features de tipo route-segment (LineString) y waypoint (Point)

Given un feature de tipo route-segment
When inspecciono sus propiedades
Then contiene: name, segmentId, surfaceType, elevationChange, riskLevel

Given un feature de tipo waypoint
When inspecciono sus propiedades
Then contiene: waypointId, name, description, waypointType (enum válido)

Given un GeoJSON con datos inválidos
When lo valido contra el schema
Then la validación falla con mensaje descriptivo
```

**Archivos requeridos:** `packages/shared-types/src/geojson.ts`, `data/routes/test-route.geojson`, `data/schemas/route.schema.json`

---

### FR-007: Server API

**Descripción:** Servidor Hono con endpoints REST para health check y rutas.

**Criterios de aceptación:**

```gherkin
Given el servidor arrancado
When hago GET /api/health
Then responde 200 con { "status": "ok", "timestamp": "<ISO date>" }

Given rutas en la base de datos
When hago GET /api/routes
Then responde 200 con array de rutas (id, name, description)

Given una ruta existente con id "test-route-1"
When hago GET /api/routes/test-route-1
Then responde 200 con la ruta completa incluyendo waypoints y segments en GeoJSON

Given una ruta inexistente
When hago GET /api/routes/no-existe
Then responde 404 con { "error": { "code": "NOT_FOUND", "message": "..." } }

Given cualquier endpoint
When inspecciono los headers de respuesta
Then incluye CORS headers configurados
```

**Archivos requeridos:** `server/src/index.ts`, `server/src/routes/health.ts`, `server/src/routes/routes.ts`

---

### FR-008: Database Schema

**Descripción:** Schema Prisma con modelos geoespaciales para rutas y waypoints.

**Criterios de aceptación:**

```gherkin
Given el schema de Prisma
When ejecuto `prisma migrate dev`
Then las tablas Route, Waypoint, RouteSegment se crean en PostgreSQL

Given la tabla RouteSegment
When inspecciono sus columnas
Then contiene columna geometry de tipo geoespacial (PostGIS)

Given el seed script
When ejecuto `pnpm db:seed`
Then se inserta la ruta de prueba con sus waypoints y segments

Given los datos seed
When consulto GET /api/routes
Then la ruta de prueba aparece en la respuesta
```

**Archivos requeridos:** `server/prisma/schema.prisma`, `server/prisma/seed.ts`, `server/prisma/migrations/`

---

### FR-009: CI Pipeline

**Descripción:** GitHub Actions ejecuta lint, typecheck y tests en cada PR.

**Criterios de aceptación:**

```gherkin
Given un PR abierto contra main
When GitHub Actions ejecuta el workflow
Then ejecuta: pnpm install → turbo lint → turbo typecheck → turbo test

Given todos los checks pasando
When el workflow finaliza
Then el status check es verde

Given un error de lint o type
When el workflow ejecuta
Then el status check es rojo con log del error
```

**Archivos requeridos:** `.github/workflows/ci.yml`

---

## 3. Requisitos No Funcionales

### NFR-001: Performance

| Métrica | Criterio |
|---------|----------|
| Mapa renderiza | < 3 segundos desde apertura de MapScreen |
| GPS update | Cada ≤ 1 segundo |
| API response | < 200ms (p95) para todos los endpoints |
| App cold start | < 5 segundos en emulador |

---

### NFR-002: Accesibilidad Base

| Criterio | Detalle |
|----------|---------|
| `accessibilityLabel` | En TODO elemento interactivo, en español |
| `accessibilityRole` | En todas las pantallas y componentes interactivos |
| `accessibilityHint` | En elementos cuya acción no sea obvia por el label |
| Touch target | Mínimo 44x44 dp |
| Contraste | Ratio mínimo 4.5:1 para texto, 3:1 para elementos gráficos |
| Focus order | Lógico, de arriba a abajo, izquierda a derecha |

---

### NFR-003: Calidad de Código

| Criterio | Detalle |
|----------|---------|
| TypeScript | `strict: true` en todos los tsconfig |
| Linting | ESLint con config compartida |
| Formatting | Prettier con config compartida |
| Cobertura tests | ≥70% en services, ≥50% global |
| Sin `any` | Prohibido usar tipo `any` explícito |

---

### NFR-004: Seguridad

| Criterio | Detalle |
|----------|---------|
| Secrets | Ningún secret en código fuente (solo `.env`) |
| `.env` | En `.gitignore`, `.env.example` versionado |
| CORS | Restringido a orígenes permitidos |
| DB connection | Via variable de entorno `DATABASE_URL` |
| Dependencies | Sin vulnerabilidades conocidas (high/critical) |

---

### NFR-005: Compatibilidad

| Plataforma | Versión Mínima |
|-----------|---------------|
| Android | API 24 (Android 7.0) |
| iOS | 15+ |
| Node.js | 20 LTS |
| PostgreSQL | 16+ |
| PostGIS | 3.4+ |

---

## 4. Modelos de Datos

### 4.1 GeoJSON Schema para Rutas

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CampusRouteCollection",
  "description": "Schema GeoJSON para rutas del campus universitario",
  "type": "object",
  "required": ["type", "features"],
  "properties": {
    "type": { "const": "FeatureCollection" },
    "features": {
      "type": "array",
      "items": {
        "oneOf": [
          { "$ref": "#/definitions/RouteSegmentFeature" },
          { "$ref": "#/definitions/WaypointFeature" }
        ]
      }
    }
  },
  "definitions": {
    "RouteSegmentFeature": {
      "type": "object",
      "required": ["type", "geometry", "properties"],
      "properties": {
        "type": { "const": "Feature" },
        "geometry": {
          "type": "object",
          "required": ["type", "coordinates"],
          "properties": {
            "type": { "const": "LineString" },
            "coordinates": {
              "type": "array",
              "items": {
                "type": "array",
                "items": { "type": "number" },
                "minItems": 2,
                "maxItems": 3
              },
              "minItems": 2
            }
          }
        },
        "properties": {
          "type": "object",
          "required": ["featureType", "segmentId", "name", "surfaceType", "elevationChange", "riskLevel"],
          "properties": {
            "featureType": { "const": "route-segment" },
            "segmentId": { "type": "string" },
            "name": { "type": "string" },
            "surfaceType": { "enum": ["paved", "cobblestone", "gravel", "dirt", "tactile"] },
            "elevationChange": { "type": "number", "description": "Cambio de elevación en metros (positivo = subida)" },
            "riskLevel": { "enum": ["none", "low", "medium", "high"] }
          }
        }
      }
    },
    "WaypointFeature": {
      "type": "object",
      "required": ["type", "geometry", "properties"],
      "properties": {
        "type": { "const": "Feature" },
        "geometry": {
          "type": "object",
          "required": ["type", "coordinates"],
          "properties": {
            "type": { "const": "Point" },
            "coordinates": {
              "type": "array",
              "items": { "type": "number" },
              "minItems": 2,
              "maxItems": 3
            }
          }
        },
        "properties": {
          "type": "object",
          "required": ["featureType", "waypointId", "name", "description", "waypointType"],
          "properties": {
            "featureType": { "const": "waypoint" },
            "waypointId": { "type": "string" },
            "name": { "type": "string" },
            "description": { "type": "string" },
            "waypointType": {
              "enum": [
                "entrance",
                "intersection",
                "building",
                "transport_stop",
                "landmark",
                "hazard",
                "rest_area",
                "information_point"
              ]
            }
          }
        }
      }
    }
  }
}
```

### 4.2 Prisma Schema

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

model Route {
  id          String         @id @default(cuid())
  name        String
  description String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  segments    RouteSegment[]
  waypoints   Waypoint[]
}

model RouteSegment {
  id              String  @id @default(cuid())
  segmentId       String  @unique
  name            String
  surfaceType     SurfaceType
  elevationChange Float   @default(0)
  riskLevel       RiskLevel @default(none)
  // geometry almacenado como GeoJSON string; queries geoespaciales via $queryRaw con PostGIS
  geometryGeoJson String  @db.Text
  orderIndex      Int
  route           Route   @relation(fields: [routeId], references: [id])
  routeId         String
}

model Waypoint {
  id           String       @id @default(cuid())
  waypointId   String       @unique
  name         String
  description  String
  waypointType WaypointType
  latitude     Float
  longitude    Float
  orderIndex   Int
  route        Route        @relation(fields: [routeId], references: [id])
  routeId      String
}

enum SurfaceType {
  paved
  cobblestone
  gravel
  dirt
  tactile
}

enum RiskLevel {
  none
  low
  medium
  high
}

enum WaypointType {
  entrance
  intersection
  building
  transport_stop
  landmark
  hazard
  rest_area
  information_point
}
```

### 4.3 TypeScript Shared Types

```typescript
// packages/shared-types/src/index.ts

// === Enums ===

export enum WaypointType {
  Entrance = 'entrance',
  Intersection = 'intersection',
  Building = 'building',
  TransportStop = 'transport_stop',
  Landmark = 'landmark',
  Hazard = 'hazard',
  RestArea = 'rest_area',
  InformationPoint = 'information_point',
}

export enum SurfaceType {
  Paved = 'paved',
  Cobblestone = 'cobblestone',
  Gravel = 'gravel',
  Dirt = 'dirt',
  Tactile = 'tactile',
}

export enum RiskLevel {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

// === GeoJSON Interfaces ===

export interface RouteSegmentProperties {
  featureType: 'route-segment';
  segmentId: string;
  name: string;
  surfaceType: SurfaceType;
  elevationChange: number;
  riskLevel: RiskLevel;
}

export interface WaypointProperties {
  featureType: 'waypoint';
  waypointId: string;
  name: string;
  description: string;
  waypointType: WaypointType;
}

export interface RouteSegmentFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][] | [number, number, number][];
  };
  properties: RouteSegmentProperties;
}

export interface WaypointFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number] | [number, number, number];
  };
  properties: WaypointProperties;
}

export type RouteFeature = RouteSegmentFeature | WaypointFeature;

export interface RouteFeatureCollection {
  type: 'FeatureCollection';
  features: RouteFeature[];
}

// === API Response Types ===

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
}

export interface RouteSummary {
  id: string;
  name: string;
  description: string;
}

export interface RouteDetail extends RouteSummary {
  geojson: RouteFeatureCollection;
  createdAt: string;
  updatedAt: string;
}

export type RoutesListResponse = RouteSummary[];
export type RouteDetailResponse = RouteDetail;
```

---

## 5. Contratos API

### GET /api/health

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/health` |
| **Params** | Ninguno |
| **Response 200** | `HealthResponse` |

**Ejemplo response:**
```json
{ "status": "ok", "timestamp": "2026-03-11T10:00:00.000Z" }
```

---

### GET /api/routes

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/routes` |
| **Params** | Ninguno |
| **Response 200** | `RouteSummary[]` |

**Ejemplo response:**
```json
[
  {
    "id": "test-route-1",
    "name": "Ruta Medicina - Metro Ciudad Universitaria",
    "description": "Ruta accesible desde la Facultad de Medicina hasta la estación de Metro"
  }
]
```

---

### GET /api/routes/:id

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/routes/:id` |
| **Params** | `id` (path param, string) |
| **Response 200** | `RouteDetail` |
| **Response 404** | `ApiErrorResponse` con code `NOT_FOUND` |

**Ejemplo response 200:**
```json
{
  "id": "test-route-1",
  "name": "Ruta Medicina - Metro Ciudad Universitaria",
  "description": "Ruta accesible desde la Facultad de Medicina hasta la estación de Metro",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z",
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [-3.7264, 40.4468]
        },
        "properties": {
          "featureType": "waypoint",
          "waypointId": "wp-001",
          "name": "Facultad de Medicina",
          "description": "Entrada principal de la Facultad de Medicina",
          "waypointType": "building"
        }
      }
    ]
  }
}
```

**Ejemplo response 404:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Ruta no encontrada"
  }
}
```

---

## 6. Arquitectura de Componentes

### 6.1 Screens

| Screen | Archivo | Descripción |
|--------|---------|-------------|
| MapScreen | `apps/mobile/src/screens/MapScreen.tsx` | Única pantalla en Fase 1. Contiene mapa, ubicación y ruta |

### 6.2 Components

| Componente | Archivo | Props Principales | a11y |
|-----------|---------|-------------------|------|
| MapView | `components/MapView.tsx` | `center`, `zoom`, `children` | label: "Mapa del campus universitario" |
| UserLocationMarker | `components/UserLocationMarker.tsx` | `coordinate` | label: "Tu ubicación actual" |
| RoutePolyline | `components/RoutePolyline.tsx` | `segments: RouteSegmentFeature[]` | label: "Ruta {name}" |
| WaypointMarker | `components/WaypointMarker.tsx` | `waypoint: WaypointFeature` | label: "{waypoint.name}" |
| PermissionRequestModal | `components/PermissionRequestModal.tsx` | `onAllow`, `onDeny` | label: "Permiso de ubicación necesario" |
| LoadingOverlay | `components/LoadingOverlay.tsx` | `visible`, `message` | label: "{message}" |

### 6.3 Services

| Service | Archivo | Responsabilidad |
|---------|---------|----------------|
| LocationService | `services/locationService.ts` | Gestionar permisos GPS, obtener/suscribir ubicación |
| RouteService | `services/routeService.ts` | Obtener rutas de la API, transformar a GeoJSON |
| ApiClient | `services/apiClient.ts` | HTTP client configurado con base URL |

### 6.4 Hooks

| Hook | Archivo | Retorno |
|------|---------|---------|
| `useLocation()` | `hooks/useLocation.ts` | `{ location, error, isLoading, requestPermission }` |
| `useRoutes()` | `hooks/useRoutes.ts` | `{ routes, error, isLoading }` |
| `useRoute(id)` | `hooks/useRoute.ts` | `{ route, error, isLoading }` |

### 6.5 Stores (Zustand)

| Store | Archivo | Estado |
|-------|---------|--------|
| locationStore | `store/locationStore.ts` | `{ location, isTracking, accuracy, setLocation, startTracking, stopTracking }` |
| mapStore | `store/mapStore.ts` | `{ center, zoom, selectedRouteId, setCenter, setZoom, selectRoute }` |

---

## 7. Mapa de Dependencias

```
apps/mobile ──→ packages/shared-types
server ────────→ packages/shared-types
apps/mobile ──→ server (API en runtime)
server ────────→ PostgreSQL + PostGIS

Build order: shared-types → mobile + server (paralelo)
```

---

## 8. Definition of Done por Tarea

### T1.1 — Monorepo Setup

- **Spec IDs:** FR-001
- **Archivos:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.gitattributes`, `.npmrc`
- **Tests:** `pnpm install` sin errores, `turbo build` exitoso
- **Done:** Estructura de carpetas creada, workspaces resolviendo

### T1.2 — Expo + TypeScript

- **Spec IDs:** FR-002, NFR-003, NFR-005
- **Archivos:** `apps/mobile/*` (package.json, app.json, tsconfig.json, App.tsx)
- **Tests:** App arranca en emulador Android, TypeScript strict sin errores
- **Done:** App vacía arranca limpiamente

### T1.3 — MapLibre GL

- **Spec IDs:** FR-003, NFR-001, NFR-002
- **Archivos:** `MapScreen.tsx`, `MapView.tsx`
- **Tests:** Mapa visible, centrado en CU, a11y labels presentes
- **Done:** Mapa renderiza en < 3s con interacción gestual

### T1.4 — GPS Location

- **Spec IDs:** FR-004, NFR-001, NFR-002
- **Archivos:** `UserLocationMarker.tsx`, `PermissionRequestModal.tsx`, `locationService.ts`, `useLocation.ts`, `locationStore.ts`
- **Tests:** TST-FR-004-001 (unit locationService), TST-FR-004-002 (unit locationStore)
- **Done:** Marker visible, actualización cada ≤1s, modal de permisos funcional

### T1.5 — GeoJSON Data Model

- **Spec IDs:** FR-006, NFR-003
- **Archivos:** `packages/shared-types/src/geojson.ts`, `data/routes/test-route.geojson`, `data/schemas/route.schema.json`
- **Tests:** TST-FR-006-001 (validación GeoJSON), TST-FR-006-002 (schema rejects invalid)
- **Done:** Schema definido, tipos exportados, datos de prueba válidos

### T1.6 — Server + Database

- **Spec IDs:** FR-007, FR-008, NFR-001, NFR-004
- **Archivos:** `server/src/**`, `server/prisma/**`
- **Tests:** TST-FR-007-001 (health), TST-FR-007-002 (GET routes), TST-FR-007-003 (GET route by id), TST-FR-007-004 (404), TST-FR-008-001 (migration), TST-FR-008-002 (seed)
- **Done:** API endpoints responden correctamente, DB con datos seed

### T1.7 — Static Route Display

- **Spec IDs:** FR-005, NFR-002
- **Archivos:** `RoutePolyline.tsx`, `WaypointMarker.tsx`, `routeService.ts`, `useRoutes.ts`, `useRoute.ts`
- **Tests:** TST-FR-005-001 (unit routeService), manual (ruta visible en mapa)
- **Done:** Polyline y markers renderizados con a11y labels

### T1.8 — CI/CD Pipeline

- **Spec IDs:** FR-009, NFR-003
- **Archivos:** `.github/workflows/ci.yml`
- **Tests:** Workflow pasa en PR de prueba
- **Done:** CI ejecuta lint + typecheck + test en PRs

---

## 9. Especificaciones de Tests

### 9.1 Unit Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-004-001 | LocationService | requestPermission retorna status, getCurrentPosition retorna coords | FR-004 |
| TST-FR-004-002 | locationStore | setLocation actualiza estado, startTracking/stopTracking toggle | FR-004 |
| TST-FR-005-001 | RouteService | fetchRoutes retorna array, fetchRoute retorna detail, manejo de 404 | FR-005 |
| TST-FR-006-001 | GeoJSON validation | Schema acepta GeoJSON válido de ruta | FR-006 |
| TST-FR-006-002 | GeoJSON validation | Schema rechaza GeoJSON inválido con error descriptivo | FR-006 |
| TST-NFR-002-001 | Components | Todos los componentes interactivos tienen accessibilityLabel | NFR-002 |

### 9.2 Integration Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-007-001 | API /health | GET /api/health retorna 200 con status ok | FR-007 |
| TST-FR-007-002 | API /routes | GET /api/routes retorna array de RouteSummary | FR-007 |
| TST-FR-007-003 | API /routes/:id | GET /api/routes/:id retorna RouteDetail con GeoJSON | FR-007 |
| TST-FR-007-004 | API /routes/:id | GET /api/routes/invalid retorna 404 | FR-007 |
| TST-FR-008-001 | Database | Migration crea tablas Route, Waypoint, RouteSegment | FR-008 |
| TST-FR-008-002 | Database | Seed inserta datos de prueba consultables | FR-008 |

### 9.3 Manual Checklist

- [ ] Mapa renderiza en emulador Android en < 3s
- [ ] Mapa centrado en Ciudad Universitaria
- [ ] GPS marker azul visible (con GPS simulado)
- [ ] Ruta de prueba visible como polyline azul
- [ ] Waypoint markers visibles con iconos
- [ ] Tocar waypoint muestra nombre y descripción
- [ ] Screen reader (TalkBack) anuncia: mapa, ubicación, waypoints
- [ ] Touch targets ≥ 44x44 dp
- [ ] Modal de permisos aparece si GPS no autorizado

---

## 10. Matriz de Trazabilidad

| Spec ID | Task ID | Test IDs | Archivos Principales |
|---------|---------|----------|---------------------|
| FR-001 | T1.1 | (build verification) | package.json, pnpm-workspace.yaml, turbo.json |
| FR-002 | T1.2 | (app boots verification) | apps/mobile/App.tsx, app.json |
| FR-003 | T1.3 | TST-NFR-002-001 (a11y) | MapScreen.tsx, MapView.tsx |
| FR-004 | T1.4 | TST-FR-004-001, TST-FR-004-002 | locationService.ts, locationStore.ts, UserLocationMarker.tsx |
| FR-005 | T1.7 | TST-FR-005-001 | RoutePolyline.tsx, WaypointMarker.tsx, routeService.ts |
| FR-006 | T1.5 | TST-FR-006-001, TST-FR-006-002 | shared-types/geojson.ts, route.schema.json |
| FR-007 | T1.6 | TST-FR-007-001..004 | server/src/routes/*.ts |
| FR-008 | T1.6 | TST-FR-008-001, TST-FR-008-002 | schema.prisma, seed.ts |
| FR-009 | T1.8 | (CI workflow verification) | .github/workflows/ci.yml |
| NFR-001 | T1.3, T1.4, T1.6 | (manual perf check) | MapView.tsx, locationService.ts, server |
| NFR-002 | T1.3, T1.4, T1.7 | TST-NFR-002-001 | Todos los componentes |
| NFR-003 | T1.1, T1.8 | (CI lint+typecheck) | tsconfig.json, .eslintrc, ci.yml |
| NFR-004 | T1.6 | (manual review) | .env.example, .gitignore, CORS config |
| NFR-005 | T1.2, T1.6 | (compatibility verification) | app.json, package.json |
