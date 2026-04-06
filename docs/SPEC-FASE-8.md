# Especificacion de Desarrollo — Fase 8: Integracion Activa con OpenStreetMap

> **Version:** 1.0 | **Fecha:** 2026-04-05 | **Estado:** Draft
> **Prefijo IDs:** FR-8XX (funcionales), NFR-8XX (no funcionales)
> **Fase anterior:** Fase 7 — ver `SPEC-FASE-7.md`

---

## 1. Alcance

### En Scope (Fase 8)

- Consulta de datos OSM via Overpass API: edificios, caminos peatonales, paradas de transporte
- Geocodificacion con Nominatim: buscar lugares por nombre y obtener coordenadas
- Auto-sugerencia de waypoints al grabar rutas: la app propone puntos cercanos de OSM
- Pre-poblado de segmentos usando caminos peatonales de OSM (highway=footway/path)
- Enriquecimiento de POIs con metadatos de OSM (horarios, tipo, servicios)
- Cache local de datos OSM por zona para funcionamiento offline

### Fuera de Scope

- Edicion de datos en OpenStreetMap (contribucion upstream)
- Routing via OSRM/Valhalla (se mantiene Dijkstra propio por pesos de accesibilidad)
- Tiles de mapa offline (ya se usa OpenFreeMap online)

---

## 2. Requisitos Funcionales

### FR-801: Consulta de Datos OSM via Overpass API

**Descripcion:** Servicio que consulta la Overpass API para obtener edificios, caminos peatonales, y paradas de transporte en un area definida por bounding box. Los resultados se transforman a los tipos de la app (WaypointType, etc.).

**Criterios de aceptacion:**

```gherkin
Given unas coordenadas y un radio (ej: 500m)
When se consulta Overpass API
Then se obtienen edificios (amenity, building), caminos (highway=footway|path), y paradas (public_transport=stop_position)

Given los datos de Overpass
When se transforman a formato de la app
Then cada edificio se mapea a waypointType "building", cada parada a "transport_stop", cada cruce a "intersection"

Given un error de red al consultar Overpass
When falla la peticion
Then la app funciona sin sugerencias OSM (degradacion graceful)

Given datos OSM cacheados para una zona
When el usuario vuelve a la misma zona
Then se usan los datos cacheados sin nueva consulta (TTL: 24h)
```

**Archivos requeridos:**
- `apps/mobile/src/services/osmService.ts` — consulta y transformacion
- `apps/mobile/src/services/osmService.test.ts`
- `apps/mobile/src/services/osmCache.ts` — cache por zona

---

### FR-802: Geocodificacion con Nominatim

**Descripcion:** Busqueda de lugares por nombre usando la API de Nominatim (OpenStreetMap). Permite buscar "Parque del Retiro" y centrar el mapa alli, o buscar "Farmacia" y ver farmacias cercanas.

**Criterios de aceptacion:**

```gherkin
Given un texto de busqueda (ej: "Parque del Retiro")
When se consulta Nominatim
Then se obtienen resultados con nombre, coordenadas, tipo, y bounding box

Given los resultados de Nominatim
When el usuario selecciona uno
Then el mapa se centra en esas coordenadas

Given la barra de busqueda existente
When el usuario escribe texto
Then se busca primero en waypoints locales, luego en Nominatim si no hay resultados

Given un error de red con Nominatim
When falla la peticion
Then se usa solo la busqueda local de waypoints
```

**Archivos requeridos:**
- `apps/mobile/src/services/nominatimService.ts`
- `apps/mobile/src/services/nominatimService.test.ts`
- Modificar `apps/mobile/src/hooks/useSearch.ts` — integrar Nominatim como fallback

---

### FR-803: Auto-Sugerencia de Waypoints desde OSM

**Descripcion:** Al grabar una ruta (Fase 7), cuando el usuario se acerca a un edificio o punto de interes registrado en OSM, la app sugiere automaticamente crear un waypoint ahi con el nombre y tipo de OSM.

**Criterios de aceptacion:**

```gherkin
Given la grabacion de ruta activa
When el usuario se acerca a < 30m de un edificio/POI de OSM
Then aparece una sugerencia: "Facultad de Derecho detectada. ¿Agregar como punto?"

Given la sugerencia de waypoint
When el usuario acepta
Then se crea un waypoint con nombre y tipo de OSM precargados

Given la sugerencia
When el usuario la descarta
Then no se anade y no se vuelve a sugerir para ese POI en la misma sesion

Given una zona sin datos OSM (rural, sin cobertura)
When el usuario graba
Then no se muestran sugerencias y la grabacion funciona normalmente
```

