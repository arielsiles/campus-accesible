# Historial de Cambios — Fase 2: Motor de Navegación y Routing

> Registro cronológico de implementación y cambios durante la Fase 2 del proyecto **Campus GPS Accesible**.
> **Estado:** ✅ Completada
> **Spec:** `docs/SPEC-FASE-2.md`

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorías:** `Implementación`, `Fix`, `Configuración`, `Refactor`
- **Progreso:** Barras ████░░░░░░ con porcentaje

---

## Estado de Tareas — Fase 2

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T2.1 — Route Graph Model | FR-201 | ✅ Completada | ██████████ 100% |
| T2.2 — Pathfinding Algorithm | FR-202 | ✅ Completada | ██████████ 100% |
| T2.3 — Snap-to-Route | FR-203 | ✅ Completada | ██████████ 100% |
| T2.4 — Turn-by-Turn Instructions | FR-204 | ✅ Completada | ██████████ 100% |
| T2.5 — Transport Connections | FR-205 | ✅ Completada | ██████████ 100% |
| T2.6 — Destination Search | FR-206 | ✅ Completada | ██████████ 100% |
| T2.7 — Route Calculation API | FR-207 | ✅ Completada | ██████████ 100% |
| T2.8 — Navigation Screen | FR-208 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 2:** ██████████ 100% (8/8 tareas) ✅

---

## [2026-03-18] — Implementación del Motor de Navegación (T2.1–T2.7)

### T2.1 — Route Graph Model `Implementación`

- **Commit:** `656da25`
- **Spec ID:** FR-201
- **Archivos creados/modificados:**
  - `server/prisma/schema.prisma` — Modelo `GraphEdge`, enum `TransportType`, campos `transportType`/`transportLines` en `Waypoint`
  - `packages/shared-types/src/graph.ts` — Tipos `GraphNode`, `GraphEdgeSummary`, `GraphData`, `WeightFactors`
  - `packages/shared-types/src/transport.ts` — Enum `TransportType`, interfaz `TransportInfo`
  - `packages/shared-types/src/navigation.ts` — Tipos `CalculatedRoute`, `NavigationInstruction`, `WaypointSummary`, `RouteCalculationRequest/Response`, `SearchResult`
  - `packages/shared-types/src/index.ts` — Re-exports de todos los tipos nuevos
  - `server/src/services/graphBuilder.ts` — `buildGraph()`, `calculateWeight()`, `haversineDistance()`
  - `server/src/services/graphBuilder.test.ts` — 9 tests
  - `server/prisma/seed.ts` — 3 rutas de prueba (14 nodos, 22 aristas)
  - `server/prisma/migrations/20260318202736_add_graph_edges_and_transport/` — Migración
- **Tests:** 9 (haversine distance, weight calculation con elevation/risk)
- **Datos de prueba:**
  - Ruta 1: Medicina → Metro CU (5 waypoints, 4 segments) — existente de Fase 1
  - Ruta 2: Derecho → Metro CU (4 waypoints, 3 segments) — nueva
  - Ruta 3: Informática → Medicina (5 waypoints, 4 segments) — nueva
  - Grafo resultante: 14 nodos, 22 aristas bidireccionales

### T2.2 — Pathfinding Algorithm `Implementación`

- **Commit:** `6f299d5`
- **Spec ID:** FR-202, NFR-201, NFR-204
- **Archivos creados:**
  - `packages/routing-engine/package.json` — Nuevo paquete `@campus-gps/routing-engine`
  - `packages/routing-engine/tsconfig.json`
  - `packages/routing-engine/src/dijkstra.ts` — Algoritmo Dijkstra con pesos de accesibilidad
  - `packages/routing-engine/src/types.ts` — `GraphEdgeInput`, `GraphNodeInput`, `PathResult`
  - `packages/routing-engine/src/index.ts` — Exports públicos
  - `packages/routing-engine/src/dijkstra.test.ts` — 9 tests
- **Tests:** 9 (ruta óptima, destino inalcanzable, bidireccional, performance 500 nodos < 500ms)
- **Decisión técnica:** Dijkstra sobre A* — campus es grafo pequeño (~500 nodos máx), no justifica heurística. Priority queue como array ordenado suficiente para escala campus.

### T2.5 — Transport Connections `Implementación`

- **Commit:** `aa359b7`
- **Spec ID:** FR-205
- **Archivos modificados:**
  - `server/src/routes/routes.ts` — Incluir `transportType` y `transportLines` en propiedades GeoJSON de waypoints
  - `server/src/routes/routes.test.ts` — 1 test de integración
- **Tests:** 1 (verifica metro stop incluye línea 6 en response)
- **Nota:** Schema y seed ya implementados en T2.1 (parada bus: líneas G,U / Metro CU: línea 6)

