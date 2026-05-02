# Especificacion de Desarrollo — Fase 15: Crowdsourcing Inteligente y Aprendizaje

> **Version:** 1.0 | **Fecha:** 2026-05-01 | **Estado:** Draft
> **Prefijo IDs:** FR-15XX (funcionales), NFR-15XX (no funcionales)
> **Fase anterior:** Fase 14 — ver `SPEC-FASE-14.md`
> **Enfoque:** La app aprende de los usuarios para mejorar rutas, detectar nuevos caminos y validar accesibilidad

---

## 1. Alcance

### En Scope (Fase 15)

- Telemetria de trazas GPS durante navegacion (anonimas, opt-in con consentimiento explicito)
- Re-weighting automatico de aristas del grafo basado en uso real (popularidad, tiempos)
- Deteccion de "atajos" no registrados (caminos repetidos por usuarios)
- Validacion comunitaria de incidencias (multiples reportes incrementan confianza)
- Feedback rapido al final de cada navegacion ("¿Cumplio expectativas?" 1 toque)
- Metricas agregadas por segmento: tiempo medio por perfil, tasa de off-route, popularidad
- Dashboard admin: visualizacion de trazas agregadas en heat map
- Sistema de reputacion para contributors (gamificacion ligera)

### Fuera de Scope

- Identificacion de usuarios individuales (todo es anonimo agregado)
- Almacenamiento permanente de trazas individuales (se agregan y descartan)
- Gamificacion compleja (badges, niveles, ranking publico) — solo reputacion interna
- Integracion con redes sociales
- Pagos o monetizacion del crowdsourcing

### Motivacion

Una app de navegacion es solo tan buena como sus datos. Los datos:
- **Envejecen** rapido (obras, cambios urbanos)
- **Tienen sesgos** (los contributors mapean lo que conocen)
- **Son incompletos** (no siempre se anota la pendiente exacta)

Esta fase convierte cada usuario en un contributor pasivo, mejorando la base de datos sin esfuerzo del usuario.

### Principios de privacidad

- **Opt-in explicito** — el usuario elige activar telemetria (off por defecto)
- **Anonimo agregado** — solo se guardan estadisticas, no trazas individuales
- **Procesamiento en servidor** — las trazas se reciben, se agregan, se descartan
- **Transparencia** — en perfil del usuario muestra que se comparte y boton para borrar todo
- **Cumplimiento GDPR / privacidad** — consentimiento explicito en primera ejecucion

---

## 2. Requisitos Funcionales

### FR-1501: Telemetria de Trazas GPS Anonimas

**Descripcion:** Durante la navegacion, la app registra puntos GPS y los envia al servidor en lotes. El servidor los almacena en una tabla `gps_traces` con expiracion de 24h, y un job nocturno los agrega a estadisticas por segmento.

**Criterios de aceptacion:**

```gherkin
Given un usuario con telemetria activada
When navega por una ruta
Then cada 30 segundos la app envia un batch de puntos GPS al servidor
  And cada punto incluye: lat, lng, timestamp, segmentId asociado, perfil de usuario
  And NO incluye: userId, deviceId, ningun identificador

Given el servidor recibe trazas
When las procesa
Then las almacena temporalmente (24h) para agregacion
  And anade los datos agregados a metricas del segmento
  And descarta las trazas individuales tras 24h

Given un usuario sin telemetria activada
When navega
Then no se envia ninguna traza
```

**Archivos requeridos:**
- `apps/mobile/src/services/telemetryService.ts` (nuevo)
- `apps/mobile/src/store/privacyStore.ts` (nuevo)
- `server/src/routes/telemetry.ts` (nuevo)
- `server/prisma/schema.prisma` — modelo `GpsTrace` con TTL

---

### FR-1502: Re-weighting de Aristas por Uso Real

**Descripcion:** Job que se ejecuta diariamente y recalcula los pesos de las aristas del grafo basandose en datos reales de uso:
- **Popularidad:** Si una arista es muy usada, su peso baja ligeramente (es preferida)
- **Tiempo real:** Si los usuarios tardan mas de lo esperado, su peso sube
- **Off-route rate:** Si muchos usuarios se salen en un punto, posible problema → sube peso

**Criterios de aceptacion:**

```gherkin
Given trazas agregadas de las ultimas 30 dias
When se ejecuta el job de re-weighting
Then se calcula el peso ajustado de cada arista
  And el ajuste es bounded (max +/- 30% del peso original)
  And la actualizacion se aplica al grafo en BD
  And se rebuilds el grafo en memoria

Given un segmento poco usado pero correcto
When pasa por el job
Then no se penaliza por falta de datos (se mantiene el peso original)
```

**Archivos requeridos:**
- `server/src/services/edgeReweightingService.ts` (nuevo)
- `server/src/jobs/dailyReweighting.ts` (nuevo, cron)

---

### FR-1503: Deteccion de Atajos no Registrados

**Descripcion:** Identificacion automatica de caminos que muchos usuarios toman pero no estan en el grafo. La idea es proponer estos atajos como nuevos waypoints/segmentos para revision por reviewers.

