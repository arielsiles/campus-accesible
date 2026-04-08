# Especificacion de Desarrollo — Fase 11: Camara Inteligente con Vision IA

> **Version:** 1.0 | **Fecha:** 2026-04-07 | **Estado:** Draft
> **Prefijo IDs:** FR-11XX (funcionales), NFR-11XX (no funcionales)
> **Fase anterior:** Fase 10 — ver `SPEC-FASE-10.md`
> **Dependencia clave:** Claude Vision API (Anthropic)

---

## 1. Alcance

### En Scope (Fase 11)

- Integracion de camara en la app con `react-native-vision-camera`
- Modo "Que veo?": capturar imagen y obtener descripcion IA del entorno
- Descripcion adaptada por perfil de accesibilidad (visual, movilidad, lectura facil)
- Deteccion de obstaculos y riesgos en la imagen
- Integracion con TTS para narrar la descripcion automaticamente
- Historial de capturas con descripciones
- Modo continuo: descripcion automatica cada N segundos durante navegacion

### Fuera de Scope

- OCR / lectura de texto en senales (Fase 12)
- Realidad aumentada con overlays (Fase 13)
- Procesamiento de video en streaming (solo capturas individuales)
- Entrenamiento de modelos custom (se usa Claude Vision)

---

## 2. Requisitos Funcionales

### FR-1101: Integracion de Camara

**Descripcion:** Agregar acceso a la camara del dispositivo con vista previa en tiempo real. La camara se usa como herramienta de exploracion del entorno, no como scanner continuo.

**Criterios de aceptacion:**

```gherkin
Given el usuario en el mapa principal
When pulsa el boton "Camara" (nuevo FAB)
Then se abre la vista de camara con botones de accion

Given la vista de camara abierta
When el usuario apunta a un lugar
Then ve la imagen en tiempo real (preview)

Given la vista de camara
When el usuario pulsa "Que veo?"
Then se captura la imagen y se envia a Claude Vision API

Given permisos de camara no concedidos
When el usuario intenta abrir la camara
Then se solicita permiso con explicacion accesible en espanol

Given la vista de camara
When TalkBack esta activo
Then todos los controles son accesibles con labels en espanol
```

**Archivos requeridos:**
- `apps/mobile/src/screens/CameraScreen.tsx` — vista de camara con controles
- `apps/mobile/src/hooks/useCamera.ts` — hook de permisos y captura
- `apps/mobile/src/services/cameraService.ts` — captura y procesamiento de imagen

---

### FR-1102: Descripcion IA del Entorno ("Que veo?")

**Descripcion:** Al capturar una imagen, se envia a Claude Vision API con contexto de navegacion (posicion GPS, ruta activa, perfil de accesibilidad) para obtener una descripcion rica y util del entorno.

**Criterios de aceptacion:**

```gherkin
Given una imagen capturada por la camara
When se envia a Claude Vision API
Then se recibe una descripcion del entorno en espanol adaptada al contexto

Given el perfil "discapacidad visual" activo
When se describe la imagen
Then el prompt prioriza: obstaculos en el camino, tipo de superficie, senalizacion, distancias estimadas, cambios de nivel

Given el perfil "movilidad reducida" activo
When se describe la imagen
Then el prompt prioriza: escaleras, rampas, ancho del paso, desniveles, bordillos

Given el perfil "lectura facil" activo
When se describe la imagen
Then la descripcion usa frases cortas (max 10 palabras), vocabulario simple

Given la descripcion recibida
When TTS esta habilitado
Then se lee automaticamente en voz alta

Given la API de Claude no disponible
When se intenta describir
Then se muestra mensaje "Sin conexion para analisis de imagen"

Given la descripcion completada
When se muestra al usuario
Then incluye: texto descriptivo, nivel de confianza, sugerencias de accion
```

**Prompt por perfil:**

| Perfil | Enfoque del prompt |
|--------|-------------------|
| **visual_disability** | Obstaculos, superficie, senales, distancias, objetos en el camino, cambios de nivel, iluminacion |
| **reduced_mobility** | Escaleras, rampas, ancho de paso, bordillos, tipo de suelo, pendientes visibles |
| **deaf** | Elementos visuales de alerta, semaforos, senalizacion de peligro |
| **easy_read** | Descripcion simple: "Hay un camino recto. A la izquierda hay un edificio grande." |
| **standard** | Descripcion general del entorno: edificios, calles, puntos de interes |

