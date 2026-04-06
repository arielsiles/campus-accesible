# Especificacion de Desarrollo — Fase 7: Herramienta de Creacion de Rutas

> **Version:** 1.0 | **Fecha:** 2026-04-05 | **Estado:** Draft
> **Prefijo IDs:** FR-7XX (funcionales), NFR-7XX (no funcionales)
> **Fase anterior:** Fase 6 completada (2026-04-05) — ver `SPEC-FASE-6.md`

---

## 1. Alcance

### En Scope (Fase 7)

Las 7 tareas para esta fase:
- Grabacion GPS de rutas: caminar y grabar track con marcado de waypoints en tiempo real
- Edicion de rutas en mapa: colocar y mover waypoints tocando el mapa
- Formulario de anotacion de segmentos: superficie, ancho, escaleras, pendiente, riesgos
- Vista previa y validacion de ruta antes de subir al servidor
- API completa de gestion de rutas: crear, actualizar, eliminar
- Reconstruccion automatica del grafo al crear/editar rutas
- Generacion automatica de audio-descripciones para segmentos nuevos

### Fuera de Scope

- Integracion con datos de OpenStreetMap (Fase 8)
- Autenticacion de usuarios / cuentas (Fase 9)
- Multi-campus con seleccion de ubicacion (Fase 9)
- Publicacion en tiendas (Fase 10)

### Dependencias de Fase 6

| Componente | Estado | Notas |
|-----------|--------|-------|
| API cache + dedup | ✅ Funcionando | Reducira calls redundantes durante grabacion |
| GPS adaptativo | ✅ Funcionando | Base para grabacion GPS de tracks |
| Campus export/import | ✅ Funcionando | Formato GeoJSON ya definido |
| Auditoria WCAG 2.1 AA | ✅ Pasando | Nuevas pantallas deben cumplir |
| Vitest coverage | ✅ Configurado | Tests con threshold 70% services |

---

## 2. Requisitos Funcionales

### FR-701: Grabacion GPS de Rutas

**Descripcion:** Modo de grabacion donde el usuario camina por un espacio y la app registra el track GPS en tiempo real. En puntos de interes, el usuario pulsa un boton para marcar un waypoint. Al terminar, la app genera automaticamente los waypoints y segmentos.

**Criterios de aceptacion:**

```gherkin
Given el usuario en la pantalla del mapa
When pulsa el boton "Crear ruta"
Then se abre la pantalla de grabacion con cronometro y contador de puntos

Given la grabacion activa
When el usuario camina
Then la app registra coordenadas GPS cada 1-2 segundos formando un track

Given la grabacion activa
When el usuario pulsa "Marcar punto"
Then se anade un waypoint con las coordenadas GPS actuales y se le pide nombre y tipo

Given la grabacion activa
When el usuario pulsa "Finalizar"
Then la app genera segmentos LineString entre waypoints consecutivos usando el track grabado

Given el track grabado con < 2 waypoints
When el usuario intenta finalizar
Then se muestra error "Se necesitan al menos 2 puntos para crear una ruta"

Given la grabacion activa
When el GPS se pierde por mas de 10 segundos
Then se muestra alerta "Senal GPS perdida" y se pausa la grabacion

Given la grabacion activa
When la app pasa a segundo plano
Then la grabacion continua (background location tracking)

Given la pantalla de grabacion
When TalkBack/VoiceOver esta activo
Then todos los controles son accesibles con labels en espanol
```

**Archivos requeridos:**
- `apps/mobile/src/store/routeCreatorStore.ts` — estado de grabacion
- `apps/mobile/src/services/trackRecorderService.ts` — grabacion GPS con buffer
- `apps/mobile/src/services/trackRecorderService.test.ts`
- `apps/mobile/src/screens/RouteRecorderScreen.tsx` — pantalla de grabacion
- `apps/mobile/src/components/RecordingControls.tsx` — controles de grabacion
- `apps/mobile/src/components/TrackLine.tsx` — visualizacion del track en mapa

