# Especificación de Desarrollo — Fase 2: Motor de Navegación y Routing

> **Versión:** 1.0 | **Fecha:** 2026-03-18 | **Estado:** Draft
> **Prefijo IDs:** FR-2XX (funcionales), NFR-2XX (no funcionales)
> **Fase anterior:** Fase 1 completada (2026-03-18) — ver `SPEC-FASE-1.md`

---

## 1. Alcance

### En Scope (Fase 2)

Las 6 tareas del plan maestro para esta fase:
- Grafo de rutas (nodos = waypoints, aristas = segmentos con pesos)
- Algoritmo de pathfinding (Dijkstra/A*) adaptado a accesibilidad
- Sistema snap-to-route para mantener al usuario en la ruta
- Instrucciones turn-by-turn básicas (texto)
- Conexión con puntos de transporte (Metro, autobuses)
- Búsqueda de destinos (facultades, edificios, paradas)

### Fuera de Scope

- Audio 3D espacializado (Fase 3)
- Perfiles de accesibilidad por tipo de discapacidad (Fase 3-4)
- Panel de administración web (Fase 5)
- Sistema de incidencias (Fase 5)
- Autenticación de usuarios (Fase 5)
- Lectura fácil / internacionalización (Fase 4)
- Retroalimentación háptica direccional (Fase 4)

### Dependencias de Fase 1

| Componente | Estado | Notas |
|-----------|--------|-------|
| MapLibre GL + OpenFreeMap | ✅ Funcionando | Mapa interactivo con tiles gratuitos |
| GPS + expo-location | ✅ Funcionando | Permisos, watchPosition, UserLocationMarker |
| GeoJSON data model | ✅ Definido | Enums alineados con spec (shared-types) |
| Server Hono + Prisma + PostGIS | ✅ Funcionando | GET /api/routes, GET /api/routes/:id |
| Ruta estática de prueba | ✅ Renderizando | Medicina → Metro CU (5 waypoints, 4 segments) |
| CI/CD GitHub Actions | ✅ Configurado | lint + typecheck + test en PRs |

---

## 2. Requisitos Funcionales

### FR-201: Route Graph Model

**Descripción:** Modelo de grafo dirigido donde los nodos son waypoints y las aristas son segmentos de ruta, con pesos calculados por distancia, elevación y accesibilidad.

**Criterios de aceptación:**

```gherkin
Given el schema de la base de datos
When inspecciono los modelos
Then existe una tabla GraphEdge con campos: fromWaypointId, toWaypointId, segmentId, weight, distance, bidirectional

Given un grafo con waypoints y segmentos
When lo consulto desde la API
Then cada nodo tiene una lista de aristas salientes con sus pesos

Given datos de rutas existentes (Fase 1)
When ejecuto la migración y seed
Then se genera el grafo automáticamente a partir de los segmentos existentes

Given un segmento con elevationChange > 5m o riskLevel = "high"
When se calcula el peso de la arista
Then el peso se incrementa proporcionalmente al factor de accesibilidad
```

**Archivos requeridos:**
- `server/prisma/schema.prisma` (modelo GraphEdge)
- `packages/shared-types/src/graph.ts` (tipos del grafo)
- `server/src/services/graphBuilder.ts` (construir grafo desde segmentos)

---

### FR-202: Pathfinding Algorithm

**Descripción:** Algoritmo Dijkstra/A* que encuentra la ruta óptima entre dos waypoints, considerando pesos de accesibilidad.

**Criterios de aceptación:**

```gherkin
Given dos waypoints existentes en el grafo
When solicito una ruta de A a B
Then el algoritmo retorna la secuencia óptima de waypoints y segmentos

Given un grafo con múltiples caminos entre A y B
When solicito la ruta óptima
Then retorna el camino con menor peso total (no necesariamente el más corto en distancia)

Given un destino inalcanzable desde el origen
When solicito la ruta
Then retorna un error descriptivo: "No se encontró ruta entre {origin} y {destination}"

Given el resultado del pathfinding
When inspecciono la respuesta
Then incluye: distancia total, tiempo estimado, waypoints ordenados, segments ordenados, instrucciones
```

