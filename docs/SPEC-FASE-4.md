# Especificación de Desarrollo — Fase 4: Perfiles Adicionales de Accesibilidad

> **Versión:** 1.0 | **Fecha:** 2026-03-21 | **Estado:** Draft
> **Prefijo IDs:** FR-4XX (funcionales), NFR-4XX (no funcionales)
> **Fase anterior:** Fase 3 completada (2026-03-21) — ver `SPEC-FASE-3.md`

---

## 1. Alcance

### En Scope (Fase 4)

Las 5 tareas del plan maestro para esta fase:
- Perfil de movilidad reducida: valoración de accesibilidad física (pendientes, rampas, pasos adaptados, ancho de paso, tipo de firme)
- Perfil de diversidad intelectual: lectura fácil con agente IA que simplifica instrucciones siguiendo guías de Plena Inclusión
- Perfil de personas sordas: sistema de vibración háptica direccional como alternativa al audio
- Selector de perfil mejorado en onboarding con los 4 perfiles disponibles
- Tests de usabilidad y validación por perfil

### Fuera de Scope

- Panel de administración web (Fase 5)
- Sistema de incidencias colaborativo (Fase 5)
- Autenticación de usuarios (Fase 5)
- Publicación en tiendas (Fase 6)
- Precisión GPS submétrica / RTK (Fase 6)

### Dependencias de Fase 3

| Componente | Estado | Notas |
|-----------|--------|-------|
| Audio Beacons HRTF | ✅ Funcionando | Motor 3D con stereo panning, 10Hz updates |
| Audio-Descripciones | ✅ Funcionando | TTS en español, modo full/reduced |
| TalkBack/VoiceOver | ✅ Funcionando | Screen reader service, focus manager |
| Risk Assessment | ✅ Funcionando | 9 factores de riesgo, alertas visuales |
| Perfil Accesibilidad Visual | ✅ Funcionando | Zustand + AsyncStorage, 2 perfiles base |
| Conducción Ósea | ✅ Funcionando | Mono mode, +20% volumen |
| Generador IA Descripciones | ✅ Funcionando | Claude Haiku API + fallback plantillas |

---

## 2. Requisitos Funcionales

### FR-401: Perfil de Movilidad Reducida

**Descripción:** Perfil de usuario para personas con movilidad reducida (silla de ruedas, muletas, andador) que evalúa la accesibilidad física de cada segmento y prioriza rutas sin barreras arquitectónicas.

**Criterios de aceptación:**

```gherkin
Given el perfil "Movilidad reducida" activo
When se calcula una ruta
Then se priorizan segmentos sin escalones, con rampas y ancho ≥ 1.5m

Given un segmento con pendiente > 8%
When el usuario con movilidad reducida navega
Then se advierte "Pendiente pronunciada, {X}% de inclinación"

Given un segmento con escalones
When se calcula ruta para movilidad reducida
Then se evita ese segmento si hay alternativa, o se advierte "Sin paso adaptado"

Given las propiedades de un segmento
When inspecciono su accesibilidad física
Then incluye: hasRamp, hasStairs, pathWidth, maxSlope, surfaceQuality

Given el perfil de movilidad reducida
When configuro preferencias
Then puedo ajustar: umbral de pendiente máxima, ancho mínimo, evitar escalones

Given la pantalla de navegación con movilidad reducida
When TalkBack está activo
Then todos los avisos de accesibilidad física se anuncian por voz
```

**Archivos requeridos:**
- `packages/shared-types/src/mobility.ts` (tipos de accesibilidad física)
- `server/prisma/schema.prisma` (campos de accesibilidad física en RouteSegment)
- `server/prisma/seed.ts` (datos de accesibilidad por segmento)
- `apps/mobile/src/services/mobilityAssessmentService.ts`
- `apps/mobile/src/services/mobilityAssessmentService.test.ts`
- `apps/mobile/src/components/MobilityAlert.tsx`

---

### FR-402: Perfil de Diversidad Intelectual — Lectura Fácil

**Descripción:** Perfil para personas con diversidad intelectual que simplifica todas las instrucciones, descripciones y textos de la app siguiendo las guías de Plena Inclusión. Utiliza agente IA para adaptar textos a lectura fácil.

