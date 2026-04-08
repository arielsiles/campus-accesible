# Especificacion de Desarrollo — Fase 12: OCR e Informacion Contextual

> **Version:** 1.0 | **Fecha:** 2026-04-07 | **Estado:** Draft
> **Prefijo IDs:** FR-12XX (funcionales), NFR-12XX (no funcionales)
> **Fase anterior:** Fase 11 — ver `SPEC-FASE-11.md`

---

## 1. Alcance

### En Scope (Fase 12)

- OCR en tiempo real con Google ML Kit (on-device, sin internet)
- Lectura automatica de carteles, senalizaciones, nombres de calles via TTS
- Integracion con Google Places API: comercios, horarios, servicios cercanos
- Integracion con OpenWeatherMap: clima actual y alertas meteorologicas
- Integracion con APIs de transporte: tiempos reales de autobuses/metro
- Panel de informacion contextual combinando todas las fuentes
- Cache de informacion contextual para modo offline parcial

### Fuera de Scope

- Vision IA con Claude (Fase 11, ya implementada)
- Realidad aumentada visual (Fase 13)
- Traduccion de idiomas en carteles

---

## 2. Requisitos Funcionales

### FR-1201: OCR On-Device con ML Kit

**Descripcion:** Reconocimiento de texto en tiempo real usando Google ML Kit. Funciona sin internet. Detecta texto en carteles, senalizaciones, y nombres de calles, y lo anuncia via TTS.

**Criterios de aceptacion:**

```gherkin
Given la camara apuntando a un cartel con texto
When ML Kit detecta texto
Then se muestra el texto reconocido en pantalla y se lee via TTS

Given texto detectado en espanol
When se procesa
Then se limpia (elimina ruido, normaliza) y se presenta como frase

Given la deteccion de texto
When el usuario tiene perfil "lectura facil"
Then el texto se simplifica antes de anunciarlo

Given la deteccion de texto
When no hay texto visible en la imagen
Then no se anuncia nada (sin falsos positivos)

Given el procesamiento OCR
When se ejecuta
Then funciona completamente offline (on-device)
```

**Archivos requeridos:**
- `apps/mobile/src/services/ocrService.ts` — ML Kit text recognition
- `apps/mobile/src/services/ocrService.test.ts`
- `apps/mobile/src/components/TextOverlay.tsx` — muestra texto detectado sobre camara

---

### FR-1202: Informacion de Comercios (Google Places API)

**Descripcion:** Al explorar una zona, la app muestra informacion de comercios, servicios y puntos de interes cercanos: nombre, tipo, horario, valoracion, distancia.

**Criterios de aceptacion:**

```gherkin
Given la posicion GPS del usuario
When solicita informacion contextual
Then se muestran los 5-10 lugares mas cercanos con nombre, tipo, distancia

Given un comercio cercano
When se muestra su info
Then incluye: nombre, tipo (farmacia, cafe, banco...), horario actual (abierto/cerrado), distancia

Given el perfil de accesibilidad activo
When se filtran los resultados
Then se priorizan: farmacias, bancos, cafeterias, banos publicos, hospitales

Given la informacion de Places
When el usuario selecciona un lugar
Then puede iniciar navegacion hacia el (como destino)
```

**Archivos requeridos:**
- `server/src/services/placesService.ts` — Google Places API client
- `server/src/services/placesService.test.ts`
- `server/src/routes/context.ts` — GET /api/context/places
- `apps/mobile/src/services/contextService.ts` — cliente mobile
- `apps/mobile/src/components/PlaceCard.tsx` — tarjeta de lugar

---

### FR-1203: Clima en Tiempo Real (OpenWeatherMap)

**Descripcion:** Mostrar condiciones climaticas actuales y alertas relevantes para la accesibilidad (lluvia = suelo resbaladizo, viento fuerte, calor extremo).

**Criterios de aceptacion:**