**Archivos requeridos:**
- `packages/routing-engine/src/dijkstra.ts` (algoritmo)
- `packages/routing-engine/src/types.ts` (tipos internos)
- `packages/routing-engine/src/index.ts` (exports)

---

### FR-203: Snap-to-Route

**Descripción:** Sistema que proyecta la posición GPS del usuario al punto más cercano de la ruta activa, para compensar la imprecisión del GPS (~3-5m).

**Criterios de aceptación:**

```gherkin
Given una ruta activa con segmentos LineString
When la posición GPS del usuario está a ≤ 30m de la ruta
Then la posición se proyecta al punto más cercano del segmento más próximo

Given la posición GPS del usuario
When está a > 30m de cualquier segmento de la ruta
Then se muestra un aviso "Te has alejado de la ruta" y se mantiene la posición real

Given el usuario moviéndose a lo largo de la ruta
When el GPS se actualiza
Then el punto proyectado avanza suavemente sobre la ruta (sin saltos)

Given el sistema de snap-to-route
When un screen reader inspecciona la posición
Then anuncia el segmento actual y la distancia al siguiente waypoint
```

**Archivos requeridos:**
- `apps/mobile/src/services/snapToRouteService.ts`
- `apps/mobile/src/services/snapToRouteService.test.ts`
- `apps/mobile/src/hooks/useSnapToRoute.ts`

---

### FR-204: Turn-by-Turn Instructions

**Descripción:** Instrucciones de navegación paso a paso en texto, generadas a partir de la secuencia de waypoints y segmentos de la ruta calculada.

**Criterios de aceptación:**

```gherkin
Given una ruta calculada con waypoints y segmentos
When genero las instrucciones
Then cada instrucción contiene: acción ("continúa", "gira a la izquierda", "gira a la derecha"), distancia, nombre del destino parcial

Given el usuario navegando
When llega a ≤ 15m del siguiente waypoint
Then se muestra/anuncia la siguiente instrucción automáticamente

Given las instrucciones de navegación
When un screen reader las lee
Then cada instrucción tiene accessibilityLabel descriptivo en español

Given una instrucción de giro
When inspecciono su contenido
Then incluye: ángulo relativo, tipo de waypoint destino, nombre del lugar, distancia al siguiente punto

Given el usuario que ha completado la ruta
When llega al waypoint final
Then se muestra "Has llegado a tu destino: {nombre}" con accessibilityRole="alert"
```

**Archivos requeridos:**
- `apps/mobile/src/services/navigationService.ts`
- `apps/mobile/src/services/navigationService.test.ts`
- `apps/mobile/src/components/InstructionBanner.tsx`
- `apps/mobile/src/components/ArrivalModal.tsx`
- `apps/mobile/src/hooks/useNavigation.ts`
- `apps/mobile/src/store/navigationStore.ts`

---

### FR-205: Transport Connections

**Descripción:** Los waypoints de tipo `transport_stop` incluyen información de las líneas de transporte disponibles, permitiendo al usuario planificar conexiones.

**Criterios de aceptación:**

```gherkin
Given un waypoint de tipo transport_stop
When inspecciono sus propiedades en la BD
Then contiene: transportType (metro, bus, intercambiador), lines (array de strings)

Given la ruta calculada que pasa por un transport_stop
When se generan las instrucciones
Then incluye información de las líneas disponibles: "Parada de bus: líneas G, U"

Given la app mostrando waypoints
When toco un transport_stop
Then se muestra el tipo de transporte, líneas disponibles y descripción

Given el endpoint GET /api/routes/:id
When inspecciono un waypoint transport_stop en la respuesta
Then incluye transportType y lines en las propiedades GeoJSON
```

