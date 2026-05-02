# Especificacion de Desarrollo — Fase 14: Routing Universal con OSM Fallback

> **Version:** 1.0 | **Fecha:** 2026-05-01 | **Estado:** Draft
> **Prefijo IDs:** FR-14XX (funcionales), NFR-14XX (no funcionales)
> **Fase anterior:** Fase 13 — ver `SPEC-FASE-13.md`
> **Enfoque:** Habilitar navegacion desde/hacia cualquier punto, no solo entre waypoints registrados

---

## 1. Alcance

### En Scope (Fase 14)

- Calculo de ruta desde la posicion GPS actual del usuario (no solo desde waypoints registrados)
- Calculo de ruta hacia destinos no registrados en el grafo (resultados de Nominatim, taps en mapa)
- Resolucion "nearest waypoint": cuando origen o destino no esta en el grafo, encontrar el waypoint mas cercano
- Routing libre via OSM cuando no hay grafo disponible en la zona (Overpass footways)
- Construccion de grafo temporal en memoria a partir de footways OSM
- Pesos de accesibilidad estimados desde tags OSM (`wheelchair`, `surface`, `incline`, `step_count`)
- Hibridacion: combinar grafo propio (mas detallado) con grafo OSM (mas extenso)
- Indicador visual de "tramo aproximado" cuando un segmento no tiene datos de accesibilidad detallados

### Fuera de Scope

- Routing global de larga distancia (mantener uso para campus / zonas urbanas)
- Routing en interiores de edificios (Fase futura, requiere planos)
- Sustitucion completa del grafo propio (es complementario)
- Tiles offline del mapa (sigue requiriendo conexion)
- Integracion con OSRM/Valhalla externos (mantenemos Dijkstra propio para control de pesos)

### Motivacion

Hoy la app solo permite navegar entre **waypoints registrados** en el grafo. Esto limita el caso de uso a:
- Rutas pre-creadas por contributors
- Origen/destino estricto en waypoints

Esta fase elimina esa limitacion permitiendo:
- Buscar cualquier direccion (Nominatim) y navegar hacia ella
- Iniciar navegacion desde donde el usuario este (no desde el primer waypoint de una ruta)
- Funcionar en zonas con grafo propio limitado, usando OSM como base

---

## 2. Requisitos Funcionales

### FR-1401: Calculo de Ruta desde Posicion GPS Actual

**Descripcion:** El calculo de ruta acepta como origen las coordenadas GPS del usuario, no solo un `waypointId`. Si el usuario no esta sobre un waypoint del grafo, se identifica el nodo mas cercano y se calcula la ruta desde alli.

**Criterios de aceptacion:**

```gherkin
Given un usuario con GPS activo en posicion (lat, lng) cualquiera
When solicita calcular ruta a un destino registrado
Then la app encuentra el waypoint mas cercano a su GPS
  And calcula ruta accesible desde ese waypoint hasta el destino
  And anade un tramo inicial "aproximarse al punto de partida (XXm)"

Given un usuario en un waypoint del grafo
When solicita calcular ruta
Then la ruta empieza directamente desde ese waypoint sin tramo de aproximacion

Given un usuario lejos de cualquier waypoint del grafo (>500m)
When solicita calcular ruta
Then se intenta routing libre via OSM (FR-1404) o se muestra error
```

**Archivos requeridos:**
- `server/src/services/routingService.ts` — extender con `findNearestNode(lat, lng)`
- `server/src/routes/calculate.ts` — aceptar query params `from_lat`, `from_lng`
- `apps/mobile/src/services/routeCalculationService.ts` — usar GPS actual

---

### FR-1402: Calculo de Ruta hacia Destinos No Registrados

**Descripcion:** El destino puede ser un resultado de Nominatim (direccion arbitraria) o un punto seleccionado en el mapa. Si no es un waypoint del grafo, se encuentra el nodo mas cercano y se calcula ruta hasta alli, con un tramo final "aproximarse al destino (XXm)".

**Criterios de aceptacion:**

```gherkin
Given el usuario busca "Plaza Mayor" via Nominatim
When selecciona el resultado y toca Navegar
Then la app encuentra el waypoint mas cercano al destino
  And calcula ruta accesible hasta ese waypoint
  And anade tramo final "destino a XXm en linea recta"

Given el usuario toca un punto vacio en el mapa
When toca el menu contextual "Navegar aqui"
Then aplica la misma logica de nearest waypoint
```