---

### FR-702: Edicion de Rutas en Mapa

**Descripcion:** Modo de edicion donde el usuario puede colocar waypoints tocando el mapa, arrastrarlos para ajustar posicion, y reordenarlos. Los segmentos se generan automaticamente entre puntos consecutivos.

**Criterios de aceptacion:**

```gherkin
Given la pantalla de edicion de ruta
When el usuario hace long-press en el mapa
Then se coloca un waypoint nuevo en esa posicion

Given un waypoint existente en el editor
When el usuario lo arrastra
Then el waypoint se mueve y los segmentos conectados se actualizan

Given multiples waypoints en el editor
When el usuario reordena la lista
Then los segmentos se regeneran siguiendo el nuevo orden

Given un waypoint en el editor
When el usuario pulsa "Eliminar"
Then el waypoint se elimina y los segmentos adyacentes se reconectan

Given una ruta existente en la base de datos
When el usuario pulsa "Editar ruta"
Then se carga la ruta en el editor con todos sus waypoints y segmentos
```

**Archivos requeridos:**
- `apps/mobile/src/screens/RouteEditorScreen.tsx` — pantalla de edicion visual
- `apps/mobile/src/components/DraggableWaypoint.tsx` — waypoint arrastrable
- `apps/mobile/src/components/EditableSegment.tsx` — segmento editable
- `apps/mobile/src/hooks/useRouteEditor.ts` — logica de edicion

---

### FR-703: Anotacion de Segmentos

**Descripcion:** Formulario accesible para anotar los datos de accesibilidad de cada segmento: tipo de superficie, ancho del camino, existencia de escaleras/rampas, pendiente, nivel de riesgo, y calidad de superficie.

**Criterios de aceptacion:**

```gherkin
Given los segmentos generados de una ruta
When el usuario abre la anotacion
Then ve una lista de segmentos con formulario de accesibilidad para cada uno

Given el formulario de un segmento
When el usuario anota superficie, ancho, escaleras, pendiente
Then los datos se guardan en el segmento localmente

Given un segmento sin anotar
When el usuario intenta guardar la ruta
Then se permite guardar con valores por defecto (paved, 2.0m, sin escaleras, 0%)

Given el formulario de anotacion
When TalkBack esta activo
Then todos los selectores y sliders tienen labels descriptivos en espanol

Given un segmento anotado como "tiene escaleras"
When el usuario marca "tiene rampa alternativa"
Then el campo hasRamp se activa y hasStairs permanece true
```

**Archivos requeridos:**
- `apps/mobile/src/screens/SegmentAnnotatorScreen.tsx` — lista de segmentos con formularios
- `apps/mobile/src/components/SegmentAnnotationForm.tsx` — formulario por segmento
- `apps/mobile/src/components/SurfaceTypeSelector.tsx` — selector de superficie
- `apps/mobile/src/components/RiskLevelSelector.tsx` — selector de riesgo

---

### FR-704: Vista Previa y Validacion

**Descripcion:** Pantalla de vista previa que muestra la ruta completa en el mapa antes de subirla. Incluye validacion de datos y resumen de la ruta.

**Criterios de aceptacion:**

```gherkin
Given una ruta completa con waypoints y segmentos anotados
When el usuario abre la vista previa
Then ve la ruta dibujada en el mapa con todos los waypoints marcados

Given la vista previa
When se muestra el resumen
Then incluye: nombre, descripcion, numero de puntos, distancia total, tiempo estimado

Given una ruta con errores de validacion (waypoints sin nombre, segmentos sin datos)
When se abre la vista previa
Then se muestran los errores con accesibilidad (role="alert")

Given la vista previa con ruta valida
When el usuario pulsa "Guardar ruta"
Then la ruta se sube al servidor y se muestra confirmacion

Given la vista previa
When el usuario pulsa "Editar"
Then vuelve al editor para hacer cambios
```