**Archivos requeridos:**
- `server/prisma/schema.prisma` (campos transportType, lines en Waypoint)
- `packages/shared-types/src/transport.ts` (tipos de transporte)
- `server/prisma/seed.ts` (datos de transporte actualizados)

---

### FR-206: Destination Search

**Descripción:** Búsqueda de destinos por nombre que permite al usuario encontrar facultades, edificios, paradas y puntos de interés.

**Criterios de aceptación:**

```gherkin
Given el usuario en la pantalla del mapa
When pulsa el campo de búsqueda
Then aparece un input con accessibilityLabel "Buscar destino" y un teclado

Given el usuario escribiendo en el campo de búsqueda
When escribe al menos 2 caracteres
Then se muestran sugerencias filtradas por coincidencia parcial (case-insensitive)

Given el listado de sugerencias
When el usuario selecciona un destino
Then el mapa centra en el waypoint seleccionado y lo resalta

Given el endpoint GET /api/waypoints/search?q=medicina
When ejecuto la búsqueda
Then retorna waypoints cuyo nombre contiene "medicina" (máximo 10 resultados)

Given el campo de búsqueda
When un screen reader lo inspecciona
Then anuncia "Buscar destino" y cada sugerencia anuncia "{nombre}, {tipo}"

Given la lista de sugerencias vacía
When no hay coincidencias
Then muestra "Sin resultados" con accessibilityRole="alert"
```

**Archivos requeridos:**
- `server/src/routes/waypoints.ts` (endpoint de búsqueda)
- `apps/mobile/src/components/SearchBar.tsx`
- `apps/mobile/src/components/SearchResults.tsx`
- `apps/mobile/src/services/searchService.ts`
- `apps/mobile/src/hooks/useSearch.ts`

---

### FR-207: Route Calculation API

**Descripción:** Endpoint del servidor que calcula la ruta óptima entre un origen y un destino, retornando la secuencia de waypoints, segmentos e instrucciones.

**Criterios de aceptación:**

```gherkin
Given dos waypointIds válidos
When hago POST /api/routes/calculate con { origin: "wp-medicina", destination: "wp-metro-cu" }
Then responde 200 con la ruta calculada incluyendo GeoJSON, instrucciones y metadata

Given un waypointId inválido
When hago POST /api/routes/calculate
Then responde 404 con { error: { code: "WAYPOINT_NOT_FOUND", message: "..." } }

Given origin === destination
When hago POST /api/routes/calculate
Then responde 400 con { error: { code: "SAME_ORIGIN_DESTINATION", message: "..." } }

Given una ruta sin camino posible
When hago POST /api/routes/calculate
Then responde 404 con { error: { code: "NO_ROUTE_FOUND", message: "..." } }

Given cualquier request al endpoint
When inspecciono el body
Then está validado con Zod (origin: string, destination: string requeridos)
```

**Archivos requeridos:**
- `server/src/routes/calculate.ts` (endpoint)
- `server/src/services/routingService.ts` (orquesta el cálculo)
- `packages/shared-types/src/navigation.ts` (tipos de request/response)

---

### FR-208: Navigation Screen

**Descripción:** Pantalla de navegación activa que muestra la ruta calculada, instrucciones turn-by-turn y progreso del usuario.

**Criterios de aceptación:**

```gherkin
Given una ruta calculada
When el usuario inicia la navegación
Then la pantalla muestra: mapa con ruta resaltada, banner de instrucción actual, barra de progreso

Given la navegación activa
When el usuario avanza por la ruta
Then el banner se actualiza con la siguiente instrucción al acercarse al waypoint

Given la navegación activa
When el usuario pulsa "Cancelar navegación"
Then vuelve al mapa normal con confirmación previa

Given la pantalla de navegación
When un screen reader inspecciona el banner
Then anuncia la instrucción actual completa en español

Given la navegación activa
When se pierde la señal GPS por > 10 segundos
Then muestra aviso "Señal GPS perdida" con accessibilityRole="alert"
```