**Referencia:** Guías de Lectura Fácil — Plena Inclusión España

**Criterios de aceptación:**

```gherkin
Given el perfil "Lectura fácil" activo
When se muestran instrucciones de navegación
Then usan frases cortas (máx. 10 palabras), vocabulario sencillo, sin subordinadas

Given la instrucción "Continúa recto por la Avenida Complutense durante 135 metros"
When se adapta a lectura fácil
Then se transforma en "Camina recto. Son 135 metros."

Given una audio-descripción de riesgo
When el perfil de lectura fácil está activo
Then se simplifica: "Precaución: cruce sin semáforo" → "Cuidado. Hay un cruce. No hay semáforo."

Given el perfil de lectura fácil
When se muestran textos en la app
Then el tamaño de fuente es ≥ 18sp, interlineado ≥ 1.5, fuente sans-serif

Given un lote de instrucciones
When se procesan con el agente IA de lectura fácil
Then se simplifican siguiendo las guías: frases afirmativas, sin doble negación, sin metáforas

Given la API de Claude no disponible
When se necesitan textos en lectura fácil
Then se usan plantillas simplificadas como fallback
```

**Archivos requeridos:**
- `server/src/services/easyReadService.ts` (agente IA de simplificación)
- `server/src/services/easyReadService.test.ts`
- `apps/mobile/src/services/easyReadAdapter.ts` (adaptador cliente)
- `apps/mobile/src/services/easyReadAdapter.test.ts`
- `data/easy-read/templates.json` (plantillas de lectura fácil)

---

### FR-403: Perfil de Personas Sordas — Háptica Direccional

**Descripción:** Sistema de vibración háptica direccional como alternativa al audio para personas sordas. La vibración indica dirección, distancia y alertas mediante patrones de vibración distinguibles.

**Criterios de aceptación:**

```gherkin
Given el perfil "Personas sordas" activo
When el usuario navega
Then la guía es exclusivamente visual + vibración (sin audio beacons ni TTS)

Given la navegación activa con háptica
When hay que girar a la izquierda
Then vibra: 2 pulsos cortos (patrón izquierda)

Given la navegación activa con háptica
When hay que girar a la derecha
Then vibra: 3 pulsos cortos (patrón derecha)

Given la navegación activa con háptica
When el usuario debe continuar recto
Then vibra: 1 pulso largo (patrón recto)

Given un segmento de alto riesgo
When el usuario se acerca
Then vibra: patrón de alerta (pulsos rápidos continuos, 1 segundo)

Given la llegada al destino
When el usuario llega
Then vibra: patrón de éxito (3 pulsos largos)

Given las preferencias del perfil sordo
When el usuario las configura
Then puede ajustar: intensidad de vibración, patrones personalizados
```

**Archivos requeridos:**
- `apps/mobile/src/haptics/hapticPatterns.ts` (definición de patrones)
- `apps/mobile/src/haptics/hapticNavigationService.ts` (servicio de navegación háptica)
- `apps/mobile/src/haptics/hapticNavigationService.test.ts`
- `apps/mobile/src/components/HapticIndicator.tsx` (indicador visual de dirección)

---

### FR-404: Selector de Perfil Multi-Accesibilidad

**Descripción:** Actualización del selector de perfil existente (FR-305) para soportar los 4 perfiles de accesibilidad. Incluye onboarding guiado con descripción de cada perfil y demo interactiva.

**Criterios de aceptación:**

```gherkin
Given un usuario nuevo
When abre la app por primera vez
Then ve selector con 4 perfiles: Estándar, Discapacidad visual, Movilidad reducida, Personas sordas

Given el selector de perfil
When el usuario explora opciones
Then cada perfil muestra: nombre, icono, descripción breve, lista de características activadas

Given el perfil "Movilidad reducida" seleccionado
When se activa
Then: audio beacons OFF, alertas de accesibilidad física ON, rutas sin barreras priorizadas

Given el perfil "Personas sordas" seleccionado
When se activa
Then: audio OFF, háptica ON, alertas visuales ampliadas, subtítulos de instrucciones ON

Given el perfil "Lectura fácil" seleccionado
When se activa
Then: textos simplificados ON, fuente grande ON, instrucciones paso a paso ON

Given el cambio de perfil
When el usuario cambia de un perfil a otro
Then se aplica inmediatamente sin reiniciar la app
```

