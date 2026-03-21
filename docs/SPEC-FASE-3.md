# Especificación de Desarrollo — Fase 3: Accesibilidad Visual y Audio 3D

> **Versión:** 1.0 | **Fecha:** 2026-03-20 | **Estado:** Draft
> **Prefijo IDs:** FR-3XX (funcionales), NFR-3XX (no funcionales)
> **Fase anterior:** Fase 2 completada (2026-03-20) — ver `SPEC-FASE-2.md`

---

## 1. Alcance

### En Scope (Fase 3)

Las 7 tareas del plan maestro para esta fase:
- Audio espacializado 3D con HRTF (Head-Related Transfer Function)
- Sistema de audio-descripciones contextuales (obstáculos, desniveles, cruces)
- Integración completa con TalkBack (Android) y VoiceOver (iOS)
- Evaluación y clasificación de riesgos por segmento de ruta
- Perfil de usuario para discapacidad visual con preferencias configurables
- Compatibilidad con auriculares de conducción ósea
- Agente IA para generación automática de audio-descripciones a partir de datos topográficos

### Fuera de Scope

- Perfil de movilidad reducida (Fase 4)
- Perfil de diversidad intelectual / lectura fácil (Fase 4)
- Perfil de personas sordas / háptica direccional (Fase 4)
- Panel de administración web (Fase 5)
- Sistema de incidencias (Fase 5)
- Autenticación de usuarios (Fase 5)

### Dependencias de Fase 2

| Componente | Estado | Notas |
|-----------|--------|-------|
| Route Graph Model | ✅ Funcionando | Grafo con aristas puente inter-ruta, 14 nodos, 30 aristas |
| Dijkstra Pathfinding | ✅ Funcionando | Ruta óptima < 500ms, paquete `@campus-gps/routing-engine` |
| Snap-to-Route | ✅ Funcionando | Umbral 30m, proyección punto-a-segmento |
| Turn-by-Turn Instructions | ✅ Funcionando | Instrucciones en español, trigger a 15m, llegada a 10m |
| Transport Connections | ✅ Funcionando | Metro línea 6, bus líneas G/U en datos |
| Destination Search | ✅ Funcionando | GET /api/waypoints/search, debounce 300ms |
| Route Calculation API | ✅ Funcionando | POST /api/routes/calculate, validación Zod |
| Navigation Screen | ✅ Funcionando | Mapa + instrucciones + progreso + alertas |

---

## 2. Requisitos Funcionales

### FR-301: Audio Espacializado 3D (Audio Beacons)

**Descripción:** Sistema de audio 3D que emite sonidos direccionales ("audio beacons") para guiar al usuario hacia el siguiente waypoint. El sonido cambia de dirección relativa a la orientación del usuario, permitiendo navegación intuitiva sin mirar la pantalla.

**Referencia:** Microsoft Soundscape (MIT) — `soundscape-community/soundscape`

**Criterios de aceptación:**

```gherkin
Given la navegación activa y el audio beacon habilitado
When el siguiente waypoint está al frente del usuario
Then el sonido se reproduce centrado (stereo igual)

Given la navegación activa
When el siguiente waypoint está a la izquierda del usuario
Then el sonido se reproduce predominantemente por el canal izquierdo

Given la navegación activa
When el siguiente waypoint está detrás del usuario
Then el sonido se reproduce atenuado y con efecto de "detrás"

Given la orientación del dispositivo (brújula)
When el usuario gira el cuerpo/teléfono
Then la dirección del audio beacon se actualiza en tiempo real (< 100ms)

Given las preferencias del usuario
When configura "sin audio beacon"
Then la navegación funciona solo con instrucciones de texto/TalkBack

Given el usuario con auriculares de conducción ósea
When navega con audio beacons
Then el audio se adapta a salida mono-espacializada compatible
```