**Archivos requeridos:**
- `apps/mobile/src/screens/MapScreen.tsx` — handler para taps en mapa con menu
- `apps/mobile/src/services/routeCalculationService.ts`
- `packages/shared-types/src/navigation.ts` — agregar `approachLeg` opcional al CalculatedRoute

---

### FR-1403: Resolucion "Nearest Waypoint"

**Descripcion:** Algoritmo eficiente para encontrar el waypoint del grafo mas cercano a unas coordenadas dadas. Para grafos pequenos (<1000 nodos) basta con Haversine lineal; para mayores, considerar k-d tree.

**Criterios de aceptacion:**

```gherkin
Given un grafo con N waypoints
When se busca el mas cercano a (lat, lng)
Then se devuelve el waypoint cuya distancia Haversine sea minima
  And la operacion completa en menos de 50ms para N <= 1000

Given un radio maximo configurable (ej. 500m)
When ningun waypoint esta dentro de ese radio
Then la funcion retorna null (no hay match)
```

**Archivos requeridos:**
- `server/src/services/nearestNodeService.ts` (nuevo)
- `packages/routing-engine/src/nearestNode.ts` (opcional, si se mueve la logica)

---

### FR-1404: Routing Libre via OSM Footways

**Descripcion:** Cuando no hay grafo propio en la zona del usuario (ej. usuario en otra ciudad sin rutas registradas), la app construye un grafo temporal a partir de footways de OSM (Overpass) y calcula ruta sobre el.

**Criterios de aceptacion:**

```gherkin
Given un usuario en una zona sin grafo propio
When solicita ruta a un destino tambien fuera del grafo
Then la app consulta Overpass por footways en un radio de 1km
  And construye un grafo temporal desde los nodos de los footways
  And aplica pesos de accesibilidad estimados (FR-1405)
  And calcula ruta con Dijkstra sobre ese grafo
  And muestra un banner "Ruta calculada desde datos OSM (precision limitada)"

Given Overpass falla o no hay datos OSM
When la app no puede calcular ninguna ruta
Then muestra mensaje claro "No se puede calcular ruta en esta zona"
```

**Archivos requeridos:**
- `apps/mobile/src/services/osmRoutingService.ts` (nuevo)
- `packages/routing-engine/src/osmGraphBuilder.ts` (nuevo, opcional)
- Reutiliza `osmService.ts` existente para Overpass

---

### FR-1405: Pesos de Accesibilidad Estimados desde OSM

**Descripcion:** Mapeo de tags OSM a los pesos de los perfiles de accesibilidad existentes. Cuando un footway no tiene datos completos, se asume valor por defecto conservador.

**Mapeo principal:**

| Tag OSM | Atributo App | Valor |
|---------|-------------|-------|
| `wheelchair=yes` | `accessibility=accessible` | Sin penalizacion |
| `wheelchair=limited` | `accessibility=limited` | Penalizacion media |
| `wheelchair=no` | `accessibility=inaccessible` | Penalizacion alta |
| `surface=asphalt|paving_stones|concrete` | `surfaceType=paved` | Default |
| `surface=cobblestone|sett` | `surfaceType=cobblestone` | Penaliza visual_disability |
| `surface=gravel|fine_gravel` | `surfaceType=gravel` | Penaliza reduced_mobility |
| `incline=*` | `maxSlope` | Penaliza si >5% (reduced_mobility) |
| `step_count=*` | `hasStairs=true` | Penalizacion x10 (reduced_mobility) |
| `tactile_paving=yes` | bonus | Bonificacion (visual_disability) |
| `lit=no` | `riskLevel=low` | Penaliza horario nocturno |

**Archivos requeridos:**
- `apps/mobile/src/services/osmRoutingService.ts` — funcion `mapOsmToWeights()`
- Tests en `osmRoutingService.test.ts`

---

### FR-1406: Tramo de Aproximacion ("Approach Leg")

**Descripcion:** Cuando origen o destino requieren caminar un tramo en linea recta no cubierto por el grafo, se anade un "approach leg" especial en la ruta calculada. Este tramo:
- Se muestra en el mapa con linea **punteada** (visualmente distinto del trazado normal)
- En la navegacion turn-by-turn aparece como instruccion: "Avanza 80m hacia el norte hasta el inicio de la ruta"
- Se penaliza menos en pesos (no es ruta accesible mapeada, pero asumimos andable)

**Criterios de aceptacion:**