**Archivos requeridos:**
- `server/src/services/visionService.ts` — servicio de analisis de imagen con Claude Vision
- `server/src/services/visionService.test.ts`
- `server/src/routes/vision.ts` — POST /api/vision/describe
- `apps/mobile/src/services/visionService.ts` — cliente mobile
- `apps/mobile/src/services/visionService.test.ts`

---

### FR-1103: Contexto GPS + Ruta en la Descripcion

**Descripcion:** La descripcion de la imagen se enriquece con datos de contexto: posicion GPS actual, ruta activa (si hay), waypoints cercanos, segmento actual con datos de accesibilidad, e incidencias reportadas.

**Criterios de aceptacion:**

```gherkin
Given una imagen capturada durante navegacion activa
When se envia a la IA
Then el prompt incluye: "El usuario esta en el segmento X, a Y metros del waypoint Z, superficie: paved, riesgo: medium"

Given waypoints cercanos en la base de datos
When se describe la imagen
Then la IA puede referenciar: "A tu derecha deberia estar la Facultad de Medicina"

Given incidencias activas en la zona
When se describe la imagen
Then la IA advierte: "Hay obras reportadas a 50 metros adelante"

Given datos de clima disponibles
When se describe la imagen
Then la IA menciona: "El suelo puede estar resbaladizo por la lluvia"
```

---

### FR-1104: Historial de Capturas

**Descripcion:** Las capturas con sus descripciones se almacenan localmente para referencia posterior. Util para documentar barreras de accesibilidad o reportar incidencias con foto.

**Criterios de aceptacion:**

```gherkin
Given una descripcion completada
When se guarda automaticamente
Then se almacena: imagen (thumbnail), descripcion, ubicacion GPS, timestamp

Given el historial de capturas
When el usuario accede
Then ve las ultimas 20 capturas con miniatura y texto

Given una captura del historial
When el usuario la selecciona
Then puede ver la imagen completa y la descripcion, o crear un reporte de incidencia desde ella
```

**Archivos requeridos:**
- `apps/mobile/src/store/captureStore.ts` — historial de capturas
- `apps/mobile/src/screens/CaptureHistoryScreen.tsx`

---

### FR-1105: Modo Continuo (durante navegacion)

**Descripcion:** Durante la navegacion activa, la camara puede activarse en modo continuo — analiza el entorno cada 15-30 segundos automaticamente y anuncia cambios relevantes via TTS.

**Criterios de aceptacion:**

```gherkin
Given la navegacion activa con modo continuo habilitado
When pasan 15-30 segundos desde la ultima descripcion
Then se captura y analiza automaticamente

Given el modo continuo activo
When la IA detecta un cambio significativo (nuevo obstaculo, cambio de superficie)
Then lo anuncia via TTS

Given el modo continuo activo
When no hay cambios significativos
Then NO anuncia nada (evita saturar al usuario)

Given el perfil de personas sordas
When el modo continuo esta activo
Then las alertas se muestran como vibracion haptica + texto en pantalla

Given el consumo de bateria
When el modo continuo esta activo
Then se captura a resolucion reducida (640x480) para minimizar uso de API y bateria
```

**Archivos requeridos:**
- `apps/mobile/src/services/continuousScanService.ts`
- `apps/mobile/src/hooks/useContinuousScan.ts`

---

## 3. Requisitos No Funcionales

### NFR-1101: Rendimiento de Camara

| Metrica | Criterio |
|---------|----------|
| Tiempo de captura | < 500ms |
| Tiempo de analisis IA | < 5 segundos (red movil) |
| Resolucion de captura | 1280x960 (modo manual), 640x480 (modo continuo) |
| Consumo de bateria | < 20% por hora en modo continuo |
| Tamano de imagen enviada | < 500KB (compresion JPEG 70%) |

### NFR-1102: Calidad de Descripcion