**Archivos requeridos:**
- `apps/mobile/src/audio/audioBeaconEngine.ts` (motor de audio 3D)
- `apps/mobile/src/audio/hrtfProcessor.ts` (procesamiento HRTF)
- `apps/mobile/src/audio/audioBeaconEngine.test.ts`
- `apps/mobile/src/hooks/useAudioBeacon.ts`
- `apps/mobile/src/hooks/useCompass.ts`

---

### FR-302: Audio-Descripciones Contextuales

**Descripción:** El sistema genera y reproduce descripciones en audio del entorno cercano durante la navegación: tipo de superficie, obstáculos, desniveles, cruces, puntos de interés y riesgos.

**Criterios de aceptación:**

```gherkin
Given un segmento con surfaceType = "cobblestone"
When el usuario entra en ese segmento
Then se anuncia "Atención: suelo adoquinado" por voz

Given un segmento con elevationChange > 3m
When el usuario se acerca al segmento
Then se anuncia "Cuesta arriba pronunciada, {X} metros de desnivel"

Given un segmento con riskLevel = "medium" o "high"
When el usuario se acerca al segmento
Then se anuncia "Precaución: {descripción del riesgo}" con vibración

Given un waypoint de tipo "intersection"
When el usuario llega a la intersección
Then se describe el cruce: "Cruce con {nombre}, continúa {dirección}"

Given un waypoint de tipo "transport_stop"
When el usuario llega a la parada
Then se anuncia: "Parada de {tipo}: líneas {líneas}"

Given las audio-descripciones
When el usuario configura "descripciones reducidas"
Then solo se anuncian riesgos y giros, no superficies ni POIs
```

**Archivos requeridos:**
- `apps/mobile/src/services/audioDescriptionService.ts`
- `apps/mobile/src/services/audioDescriptionService.test.ts`
- `apps/mobile/src/services/ttsService.ts` (text-to-speech wrapper)
- `data/audio-descriptions/templates.json` (plantillas de descripción)

---

### FR-303: Integración TalkBack / VoiceOver

**Descripción:** La app funciona completamente con lectores de pantalla nativos (TalkBack en Android, VoiceOver en iOS), con navegación por gestos, anuncios live region, y focus management correcto.

**Criterios de aceptación:**

```gherkin
Given TalkBack activado
When el usuario abre la app
Then puede navegar por todos los elementos con swipe izquierda/derecha

Given la pantalla de navegación activa con TalkBack
When cambia la instrucción actual
Then TalkBack anuncia automáticamente la nueva instrucción (live region)

Given el mapa con waypoints
When TalkBack está activo y el usuario toca un waypoint
Then se anuncia: "{nombre}, {tipo}, doble toque para seleccionar"

Given una alerta (off-route, GPS lost, arrival)
When aparece en pantalla
Then TalkBack la anuncia inmediatamente como alerta

Given la barra de búsqueda con TalkBack
When el usuario escribe y aparecen resultados
Then TalkBack anuncia "{N} resultados" y permite navegar la lista

Given el cambio entre MapScreen y NavigationScreen
When TalkBack está activo
Then el foco se mueve al elemento principal de la nueva pantalla
```

**Archivos requeridos:**
- `apps/mobile/src/accessibility/screenReaderService.ts`
- `apps/mobile/src/accessibility/screenReaderService.test.ts`
- `apps/mobile/src/accessibility/focusManager.ts`
- Actualizaciones de a11y props en todos los componentes existentes

---

### FR-304: Evaluación de Riesgos por Segmento

**Descripción:** Cada segmento de ruta tiene una evaluación detallada de riesgos con categorías específicas, visible en la navegación y prioritaria en las audio-descripciones.

**Criterios de aceptación:**

