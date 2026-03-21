# Historial de Cambios — Fase 4: Perfiles Adicionales de Accesibilidad

> Registro cronológico de implementación y cambios durante la Fase 4 del proyecto **Campus GPS Accesible**.
> **Estado:** ✅ Completada
> **Spec:** `docs/SPEC-FASE-4.md`

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorías:** `Implementación`, `Fix`, `Configuración`, `Refactor`
- **Progreso:** Barras ████░░░░░░ con porcentaje

---

## Estado de Tareas — Fase 4

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T4.1 — Perfil Movilidad Reducida | FR-401, NFR-403 | ✅ Completada | ██████████ 100% |
| T4.2 — Lectura Fácil con IA | FR-402, NFR-402 | ✅ Completada | ██████████ 100% |
| T4.3 — Vibración Háptica Direccional | FR-403, NFR-401 | ✅ Completada | ██████████ 100% |
| T4.4 — Selector Multi-Perfil | FR-404 | ✅ Completada | ██████████ 100% |
| T4.5 — Pesos de Ruta por Perfil | FR-405 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 4:** ██████████ 100% (5/5 tareas)

---

## Dependencias de Fase 3

| Componente | Commit | Estado |
|-----------|--------|--------|
| Audio Beacons con HRTF | T3.1 | ✅ |
| Audio-Descripciones Contextuales | T3.2 | ✅ |
| Integración TalkBack/VoiceOver | T3.3 | ✅ |
| Evaluación de Riesgos Detallada | T3.4 | ✅ |
| Perfil de Accesibilidad Visual | T3.5 | ✅ |
| Conducción Ósea | T3.6 | ✅ |
| Generador IA de Descripciones | T3.7 | ✅ |

---

## Registro de Cambios

### 2026-03-21 — T4.3: Vibración Háptica Direccional [FR-403]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **hapticPatterns.ts** — Definición de patrones de vibración:
   - 6 patrones: turn_left (2 pulsos cortos), turn_right (3 pulsos cortos), go_straight (1 largo), alert_risk (rápidos 1s), arrival (3 largos), off_route (2 largos)
   - Intensidades: light, medium, heavy por paso
   - `actionToPattern()` — Mapeo de acciones de navegación a patrones
   - `getPatternDuration()` — Duración total del patrón
   - Labels en español para configuración

2. **hapticNavigationService.ts** — Servicio de navegación háptica:
   - `playPattern()` — Ejecuta secuencia de vibraciones via expo-haptics
   - `vibrateForAction()` — Vibra según instrucción de navegación
   - `vibrateAlert()` — Alerta por nivel de riesgo (heavy para alto, single para medio)
   - `vibrateArrival()` / `vibrateOffRoute()` — Patrones especiales
   - `setEnabled()` / `getIsEnabled()` — Control global

3. **HapticIndicator.tsx** — Indicador visual de dirección:
   - Iconos grandes por dirección (⬅️ ➡️ ⬆️ 📍)
   - Distancia al siguiente waypoint
   - Accesibilidad completa (role=alert, liveRegion=polite)

4. **Dependencia** — `expo-haptics@14.0.1` (SDK 52 compatible)

5. **Tests** — 12 tests pasando:
   - TST-FR-403-001 (patrón giro izquierda), TST-FR-403-002 (alerta riesgo)
   - TST-FR-403-003 (patrones ≤ 2 segundos)
   - Mapeo acciones, enable/disable, labels

---

### 2026-03-21 — T4.2: Lectura Fácil con IA [FR-402]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **easyReadService.ts** (server) — Servicio de simplificación:
   - `simplifyWithAI()` — Simplifica via Claude Haiku 4.5 siguiendo guías Plena Inclusión
   - `simplifyFromTemplate()` — Fallback con patrones de simplificación
   - `simplifyText()` — Intenta IA, cae a plantillas si no hay API key
   - Contextos: navigation, risk, description, general

2. **API Endpoint** — `POST /api/text/easy-read`:
   - Validación Zod (text, context)
   - Retorna: original, simplified, source (ai/template)

3. **easyReadAdapter.ts** (mobile) — Adaptador cliente:
   - `simplifyLocally()` — Simplificación inmediata sin red con regex patterns
   - `simplifyViaAPI()` — Llama al endpoint con fallback local
   - `simplifyInstruction()` — Wrapper para instrucciones de navegación
   - Patrones locales: start, continue, turn, arrive

4. **templates.json** — Plantillas en lectura fácil:
   - Navegación, riesgos, superficies, barreras de movilidad

5. **Tests** — 15 tests pasando:
   - `easyReadService.test.ts`: 8 tests (TST-FR-402-002, TST-FR-402-003)
   - `easyReadAdapter.test.ts`: 7 tests (local patterns, word count ≤10)

---

