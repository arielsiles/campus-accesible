# Historial de Cambios — Fase 3: Accesibilidad Visual y Audio 3D

> Registro cronológico de implementación y cambios durante la Fase 3 del proyecto **Campus GPS Accesible**.
> **Estado:** ✅ Completada
> **Spec:** `docs/SPEC-FASE-3.md`

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorías:** `Implementación`, `Fix`, `Configuración`, `Refactor`
- **Progreso:** Barras ████░░░░░░ con porcentaje

---

## Estado de Tareas — Fase 3

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T3.1 — Audio Beacons con HRTF | FR-301, NFR-301, NFR-303 | ✅ Completada | ██████████ 100% |
| T3.2 — Audio-Descripciones Contextuales | FR-302, NFR-301 | ✅ Completada | ██████████ 100% |
| T3.3 — Integración TalkBack/VoiceOver | FR-303, NFR-302 | ✅ Completada | ██████████ 100% |
| T3.4 — Evaluación de Riesgos Detallada | FR-304 | ✅ Completada | ██████████ 100% |
| T3.5 — Perfil de Accesibilidad Visual | FR-305, NFR-302 | ✅ Completada | ██████████ 100% |
| T3.6 — Conducción Ósea | FR-306, NFR-303 | ✅ Completada | ██████████ 100% |
| T3.7 — Generador IA de Descripciones | FR-307 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 3:** ██████████ 100% (7/7 tareas)

---

## Dependencias de Fase 2

| Componente | Commit | Estado |
|-----------|--------|--------|
| Route Graph Model + Bridge Edges | `656da25`, `6f3583c` | ✅ |
| Dijkstra Pathfinding | `6f299d5` | ✅ |
| Transport Connections | `aa359b7` | ✅ |
| Route Calculation API | `1648e71` | ✅ |
| Destination Search | `682794c` | ✅ |
| Snap-to-Route | `d31d53c` | ✅ |
| Turn-by-Turn Instructions | `7fe9a78` | ✅ |
| Navigation Screen | `3e3771e` | ✅ |

---

## Registro de Cambios

### 2026-03-21 — T3.7: Generador IA de Descripciones [FR-307]

**Categoría:** Implementación
**Branch:** `fase3/T3.7-ai-description-generator`

#### Cambios realizados:

1. **descriptionGenerator.ts** — Servicio de generación de audio-descripciones:
   - `generateWithAI()` — Genera descripciones via Claude API (Haiku 4.5)
   - `generateFromTemplate()` — Fallback con plantillas en español
   - `generateDescription()` — Intenta IA, cae a plantillas si no hay API key
   - `generateBatch()` — Procesamiento batch para múltiples segmentos
   - Prompt optimizado: máximo 80 caracteres, español claro, sin tecnicismos

2. **API Endpoint** — `POST /api/routes/generate-descriptions`:
   - Lee todos los segmentos de la BD
   - Genera descripciones (IA o plantillas según `ANTHROPIC_API_KEY`)
   - Actualiza `audioDescription` en cada segmento
   - Retorna resumen con source (ai/template) por segmento

3. **Configuración** — `ANTHROPIC_API_KEY` en `.env` (vacía por defecto)

4. **Dependencia** — `@anthropic-ai/sdk` instalado en server

5. **Tests** — 9 tests pasando:
   - Template generation (6), fallback sin API key (2), batch (1)
   - Incluye TST-FR-307-001 (pendiente test con API real) y TST-FR-307-002

---

### 2026-03-21 — T3.6: Conducción Ósea [FR-306]

**Categoría:** Implementación
**Branch:** `fase3/T3.6-bone-conduction`

#### Cambios realizados:

1. **boneConduction.ts** — Adaptador de salida para auriculares de conducción ósea:
   - `getConfigForOutputType()` — Config mono (+20% vol) vs estéreo
   - `applyOutputType()` — Aplica cambios inmediatamente al HRTF engine
   - `isBoneConductionActive()` — Estado actual del modo

2. **Integración** — Conecta con `audioBeaconEngine.setHRTFConfig()` (T3.1) y
   `accessibilityStore.audioOutputType` (T3.5) para cambio en tiempo real