```gherkin
Given un segmento de ruta
When inspecciono sus datos
Then tiene campos: riskLevel (none/low/medium/high), riskDescription, riskFactors[]

Given los factores de riesgo de un segmento
When son múltiples (ej: "cruce sin semáforo" + "mala iluminación")
Then todos se listan en la evaluación y se anuncian por audio

Given una ruta calculada con segmentos de riesgo "high"
When se muestran las instrucciones
Then los segmentos de alto riesgo se resaltan visualmente (color naranja/rojo) y por audio

Given la pantalla de navegación
When el usuario se acerca a un segmento de alto riesgo
Then se reproduce una alerta háptica + audio antes de entrar al segmento

Given el endpoint GET /api/routes/:id
When inspecciono un segmento
Then incluye riskDescription y riskFactors[] en las propiedades
```

**Archivos requeridos:**
- `server/prisma/schema.prisma` (campos riskDescription, riskFactors en RouteSegment)
- `packages/shared-types/src/risk.ts` (tipos de riesgo)
- `server/prisma/seed.ts` (datos de riesgo actualizados)
- `apps/mobile/src/components/RiskAlert.tsx`

---

### FR-305: Perfil de Accesibilidad Visual

**Descripción:** Perfil de usuario configurable para personas con discapacidad visual, con preferencias que ajustan el comportamiento de audio beacons, audio-descripciones, TTS y contraste.

**Criterios de aceptación:**

```gherkin
Given un usuario nuevo
When abre la app por primera vez
Then se muestra un selector de perfil con opciones: "Estándar", "Discapacidad visual"

Given el perfil "Discapacidad visual" activo
When navega por la app
Then: audio beacons ON, audio-descripciones ON, TTS para instrucciones ON, alto contraste ON

Given el perfil "Estándar" activo
When navega por la app
Then: audio beacons OFF, audio-descripciones OFF, instrucciones solo visuales

Given las preferencias del perfil visual
When el usuario las configura
Then puede ajustar: volumen beacon, frecuencia descripciones, velocidad TTS, tipo de voz

Given el perfil del usuario
When cierra y reabre la app
Then las preferencias se mantienen (almacenamiento local)

Given la pantalla de configuración
When TalkBack está activo
Then todos los controles son accesibles con labels descriptivos en español
```

**Archivos requeridos:**
- `apps/mobile/src/store/accessibilityStore.ts` (Zustand store)
- `apps/mobile/src/screens/ProfileScreen.tsx`
- `apps/mobile/src/screens/AccessibilitySettingsScreen.tsx`
- `apps/mobile/src/components/ProfileSelector.tsx`

---

### FR-306: Compatibilidad Auriculares de Conducción Ósea

**Descripción:** Soporte para auriculares de conducción ósea (ej: AfterShokz/Shokz), que transmiten sonido por vibración ósea dejando el oído libre para sonidos ambientales — esencial para seguridad de usuarios con discapacidad visual.

**Criterios de aceptación:**

```gherkin
Given auriculares de conducción ósea conectados
When se reproducen audio beacons
Then el audio se adapta a mono-espacializado (sin HRTF estéreo completo)

Given auriculares de conducción ósea
When se reproduce TTS
Then la voz es clara y a volumen adecuado para vibración ósea

Given la configuración de audio
When el usuario selecciona "Auriculares de conducción ósea"
Then el motor de audio ajusta: mono output, volumen +20%, sin graves profundos

Given auriculares normales
When el usuario cambia a conducción ósea en configuración
Then el cambio se aplica inmediatamente sin reiniciar la navegación
```

**Archivos requeridos:**
- `apps/mobile/src/audio/boneConduction.ts` (adaptador de salida)
- `apps/mobile/src/audio/boneConduction.test.ts`
- Actualización de `accessibilityStore.ts` con preferencia de auriculares

---

### FR-307: Generación IA de Audio-Descripciones

**Descripción:** Agente que utiliza la API de Claude para generar automáticamente audio-descripciones a partir de datos topográficos (tipo de superficie, elevación, riesgos, POIs cercanos).

**Criterios de aceptación:**