**Archivos requeridos:**
- Actualización de `apps/mobile/src/store/accessibilityStore.ts`
- Actualización de `apps/mobile/src/components/ProfileSelector.tsx`
- `apps/mobile/src/components/ProfileCard.tsx`
- Actualización de `apps/mobile/src/screens/AccessibilitySettingsScreen.tsx`

---

### FR-405: Pesos de Ruta por Perfil

**Descripción:** El motor de routing ajusta los pesos de las aristas del grafo según el perfil activo, priorizando diferentes criterios para cada tipo de accesibilidad.

**Criterios de aceptación:**

```gherkin
Given el perfil "Movilidad reducida"
When se calcula una ruta
Then los segmentos con escalones tienen peso x10 (penalización alta)
And los segmentos con pendiente > 8% tienen peso x3
And los segmentos con ancho < 1.5m tienen peso x5

Given el perfil "Estándar"
When se calcula una ruta
Then se usan los pesos por defecto (distancia + desnivel)

Given el perfil "Discapacidad visual"
When se calcula una ruta
Then los segmentos con riesgo alto tienen peso x3
And los segmentos con pavimento táctil tienen peso x0.5 (bonificación)

Given dos perfiles diferentes
When calculan la misma ruta origen-destino
Then pueden obtener caminos distintos según sus pesos
```

**Archivos requeridos:**
- Actualización de `packages/shared-types/src/graph.ts` (WeightFactors por perfil)
- `server/src/services/profileWeights.ts`
- `server/src/services/profileWeights.test.ts`
- Actualización de `server/src/services/routingService.ts`

---

## 3. Requisitos No Funcionales

### NFR-401: Háptica

| Métrica | Criterio |
|---------|----------|
| Latencia de vibración | < 100ms desde trigger |
| Patrones distinguibles | ≥ 90% de acierto en tests de usuario |
| Duración de patrón | Máximo 2 segundos por instrucción |
| Batería | Vibración no incrementa consumo > 10% |

---

### NFR-402: Lectura Fácil

| Criterio | Detalle |
|----------|---------|
| Longitud de frase | Máximo 10 palabras por frase |
| Vocabulario | Frecuencia ≥ 5000 palabras más usadas en español |
| Estructura | Frases afirmativas, sin subordinadas, sin doble negación |
| Tipografía | Sans-serif, ≥ 18sp, interlineado ≥ 1.5 |
| Iconografía | Pictogramas acompañan instrucciones clave |

---

### NFR-403: Accesibilidad Física

| Criterio | Detalle |
|----------|---------|
| Datos de accesibilidad | 100% de segmentos evaluados para movilidad reducida |
| Pendiente máxima | Configurable por usuario (default 8%) |
| Ancho mínimo | Configurable por usuario (default 1.5m) |
| Actualización | Datos revisables sin deploy (actualización de seed/BD) |

---

## 4. Modelos de Datos

### 4.1 Extensión del Prisma Schema

```prisma
// Extensión de RouteSegment para Fase 4
model RouteSegment {
  // ... campos existentes de Fases 1-3 ...

  // FR-401: Accesibilidad física
  hasRamp          Boolean  @default(false) @map("has_ramp")
  hasStairs        Boolean  @default(false) @map("has_stairs")
  pathWidth        Float    @default(2.0) @map("path_width")     // metros
  maxSlope         Float    @default(0.0) @map("max_slope")      // porcentaje
  surfaceQuality   String   @default("good") @map("surface_quality") // good, fair, poor
}
```

### 4.2 Nuevos tipos compartidos

```typescript
// packages/shared-types/src/mobility.ts
export type SurfaceQuality = "good" | "fair" | "poor";

export interface PhysicalAccessibility {
  hasRamp: boolean;
  hasStairs: boolean;
  pathWidth: number;       // metros
  maxSlope: number;        // porcentaje (0-100)
  surfaceQuality: SurfaceQuality;
}

export type AccessibilityProfile =
  | "standard"
  | "visual_disability"
  | "reduced_mobility"
  | "deaf"
  | "easy_read";

// apps/mobile/src/haptics/hapticPatterns.ts
export type HapticPattern =
  | "turn_left"      // 2 pulsos cortos
  | "turn_right"     // 3 pulsos cortos
  | "go_straight"    // 1 pulso largo
  | "alert_risk"     // pulsos rápidos 1s
  | "arrival"        // 3 pulsos largos
  | "off_route";     // 2 pulsos largos
```