### T2.7 — Route Calculation API `Implementación`

- **Commit:** `1648e71`
- **Spec ID:** FR-207, NFR-201
- **Archivos creados/modificados:**
  - `server/src/routes/calculate.ts` — Endpoint `POST /api/routes/calculate` con validación Zod
  - `server/src/services/routingService.ts` — Orquestación: lookup waypoints → load graph → Dijkstra → generar instrucciones → GeoJSON
  - `server/src/app.ts` — Registro de ruta `calculateRoutes`
  - `server/package.json` — Dependencia `@campus-gps/routing-engine`
  - `server/src/routes/calculate.test.ts` — 4 tests
- **Tests:** 4 (ruta válida con instrucciones, waypoint no encontrado 404, body inválido 400, mismo origen/destino 400)
- **Funcionalidades:**
  - Generación de instrucciones turn-by-turn con detección de giros por bearing
  - Información de transporte incluida en instrucciones (líneas bus/metro)
  - Tiempo estimado basado en 4 km/h
  - Error codes: `WAYPOINT_NOT_FOUND`, `SAME_ORIGIN_DESTINATION`, `NO_ROUTE_FOUND`, `VALIDATION_ERROR`

### T2.6 — Destination Search `Implementación`

- **Commit:** `682794c`
- **Spec ID:** FR-206
- **Archivos creados/modificados:**
  - `server/src/routes/waypoints.ts` — Endpoint `GET /api/waypoints/search?q=`
  - `server/src/routes/waypoints.test.ts` — 6 tests
  - `server/src/app.ts` — Registro de ruta `waypointRoutes`
  - `apps/mobile/src/services/searchService.ts` — Cliente de búsqueda
  - `apps/mobile/src/services/apiClient.ts` — Añadido `apiPost()` helper
  - `apps/mobile/src/hooks/useSearch.ts` — Hook con debounce 300ms
  - `apps/mobile/src/components/SearchBar.tsx` — Input con a11y (label "Buscar destino", min 48dp)
  - `apps/mobile/src/components/SearchResults.tsx` — Dropdown con etiquetas de tipo en español
  - `apps/mobile/src/screens/MapScreen.tsx` — Integración de búsqueda con centrado en mapa
- **Tests:** 6 (búsqueda válida, case-insensitive, sin resultados, validación < 2 chars, max 10, transport info)
- **A11y:** Labels en español, `accessibilityRole="search"`, cada resultado anuncia "{nombre}, {tipo}"

### T2.3 — Snap-to-Route `Implementación`

- **Commit:** `d31d53c`
- **Spec ID:** FR-203, NFR-203
- **Archivos creados:**
  - `apps/mobile/src/services/snapToRouteService.ts` — `snapToRoute()`, `projectPointToSegment()`, `haversineDistance()`
  - `apps/mobile/src/services/snapToRouteService.test.ts` — 12 tests
  - `apps/mobile/src/hooks/useSnapToRoute.ts` — Hook reactivo con extracción de segmentos GeoJSON
- **Tests:** 12 (proyección, clamping inicio/fin, segmento degenerado, on-route, off-route, multi-segmento, threshold custom)
- **Parámetros NFR-203:**
  - Umbral off-route: 30m (configurable)
  - Retorna: `snappedPosition`, `isOnRoute`, `distanceToRoute`, `segmentIndex`, `progressAlongSegment`

### T2.4 — Turn-by-Turn Instructions `Implementación`

- **Commit:** `7fe9a78`
- **Spec ID:** FR-204, NFR-202
- **Archivos creados:**
  - `apps/mobile/src/services/navigationService.ts` — `shouldTriggerNext()` (15m), `detectArrival()` (10m), `getCurrentInstructionIndex()`, `calculateProgress()`
  - `apps/mobile/src/services/navigationService.test.ts` — 12 tests
  - `apps/mobile/src/store/navigationStore.ts` — Zustand store con estado de navegación
  - `apps/mobile/src/hooks/useNavigation.ts` — Hook que orquesta GPS → instrucciones → progreso → llegada
  - `apps/mobile/src/components/InstructionBanner.tsx` — Banner azul con icono, descripción, distancia
  - `apps/mobile/src/components/ArrivalModal.tsx` — Modal "¡Has llegado!" con botón aceptar
- **Tests:** 12 (trigger at 15m, arrival at 10m, instruction advance, progress 0-100%, no backward)
- **A11y:** `accessibilityRole="alert"`, `accessibilityLiveRegion="assertive"` en banner, labels en español
- **Parámetros NFR-203:**
  - Trigger instrucción: ≤ 15m del waypoint
  - Detección llegada: ≤ 10m del destino final