```gherkin
Given datos topográficos de un segmento (surface, elevation, risk, POIs)
When ejecuto el generador de descripciones
Then genera una descripción contextual en español, clara y concisa (< 100 caracteres)

Given un segmento con adoquinado + cuesta + riesgo medio
When genero la descripción
Then incluye todos los factores relevantes: "Adoquinado con cuesta moderada, precaución en cruce"

Given las descripciones generadas
When las reviso
Then siguen las guías de lenguaje claro (frases cortas, vocabulario sencillo, sin tecnicismos)

Given un lote de segmentos sin descripción
When ejecuto el generador en batch
Then genera descripciones para todos y las almacena en la BD

Given la API de Claude no disponible
When intento generar descripciones
Then se usan plantillas predefinidas como fallback
```

**Archivos requeridos:**
- `server/src/services/descriptionGenerator.ts`
- `server/src/services/descriptionGenerator.test.ts`
- `data/audio-descriptions/templates.json` (plantillas fallback)
- `packages/shared-types/src/audioDescription.ts` (tipos)

---

## 3. Requisitos No Funcionales

### NFR-301: Latencia de Audio

| Métrica | Criterio |
|---------|----------|
| Actualización dirección beacon | < 100ms desde cambio de orientación |
| Inicio de TTS | < 300ms desde trigger |
| Audio-descripción contextual | < 500ms desde entrada a nuevo segmento |
| Cambio modo conducción ósea | Inmediato, sin corte de audio |

---

### NFR-302: Accesibilidad WCAG 2.1 AA

| Criterio | Detalle |
|----------|---------|
| TalkBack/VoiceOver | 100% de elementos interactivos etiquetados |
| Contraste | ≥ 4.5:1 texto, ≥ 3:1 gráficos (modo alto contraste: ≥ 7:1) |
| Focus visible | Indicador de foco visible en todos los elementos interactivos |
| Touch targets | ≥ 48x48 dp (perfil visual: ≥ 56x56 dp) |
| Timing | Sin límites de tiempo en interacciones |
| Motion | Respetar preferencia `prefers-reduced-motion` |

---

### NFR-303: Calidad de Audio

| Criterio | Detalle |
|---------|---------|
| Sample rate | ≥ 44.1 kHz para audio beacons |
| Latencia | < 50ms de latencia de audio (buffer mínimo) |
| HRTF | Dataset MIT KEMAR o equivalente libre |
| TTS | Voz natural en español (voz del sistema o engine custom) |
| Volumen | Ajustable independientemente: beacons, TTS, descripciones |

---

### NFR-304: Rendimiento con Audio

| Criterio | Detalle |
|---------|---------|
| Batería | Audio beacons no incrementan consumo > 15% vs navegación sin audio |
| CPU | Procesamiento HRTF < 5% CPU en dispositivos medios |
| Memoria | Audio engine < 30 MB RAM adicional |
| Background | Audio continúa cuando la pantalla se apaga |

---

## 4. Modelos de Datos

### 4.1 Extensión del Prisma Schema

```prisma
// Extensión de RouteSegment para Fase 3
model RouteSegment {
  // ... campos existentes ...
  riskDescription  String?   // Descripción legible del riesgo
  riskFactors      String[]  @default([])  // ["cruce sin semáforo", "mala iluminación"]
  audioDescription String?   // Descripción para audio (generada por IA o manual)
}

// Nuevo modelo para preferencias de accesibilidad
model AccessibilityProfile {
  id               String   @id @default(cuid())
  deviceId         String   @unique  // Identificador anónimo del dispositivo
  profileType      String   @default("standard")  // "standard" | "visual"
  audioBeacons     Boolean  @default(false)
  audioDescriptions Boolean @default(false)
  ttsEnabled       Boolean  @default(true)
  ttsSpeed         Float    @default(1.0)  // 0.5 - 2.0
  highContrast     Boolean  @default(false)
  boneConduction   Boolean  @default(false)
  beaconVolume     Float    @default(0.7)  // 0.0 - 1.0
  descriptionLevel String   @default("full")  // "full" | "reduced" | "risks_only"
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("accessibility_profiles")
}
```