| Criterio | Detalle |
|----------|---------|
| Idioma | Siempre en espanol |
| Longitud | 2-5 frases (modo manual), 1-2 frases (modo continuo) |
| Relevancia | Priorizar info de navegacion sobre estetica |
| Seguridad | Nunca describir personas identificables |
| Fallback | Mensaje generico si la imagen es oscura/borrosa |

### NFR-1103: Privacidad

| Criterio | Detalle |
|----------|---------|
| Almacenamiento | Imagenes solo en dispositivo, no en servidor |
| Transmision | Imagen se envia a Claude API y se descarta (no se almacena) |
| Rostros | El prompt instruye a la IA a NO identificar personas |
| Consentimiento | Aviso al activar camara: "Las imagenes se analizan con IA" |

---

## 4. Contratos de API

### 4.1 Describir imagen

```
POST /api/vision/describe
Headers: Content-Type: multipart/form-data
Body:
  - image: archivo JPEG/PNG (max 2MB)
  - latitude: number
  - longitude: number
  - profile: "standard" | "visual_disability" | "reduced_mobility" | "deaf" | "easy_read"
  - context?: string (segmento actual, waypoints cercanos)

Response 200:
{
  "description": "Camino pavimentado recto con ligero descenso. A la izquierda hay un edificio de ladrillo...",
  "obstacles": ["bordillo sin rampa a 5 metros"],
  "surface": "paved",
  "riskLevel": "low",
  "suggestions": ["Continua recto", "Precaucion con el bordillo"],
  "confidence": 0.85,
  "source": "ai"
}

Response 400: { "error": { "code": "INVALID_IMAGE", "message": "..." } }
Response 503: { "error": { "code": "VISION_UNAVAILABLE", "message": "..." } }
```

---

## 5. Arquitectura de Componentes

```
apps/mobile/
  src/screens/CameraScreen.tsx           [FR-1101] Vista de camara + controles
  src/screens/CaptureHistoryScreen.tsx   [FR-1104] Historial de capturas
  src/services/cameraService.ts          [FR-1101] Captura + compresion
  src/services/visionService.ts          [FR-1102] Cliente API vision
  src/services/continuousScanService.ts  [FR-1105] Modo automatico
  src/hooks/useCamera.ts                 [FR-1101] Permisos + captura
  src/hooks/useContinuousScan.ts         [FR-1105] Auto-scan durante nav
  src/store/captureStore.ts              [FR-1104] Historial local

server/
  src/routes/vision.ts                   [FR-1102] POST /api/vision/describe
  src/services/visionService.ts          [FR-1102] Claude Vision + prompt engineering
```

### Flujo de datos

```
Camara → Captura JPEG → Compresion (< 500KB)
  ↓
POST /api/vision/describe + GPS + perfil + contexto
  ↓
Servidor → Claude Vision API (claude-sonnet-4-20250514 con vision)
  ↓
Respuesta: descripcion + obstaculos + sugerencias
  ↓
Mobile → TTS lee descripcion / Haptica alerta / Pantalla muestra texto
```

---

## 6. Orden de Implementacion

1. **T11.1** — react-native-vision-camera + permisos + CameraScreen basica
2. **T11.2** — visionService (servidor) + POST /api/vision/describe + prompt engineering
3. **T11.3** — visionService (cliente) + integracion TTS + UI de resultado
4. **T11.4** — Contexto GPS + ruta en el prompt
5. **T11.5** — Historial de capturas
6. **T11.6** — Modo continuo durante navegacion

**Camino critico:** T11.1 → T11.2 → T11.3 → T11.4

---

## 7. Dependencias Externas

| Dependencia | Version | Licencia | Notas |
|-------------|---------|----------|-------|
| react-native-vision-camera | ^4.x | MIT | Requiere native build (no Expo Go) |
| @anthropic-ai/sdk | ^0.80+ | MIT | Ya instalado — agregar soporte vision |
| expo-camera | SDK 52+ | MIT | Alternativa si vision-camera da problemas |
| expo-file-system | SDK 52+ | MIT | Para guardar thumbnails localmente |

---

*Documento creado: 2026-04-07*