### T2.8 — Navigation Screen `Implementación`

- **Commit:** `3e3771e`
- **Spec ID:** FR-208, NFR-202
- **Archivos creados/modificados:**
  - `apps/mobile/src/screens/NavigationScreen.tsx` — Pantalla de navegación activa: mapa + ruta + instrucciones + progreso + alertas
  - `apps/mobile/src/components/NavigationControls.tsx` — Botón "Cancelar" con diálogo de confirmación
  - `apps/mobile/src/components/ProgressBar.tsx` — Barra de progreso con `accessibilityRole="progressbar"`
  - `apps/mobile/src/components/OffRouteAlert.tsx` — Alerta "Fuera de ruta" con `accessibilityLiveRegion="assertive"`
  - `apps/mobile/src/components/GpsLostAlert.tsx` — Alerta "Señal GPS perdida" tras >10 segundos sin señal
  - `apps/mobile/src/services/routeCalculationService.ts` — Cliente para `POST /api/routes/calculate`
  - `apps/mobile/src/screens/MapScreen.tsx` — Tarjeta de destino con botón "Navegar", transición a NavigationScreen
- **Tests:** Manual (navegación completa en emulador)
- **Funcionalidades:**
  - Mapa con ruta resaltada, waypoints y posición del usuario
  - Banner de instrucción actual (InstructionBanner) en overlay superior
  - Barra de progreso 0-100% en overlay inferior
  - Alerta off-route cuando GPS > 30m de la ruta (vía snap-to-route)
  - Alerta GPS perdida cuando sin señal > 10 segundos
  - Diálogo de confirmación al cancelar navegación
  - Modal de llegada "¡Has llegado!" al alcanzar destino
  - Flujo completo: buscar → seleccionar destino → calcular ruta → navegar
- **A11y:** Labels en español, roles alert/progressbar/button, assertive live regions, touch targets ≥ 48dp

### Fix — Cross-Route Pathfinding `Fix`

- **Commit:** `6f3583c`
- **Spec IDs:** FR-201, FR-207
- **Archivos modificados:**
  - `server/src/services/graphBuilder.ts` — Aristas puente de coste 0 entre waypoints co-localizados de distintas rutas
  - `server/src/services/routingService.ts` — Filtro de waypoints duplicados consecutivos en instrucciones
- **Problema:** El grafo solo conectaba waypoints dentro de cada ruta. Waypoints co-localizados (mismo punto físico, IDs distintos como `wp-odontologia` y `wp-odontologia-r3`) no tenían aristas entre sí, haciendo imposible el pathfinding entre rutas.
- **Solución:**
  - `buildGraph()` agrupa waypoints por coordenadas (precisión 4 decimales ≈ 1m) y crea aristas bidireccionales de peso 0 entre co-localizados
  - `calculateRoute()` filtra waypoints consecutivos con mismas coordenadas antes de generar instrucciones, evitando "Sal de X y camina hacia X"
- **Resultado:** Grafo pasa de 22 a 30 aristas. Navegación inter-ruta funcional.

---

## Resumen de Tests — Fase 2

| Paquete | Archivo | Tests | Validates |
|---------|---------|-------|-----------|
| server | `graphBuilder.test.ts` | 9 | FR-201 |
| routing-engine | `dijkstra.test.ts` | 9 | FR-202, NFR-201, NFR-204 |
| server | `routes.test.ts` | 4 | FR-007, FR-205 |
| server | `calculate.test.ts` | 4 | FR-207 |
| server | `waypoints.test.ts` | 6 | FR-206 |
| mobile | `snapToRouteService.test.ts` | 12 | FR-203, NFR-203 |
| mobile | `navigationService.test.ts` | 12 | FR-204 |

**Total tests nuevos Fase 2:** 53 (+ 3 pre-existentes Fase 1 = **56 tests en total**)

---

## Dependencias de Fase 1

| Componente | Commit | Estado |
|-----------|--------|--------|
| Monorepo Turborepo + pnpm | `68132ee` | ✅ |
| MapLibre GL + OpenFreeMap | `8d96da6` | ✅ |
| Ruta estática con waypoints | `856d9e5` | ✅ |
| GPS + permisos + UserLocation | `e7c50ae` | ✅ |
| Enums alineados + CI/CD | `e5238bf` | ✅ |
| Metro ProtocolException fix | `6c95cba` | ✅ |

---

## Paquetes Nuevos

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@campus-gps/routing-engine` | 0.1.0 | Dijkstra pathfinding, tipos de grafo |

---

*Registro actualizado: 2026-03-18 — Fase 2 completada, 12 commits, 65 tests passing*
