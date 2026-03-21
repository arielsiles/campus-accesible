# Historial de Cambios — Fase 3: Accesibilidad Visual y Audio 3D

> Registro cronológico de implementación y cambios durante la Fase 3 del proyecto **Campus GPS Accesible**.
> **Estado:** 🔄 En progreso
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
| T3.1 — Audio Beacons con HRTF | FR-301, NFR-301, NFR-303 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T3.2 — Audio-Descripciones Contextuales | FR-302, NFR-301 | ✅ Completada | ██████████ 100% |
| T3.3 — Integración TalkBack/VoiceOver | FR-303, NFR-302 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T3.4 — Evaluación de Riesgos Detallada | FR-304 | ✅ Completada | ██████████ 100% |
| T3.5 — Perfil de Accesibilidad Visual | FR-305, NFR-302 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T3.6 — Conducción Ósea | FR-306, NFR-303 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T3.7 — Generador IA de Descripciones | FR-307 | 🔲 Pendiente | ░░░░░░░░░░ 0% |

**Progreso global Fase 3:** ██░░░░░░░░ 29% (2/7 tareas)

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