### 4.2 TypeScript Types — Audio

```typescript
// packages/shared-types/src/audio.ts

export interface AudioBeaconConfig {
  enabled: boolean;
  volume: number;         // 0.0 - 1.0
  soundType: 'click' | 'tone' | 'chime';
  boneConduction: boolean;
}

export interface AudioDescriptionConfig {
  enabled: boolean;
  level: 'full' | 'reduced' | 'risks_only';
  ttsSpeed: number;       // 0.5 - 2.0
  ttsVoice: string;       // ID de voz del sistema
}

export interface SpatialAudioPosition {
  azimuth: number;        // -180 a 180 grados (0 = frente)
  elevation: number;      // -90 a 90 grados
  distance: number;       // metros
}
```

### 4.3 TypeScript Types — Riesgos

```typescript
// packages/shared-types/src/risk.ts

export interface RiskAssessment {
  level: 'none' | 'low' | 'medium' | 'high';
  description: string;    // Descripción legible en español
  factors: RiskFactor[];
}

export type RiskFactor =
  | 'cruce_sin_semaforo'
  | 'mala_iluminacion'
  | 'superficie_irregular'
  | 'pendiente_pronunciada'
  | 'trafico_vehicular'
  | 'obras_temporales'
  | 'escalones'
  | 'sin_barandilla'
  | 'paso_estrecho';
```

### 4.4 TypeScript Types — Perfil de Accesibilidad

```typescript
// packages/shared-types/src/accessibilityProfile.ts

export type ProfileType = 'standard' | 'visual';

export interface AccessibilityPreferences {
  profileType: ProfileType;
  audioBeacons: AudioBeaconConfig;
  audioDescriptions: AudioDescriptionConfig;
  highContrast: boolean;
  enlargedTouchTargets: boolean;  // 56dp en vez de 48dp
}

export const DEFAULT_VISUAL_PROFILE: AccessibilityPreferences = {
  profileType: 'visual',
  audioBeacons: { enabled: true, volume: 0.7, soundType: 'click', boneConduction: false },
  audioDescriptions: { enabled: true, level: 'full', ttsSpeed: 1.0, ttsVoice: 'default' },
  highContrast: true,
  enlargedTouchTargets: true,
};

export const DEFAULT_STANDARD_PROFILE: AccessibilityPreferences = {
  profileType: 'standard',
  audioBeacons: { enabled: false, volume: 0.5, soundType: 'click', boneConduction: false },
  audioDescriptions: { enabled: false, level: 'reduced', ttsSpeed: 1.0, ttsVoice: 'default' },
  highContrast: false,
  enlargedTouchTargets: false,
};
```

---

## 5. Contratos API

### GET /api/segments/:id/audio-description

| Campo | Valor |
|-------|-------|
| **Método** | GET |
| **Path** | `/api/segments/:id/audio-description` |
| **Response 200** | `{ description: string, generatedBy: 'ai' \| 'template' \| 'manual' }` |
| **Response 404** | `ApiErrorResponse` con code `SEGMENT_NOT_FOUND` |

---

### POST /api/audio-descriptions/generate

| Campo | Valor |
|-------|-------|
| **Método** | POST |
| **Path** | `/api/audio-descriptions/generate` |
| **Body** | `{ segmentIds: string[] }` (vacío = todos sin descripción) |
| **Response 200** | `{ generated: number, failed: number, descriptions: { segmentId: string, description: string }[] }` |
| **Auth** | Requiere clave API (solo admin/dev) |

---

### GET /api/routes/:id (actualizado)

Extensión del response existente para incluir audio-descripciones y riesgos detallados en las propiedades de cada segmento:

```json
{
  "properties": {
    "featureType": "route-segment",
    "segmentId": "seg-farmacia-bus",
    "surfaceType": "paved",
    "elevationChange": -2.3,
    "riskLevel": "low",
    "riskDescription": "Cruce con tráfico moderado",
    "riskFactors": ["cruce_sin_semaforo", "trafico_vehicular"],
    "audioDescription": "Camino pavimentado con ligero descenso. Precaución en cruce con tráfico."
  }
}
```

