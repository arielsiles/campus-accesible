# Historial de Cambios — Fase 8: Integracion Activa con OpenStreetMap

> Registro cronologico de implementacion y cambios durante la Fase 8 del proyecto **Campus GPS Accesible**.
> **Estado:** ✅ Completada
> **Spec:** `docs/SPEC-FASE-8.md`

---

## Estado de Tareas — Fase 8

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T8.1 — OSM Service + Cache | FR-801, FR-805 | ✅ Completada | ██████████ 100% |
| T8.2 — Nominatim Geocoding | FR-802 | ✅ Completada | ██████████ 100% |
| T8.3 — Auto-Sugerencia Waypoints | FR-803 | ✅ Completada | ██████████ 100% |
| T8.4 — Path Matching con OSM | FR-804 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 8:** ██████████ 100% (4/4 tareas)

---

## Registro de Cambios

### 2026-04-05 — T8.1: OSM Service + Cache [FR-801, FR-805]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/mobile/src/services/osmService.ts** — Overpass API:
   - `fetchOsmFeatures()` — consulta edificios, POIs, paradas en radio (500m)
   - `fetchOsmFootways()` — consulta caminos peatonales (footway, path, pedestrian)
   - `mapToWaypointType()` — mapeo OSM tags → app WaypointType
   - `mapOsmSurface()` — mapeo surface tags → app surfaceType
   - Rate limiting via User-Agent header

2. **apps/mobile/src/services/osmCache.ts** — Cache local:
   - Cache por geohash (precision 4) con TTL 24h
   - LRU eviction al superar 200 entries (~50MB max)
   - Separado por tipo (features vs footways)
   - 6 tests pasando

---

### 2026-04-05 — T8.2: Nominatim Geocoding [FR-802]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/mobile/src/services/nominatimService.ts** — Geocodificacion:
   - `searchPlaces()` — busca lugares por nombre (max 5 resultados, bias Espana)
   - `reverseGeocode()` — obtiene nombre desde coordenadas
   - Rate limiting: 1 req/segundo (politica Nominatim)
   - Viewbox opcional para sesgo geografico
   - 5 tests pasando (con mock de fetch)

2. **apps/mobile/src/hooks/useSearch.ts** — Integrado:
   - Busca primero en waypoints locales (API del servidor)
   - Si no hay resultados, busca en Nominatim como fallback
   - Resultados OSM mapeados a SearchResult con waypointId sintetico

---

### 2026-04-05 — T8.3: Auto-Sugerencia de Waypoints [FR-803]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/mobile/src/services/waypointSuggestionService.ts** — Logica:
   - `checkForSuggestion()` — detecta POIs cercanos (< 30m) de OSM
   - Evita re-sugerir POIs ya anadidos o descartados (cooldown 60s)
   - Cache de features OSM con refetch al moverse > 200m
   - `dismissSuggestion()` / `resetSuggestions()` — gestion de estado
   - 5 tests pasando

2. **apps/mobile/src/components/WaypointSuggestion.tsx** — UI:
   - Banner azul con nombre del POI, tipo, distancia
   - Botones "Agregar" y "Descartar"
   - accessibilityRole="alert", liveRegion="polite"

3. **apps/mobile/src/screens/RouteRecorderScreen.tsx** — Integrado:
   - Check cada 5s durante grabacion
   - Muestra banner sobre los controles de grabacion
   - Aceptar crea waypoint con datos de OSM, descartar oculta

---

### 2026-04-05 — T8.4: Path Matching con OSM [FR-804]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/mobile/src/services/osmPathMatchingService.ts** — Matching:
   - `matchSegmentToOsmPath()` — encuentra footway OSM mas cercano al segmento
   - Umbral: distancia promedio < 15m para match positivo
   - Extrae porcion relevante del footway entre inicio/fin del segmento
   - Mapea surface tag de OSM a surfaceType de la app
   - 4 tests pasando

---

## Mapa de Arquitectura — Fase 8

```
apps/mobile/
  src/services/osmService.ts              [FR-801] Overpass API + mapeos
  src/services/osmCache.ts                [FR-805] Cache geohash + LRU
  src/services/nominatimService.ts        [FR-802] Geocodificacion
  src/services/waypointSuggestionService.ts [FR-803] Auto-sugerencia
  src/services/osmPathMatchingService.ts  [FR-804] Snap a footways OSM
  src/hooks/useSearch.ts                  [FR-802] +Nominatim fallback
  src/screens/RouteRecorderScreen.tsx     [FR-803] +Sugerencias OSM
  src/components/WaypointSuggestion.tsx   [FR-803] Banner de sugerencia
```
