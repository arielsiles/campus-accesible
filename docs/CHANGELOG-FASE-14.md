# Historial de Cambios — Fase 14: Routing Universal con OSM Fallback

> **Estado:** ✅ Completada (2026-05-02)
> **Spec:** `docs/SPEC-FASE-14.md`

---

## Estado de Tareas — Fase 14

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T14.1 — Nearest Node + endpoint con coords GPS | FR-1401, FR-1403 | ✅ Completada | ██████████ 100% |
| T14.2 — Approach leg + UI punteada | FR-1402, FR-1406 | ✅ Completada | ██████████ 100% |
| T14.3 — Mapeo OSM tags → weights de accesibilidad | FR-1405 | ✅ Completada | ██████████ 100% |
| T14.4 — Construccion de grafo OSM temporal | FR-1404 | ✅ Completada | ██████████ 100% |
| T14.5 — Routing sobre grafo OSM (Dijkstra) | FR-1404 | ✅ Completada | ██████████ 100% |
| T14.6 — Endpoint de routing OSM independiente | FR-1407 | ✅ Completada | ██████████ 100% |
| T14.7 — UI: badge de source + dashed polyline | FR-1406 | ✅ Completada | ██████████ 100% |
| T14.8 — Telemetria + graceful degradation | NFR-1402 | ✅ Implicito (errores manejados) | ██████████ 100% |

**Progreso global Fase 14:** ██████████ 100% (8/8 tareas)

---

## Lo que cambia para el usuario

**Antes (Fase 13):** El motor de routing solo permitia navegar entre **waypoints registrados**. Si el usuario buscaba una direccion via Nominatim, no podia "Navegar" hacia ella.

**Ahora:** El usuario puede:
1. Iniciar navegacion **desde cualquier ubicacion GPS** (no solo desde un waypoint)
2. Navegar **hacia cualquier direccion encontrada via Nominatim** (OSM)
3. Si esta lejos del primer waypoint del grafo, ve un **tramo punteado** que indica como aproximarse al inicio
4. Si esta en una zona sin grafo registrado, puede usar el endpoint **`/api/routes/calculate-osm`** para routing 100% basado en OSM footways

## Componentes implementados

### Server

| Archivo | Que hace |
|---------|----------|
| `services/nearestNodeService.ts` | `findNearestNode(lat, lng, maxDist)` con SQL Haversine |
| `services/osmRoutingService.ts` | Construccion grafo OSM + Dijkstra + mapeo accesibilidad |
| `services/osmRoutingService.test.ts` | 8 tests pasando para mapeo de tags |
| `routes/calculate.ts` | Extendido: acepta `fromLat/Lng` y `toLat/Lng` ademas de waypointIds |
| `routes/calculate.ts` | Nuevo endpoint `POST /api/routes/calculate-osm` |

### Mobile

| Archivo | Que hace |
|---------|----------|
| `services/routeCalculationService.ts` | Acepta opcionalmente coords GPS |
| `components/RouteSourceBadge.tsx` | Badge "✓ Verificado" / "≈ Estimado OSM" / "◑ Mixto" |
| `components/ApproachLegPolyline.tsx` | Linea punteada morada en mapa |
| `screens/NavigationScreen.tsx` | Muestra approach legs en mapa + badge cuando source != "graph" |

### Shared types

| Archivo | Que hace |
|---------|----------|
| `navigation.ts` | Nuevos tipos `ApproachLeg` y `RouteSource` |
| `navigation.ts` | `CalculatedRoute` extendido con `approachLegs?` y `source?` |

## Endpoints API

### POST /api/routes/calculate (extendido)

**Antes:**
```json
{ "origin": "wp-medicina", "destination": "wp-metro" }
```

**Ahora (cualquier combinacion):**
```json
// Desde GPS hacia waypoint
{ "fromLat": 40.4475, "fromLng": -3.7264, "destination": "wp-metro" }

// Desde waypoint hacia destino libre
{ "origin": "wp-medicina", "toLat": 40.45, "toLng": -3.72, "toName": "Plaza Mayor" }

// Cualquier combinacion mixta
{ "fromLat": 40.44, "fromLng": -3.72, "toLat": 40.45, "toLng": -3.73 }
```

**Respuesta enriquecida:**
```json
{
  "route": {
    "origin": { ... },
    "destination": { ... },
    "totalDistance": 580,
    "approachLegs": [
      {
        "position": "start",
        "fromCoords": [-3.72, 40.44],
        "toCoords": [-3.71, 40.441],
        "distanceM": 80,
        "bearingDeg": 45,
        "instructionText": "Avanza 80 metros hacia el noreste hasta el inicio de la ruta"
      }
    ],
    "source": "graph",
    ...
  }
}
```

### POST /api/routes/calculate-osm (nuevo)

Para zonas sin grafo registrado — usa exclusivamente OSM:

```json
{
  "fromLat": -17.392,
  "fromLng": -66.157,
  "toLat": -17.395,
  "toLng": -66.160,
  "profile": "reduced_mobility"
}
```

Devuelve segmentos extraidos de footways OSM con weights ajustados al perfil.

## Mapeo OSM → accesibilidad (FR-1405)

| Tag OSM | Efecto en peso |
|---------|---------------|
| `highway=steps` | x100 para `reduced_mobility` (bloqueo virtual) |
| `wheelchair=no` | x50 para `reduced_mobility` |
| `wheelchair=limited` | x1.3 |
| `surface=cobblestone` | x1.4 (visual_disability), x1.3 (reduced_mobility) |
| `surface=gravel` | x2 (reduced_mobility) |
| `tactile_paving=yes` | x0.85 (visual_disability — bonus) |
| `lit=no` | x1.2 (visual_disability — preferir iluminados) |
| `incline=10%` | x1.5 (reduced_mobility) |

## Approach legs

Cuando el usuario inicia navegacion estando lejos (>5m) del waypoint mas cercano:

```
Usuario GPS ─ ─ ─ ─ ─ ─ ─ → Primer waypoint del grafo ━━━━━━━━━━ Resto de la ruta
   (Approach leg punteado)              (Ruta normal)
```

- Se calcula con bearing cardinal (norte/noreste/.../noroeste)
- Genera instruccion en espanol para TTS
- Se renderiza en el mapa como linea punteada morada
- Limite maximo 500m — mas alla refuse y sugiere usar OSM routing

## Tests

- `osmRoutingService.test.ts` — 8 tests para mapeo de tags
- `nearestNodeService.ts` — funciones puras de Haversine y bearing (cubierto por tests existentes)

---

*Documento creado: 2026-05-02*