**Archivos requeridos:**
- `apps/mobile/src/screens/NavigationScreen.tsx`
- `apps/mobile/src/components/InstructionBanner.tsx`
- `apps/mobile/src/components/NavigationControls.tsx`
- `apps/mobile/src/components/ProgressBar.tsx`

---

## 3. Requisitos No Funcionales

### NFR-201: Performance de Routing

| Métrica | Criterio |
|---------|----------|
| Cálculo de ruta | < 500ms para cualquier par de waypoints en el campus |
| Snap-to-route | < 50ms por actualización de GPS |
| Búsqueda de destinos | < 200ms (p95) |
| Instrucciones | Generadas en < 100ms post-cálculo |

---

### NFR-202: Accesibilidad de Navegación

| Criterio | Detalle |
|----------|---------|
| Instrucciones | En español, lenguaje claro y conciso |
| Screen reader | Todas las instrucciones compatibles con TalkBack/VoiceOver |
| Touch targets | Botones de navegación ≥ 48x48 dp |
| Contraste | Banner de instrucciones con ratio ≥ 4.5:1 |
| Focus management | Al cambiar instrucción, focus se mueve al nuevo banner |
| Off-route alert | Anunciado automáticamente por screen reader |

---

### NFR-203: Precisión de Navegación

| Criterio | Detalle |
|----------|---------|
| Snap-to-route | Umbral de 30m (configurable) |
| Detección de waypoint | Radio de 15m para trigger de instrucción |
| Detección de llegada | Radio de 10m para destino final |
| GPS fallback | Mantener última posición conocida durante ≤ 10s de pérdida de señal |

---

### NFR-204: Escalabilidad del Grafo

| Criterio | Detalle |
|----------|---------|
| Nodos | Soportar ≥ 500 waypoints sin degradación |
| Aristas | Soportar ≥ 1000 segmentos sin degradación |
| Recalculación | Si el usuario se desvía, recalcular en < 1s |
| Datos | Grafo construido desde datos existentes, no duplicado manualmente |

---

## 4. Modelos de Datos

### 4.1 Extensión del Prisma Schema

```prisma
// Nuevos modelos para Fase 2

model GraphEdge {
  id              String   @id @default(cuid())
  fromWaypointId  String
  toWaypointId    String
  segmentId       String?
  distance        Float    // metros
  weight          Float    // peso calculado (distancia + factores accesibilidad)
  bidirectional   Boolean  @default(true)
  fromWaypoint    Waypoint @relation("EdgesFrom", fields: [fromWaypointId], references: [id])
  toWaypoint      Waypoint @relation("EdgesTo", fields: [toWaypointId], references: [id])
  segment         RouteSegment? @relation(fields: [segmentId], references: [id])

  @@unique([fromWaypointId, toWaypointId])
  @@map("graph_edge")
}

// Extensión de Waypoint existente
model Waypoint {
  // ... campos existentes de Fase 1 ...
  transportType  TransportType?
  transportLines String[]       @default([])
  edgesFrom      GraphEdge[]    @relation("EdgesFrom")
  edgesTo        GraphEdge[]    @relation("EdgesTo")
}

enum TransportType {
  metro
  bus
  intercambiador
  cercanias
}
```

### 4.2 TypeScript Types — Navegación