---

## 5. Contratos de API

### 5.1 Extensión de segmentos existentes

```json
// GET /api/routes/:id — segmento con datos de accesibilidad física
{
  "properties": {
    "featureType": "route-segment",
    "segmentId": "seg-medicina-odonto",
    "surfaceType": "paved",
    "riskLevel": "none",
    "hasRamp": true,
    "hasStairs": false,
    "pathWidth": 2.5,
    "maxSlope": 3.2,
    "surfaceQuality": "good"
  }
}
```

### 5.2 Nuevo endpoint de lectura fácil

```
POST /api/text/easy-read
Body: { "text": "Continúa recto por la Avenida Complutense durante 135 metros", "context": "navigation" }
Response: { "original": "...", "simplified": "Camina recto. Son 135 metros.", "source": "ai" | "template" }
```

### 5.3 Pesos por perfil

```
GET /api/routes/calculate?profile=reduced_mobility
→ Usa WeightFactors ajustados para movilidad reducida
```

---

## 6. Arquitectura de Componentes

### 6.1 Nuevos servicios

| Servicio | Archivo | Responsabilidad |
|----------|---------|----------------|
| MobilityAssessmentService | `services/mobilityAssessmentService.ts` | Evalúa accesibilidad física por segmento |
| EasyReadService | `server/services/easyReadService.ts` | Simplifica textos con IA (Claude) |
| EasyReadAdapter | `services/easyReadAdapter.ts` | Adapta instrucciones en el cliente |
| HapticNavigationService | `haptics/hapticNavigationService.ts` | Traduce instrucciones a patrones hápticos |
| ProfileWeights | `server/services/profileWeights.ts` | Calcula pesos de routing por perfil |

### 6.2 Nuevos componentes

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| ProfileCard | `components/ProfileCard.tsx` | Tarjeta descriptiva de perfil |
| MobilityAlert | `components/MobilityAlert.tsx` | Alerta de barrera física |
| HapticIndicator | `components/HapticIndicator.tsx` | Indicador visual de dirección (sordos) |

### 6.3 Nuevos hooks

| Hook | Archivo | Returns |
|------|---------|---------|
| `useHapticNavigation(instruction)` | `hooks/useHapticNavigation.ts` | `{ vibrate, pattern }` |
| `useEasyRead(text)` | `hooks/useEasyRead.ts` | `{ simplified, isLoading }` |
| `useMobilityCheck(segment)` | `hooks/useMobilityCheck.ts` | `{ isAccessible, warnings }` |

---

## 7. Mapa de Dependencias

```
apps/mobile ──→ expo-haptics (vibración direccional)
apps/mobile ──→ packages/shared-types (tipos movilidad, háptica, perfiles)
server ────────→ @anthropic-ai/sdk (lectura fácil con IA)
server ────────→ packages/shared-types (tipos compartidos)

Build order: shared-types → routing-engine → mobile + server (paralelo)
```

---

## 8. Definition of Done por Tarea

### T4.1 — Perfil de Movilidad Reducida

- **Spec IDs:** FR-401, FR-405, NFR-403
- **Archivos:** `shared-types/mobility.ts`, `schema.prisma`, `seed.ts`, `services/mobilityAssessmentService.ts`, `components/MobilityAlert.tsx`, `services/profileWeights.ts`
- **Tests:** TST-FR-401-001 (barrera detectada), TST-FR-401-002 (ruta alternativa), TST-FR-405-001 (pesos por perfil)
- **Done:** Navegación funcional evitando barreras físicas

### T4.2 — Perfil de Diversidad Intelectual — Lectura Fácil

- **Spec IDs:** FR-402, NFR-402
- **Archivos:** `server/services/easyReadService.ts`, `services/easyReadAdapter.ts`, `data/easy-read/templates.json`
- **Tests:** TST-FR-402-001 (simplificación con IA), TST-FR-402-002 (fallback plantillas), TST-FR-402-003 (longitud frase ≤ 10 palabras)
- **Done:** Instrucciones simplificadas funcionales con fallback