---

## 6. Arquitectura de Componentes

### 6.1 Screens (nuevos)

| Screen | Archivo | Descripción |
|--------|---------|-------------|
| ProfileScreen | `screens/ProfileScreen.tsx` | Selector de perfil de accesibilidad |
| AccessibilitySettingsScreen | `screens/AccessibilitySettingsScreen.tsx` | Configuración detallada del perfil visual |

### 6.2 Components (nuevos)

| Componente | Archivo | Props Principales | a11y |
|-----------|---------|-------------------|------|
| ProfileSelector | `components/ProfileSelector.tsx` | `onSelect(profile)` | label: "Seleccionar perfil de accesibilidad" |
| RiskAlert | `components/RiskAlert.tsx` | `risk`, `segmentName` | role: "alert", liveRegion: "assertive" |
| AudioBeaconIndicator | `components/AudioBeaconIndicator.tsx` | `direction`, `active` | label: "Audio beacon {dirección}" |
| VolumeSlider | `components/VolumeSlider.tsx` | `value`, `onChange`, `label` | role: "adjustable" |
| HighContrastToggle | `components/HighContrastToggle.tsx` | `enabled`, `onToggle` | label: "Activar alto contraste" |

### 6.3 Services (nuevos)

| Service | Archivo | Responsabilidad |
|---------|---------|----------------|
| AudioBeaconEngine | `audio/audioBeaconEngine.ts` | Motor de audio espacializado 3D |
| HRTFProcessor | `audio/hrtfProcessor.ts` | Procesamiento HRTF para stereo |
| BoneConduction | `audio/boneConduction.ts` | Adaptador para auriculares de conducción ósea |
| TTSService | `services/ttsService.ts` | Wrapper de text-to-speech nativo |
| AudioDescriptionService | `services/audioDescriptionService.ts` | Generación y reproducción de descripciones |
| ScreenReaderService | `accessibility/screenReaderService.ts` | Detección y gestión de screen reader |
| FocusManager | `accessibility/focusManager.ts` | Gestión de foco para TalkBack/VoiceOver |
| DescriptionGenerator (server) | `server/src/services/descriptionGenerator.ts` | Generación IA de audio-descripciones |

### 6.4 Hooks (nuevos)

| Hook | Archivo | Retorno |
|------|---------|---------|
| `useAudioBeacon(target)` | `hooks/useAudioBeacon.ts` | `{ isPlaying, direction, toggle }` |
| `useCompass()` | `hooks/useCompass.ts` | `{ heading, accuracy }` |
| `useScreenReader()` | `hooks/useScreenReader.ts` | `{ isActive, announce(msg) }` |
| `useAccessibilityProfile()` | `hooks/useAccessibilityProfile.ts` | `{ profile, updatePreference }` |
| `useAudioDescription(segment)` | `hooks/useAudioDescription.ts` | `{ description, play, isPlaying }` |

### 6.5 Stores (nuevos)

| Store | Archivo | Estado |
|-------|---------|--------|
| accessibilityStore | `store/accessibilityStore.ts` | `{ profile, preferences, updatePreference, setProfile }` |
| audioStore | `store/audioStore.ts` | `{ isBeaconActive, isTTSPlaying, volumes }` |

---

## 7. Mapa de Dependencias

```
apps/mobile ──→ expo-av (audio playback)
apps/mobile ──→ expo-sensors (magnetometer/compass)
apps/mobile ──→ expo-speech (TTS)
apps/mobile ──→ expo-haptics (vibración para riesgos)
apps/mobile ──→ @react-native-async-storage/async-storage (preferencias)
apps/mobile ──→ packages/shared-types (tipos audio, riesgo, perfil)
server ────────→ @anthropic-ai/sdk (generación de descripciones)

Build order: shared-types → routing-engine → mobile + server (paralelo)
```