3. **Tests** — 7 tests pasando:
   - Config mono/stereo (2), apply/switch (3), HRTF integration (2)
   - Incluye TST-FR-306-001 y TST-FR-306-002

---

### 2026-03-21 — T3.5: Perfil de Accesibilidad Visual [FR-305]

**Categoría:** Implementación
**Branch:** `fase3/T3.5-accessibility-profile`

#### Cambios realizados:

1. **accessibilityStore.ts** — Zustand store con persistencia AsyncStorage:
   - Perfiles: "Estándar" y "Discapacidad visual" con defaults automáticos
   - Preferencias: beacon volume, description frequency, TTS rate/pitch, alto contraste
   - Audio output type: stereo / bone_conduction (FR-306)
   - Persistencia automática a `@campus-gps/accessibility-profile`
   - `loadFromStorage()` para restaurar al iniciar

2. **ProfileSelector.tsx** — Selector de perfil para primer uso:
   - Dos opciones con iconos, títulos y descripciones en español
   - Accesibilidad completa (labels, hints, roles)

3. **AccessibilitySettingsScreen.tsx** — Pantalla de configuración completa:
   - Secciones: Perfil, Audio Beacons, Audio-Descripciones, Voz, Visual, Salida de audio
   - Todos los controles con `accessibilityLabel`, `accessibilityRole`, `accessibilityState`
   - Touch targets mínimos 44x44dp

4. **Dependencia** — `@react-native-async-storage/async-storage` instalado

5. **Tests** — 9 tests pasando:
   - Defaults (1), profile switch (2), persistence (2), load (1), clamping (2), output type (1)
   - Incluye TST-FR-305-001 y TST-FR-305-002

---

### 2026-03-21 — T3.3: Integración TalkBack/VoiceOver [FR-303]

**Categoría:** Implementación
**Branch:** `fase3/T3.3-talkback-voiceover`

#### Cambios realizados:

1. **screenReaderService.ts** — Servicio de detección y anuncios para TalkBack/VoiceOver:
   - `initialize()` — Detección de screen reader activo (TST-FR-303-001)
   - `announce()` — Anuncio via `AccessibilityInfo.announceForAccessibility`
   - `announceSearchResults()` — Anuncia conteo de resultados en español
   - `announceInstruction()`, `announceAlert()` — Anuncios contextuales
   - `onScreenReaderChanged()` — Suscripción a cambios de estado

2. **focusManager.ts** — Gestión de foco de accesibilidad:
   - `setFocus()` — Mueve foco a componente específico (TST-FR-303-002)
   - `createScreenFocusHandler()` — Auto-foco al montar pantalla

3. **SearchResults.tsx** — Actualizado con anuncio de resultados al screen reader y `accessibilityRole="list"` en FlatList

4. **WaypointMarker.tsx** — Añadidas etiquetas de tipo en español para anuncios al tocar waypoints

5. **NavigationScreen.tsx** — Foco automático en instruction banner al montar pantalla

6. **Tests** — 10 tests pasando:
   - Screen reader detection (2), announce (4), search results (1), instruction (1), alert (1), focus (2)
   - Incluye TST-FR-303-001 y TST-FR-303-002

---

### 2026-03-21 — T3.1: Audio Beacons con HRTF [FR-301]

**Categoría:** Implementación
**Branch:** `fase3/T3.1-audio-beacons`

#### Cambios realizados:

1. **hrtfProcessor.ts** — Procesador HRTF (Head-Related Transfer Function):
   - `calculateHRTF()` — Stereo panning por ángulo relativo (seno del ángulo)
   - Atenuación trasera al 40% para efecto "detrás"
   - Modo mono para conducción ósea (FR-306) con boost de volumen
   - `calculateRelativeAngle()` — Ángulo relativo entre heading y bearing
   - `calculateBearing()` — Bearing geodésico entre dos coordenadas

2. **audioBeaconEngine.ts** — Motor de audio beacon 3D:
   - `startBeacon()` / `stopBeacon()` — Lifecycle del sonido direccional
   - Actualización de dirección a 10Hz (100ms) per NFR-301
   - `updateUserPosition()`, `updateUserHeading()`, `updateTarget()`
   - Integración con expo-av para stereo pan y volumen dinámico