```gherkin
Given la posicion GPS del usuario
When se consulta el clima
Then se muestra: temperatura, condicion (soleado/nublado/lluvia), humedad

Given condiciones de lluvia
When el perfil de movilidad reducida esta activo
Then se advierte: "Lluvia: suelo posiblemente resbaladizo, precaucion"

Given temperatura > 35C o < 0C
When se navega
Then se advierte: "Temperatura extrema, busca sombra/refugio"

Given la API de clima no disponible
When se consulta
Then no se muestra info de clima (degradacion graceful)
```

**Archivos requeridos:**
- `server/src/services/weatherService.ts` — OpenWeatherMap client
- `server/src/services/weatherService.test.ts`
- `server/src/routes/context.ts` — GET /api/context/weather
- `apps/mobile/src/components/WeatherBadge.tsx` — indicador de clima

---

### FR-1204: Transporte en Tiempo Real

**Descripcion:** Para waypoints de tipo `transport_stop`, mostrar tiempos reales de llegada de autobuses/metro.

**Criterios de aceptacion:**

```gherkin
Given un waypoint de tipo transport_stop
When el usuario lo consulta
Then se muestran los proximos 3 vehiculos con linea, destino, y tiempo

Given la parada de bus "Farmacia" (lineas G y U)
When hay datos en tiempo real
Then muestra: "Linea G → Ciudad Universitaria: 3 min, Linea U → Moncloa: 7 min"

Given la API de transporte no disponible
When se consulta
Then se muestra el horario estatico de las lineas (datos OSM)
```

**Archivos requeridos:**
- `server/src/services/transitService.ts` — API de transporte
- `server/src/routes/context.ts` — GET /api/context/transit
- `apps/mobile/src/components/TransitInfo.tsx` — info de transporte

---

### FR-1205: Panel de Informacion Contextual

**Descripcion:** Panel unificado accesible desde el mapa que combina toda la informacion contextual: clima, lugares cercanos, transporte, y descripcion IA del entorno.

**Criterios de aceptacion:**

```gherkin
Given el mapa principal
When el usuario pulsa el nuevo boton "Info" o desliza hacia arriba
Then se abre el panel contextual con secciones: Clima, Cerca de ti, Transporte

Given el panel contextual
When TalkBack esta activo
Then cada seccion se navega con accessibilityRole y labels en espanol

Given el panel contextual
When el usuario selecciona un lugar cercano
Then puede navegar hacia el o ver mas detalles
```

**Archivos requeridos:**
- `apps/mobile/src/screens/ContextPanel.tsx` — panel deslizable
- `apps/mobile/src/hooks/useContextInfo.ts` — combina todas las fuentes

---

## 3. Requisitos No Funcionales

### NFR-1201: Rendimiento OCR

| Metrica | Criterio |
|---------|----------|
| Deteccion de texto | < 200ms por frame (on-device) |
| Precision OCR | >= 90% para texto impreso legible |
| Consumo bateria | < 5% adicional por hora |
| Sin internet | OCR funciona 100% offline |

### NFR-1202: APIs Externas

| API | Rate limit | Cache TTL | Fallback |
|-----|-----------|-----------|----------|
| Google Places | 100 req/dia (free) | 30 min | Datos OSM |
| OpenWeatherMap | 60 req/min (free) | 10 min | Sin info clima |
| Transporte | Variable | 1 min | Horario estatico |

---

## 4. Orden de Implementacion

1. **T12.1** — ocrService con ML Kit + TextOverlay
2. **T12.2** — placesService + Google Places API
3. **T12.3** — weatherService + OpenWeatherMap
4. **T12.4** — transitService + API transporte
5. **T12.5** — ContextPanel unificado + hook

**Camino critico:** T12.1 (independiente) + T12.2 → T12.5

---

## 5. Dependencias Externas

| Dependencia | Uso | Costo |
|-------------|-----|-------|
| @react-native-ml-kit/text-recognition | OCR on-device | Gratis (Apache 2.0) |
| Google Places API | Comercios cercanos | $17/1000 req |
| OpenWeatherMap API | Clima | Gratis (tier basico) |
| API transporte (EMT/CRTM) | Buses/metro Madrid | Gratis (API publica) |

---

*Documento creado: 2026-04-07*