**Criterios de aceptacion:**

```gherkin
Given un patron de trazas que cruzan una zona sin grafo
When >= 50 usuarios distintos siguen el mismo patron en un mes
Then se crea automaticamente una sugerencia de "nuevo segmento detectado"
  And aparece en el dashboard de reviewers para revisar y aprobar
  And si se aprueba, se anade al grafo permanentemente

Given una sugerencia automatica
When un reviewer la aprueba
Then se crean los waypoints + segmento correspondientes
  And se hereda metadata estimada de OSM si existe
```

**Archivos requeridos:**
- `server/src/services/shortcutDetectionService.ts`
- `server/src/jobs/weeklyShortcutDetection.ts`
- `apps/admin-web/src/app/shortcuts/page.tsx` — UI de revision

---

### FR-1504: Validacion Comunitaria de Incidencias

**Descripcion:** Multiples reportes de la misma incidencia incrementan su confianza. Si solo 1 persona reporta una grieta, status = `pending`. Si 5 personas la reportan en una zona pequena, sube a `validated` automaticamente.

**Criterios de aceptacion:**

```gherkin
Given una incidencia reportada
When otra persona reporta la misma (mismo tipo, ubicacion < 20m)
Then se incrementa el contador `confirmCount` de la primera
  And NO se crea una incidencia duplicada
  And el segundo usuario recibe "Esta incidencia ya fue reportada, ¿la confirmas?"

Given una incidencia con confirmCount >= 3
When pasa el filtro automatico
Then status sube a "validated" sin necesidad de moderacion humana

Given una incidencia "obsoleta" (sin reportes en 30 dias) y de tipo temporal
When pasa el job de limpieza
Then status pasa a "resolved" automaticamente
```

**Archivos requeridos:**
- `server/src/services/incidentService.ts` — extender con dedup logic
- `server/prisma/schema.prisma` — agregar `confirmCount`, `lastConfirmedAt`
- `apps/mobile/src/screens/ReportIncidentScreen.tsx` — UI "Esta incidencia ya existe"

---

### FR-1505: Feedback Rapido Post-Navegacion

**Descripcion:** Al finalizar una navegacion exitosa, mostrar un modal de 1 toque preguntando "¿Como estuvo esta ruta?". Las respuestas se asocian a la ruta calculada y alimentan el sistema de re-weighting.

**Criterios de aceptacion:**

```gherkin
Given el usuario llega a su destino
When se cierra la navegacion
Then aparece un modal con:
  And opcion "Buena" (verde)
  And opcion "Aceptable" (amarillo)
  And opcion "Mala" (rojo)
  And opcion "Saltar" (sin feedback)

Given el usuario marca "Mala"
When confirma
Then se abre opcion de comentario opcional ("¿Que paso?")
  And se asocia el feedback a los segmentos que conformaban la ruta
  And se penalizan ligeramente esos segmentos en el siguiente reweighting
```

**Archivos requeridos:**
- `apps/mobile/src/components/RouteFeedbackModal.tsx` (nuevo)
- `server/src/routes/feedback.ts` (nuevo)
- `server/prisma/schema.prisma` — modelo `RouteFeedback`

---

### FR-1506: Metricas Agregadas por Segmento

**Descripcion:** Cada segmento del grafo acumula metricas agregadas que se muestran en admin web y se usan para priorizar mejoras de mapeo.

**Metricas:**
- `usageCount` — Numero de veces atravesado en navegacion
- `avgTraversalTimeS` — Tiempo medio en segundos
- `offRouteRate` — % de usuarios que se salieron en este segmento
- `feedbackScore` — Promedio de feedback (1-3, ponderado)
- `lastUsedAt` — Ultimo uso

**Archivos requeridos:**
- `server/prisma/schema.prisma` — modelo `SegmentMetrics`
- `server/src/services/metricsAggregationService.ts`
- `apps/admin-web/src/app/metrics/page.tsx`

---

### FR-1507: Heat Map de Uso (Admin)

**Descripcion:** Visualizacion en el panel admin de las trazas agregadas como heat map en un mapa interactivo. Permite identificar zonas de uso intensivo y zonas no cubiertas.

**Criterios de aceptacion:**

```gherkin
Given el panel admin
When un admin abre la seccion "Heat Map"
Then ve un mapa interactivo con:
  And capas: trazas (rojo=alto uso), incidencias activas, segmentos bloqueados
  And filtros: rango de fechas, perfil de accesibilidad, campus
  And tooltip con detalles al hacer hover

Given filtros aplicados
When cambian
Then el mapa se actualiza en tiempo real
```

**Archivos requeridos:**
- `apps/admin-web/src/app/heatmap/page.tsx`
- Endpoint `GET /api/admin/heatmap` con datos agregados

---

### FR-1508: Sistema de Reputacion para Contributors

**Descripcion:** Sistema simple de puntuacion para usuarios contributors basado en calidad de sus contribuciones.

