# Historial de Cambios — Fase 11: Camara Inteligente con Vision IA

> **Estado:** ✅ Completada (2026-05-02)
> **Spec:** `docs/SPEC-FASE-11.md`

---

## Estado de Tareas — Fase 11

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T11.1 — Camera + Permisos | FR-1101 | ✅ Completada | ██████████ 100% |
| T11.2 — Vision Service (servidor) | FR-1102 | ✅ Completada | ██████████ 100% |
| T11.3 — Vision Service (cliente) + TTS | FR-1102 | ✅ Completada | ██████████ 100% |
| T11.4 — Contexto GPS en prompt | FR-1103 | ✅ Completada | ██████████ 100% |
| T11.5 — Historial de capturas | FR-1104 | ✅ Completada | ██████████ 100% |
| T11.6 — Modo continuo + 1-tap report | FR-1105 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 11:** ██████████ 100% (6/6 tareas)

---

## Decisiones tecnicas

- **Modelo Claude:** `claude-haiku-4-5` para todas las llamadas (manual + continuo). Haiku 4.5 ofrece buen balance calidad/costo (~$0.0015 por captura).
- **Camara:** `expo-camera ~16.0.0` (compatible con Expo SDK 52). `expo-image-manipulator` para resize+compression antes de enviar.
- **TTS:** `expo-speech` con idioma `es-ES`.
- **Privacidad:** Imagenes se envian al servidor, se procesan, se descartan. Solo el thumbnail se guarda localmente en `documentDirectory/captures/`.
- **Salvaguardas economicas:**
  - Rate limiting: 5 req/min y 100 req/h por usuario o IP
  - Budget mensual configurable (`VISION_MONTHLY_BUDGET_USD=20` por defecto)
  - GET `/api/vision/usage` para monitoreo
- **Modo continuo:**
  - User-controlled (default OFF, toggle visible solo en NavigationScreen)
  - Captura cada 20s a 640x480 q=0.5 (menor resolucion para ahorrar bateria/budget)
  - Solo anuncia cambios significativos (escalada de riesgo, obstaculo nuevo, cambio de superficie)
  - Auto-disable tras 5 errores consecutivos o al llegar al destino

## Modelos de datos

- `VisionUsage`: tracking de costo y llamadas mensuales (con cap)
- `RateLimitEntry`: contador de peticiones por identidad/endpoint

## Endpoints

- `POST /api/vision/describe` — analisis de imagen con perfil de accesibilidad
- `GET /api/vision/usage` — estadisticas mensuales de uso

## Componentes mobile

- `apps/mobile/src/screens/CameraScreen.tsx` — captura manual + descripcion
- `apps/mobile/src/screens/CaptureHistoryScreen.tsx` — historial con detalles
- `apps/mobile/src/components/ContinuousScanOverlay.tsx` — camara invisible para modo continuo
- `apps/mobile/src/components/QuickReportBanner.tsx` — reporte 1-toque
- `apps/mobile/src/hooks/useCamera.ts` — permisos
- `apps/mobile/src/hooks/useContinuousScan.ts` — loop de scan
- `apps/mobile/src/services/cameraService.ts` — utilidades de imagen
- `apps/mobile/src/services/visionService.ts` — cliente API
- `apps/mobile/src/services/continuousScanService.ts` — deteccion de cambios
- `apps/mobile/src/store/captureStore.ts` — historial persistente

## Servicios servidor

- `server/src/services/visionService.ts` — Claude Haiku 4.5 vision con prompt por perfil
- `server/src/services/visionContextService.ts` — enriquecimiento con waypoints/incidencias/segmento
- `server/src/middleware/rateLimitMiddleware.ts` — rate limit reusable
- `server/src/routes/vision.ts` — endpoints

## Integracion con sistemas existentes

- **Modo continuo + Incidencias (Fase 5):** El banner de reporte rapido usa el endpoint `/api/incidents` ya existente, asi una vez aprobada la incidencia se auto-bloquea el segmento afectado para todos los usuarios. Es feedback con consentimiento (1 toque) que mejora la ruta para la comunidad.
- **Perfiles de accesibilidad (Fase 4):** El prompt de Claude se adapta al perfil activo del usuario:
  - `visual_disability` — distancias precisas, direcciones, cambios de nivel
  - `reduced_mobility` — escaleras, rampas, pendientes, ancho de paso
  - `deaf` — alertas haptic + visuales (no TTS) en modo continuo
  - `easy_read` — frases cortas, vocabulario simple
  - `standard` — descripcion general
- **Contexto de ruta (Fase 2):** El servidor enriquece el prompt con waypoints cercanos, incidencias activas y segmento actual, permitiendo respuestas como "A tu derecha esta la Facultad de Medicina (45m al noreste)".

---

*Documento creado: 2026-05-02*