```typescript
// packages/shared-types/src/navigation.ts

export interface RouteCalculationRequest {
  origin: string;      // waypointId
  destination: string; // waypointId
}

export interface NavigationInstruction {
  action: 'start' | 'continue' | 'turn_left' | 'turn_right' | 'slight_left' | 'slight_right' | 'arrive';
  distance: number;           // metros hasta el siguiente waypoint
  waypointName: string;       // nombre del waypoint destino
  waypointType: WaypointType;
  description: string;        // texto legible en español
  bearing: number;            // ángulo en grados (0-360)
}

export interface CalculatedRoute {
  origin: WaypointSummary;
  destination: WaypointSummary;
  totalDistance: number;       // metros
  estimatedTime: number;      // segundos (asumiendo 4 km/h)
  waypoints: WaypointSummary[];
  segments: RouteSegmentFeature[];
  instructions: NavigationInstruction[];
  geojson: RouteFeatureCollection;
}

export interface WaypointSummary {
  waypointId: string;
  name: string;
  waypointType: WaypointType;
  coordinates: [number, number];
}

export interface RouteCalculationResponse {
  route: CalculatedRoute;
}
```

### 4.3 TypeScript Types — Transporte

```typescript
// packages/shared-types/src/transport.ts

export enum TransportType {
  Metro = 'metro',
  Bus = 'bus',
  Intercambiador = 'intercambiador',
  Cercanias = 'cercanias',
}

export interface TransportInfo {
  transportType: TransportType;
  lines: string[];
}
```

### 4.4 TypeScript Types — Búsqueda

```typescript
// packages/shared-types/src/search.ts

export interface SearchResult {
  waypointId: string;
  name: string;
  description: string;
  waypointType: WaypointType;
  coordinates: [number, number];
  transportInfo?: TransportInfo;
}

export type SearchResponse = SearchResult[];
```

---

## 5. Contratos API

### POST /api/routes/calculate

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **Path** | `/api/routes/calculate` |
| **Body** | `RouteCalculationRequest` (JSON) |
| **Response 200** | `RouteCalculationResponse` |
| **Response 400** | `ApiErrorResponse` con code `SAME_ORIGIN_DESTINATION` o `VALIDATION_ERROR` |
| **Response 404** | `ApiErrorResponse` con code `WAYPOINT_NOT_FOUND` o `NO_ROUTE_FOUND` |

**Ejemplo request:**
```json
{
  "origin": "wp-medicina",
  "destination": "wp-metro-cu"
}
```

**Ejemplo response 200:**
```json
{
  "route": {
    "origin": {
      "waypointId": "wp-medicina",
      "name": "Facultad de Medicina",
      "waypointType": "building",
      "coordinates": [-3.7267, 40.4489]
    },
    "destination": {
      "waypointId": "wp-metro-cu",
      "name": "Metro Ciudad Universitaria",
      "waypointType": "transport_stop",
      "coordinates": [-3.7302, 40.4449]
    },
    "totalDistance": 523.4,
    "estimatedTime": 471,
    "waypoints": [ ... ],
    "segments": [ ... ],
    "instructions": [
      {
        "action": "start",
        "distance": 142,
        "waypointName": "Facultad de Odontología",
        "waypointType": "intersection",
        "description": "Sal de la Facultad de Medicina y camina hacia la Facultad de Odontología",
        "bearing": 195
      },
      {
        "action": "turn_left",
        "distance": 108,
        "waypointName": "Facultad de Farmacia",
        "waypointType": "building",
        "description": "Gira a la izquierda hacia la Facultad de Farmacia",
        "bearing": 220
      },
      {
        "action": "continue",
        "distance": 65,
        "waypointName": "Parada de bus Farmacia",
        "waypointType": "transport_stop",
        "description": "Continúa recto hasta la parada de bus Farmacia (líneas G, U)",
        "bearing": 210
      },
      {
        "action": "arrive",
        "distance": 0,
        "waypointName": "Metro Ciudad Universitaria",
        "waypointType": "transport_stop",
        "description": "Has llegado a Metro Ciudad Universitaria (línea 6, circular)",
        "bearing": 0
      }
    ],
    "geojson": { ... }
  }
}
```

---