**Puntos:**
- +10 por ruta aprobada
- +5 por incidencia validada
- +1 por incidencia confirmada (otra persona la reporta tambien)
- -5 por ruta rechazada por reviewer

**Niveles:**
- Bronce: 0-99 puntos
- Plata: 100-499 puntos
- Oro: 500+ puntos

Los reviewers ven el nivel del autor al revisar sus contribuciones (decision informada). NO se muestra publicamente.

**Archivos requeridos:**
- `server/prisma/schema.prisma` — anadir `reputation` y `level` a `User`
- `server/src/services/reputationService.ts`
- `apps/mobile/src/screens/ProfileScreen.tsx` — mostrar puntos al usuario

---

## 3. Requisitos No Funcionales

### NFR-1501: Privacidad

| Criterio | Detalle |
|----------|---------|
| Consentimiento | Modal explicito en primera ejecucion + en perfil |
| Opt-out facil | Boton 1 toque para desactivar telemetria |
| Anonimizacion | Sin userId/deviceId en trazas enviadas |
| TTL de datos crudos | 24h maximo, luego solo agregados |
| Boton "borrar mis datos" | Disponible en perfil |

### NFR-1502: Performance

| Criterio | Detalle |
|----------|---------|
| Envio de trazas | Batches asincronos, no bloquean UI |
| Job de reweighting | Asincrono nocturno, no afecta a usuarios |
| Heat map | Lazy rendering, datos paginados por viewport |

### NFR-1503: Resiliencia

| Criterio | Detalle |
|----------|---------|
| Servidor caido | Trazas se encolan localmente y reintentar (max 3) |
| Cuota llena | Limpiar trazas locales mas antiguas primero |

---

## 4. Modelos de Datos

```prisma
model GpsTrace {
  id          String   @id @default(cuid())
  segmentId   String?  @map("segment_id")
  latitude    Float
  longitude   Float
  timestamp   DateTime
  profile     String   // accessibility profile
  expiresAt   DateTime @map("expires_at") // TTL 24h
  
  @@index([segmentId, timestamp])
  @@index([expiresAt])
  @@map("gps_traces")
}

model SegmentMetrics {
  id                String   @id @default(cuid())
  segmentId         String   @unique @map("segment_id")
  usageCount        Int      @default(0)
  avgTraversalTimeS Float    @default(0)
  offRouteRate      Float    @default(0)
  feedbackScore     Float    @default(0)
  lastUsedAt        DateTime?
  updatedAt         DateTime @updatedAt
  
  segment RouteSegment @relation(fields: [segmentId], references: [id])
  @@map("segment_metrics")
}

model RouteFeedback {
  id          String   @id @default(cuid())
  rating      String   // "good" | "ok" | "bad"
  comment     String?
  segmentIds  String[] // segmentos atravesados
  profile     String
  createdAt   DateTime @default(now())
  
  @@map("route_feedback")
}

// Extension a User
// Anadir a User existente:
//   reputation Int @default(0)
//   level     ReputationLevel @default(bronze)

enum ReputationLevel {
  bronze
  silver
  gold
}
```

---

## 5. Orden de Implementacion

1. **T15.1** — Privacy store + consentimiento + opt-in telemetria
2. **T15.2** — Servicio de telemetria + endpoint + modelo `GpsTrace`
3. **T15.3** — Job de agregacion + modelo `SegmentMetrics`
4. **T15.4** — Validacion comunitaria de incidencias (`confirmCount`)
5. **T15.5** — Feedback post-navegacion + modelo `RouteFeedback`
6. **T15.6** — Job de re-weighting + ajuste de pesos
7. **T15.7** — Deteccion de atajos automatica
8. **T15.8** — Heat map en admin web
9. **T15.9** — Sistema de reputacion

**Camino critico:** T15.1 → T15.2 → T15.3 → T15.6

**MVP rapido:** T15.4 + T15.5 — entregan valor visible sin telemetria pesada.

---

## 6. Dependencias

- Fase 9 (autenticacion para reputacion)
- Fase 14 (motor de routing extendido)
- Panel admin web operativo

## 7. Riesgos

| Riesgo | Mitigacion |
|--------|-----------|
| Privacidad / GDPR | Anonimizacion estricta + opt-in + transparencia + auditoria |
| Falsos positivos en deteccion de atajos | Filtro estricto: minimo 50 usuarios distintos en 30 dias + revision humana |
| Re-weighting deteriora rutas correctas | Bounds en ajuste (+/- 30%) + reset si feedback medio empeora |
| Spam en feedback / inflacion de votos | Rate limit por usuario + verificacion implicita por traza GPS |
| Volumen de trazas satura BD | TTL 24h + agregacion progresiva + Postgres con particiones por fecha |

---

## 8. Metricas de Exito

- % de usuarios con telemetria activada > 30%
- Reduccion del 20% en off-route rate tras 6 meses de re-weighting
- Al menos 5 atajos detectados automaticamente y validados al ano
- Tiempo medio de validacion de incidencias < 1 dia (vs varios dias hoy)

---

*Documento creado: 2026-05-01*