---

## 8. Definition of Done por Tarea

### T3.1 — Audio Beacons con HRTF

- **Spec IDs:** FR-301, NFR-301, NFR-303
- **Archivos:** `audio/audioBeaconEngine.ts`, `audio/hrtfProcessor.ts`, `hooks/useAudioBeacon.ts`, `hooks/useCompass.ts`
- **Tests:** TST-FR-301-001 (dirección audio), TST-FR-301-002 (latencia), TST-FR-301-003 (compass)
- **Done:** Sonido direccional funcional que guía hacia el siguiente waypoint

### T3.2 — Audio-Descripciones Contextuales

- **Spec IDs:** FR-302, NFR-301
- **Archivos:** `services/audioDescriptionService.ts`, `services/ttsService.ts`, `data/audio-descriptions/templates.json`
- **Tests:** TST-FR-302-001 (descripción por superficie), TST-FR-302-002 (descripción por riesgo), TST-FR-302-003 (TTS trigger)
- **Done:** Descripciones automáticas al entrar en cada segmento

### T3.3 — Integración TalkBack / VoiceOver

- **Spec IDs:** FR-303, NFR-302
- **Archivos:** `accessibility/screenReaderService.ts`, `accessibility/focusManager.ts`
- **Tests:** TST-FR-303-001 (live region), TST-FR-303-002 (focus management), checklist manual TalkBack
- **Done:** App 100% navegable con TalkBack, anuncios automáticos

### T3.4 — Evaluación de Riesgos Detallada

- **Spec IDs:** FR-304
- **Archivos:** `schema.prisma` (actualizado), `shared-types/src/risk.ts`, `components/RiskAlert.tsx`, `seed.ts`
- **Tests:** TST-FR-304-001 (risk factors), TST-FR-304-002 (alert visual/audio)
- **Done:** Riesgos detallados en BD, alertas visuales y sonoras

### T3.5 — Perfil de Accesibilidad Visual

- **Spec IDs:** FR-305, NFR-302
- **Archivos:** `store/accessibilityStore.ts`, `screens/ProfileScreen.tsx`, `screens/AccessibilitySettingsScreen.tsx`
- **Tests:** TST-FR-305-001 (perfil persistencia), TST-FR-305-002 (preferencias aplican)
- **Done:** Selector de perfil funcional, preferencias persistentes, UI adaptada

### T3.6 — Conducción Ósea

- **Spec IDs:** FR-306, NFR-303
- **Archivos:** `audio/boneConduction.ts`, actualización `accessibilityStore.ts`
- **Tests:** TST-FR-306-001 (mono output), TST-FR-306-002 (volumen ajustado)
- **Done:** Audio adaptado para auriculares de conducción ósea

### T3.7 — Generador IA de Descripciones

- **Spec IDs:** FR-307
- **Archivos:** `server/src/services/descriptionGenerator.ts`, `data/audio-descriptions/templates.json`
- **Tests:** TST-FR-307-001 (generación con Claude), TST-FR-307-002 (fallback plantillas)
- **Done:** Generación automática funcional con fallback a plantillas

---

## 9. Especificaciones de Tests

### 9.1 Unit Tests (Vitest)