**Archivos requeridos:**
- `apps/mobile/src/screens/RoutePreviewScreen.tsx` — vista previa con mapa
- `apps/mobile/src/services/routeValidationService.ts` — validacion local
- `apps/mobile/src/services/routeValidationService.test.ts`

---

### FR-705: API de Gestion de Rutas

**Descripcion:** Endpoints del servidor para crear, actualizar y eliminar rutas completas (con waypoints y segmentos). Al crear/actualizar, se reconstruye el grafo automaticamente.

**Criterios de aceptacion:**

```gherkin
Given una ruta valida en formato GeoJSON FeatureCollection
When se envia POST /api/routes con el body
Then se crea la ruta con waypoints y segmentos, se reconstruye el grafo, y se devuelve 201

Given una ruta existente
When se envia PUT /api/routes/:id con datos actualizados
Then se actualizan waypoints y segmentos, se reconstruye el grafo

Given una ruta existente
When se envia DELETE /api/routes/:id
Then se elimina la ruta, sus waypoints y segmentos, y se reconstruye el grafo

Given un body invalido (waypoints < 2 o segmentos faltantes)
When se envia POST /api/routes
Then se devuelve 400 con errores de validacion detallados

Given la creacion de una ruta nueva
When se reconstruye el grafo
Then los bridge edges se crean para waypoints co-ubicados con rutas existentes
```

**Archivos requeridos:**
- `server/src/routes/routeManagement.ts` — POST, PUT, DELETE endpoints
- `server/src/routes/routeManagement.test.ts`
- `server/src/services/routeCreationService.ts` — logica de creacion/actualizacion
- `server/src/services/routeCreationService.test.ts`

---

### FR-706: Generacion Automatica de Descripciones

**Descripcion:** Al crear una ruta, el servidor genera automaticamente audio-descripciones para cada segmento usando IA (Claude Haiku) basandose en los datos de accesibilidad anotados. Fallback por plantillas si la API no esta disponible.

**Criterios de aceptacion:**

```gherkin
Given una ruta recien creada con segmentos anotados
When se procesa en el servidor
Then cada segmento recibe una audioDescription generada por IA

Given la API de Claude no disponible
When se generan descripciones
Then se usan plantillas basadas en surfaceType, riskLevel, elevationChange

Given una descripcion generada
When se lee en la app con perfil de discapacidad visual
Then es coherente con el terreno real (menciona superficie, riesgos, distancia)
```

**Archivos requeridos:**
- Reutiliza `server/src/services/descriptionGenerator.ts` (ya existente)
- Integrar en `routeCreationService.ts`

---

### FR-707: Servicio de Subida de Rutas (Mobile)

**Descripcion:** Servicio cliente que empaqueta la ruta creada/editada en formato GeoJSON y la sube al servidor, manejando errores de red y confirmacion.

**Criterios de aceptacion:**

```gherkin
Given una ruta completada localmente
When el usuario pulsa "Guardar"
Then el servicio serializa a GeoJSON y envia POST /api/routes

Given un error de red al subir
When falla la peticion
Then se muestra error accesible y se ofrece reintentar

Given la subida exitosa
When el servidor responde 201
Then se muestra confirmacion, se limpia el estado del editor, y se refresca la lista de rutas

Given una ruta existente editada
When el usuario pulsa "Guardar cambios"
Then el servicio envia PUT /api/routes/:id
```

**Archivos requeridos:**
- `apps/mobile/src/services/routeUploadService.ts` — serializar y subir
- `apps/mobile/src/services/routeUploadService.test.ts`
- `apps/mobile/src/hooks/useRouteUpload.ts` — hook de subida con estado

---

## 3. Requisitos No Funcionales

### NFR-701: Rendimiento de Grabacion

| Metrica | Criterio |
|---------|----------|
| Frecuencia de grabacion GPS | 1-2 puntos por segundo |
| Consumo de bateria en grabacion | < 15% por hora |
| Tamano maximo de track | 10,000 puntos (suficiente para 2+ horas) |
| Tiempo de serializacion a GeoJSON | < 500ms para 1000 puntos |
| Subida al servidor | < 3 segundos para ruta con 50 waypoints |