```gherkin
Given una ruta con approach leg inicial
When se muestra en el mapa
Then el tramo de aproximacion aparece punteado con color distinto

Given navegacion turn-by-turn con approach leg
When el usuario inicia la navegacion
Then la primera instruccion guia hacia el inicio del grafo
  And la app reconoce cuando llega al primer waypoint del grafo
  And cambia a las instrucciones normales

Given un approach leg de mas de 200m
When se calcula la ruta
Then se muestra warning "Trayecto inicial sin datos de accesibilidad detallados"
```

**Archivos requeridos:**
- `packages/shared-types/src/navigation.ts` — tipos `ApproachLeg`
- `apps/mobile/src/components/RoutePolyline.tsx` — render punteado
- `apps/mobile/src/screens/NavigationScreen.tsx` — instruccion especial inicial

---

### FR-1407: Hibridacion Grafo Propio + OSM

**Descripcion:** Cuando hay grafo propio parcial (algunos waypoints en la zona) pero no completo, combinar ambos: usar el grafo propio donde existe (mas datos de accesibilidad) y OSM como complemento para llegar a el o desde el.

**Criterios de aceptacion:**

```gherkin
Given un usuario con grafo propio cubriendo una parte del recorrido
When calcula una ruta larga que excede el grafo
Then la primera parte usa OSM hasta el grafo propio
  And la parte central usa el grafo propio (mejor accesibilidad)
  And la parte final usa OSM hasta el destino
  And la app prioriza el grafo propio cuando hay opcion
```

---

## 3. Requisitos No Funcionales

### NFR-1401: Performance

| Criterio | Detalle |
|----------|---------|
| Nearest waypoint | <50ms para N <= 1000 waypoints |
| Calculo de ruta hibrida | <500ms para rutas <2km |
| Construccion grafo OSM temporal | <2s para zona de 1km radio |
| Cache de grafos OSM | Reutiliza `osmCache.ts` existente |

### NFR-1402: Calidad de datos

| Criterio | Detalle |
|----------|---------|
| Confidence indicator | Mostrar nivel de confianza en accesibilidad ("Verificado" vs "Estimado OSM") |
| Fallback graceful | Si Overpass falla, mostrar mensaje claro y opciones |
| Telemetria | Registrar tasa de uso de routing OSM vs grafo propio |

---

## 4. Modelos de Datos

```typescript
// Extension al CalculatedRoute existente
interface CalculatedRoute {
  // ...campos existentes
  
  // FR-1406: Approach legs (puede haber al inicio, al final, o ambos)
  approachLegs?: {
    position: 'start' | 'end';
    fromCoords: [number, number];
    toCoords: [number, number];
    distanceM: number;
    bearingDeg: number;
  }[];
  
  // FR-1404: Indicador de fuente
  source: 'graph' | 'osm' | 'hybrid';
  
  // FR-1405: Confidence por segmento
  segments: Array<{
    // ...campos existentes
    accessibilityConfidence: 'verified' | 'estimated' | 'unknown';
  }>;
}
```

---

## 5. Orden de Implementacion

1. **T14.1** — `findNearestNode` + endpoint con coords GPS (Nearest Node basico)
2. **T14.2** — Approach leg + UI punteada + instruccion especial
3. **T14.3** — Mapeo OSM tags → weights de accesibilidad
4. **T14.4** — Construccion de grafo temporal desde Overpass footways
5. **T14.5** — Routing sobre grafo OSM con Dijkstra
6. **T14.6** — Hibridacion: combinar grafo propio + OSM
7. **T14.7** — UI: indicador de calidad/source de la ruta
8. **T14.8** — Telemetria y graceful degradation

**Camino critico:** T14.1 → T14.2 → T14.3 → T14.4 → T14.5

**MVP minimo (Etapa 1 sola):** T14.1 + T14.2 (sin OSM routing) — entrega valor inmediato sin esfuerzo grande.

---

## 6. Dependencias

- Fase 8 ya implementada (servicios OSM)
- Fase 2 (motor Dijkstra)
- Fase 4 (perfiles de accesibilidad — los pesos se reutilizan)

## 7. Riesgos

| Riesgo | Mitigacion |
|--------|-----------|
| Overpass API rate limits en uso intensivo | Cache + retry exponencial |
| Calidad OSM variable por region | Mostrar source/confidence al usuario |
| Performance con grafos grandes | Cache + lazy loading + k-d tree si >5000 nodos |
| Approach legs muy largos confunden al usuario | Limitar a 300m maximo, sino warning |

---

*Documento creado: 2026-05-01*