### GET /api/waypoints/search

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/waypoints/search` |
| **Query params** | `q` (string, mínimo 2 caracteres) |
| **Response 200** | `SearchResponse` (máximo 10 resultados) |
| **Response 400** | `ApiErrorResponse` con code `VALIDATION_ERROR` si `q` < 2 chars |

**Ejemplo request:**
```
GET /api/waypoints/search?q=medicina
```

**Ejemplo response 200:**
```json
[
  {
    "waypointId": "wp-medicina",
    "name": "Facultad de Medicina",
    "description": "Entrada principal de la Facultad de Medicina (UCM)",
    "waypointType": "building",
    "coordinates": [-3.7267, 40.4489]
  }
]
```

---

### GET /api/graph

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/graph` |
| **Params** | Ninguno |
| **Response 200** | `{ nodes: WaypointSummary[], edges: GraphEdgeSummary[] }` |

**Uso:** Debugging y visualización del grafo. No usado por la app en producción.

---

## 6. Arquitectura de Componentes

### 6.1 Screens

| Screen | Archivo | Descripción |
|--------|---------|-------------|
| MapScreen | `screens/MapScreen.tsx` | Pantalla principal con mapa, búsqueda y selección de destino (actualizada) |
| NavigationScreen | `screens/NavigationScreen.tsx` | Pantalla de navegación activa con instrucciones turn-by-turn |

### 6.2 Components (nuevos)

| Componente | Archivo | Props Principales | a11y |
|-----------|---------|-------------------|------|
| SearchBar | `components/SearchBar.tsx` | `onSearch`, `onSelect` | label: "Buscar destino" |
| SearchResults | `components/SearchResults.tsx` | `results`, `onSelect` | label: "{nombre}, {tipo}" por item |
| InstructionBanner | `components/InstructionBanner.tsx` | `instruction` | label: "{descripción completa}", role: "alert" |
| NavigationControls | `components/NavigationControls.tsx` | `onCancel`, `onRecenter` | label: "Cancelar navegación" / "Recentrar mapa" |
| ProgressBar | `components/ProgressBar.tsx` | `current`, `total`, `nextWaypoint` | label: "Progreso: {pct}%, siguiente: {nombre}" |
| ArrivalModal | `components/ArrivalModal.tsx` | `destination`, `onDismiss` | label: "Has llegado a {destino}", role: "alert" |
| OffRouteAlert | `components/OffRouteAlert.tsx` | `visible`, `distance` | label: "Te has alejado de la ruta", role: "alert" |

### 6.3 Services (nuevos)

| Service | Archivo | Responsabilidad |
|---------|---------|----------------|
| SnapToRouteService | `services/snapToRouteService.ts` | Proyectar GPS a punto más cercano de la ruta |
| NavigationService | `services/navigationService.ts` | Gestionar estado de navegación, trigger de instrucciones |
| SearchService | `services/searchService.ts` | Búsqueda de waypoints vía API |
| RoutingService (server) | `server/src/services/routingService.ts` | Orquestar cálculo de ruta |
| GraphBuilder (server) | `server/src/services/graphBuilder.ts` | Construir grafo desde datos existentes |

### 6.4 Hooks (nuevos)

| Hook | Archivo | Retorno |
|------|---------|---------|
| `useNavigation()` | `hooks/useNavigation.ts` | `{ instruction, progress, isNavigating, start, cancel }` |
| `useSnapToRoute(route)` | `hooks/useSnapToRoute.ts` | `{ snappedPosition, isOnRoute, distanceToRoute }` |
| `useSearch()` | `hooks/useSearch.ts` | `{ results, loading, search, clear }` |
| `useRouteCalculation()` | `hooks/useRouteCalculation.ts` | `{ calculatedRoute, loading, error, calculate }` |

### 6.5 Stores (nuevos)

| Store | Archivo | Estado |
|-------|---------|--------|
| navigationStore | `store/navigationStore.ts` | `{ route, currentInstruction, progress, isNavigating, isOffRoute }` |

### 6.6 Packages (nuevos)

| Package | Directorio | Responsabilidad |
|---------|-----------|----------------|
| routing-engine | `packages/routing-engine/` | Algoritmo Dijkstra/A*, tipos del grafo, utilidades geoespaciales |