### T4.3 — Perfil de Personas Sordas — Háptica Direccional

- **Spec IDs:** FR-403, NFR-401
- **Archivos:** `haptics/hapticPatterns.ts`, `haptics/hapticNavigationService.ts`, `components/HapticIndicator.tsx`
- **Tests:** TST-FR-403-001 (patrón giro izquierda), TST-FR-403-002 (patrón alerta), TST-FR-403-003 (latencia < 100ms)
- **Done:** Navegación funcional con vibración direccional

### T4.4 — Selector de Perfil Multi-Accesibilidad

- **Spec IDs:** FR-404
- **Archivos:** `store/accessibilityStore.ts`, `components/ProfileSelector.tsx`, `components/ProfileCard.tsx`, `screens/AccessibilitySettingsScreen.tsx`
- **Tests:** TST-FR-404-001 (4 perfiles disponibles), TST-FR-404-002 (cambio inmediato)
- **Done:** Selector con 4 perfiles funcionales, cambio en tiempo real

### T4.5 — Pesos de Ruta por Perfil

- **Spec IDs:** FR-405
- **Archivos:** `server/services/profileWeights.ts`, `server/services/routingService.ts`, `shared-types/graph.ts`
- **Tests:** TST-FR-405-001 (penalización escalones), TST-FR-405-002 (rutas diferentes por perfil)
- **Done:** Routing diferenciado por perfil de accesibilidad

---

## 9. Especificaciones de Tests

### 9.1 Unit Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-401-001 | MobilityAssessmentService | Detecta barrera (escalones) en segmento | FR-401 |
| TST-FR-401-002 | MobilityAssessmentService | Advierte pendiente > umbral configurable | FR-401, NFR-403 |
| TST-FR-402-001 | EasyReadService | Simplifica instrucción con Claude API | FR-402 |
| TST-FR-402-002 | EasyReadService | Usa plantilla cuando API no disponible | FR-402 |
| TST-FR-402-003 | EasyReadAdapter | Frase simplificada ≤ 10 palabras | FR-402, NFR-402 |
| TST-FR-403-001 | HapticNavigationService | Genera patrón correcto para giro izquierda | FR-403 |
| TST-FR-403-002 | HapticNavigationService | Genera patrón de alerta para riesgo alto | FR-403 |
| TST-FR-403-003 | HapticNavigationService | Latencia de vibración < 100ms | FR-403, NFR-401 |
| TST-FR-404-001 | AccessibilityStore | Muestra 4 perfiles en selector | FR-404 |
| TST-FR-404-002 | AccessibilityStore | Cambio de perfil aplica inmediatamente | FR-404 |
| TST-FR-405-001 | ProfileWeights | Penaliza escalones x10 para movilidad reducida | FR-405 |
| TST-FR-405-002 | RoutingService | Genera rutas diferentes por perfil | FR-405 |

---

## 10. Orden de Implementación

### Dependencias entre tareas

```
T4.4 (Selector de Perfil) ← base para todos los perfiles
  ├── T4.1 (Movilidad Reducida) ← necesita datos en BD
  │     └── T4.5 (Pesos por Perfil) ← necesita tipos de T4.1
  ├── T4.2 (Lectura Fácil) ← independiente de T4.1
  └── T4.3 (Háptica Sordos) ← independiente de T4.1
```

### Orden sugerido

1. **T4.4** — Selector multi-perfil (base para los demás)
2. **T4.1** — Movilidad reducida (schema + datos + servicio)
3. **T4.5** — Pesos por perfil (depende de T4.1)
4. **T4.2** — Lectura fácil (independiente, usa IA)
5. **T4.3** — Háptica sordos (independiente)

**Camino crítico:** T4.4 → T4.1 → T4.5

### Notas de implementación

1. T4.4 debe extender el `accessibilityStore` existente con los nuevos perfiles
2. T4.1 requiere migración de Prisma y actualización del seed
3. T4.2 reutiliza la infraestructura de `@anthropic-ai/sdk` ya instalada (T3.7)
4. T4.3 necesita `expo-haptics` (nuevo paquete nativo, requiere `expo install`)
5. T4.5 modifica el motor de routing existente — tests de regresión importantes

---

*Documento creado: 2026-03-21*