| Test ID | Módulo | Descripción | Validates |
|---------|--------|-------------|-----------|
| TST-FR-301-001 | AudioBeaconEngine | Calcula posición estéreo correcta desde azimuth | FR-301 |
| TST-FR-301-002 | AudioBeaconEngine | Latencia de actualización < 100ms | FR-301, NFR-301 |
| TST-FR-301-003 | useCompass | Retorna heading normalizado 0-360 | FR-301 |
| TST-FR-302-001 | AudioDescriptionService | Genera descripción para superficie cobblestone | FR-302 |
| TST-FR-302-002 | AudioDescriptionService | Genera descripción para segmento con riesgo alto | FR-302 |
| TST-FR-302-003 | TTSService | Inicia TTS dentro de 300ms | FR-302, NFR-301 |
| TST-FR-303-001 | ScreenReaderService | Detecta TalkBack activo | FR-303 |
| TST-FR-303-002 | FocusManager | Mueve foco al cambiar pantalla | FR-303, NFR-302 |
| TST-FR-304-001 | RiskAssessment | Parsea factores de riesgo desde BD | FR-304 |
| TST-FR-304-002 | RiskAlert | Renderiza alerta con factores | FR-304 |
| TST-FR-305-001 | AccessibilityStore | Persiste perfil en AsyncStorage | FR-305 |
| TST-FR-305-002 | AccessibilityStore | Preferencias aplican a componentes | FR-305 |
| TST-FR-306-001 | BoneConduction | Convierte stereo a mono-espacializado | FR-306 |
| TST-FR-306-002 | BoneConduction | Ajusta volumen +20% | FR-306 |
| TST-FR-307-001 | DescriptionGenerator | Genera descripción con API Claude | FR-307 |
| TST-FR-307-002 | DescriptionGenerator | Usa plantilla cuando API no disponible | FR-307 |

### 9.2 Manual Checklist — TalkBack

- [ ] Navegación completa con swipe (todos los elementos accesibles)
- [ ] Instrucciones turn-by-turn anunciadas automáticamente
- [ ] Alertas de riesgo anunciadas al acercarse
- [ ] Búsqueda funcional con TalkBack (input, resultados, selección)
- [ ] Botón "Navegar" anunciado correctamente
- [ ] Modal de llegada anunciado como alerta
- [ ] Cambio de pantalla mueve foco correctamente
- [ ] Audio beacon no interfiere con TalkBack

### 9.3 Manual Checklist — Audio Beacons

- [ ] Sonido se mueve al girar el teléfono
- [ ] Sonido centrado cuando el waypoint está al frente
- [ ] Sonido por izquierda cuando waypoint está a la izquierda
- [ ] Sonido atenuado cuando waypoint está detrás
- [ ] Modo conducción ósea funciona correctamente
- [ ] Audio beacon se pausa durante anuncio TTS
- [ ] Audio continúa con pantalla apagada

---

## 10. Datos de Prueba Adicionales

Para Fase 3 se necesitan datos de riesgo y descripciones más ricos en el seed:

| Segmento | riskLevel | riskFactors | audioDescription |
|----------|-----------|-------------|------------------|
| seg-odonto-farmacia | low | ["superficie_irregular"] | "Tramo con adoquinado, superficie algo irregular" |
| seg-bus-metro | medium | ["cruce_sin_semaforo", "trafico_vehicular"] | "Cruce con tráfico moderado. Precaución." |
| seg-fisicas-odonto | medium | ["superficie_irregular", "pendiente_pronunciada"] | "Camino de grava con cuesta descendente" |
| seg-filosofia-bus | low | ["mala_iluminacion"] | "Adoquinado con poca iluminación por la noche" |

---

## 11. Orden de Implementación Recomendado

```
T3.4 (Riesgos) → T3.2 (Audio-Descripciones) → T3.7 (IA Descripciones)
                                                        ↓
T3.5 (Perfil Visual) → T3.1 (Audio Beacons) → T3.6 (Conducción Ósea)
                                                        ↓
                    T3.3 (TalkBack/VoiceOver) ──────────┘
```

**Camino crítico:** T3.4 → T3.2 → T3.1 → T3.3

**Razón del orden:**
1. T3.4 primero porque extiende el modelo de datos (base para todo lo demás)
2. T3.2 y T3.7 necesitan los datos de riesgo
3. T3.5 antes de T3.1 porque el perfil determina si los beacons se activan
4. T3.1 necesita el compass y el perfil
5. T3.6 es una variante de T3.1
6. T3.3 es transversal y se integra al final

---

*Documento generado: 2026-03-20 | Basado en Plan_Desarrollo_GPS_Accesible.md (Fase 3) y SPEC-FASE-2.md*