---

## 7. Mapa de Dependencias

```
apps/mobile ──→ packages/shared-types
apps/mobile ──→ packages/routing-engine (cálculos geoespaciales cliente)
server ────────→ packages/shared-types
server ────────→ packages/routing-engine (pathfinding)
server ────────→ PostgreSQL + PostGIS

Build order: shared-types → routing-engine → mobile + server (paralelo)
```

---

## 8. Definition of Done por Tarea

### T2.1 — Route Graph Model

- **Spec IDs:** FR-201
- **Archivos:** `schema.prisma`, `graph.ts`, `graphBuilder.ts`, `graphBuilder.test.ts`
- **Tests:** TST-FR-201-001 (graph build), TST-FR-201-002 (weight calculation)
- **Done:** Grafo construido desde segmentos, pesos calculados con factores de accesibilidad

### T2.2 — Pathfinding Algorithm

- **Spec IDs:** FR-202, NFR-201, NFR-204
- **Archivos:** `packages/routing-engine/**`
- **Tests:** TST-FR-202-001 (shortest path), TST-FR-202-002 (no route), TST-FR-202-003 (performance)
- **Done:** Dijkstra funcional, ruta óptima calculada en < 500ms

### T2.3 — Snap-to-Route

- **Spec IDs:** FR-203, NFR-203
- **Archivos:** `snapToRouteService.ts`, `useSnapToRoute.ts`
- **Tests:** TST-FR-203-001 (projection), TST-FR-203-002 (off-route detection)
- **Done:** Posición proyectada sobre ruta, alerta fuera de ruta funcional

### T2.4 — Turn-by-Turn Instructions

- **Spec IDs:** FR-204, NFR-202
- **Archivos:** `navigationService.ts`, `InstructionBanner.tsx`, `ArrivalModal.tsx`, `useNavigation.ts`, `navigationStore.ts`
- **Tests:** TST-FR-204-001 (instruction generation), TST-FR-204-002 (waypoint trigger), TST-FR-204-003 (arrival)
- **Done:** Instrucciones en español, banner visible, llegada detectada

### T2.5 — Transport Connections

- **Spec IDs:** FR-205
- **Archivos:** `schema.prisma` (actualizado), `transport.ts`, `seed.ts` (actualizado)
- **Tests:** TST-FR-205-001 (transport data), TST-FR-205-002 (API response)
- **Done:** Waypoints de transporte con líneas, visible en instrucciones y al tocar

### T2.6 — Destination Search

- **Spec IDs:** FR-206
- **Archivos:** `waypoints.ts` (endpoint), `SearchBar.tsx`, `SearchResults.tsx`, `searchService.ts`, `useSearch.ts`
- **Tests:** TST-FR-206-001 (search API), TST-FR-206-002 (UI results)
- **Done:** Búsqueda funcional con sugerencias, a11y completa

### T2.7 — Route Calculation API

- **Spec IDs:** FR-207, NFR-201
- **Archivos:** `calculate.ts`, `routingService.ts`, `navigation.ts`
- **Tests:** TST-FR-207-001 (valid route), TST-FR-207-002 (not found), TST-FR-207-003 (validation)
- **Done:** Endpoint POST funcional, validación Zod, respuesta con instrucciones

### T2.8 — Navigation Screen

- **Spec IDs:** FR-208, NFR-202
- **Archivos:** `NavigationScreen.tsx`, `NavigationControls.tsx`, `ProgressBar.tsx`, `OffRouteAlert.tsx`
- **Tests:** Manual (navegación completa en emulador)
- **Done:** Pantalla de navegación funcional con instrucciones, progreso y cancelación

---

## 9. Especificaciones de Tests