**Archivos requeridos:**
- `apps/mobile/src/services/waypointSuggestionService.ts`
- `apps/mobile/src/services/waypointSuggestionService.test.ts`
- `apps/mobile/src/components/WaypointSuggestion.tsx` — componente de sugerencia

---

### FR-804: Pre-Poblado de Segmentos con Caminos OSM

**Descripcion:** Al crear una ruta, la app puede consultar los caminos peatonales de OSM (highway=footway, highway=path) en la zona y pre-trazar segmentos siguiendo esos caminos, en lugar de usar solo el track GPS crudo.

**Criterios de aceptacion:**

```gherkin
Given el track GPS grabado entre dos waypoints
When hay un camino peatonal de OSM cercano (< 15m)
Then la app sugiere "Ajustar segmento al camino oficial?"

Given el usuario acepta el ajuste
When se aplica
Then las coordenadas del segmento se reemplazan por las del camino OSM

Given el usuario rechaza el ajuste
When continua
Then se mantiene el track GPS original

Given datos de superficie en OSM (surface=asphalt, surface=gravel)
When se pre-puebla un segmento
Then el surfaceType se mapea automaticamente (asphalt→paved, gravel→gravel)
```

**Archivos requeridos:**
- `apps/mobile/src/services/osmPathMatchingService.ts`
- `apps/mobile/src/services/osmPathMatchingService.test.ts`

---

### FR-805: Cache Offline de Datos OSM

**Descripcion:** Los datos OSM consultados se almacenan localmente por zona geohash con TTL de 24h. Permite funcionamiento en areas con mala conectividad.

**Criterios de aceptacion:**

```gherkin
Given datos OSM consultados para una zona
When se almacenan en cache
Then se indexan por geohash de precision 6 (~1.2km x 0.6km)

Given cache existente para una zona
When el TTL no ha expirado (< 24h)
Then se usan datos cacheados sin consulta de red

Given cache con TTL expirado
When el usuario entra en la zona
Then se intenta refrescar; si falla la red, se usan datos viejos

Given el almacenamiento del dispositivo
When el cache supera 50MB
Then se eliminan las zonas mas antiguas (LRU)
```

**Archivos requeridos:**
- `apps/mobile/src/services/osmCache.ts`
- `apps/mobile/src/services/osmCache.test.ts`

---

## 3. Requisitos No Funcionales

### NFR-801: Rendimiento OSM

| Metrica | Criterio |
|---------|----------|
| Consulta Overpass | < 3 segundos para area de 500m |
| Consulta Nominatim | < 1 segundo por busqueda |
| Transformacion de datos | < 200ms para 100 features |
| Cache hit ratio | >= 80% en uso normal |
| Tamano cache maximo | 50MB |

### NFR-802: Respeto a OSM

| Criterio | Detalle |
|----------|---------|
| Rate limiting | Max 1 request/segundo a Overpass, 1/segundo a Nominatim |
| User-Agent | Incluir nombre de app y contacto en User-Agent header |
| Atribucion | Credito a OpenStreetMap visible en la app (ya existente via MapLibre) |
| Cache | Cachear agresivamente para reducir carga en servidores OSM |

---

## 4. Mapeo de Datos OSM → App

### Waypoint Types

| OSM Tag | → WaypointType | Ejemplo |
|---------|----------------|---------|
| `amenity=university` | building | Facultad |
| `building=yes/university` | building | Edificio |
| `public_transport=stop_position` | transport_stop | Parada |
| `highway=crossing` | intersection | Paso peatonal |
| `tourism=information` | information_point | Punto info |
| `amenity=bench` | rest_area | Banco |
| `leisure=park` + entrance | entrance | Entrada parque |
| `barrier=*` | hazard | Barrera |

### Surface Types

| OSM `surface=` | → surfaceType |
|----------------|---------------|
| `asphalt`, `concrete` | paved |
| `sett`, `cobblestone` | cobblestone |
| `gravel`, `fine_gravel` | gravel |
| `dirt`, `earth`, `grass` | dirt |
| `tactile_paving=yes` | tactile |

---

## 5. Orden de Implementacion

1. **T8.1** — osmService + osmCache (consulta Overpass + cache local)
2. **T8.2** — nominatimService + integracion en useSearch
3. **T8.3** — waypointSuggestionService (auto-sugerencia durante grabacion)
4. **T8.4** — osmPathMatchingService (ajuste de segmentos a caminos OSM)

**Camino critico:** T8.1 → T8.3 → T8.4

---

*Documento creado: 2026-04-05*