3. **useCompass.ts** — Hook de brújula via magnetómetro:
   - Heading normalizado 0-360° (TST-FR-301-003)
   - Intervalo de actualización 100ms (NFR-301)

4. **useAudioBeacon.ts** — Hook integrador:
   - Conecta compass + posición + engine
   - Soporte mono mode para conducción ósea (FR-306)
   - Polling de estado a 5Hz para UI

5. **beacon.wav** — Sonido de beacon placeholder (440Hz, 0.1s)

6. **Dependencias** — `expo-sensors`, `expo-av` instalados

7. **Tests** — 18 tests pasando:
   - HRTF direction (8), relative angle (5), bearing (5)
   - Incluye TST-FR-301-001 y TST-FR-301-003

---

### 2026-03-21 — T3.2: Audio-Descripciones Contextuales [FR-302]

**Categoría:** Implementación
**Branch:** `fase3/T3.2-audio-descriptions`

#### Cambios realizados:

1. **ttsService.ts** — Wrapper de Text-to-Speech sobre `expo-speech`:
   - `speak()` con idioma español (es-ES), rate 0.9, pitch 1.0
   - `stop()`, `setEnabled()`, `getIsSpeaking()` para control global

2. **audioDescriptionService.ts** — Generador de descripciones contextuales:
   - `describeSurface()` — Descripción por tipo de superficie (adoquín, grava, tierra, táctil)
   - `describeElevation()` — Alerta de desnivel > 3m (cuesta arriba/abajo)
   - `describeRisk()` — Descripción por nivel de riesgo con factores detallados
   - `describeWaypoint()` — Descripción de waypoints (cruces, paradas, edificios)
   - `describeSegment()` — Combinación completa con modo "full" y "reduced"
   - `announceSegmentEntry()` / `announceWaypoint()` — Triggers TTS con deduplicación

3. **templates.json** — Plantillas de audio-descripción en español:
   - Superficies, desniveles, riesgos, waypoints, factores de riesgo

4. **Tests** — 18 tests pasando:
   - Surface descriptions (4), elevation (3), risk (4), waypoint (3), segment (4)
   - Incluye TST-FR-302-001 y TST-FR-302-002

5. **tsconfig fix** — Excluir `*.test.ts` del build de shared-types


### 2026-03-21 — T3.4: Evaluación de Riesgos Detallada [FR-304]

**Categoría:** Implementación
**Branch:** `fase3/T3.4-risk-assessment`

#### Cambios realizados:

1. **Schema Prisma** — 3 nuevos campos en `RouteSegment`:
   - `riskDescription` (String?) — Descripción textual del riesgo
   - `riskFactors` (String[]) — Lista de factores de riesgo
   - `audioDescription` (String?) — Descripción para audio contextual

2. **Tipos compartidos** (`packages/shared-types/src/risk.ts`):
   - Tipo `RiskFactor` — 9 factores: cruce_sin_semaforo, mala_iluminacion, superficie_irregular, pendiente_pronunciada, trafico_vehicular, obras_temporales, escalones, sin_barandilla, paso_estrecho
   - `RISK_FACTOR_LABELS` — Etiquetas en español para cada factor
   - Interface `RiskAssessment` — level, description, factors

3. **GeoJSON** — `RouteSegmentProperties` extendido con campos opcionales de riesgo

4. **API** — `routes.ts` y `routingService.ts` incluyen datos de riesgo en respuestas GeoJSON (condicional, solo si existen)

5. **Seed** — 11 segmentos actualizados con datos de riesgo y audio-descripciones realistas

6. **Componente** — `RiskAlert.tsx` con colores por nivel, accesibilidad completa (role=alert, liveRegion=assertive)

7. **Tests** — 9 tests pasando:
   - `risk.test.ts`: 4 tests (labels, assessment, factores vacíos, valores español)
   - `routes.test.ts`: 5 tests (incluye TST-FR-304-001)

8. **Migración** — `add_risk_details_and_audio_description` aplicada

---

*Registro creado: 2026-03-20*