### 2026-03-21 — T4.5: Pesos de Ruta por Perfil [FR-405]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **profileWeights.ts** — Servicio de pesos por perfil:
   - `ProfileWeightFactors`: stairsPenalty, slopePenalty, narrowPathPenalty, poorSurfacePenalty, riskPenalty, tactileBonification
   - Configuraciones por perfil: reduced_mobility (escalones x10, estrecho x5), visual_disability (riesgo alto x3, táctil x0.5)
   - `calculateProfileMultiplier()` — Calcula multiplicador compuesto por segmento
   - `applyProfileWeight()` — Aplica multiplicador al peso base

2. **calculate.ts** — API acepta parámetro `profile`:
   - Schema Zod extendido con enum de 5 perfiles
   - Default "standard" para compatibilidad retroactiva

3. **routingService.ts** — Pesos dinámicos en tiempo de consulta:
   - Carga datos de segmento junto con edges del grafo
   - Aplica `applyProfileWeight()` a cada edge según perfil
   - Sin necesidad de reconstruir el grafo

4. **Tests** — 8 tests pasando + 4 regresión:
   - TST-FR-405-001 (escalones x10), TST-FR-405-002 (rutas diferentes por perfil)
   - Bonificación táctil, penalización riesgo, configs por perfil

---

### 2026-03-21 — T4.1: Perfil Movilidad Reducida [FR-401]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **mobility.ts** (shared-types) — Tipos de accesibilidad física:
   - `SurfaceQuality`: good, fair, poor
   - `PhysicalAccessibility`: hasRamp, hasStairs, pathWidth, maxSlope, surfaceQuality
   - `MobilityBarrier`: stairs, steep_slope, narrow_path, poor_surface con severidad
   - `MobilityAssessment`: isAccessible, barriers, segmentId
   - Labels en español para barreras y calidades de superficie

2. **Schema Prisma** — 5 nuevos campos en `RouteSegment`:
   - `hasRamp` (Boolean), `hasStairs` (Boolean), `pathWidth` (Float, default 2.0m)
   - `maxSlope` (Float, default 0%), `surfaceQuality` (String, default "good")
   - Migración `add_physical_accessibility_fields` aplicada

3. **Seed** — 11 segmentos con datos de accesibilidad física realistas:
   - Segmentos con escalones: seg-bus-metro, seg-bus-metro-r2, seg-fisicas-odonto
   - Segmentos estrechos: seg-filosofia-bus (1.2m), seg-fisicas-odonto (1.3m)
   - Superficie pobre: seg-filosofia-bus, seg-fisicas-odonto

4. **mobilityAssessmentService.ts** — Servicio de evaluación:
   - `assessSegment()` — Detecta barreras con preferencias configurables
   - `assessRoute()` — Evalúa múltiples segmentos
   - `hasBlockingBarriers()` — Verificación rápida de bloqueos

5. **MobilityAlert.tsx** — Componente de alerta:
   - Colores por severidad (blocking=rojo, warning=amarillo)
   - Accesibilidad completa (role=alert, liveRegion=assertive)

6. **API** — GeoJSON incluye datos de accesibilidad física en segmentos

7. **Tests** — 17 tests pasando:
   - `mobilityAssessmentService.test.ts`: 9 tests (TST-FR-401-001, TST-FR-401-002)
   - `mobility.test.ts`: 2 tests (labels)
   - `routes.test.ts`: 6 tests (+1 nuevo TST-FR-401-001 en API)

---

### 2026-03-21 — T4.4: Selector Multi-Perfil [FR-404]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **accessibilityStore.ts** — Extensión del store con 5 perfiles:
   - `AccessibilityProfile` ampliado: standard, visual_disability, reduced_mobility, deaf, easy_read
   - Nuevos estados: `hapticEnabled`, `easyReadEnabled`, `largeFontEnabled`, `mobilityBarriersEnabled`, `avoidStairs`, `maxSlopePercent`, `minPathWidth`
   - `getProfileDefaults()` con switch por perfil y defaults específicos
   - Nuevos setters con validación (clamp en slope 1-20%, width 0.5-3.0m)
   - Persistencia extendida con todos los campos nuevos

2. **ProfileCard.tsx** — Nuevo componente reutilizable:
   - Tarjeta con icono, título, descripción y lista de características
   - Estado visual seleccionado/no seleccionado
   - Accesibilidad completa (label, hint, role, state)

3. **ProfileSelector.tsx** — Actualizado con 5 perfiles:
   - ScrollView para soportar más tarjetas
   - Cada perfil con features descriptivas en español
   - Usa `ProfileCard` para cada opción

4. **AccessibilitySettingsScreen.tsx** — Secciones condicionales por perfil:
   - Grid de 5 botones de perfil en la cabecera
   - Audio beacons: visible para visual_disability y standard
   - Háptica: visible solo para deaf
   - Lectura fácil: visible solo para easy_read
   - Accesibilidad física: visible solo para reduced_mobility (escalones, pendiente, ancho)
   - Audio output: oculto para deaf

5. **Tests** — 17 tests pasando:
   - 9 tests existentes actualizados con nuevos campos
   - 8 tests nuevos: TST-FR-404-001, TST-FR-404-002, defaults por perfil (3), clamping (2), persistencia (1)

---

*Registro creado: 2026-03-21*