### NFR-702: Accesibilidad del Editor

| Criterio | Detalle |
|----------|---------|
| Touch targets | >= 44x44dp en todos los controles del editor |
| Labels | Todos en espanol con accessibilityRole |
| Drag-and-drop | Alternativa accesible para reordenar (botones arriba/abajo) |
| Feedback tactil | Vibracion al marcar waypoint, al mover, al soltar |
| Contraste | Todos los elementos >= 4.5:1 |

### NFR-703: Precision de Track

| Criterio | Detalle |
|----------|---------|
| Simplificacion | Douglas-Peucker para reducir puntos redundantes en segmentos |
| Filtrado de ruido | Descartar puntos con accuracy > 20m |
| Coordenadas | Minimo 6 decimales (precision ~0.1m) |

---

## 4. Modelos de Datos

### 4.1 Estado del Route Creator (Zustand)

```typescript
interface RouteCreatorState {
  // Recording state
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  
  // Track data
  trackPoints: TrackPoint[];    // GPS track crudo
  waypoints: DraftWaypoint[];    // puntos marcados
  segments: DraftSegment[];      // generados al finalizar
  
  // Route metadata
  routeName: string;
  routeDescription: string;
  
  // Edit mode
  editingRouteId: string | null; // null = nueva, string = editando existente
  
  // Actions
  startRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  addTrackPoint: (point: TrackPoint) => void;
  addWaypoint: (waypoint: DraftWaypoint) => void;
  updateWaypoint: (index: number, data: Partial<DraftWaypoint>) => void;
  removeWaypoint: (index: number) => void;
  reorderWaypoint: (fromIndex: number, toIndex: number) => void;
  updateSegment: (index: number, data: Partial<DraftSegment>) => void;
  setRouteName: (name: string) => void;
  setRouteDescription: (desc: string) => void;
  generateSegments: () => void;   // genera segmentos a partir de track + waypoints
  reset: () => void;
}

interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;         // metros
}

interface DraftWaypoint {
  id: string;               // temporal, UUID generado en cliente
  name: string;
  description: string;
  waypointType: string;     // entrance, building, intersection, etc.
  latitude: number;
  longitude: number;
  orderIndex: number;
  transportType?: string;
  transportLines?: string[];
}

interface DraftSegment {
  id: string;               // temporal
  name: string;
  coordinates: [number, number][];  // track points entre waypoints
  surfaceType: string;
  elevationChange: number;
  riskLevel: string;
  riskDescription?: string;
  riskFactors: string[];
  hasRamp: boolean;
  hasStairs: boolean;
  pathWidth: number;
  maxSlope: number;
  surfaceQuality: string;
  orderIndex: number;
}
```

---

## 5. Contratos de API

### 5.1 Crear ruta

```
POST /api/routes
Body: GeoJSON FeatureCollection (mismo formato que GET /api/routes/:id)
{
  "type": "FeatureCollection",
  "properties": { "name": "Mi ruta", "description": "..." },
  "features": [
    { waypoints... },
    { segments... }
  ]
}
Response 201: { route: { id, name, description }, graphRebuilt: true }
Response 400: { error: { code: "VALIDATION_ERROR", message, details: [...] } }
```

### 5.2 Actualizar ruta

```
PUT /api/routes/:id
Body: GeoJSON FeatureCollection (completo, reemplaza la ruta)
Response 200: { route: { id, name, description }, graphRebuilt: true }
Response 404: { error: { code: "NOT_FOUND" } }
```

### 5.3 Eliminar ruta

```
DELETE /api/routes/:id
Response 200: { deleted: true, graphRebuilt: true }
Response 404: { error: { code: "NOT_FOUND" } }
```

---

## 6. Arquitectura de Componentes

### 6.1 Flujo de pantallas