### 9.1 Unit Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-201-001 | GraphBuilder | buildGraph genera nodos y aristas desde segmentos | FR-201 |
| TST-FR-201-002 | GraphBuilder | calculateWeight aplica factores de elevación y riesgo | FR-201 |
| TST-FR-202-001 | Dijkstra | findShortestPath retorna ruta óptima entre dos nodos | FR-202 |
| TST-FR-202-002 | Dijkstra | findShortestPath retorna error para nodos desconectados | FR-202 |
| TST-FR-202-003 | Dijkstra | findShortestPath completa en < 500ms con 500 nodos | FR-202, NFR-201 |
| TST-FR-203-001 | SnapToRoute | projectToRoute retorna punto más cercano sobre segmento | FR-203 |
| TST-FR-203-002 | SnapToRoute | detectOffRoute retorna true cuando distancia > umbral | FR-203 |
| TST-FR-204-001 | NavigationService | generateInstructions crea instrucciones válidas en español | FR-204 |
| TST-FR-204-002 | NavigationService | shouldTriggerNext retorna true a ≤ 15m del waypoint | FR-204 |
| TST-FR-204-003 | NavigationService | detectArrival retorna true a ≤ 10m del destino final | FR-204 |
| TST-FR-206-001 | SearchService | searchWaypoints filtra por nombre parcial case-insensitive | FR-206 |

### 9.2 Integration Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-205-001 | API /routes/:id | GET route incluye transportType y lines en waypoints | FR-205 |
| TST-FR-205-002 | Database | Seed incluye datos de transporte en waypoints | FR-205 |
| TST-FR-206-002 | API /waypoints/search | GET search retorna resultados filtrados | FR-206 |
| TST-FR-207-001 | API /routes/calculate | POST con waypoints válidos retorna ruta con instrucciones | FR-207 |
| TST-FR-207-002 | API /routes/calculate | POST con waypoint inexistente retorna 404 | FR-207 |
| TST-FR-207-003 | API /routes/calculate | POST sin body retorna 400 con error de validación | FR-207 |

### 9.3 Manual Checklist

- [ ] Búsqueda de "Medicina" muestra la Facultad de Medicina como resultado
- [ ] Seleccionar destino y calcular ruta muestra la polyline en el mapa
- [ ] Banner de instrucciones visible durante la navegación
- [ ] Instrucciones cambian al acercarse al siguiente waypoint
- [ ] Alerta "Has llegado" al alcanzar el destino
- [ ] Alerta "Fuera de ruta" cuando GPS se aleja > 30m
- [ ] Cancelar navegación vuelve al mapa normal
- [ ] TalkBack lee correctamente las instrucciones y alertas
- [ ] Paradas de transporte muestran líneas al tocarlas

---

## 10. Datos de Prueba Adicionales

Para Fase 2 se necesitan **más rutas y waypoints** para probar el pathfinding con múltiples caminos. Se añadirán al seed:

| Ruta | Origen | Destino | Waypoints |
|------|--------|---------|-----------|
| test-route-1 (existente) | Medicina | Metro CU | 5 waypoints, 4 segments |
| test-route-2 (nueva) | Derecho | Metro CU | ~4 waypoints, 3 segments |
| test-route-3 (nueva) | Informática | Medicina | ~5 waypoints, 4 segments |

Los waypoints compartidos entre rutas (intersecciones, paradas) permiten al grafo tener múltiples caminos posibles.

---

## 11. Orden de Implementación Recomendado

```
T2.1 (Graph Model) → T2.2 (Pathfinding) → T2.5 (Transport) → T2.7 (API)
                                                                    ↓
T2.3 (Snap-to-Route) → T2.4 (Instructions) → T2.8 (Navigation Screen)
                                                                    ↑
                                          T2.6 (Search) ────────────┘
```

**Camino crítico:** T2.1 → T2.2 → T2.7 → T2.4 → T2.8

---

*Documento generado: 2026-03-18 | Basado en Plan_Desarrollo_GPS_Accesible.md (Fase 2) y SPEC-FASE-1.md*