```
MapScreen
  ├── [Pulsar "Crear ruta"] → RouteRecorderScreen
  │     ├── Grabando GPS track + marcando waypoints
  │     └── [Finalizar] → SegmentAnnotatorScreen
  │           ├── Formulario por segmento
  │           └── [Siguiente] → RoutePreviewScreen
  │                 ├── Vista previa en mapa + resumen
  │                 └── [Guardar] → Upload → MapScreen
  │
  └── [Pulsar "Editar ruta"] → RouteEditorScreen
        ├── Edicion visual en mapa (drag waypoints)
        └── [Guardar cambios] → SegmentAnnotatorScreen → ...
```

### 6.2 Nuevos servicios

| Servicio | Archivo | Responsabilidad |
|----------|---------|----------------|
| TrackRecorderService | `services/trackRecorderService.ts` | Grabacion GPS con buffer y filtrado |
| RouteValidationService | `services/routeValidationService.ts` | Validacion local antes de subir |
| RouteUploadService | `services/routeUploadService.ts` | Serializar y subir al servidor |
| RouteCreationService | `server/services/routeCreationService.ts` | Crear/actualizar rutas en BD |

---

## 7. Orden de Implementacion

### Dependencias entre tareas

```
T7.1 (Store + Track Recorder) ← base para grabacion
  ├── T7.2 (RouteRecorderScreen) ← usa el store y servicio
  │     └── T7.4 (SegmentAnnotatorScreen) ← despues de grabar
  │           └── T7.5 (RoutePreviewScreen) ← despues de anotar
  ├── T7.3 (RouteEditorScreen) ← alternativa a grabacion
  ├── T7.6 (API POST/PUT/DELETE) ← backend
  └── T7.7 (RouteUploadService + auto-descriptions) ← conecta mobile con server
```

### Orden sugerido

1. **T7.1** — routeCreatorStore + trackRecorderService (base)
2. **T7.6** — API de gestion de rutas en servidor (backend listo)
3. **T7.2** — RouteRecorderScreen (pantalla de grabacion)
4. **T7.4** — SegmentAnnotatorScreen (anotacion de segmentos)
5. **T7.5** — RoutePreviewScreen + RouteUploadService (preview + subida)
6. **T7.3** — RouteEditorScreen (edicion visual en mapa)
7. **T7.7** — Generacion auto de descripciones al crear

**Camino critico:** T7.1 → T7.6 → T7.2 → T7.4 → T7.5

---

## 8. Especificaciones de Tests

### 8.1 Unit Tests (Vitest)

| Test ID | Modulo | Descripcion | Validates |
|---------|--------|-------------|-----------|
| TST-FR-701-001 | trackRecorderService | Graba puntos GPS cada 1s | FR-701, NFR-701 |
| TST-FR-701-002 | trackRecorderService | Filtra puntos con accuracy > 20m | FR-701, NFR-703 |
| TST-FR-701-003 | trackRecorderService | Simplifica track con Douglas-Peucker | NFR-703 |
| TST-FR-701-004 | routeCreatorStore | Genera segmentos entre waypoints | FR-701 |
| TST-FR-701-005 | routeCreatorStore | Requiere >= 2 waypoints para finalizar | FR-701 |
| TST-FR-703-001 | SegmentAnnotationForm | Valores por defecto correctos | FR-703 |
| TST-FR-704-001 | routeValidationService | Rechaza ruta con < 2 waypoints | FR-704 |
| TST-FR-704-002 | routeValidationService | Acepta ruta valida completa | FR-704 |
| TST-FR-705-001 | routeManagement route | POST crea ruta con waypoints y segmentos | FR-705 |
| TST-FR-705-002 | routeManagement route | DELETE elimina ruta y reconstruye grafo | FR-705 |
| TST-FR-705-003 | routeManagement route | POST rechaza body invalido | FR-705 |
| TST-FR-707-001 | routeUploadService | Serializa ruta a GeoJSON correcto | FR-707 |
| TST-FR-707-002 | routeUploadService | Maneja error de red | FR-707 |

---

*Documento creado: 2026-04-05*
