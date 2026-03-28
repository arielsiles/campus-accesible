# Historial de Cambios — Fase 5: Sistema Colaborativo e Incidencias

> Registro cronologico de implementacion y cambios durante la Fase 5 del proyecto **Campus GPS Accesible**.
> **Estado:** En progreso
> **Spec:** `docs/SPEC-FASE-5.md`

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorias:** `Implementacion`, `Fix`, `Configuracion`, `Refactor`
- **Progreso:** Barras con porcentaje

---

## Estado de Tareas — Fase 5

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T5.1 — Modelo de Datos y API de Incidencias | FR-501, FR-502 | Completada | ██████████ 100% |
| T5.2 — Reporte de Incidencias Mobile | FR-502, NFR-502 | Completada | ██████████ 100% |
| T5.3 — Validacion IA de Incidencias | FR-503 | Completada | ██████████ 100% |
| T5.4 — Panel de Administracion Web | FR-504 | Completada | ██████████ 100% |
| T5.5 — Notificaciones Push | FR-505 | Completada | ██████████ 100% |
| T5.6 — Actualizacion de Rutas por Incidencias | FR-506 | Completada | ██████████ 100% |

**Progreso global Fase 5:** ██████████ 100% (6/6 tareas)

---

## Dependencias de Fase 4

| Componente | Commit | Estado |
|-----------|--------|--------|
| Perfil Movilidad Reducida | T4.1 | Funcionando |
| Lectura Facil con IA | T4.2 | Funcionando |
| Haptica Direccional | T4.3 | Funcionando |
| Selector Multi-Perfil | T4.4 | Funcionando |
| Pesos de Ruta por Perfil | T4.5 | Funcionando |

---

## Registro de Cambios

### 2026-03-28 — T5.1: Modelo de Datos y API de Incidencias [FR-501, FR-502]

**Categoria:** Implementacion
**Branch:** `main`

#### Cambios realizados:

1. **packages/shared-types/src/incident.ts** — Tipos compartidos:
   - `IncidentType` — 6 tipos: obras, obstaculo_temporal, superficie_danada, ascensor_averiado, rampa_bloqueada, otro
   - `IncidentStatus` — 4 estados: pending, validated, rejected, resolved
   - Interfaces: IncidentSummary, IncidentDetail, CreateIncidentRequest, UpdateIncidentStatusRequest
   - IncidentValidationResult, PushSubscriptionRequest
   - Labels en espanol: INCIDENT_TYPE_LABELS, INCIDENT_STATUS_LABELS

2. **server/prisma/schema.prisma** — Modelos de datos:
   - Enums: IncidentType, IncidentStatus
   - Modelo Incident: 18 campos, indices por status/segmentId/deviceId
   - Modelo PushSubscription: unico por deviceId+segmentId
   - Extension RouteSegment: temporarilyBlocked, blockReason, relaciones incidents/subscriptions

3. **server/src/routes/incidents.ts** — 5 endpoints CRUD:
   - POST /api/incidents — crear con validacion Zod + rate limiting (5/hora/dispositivo)
   - GET /api/incidents — listar con filtros (status, type, segmentId) + paginacion
   - GET /api/incidents/near — busqueda por proximidad (bounding box + Haversine)
   - GET /api/incidents/:id — detalle completo
   - PATCH /api/incidents/:id/status — cambiar estado con auto-block/unblock

4. **server/prisma/seed.ts** — 3 incidencias de ejemplo (validated, pending, resolved)

5. **Tests** — 8 route tests (DB-dependent) + shared types build verificado

---

### 2026-03-28 — T5.3: Validacion IA de Incidencias [FR-503]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/services/incidentValidator.ts** — Servicio de validacion:
   - `validateWithAI()` — Validacion via Claude Haiku 4.5
   - `validateFromTemplate()` — Fallback por plantilla: bounds check, spam detection, duplicate check
   - `validateIncident()` — Entrada principal, IA con fallback
   - Bounding box CU: lat 40.44-40.46, lng -3.74 a -3.72
   - Auto-reject incidencias con confidence > 0.8 y plausible=false

2. **Integracion** — POST /api/incidents ejecuta validacion y almacena resultado (aiValidation, aiConfidence, aiReason, validationSource)

3. **Tests** — 8 tests pasando:
   - TST-FR-503-001 (coords fuera bounds), TST-FR-503-002 (spam, URLs)
   - TST-FR-503-003 (incidencia valida), TST-FR-503-004/005 (template fallback)

---

### 2026-03-28 — T5.2: Reporte de Incidencias Mobile [FR-502]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/mobile/src/store/incidentStore.ts** — Zustand store:
   - Estado: incidents[], loading, error, selectedIncidentId
   - Acciones: setIncidents, addIncident, selectIncident, setLoading, setError

2. **apps/mobile/src/services/incidentService.ts** — API calls:
   - reportIncident, fetchIncidents, fetchNearbyIncidents, fetchIncidentDetail

3. **apps/mobile/src/services/deviceIdService.ts** — UUID anonimo persistente en AsyncStorage

4. **apps/mobile/src/services/apiClient.ts** — Extendido con apiPatch<T> y apiDelete<T>

5. **apps/mobile/src/hooks/useIncidents.ts** — Hook para cargar incidencias cercanas
6. **apps/mobile/src/hooks/useReportIncident.ts** — Hook para enviar reportes

7. **Componentes:**
   - IncidentTypeSelector.tsx — Selector accesible con accessibilityRole="radio"
   - IncidentCard.tsx — Tarjeta con tipo, titulo, estado, fecha
   - IncidentMarker.tsx — Marcador circular para mapa

8. **apps/mobile/src/screens/ReportIncidentScreen.tsx** — Formulario de reporte completo
9. **apps/mobile/src/screens/MapScreen.tsx** — FAB "Reportar" + integracion con incidencias

10. **Tests** — 11 tests (5 service + 6 store)

---

### 2026-03-28 — T5.6: Actualizacion de Rutas por Incidencias [FR-506]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/services/routeUpdateService.ts** — Servicio de bloqueo:
   - `isBlockingType()` — obras, rampa_bloqueada, ascensor_averiado
   - `blockSegmentForIncident()` — Bloquea segmento al validar
   - `unblockSegmentForIncident()` — Desbloquea al resolver (si no quedan otras)

2. **server/src/routes/segments.ts** — PATCH /api/segments/:id/block
3. **server/src/services/routingService.ts** — `temporarilyBlocked` -> peso 999999

4. **Integracion** — Auto-block en PATCH /incidents/:id/status (validated), auto-unblock (resolved)

5. **Tests** — 6 service tests + 3 route tests

---

### 2026-03-28 — T5.4: Panel de Administracion Web [FR-504]

**Categoria:** Implementacion

#### Cambios realizados:

1. **apps/admin-web/** — Aplicacion Next.js 14 App Router completa:
   - Dashboard con estadisticas por estado
   - Lista de incidencias con filtros por estado
   - Detalle de incidencia con resultado IA + acciones admin
   - Gestion de segmentos con bloqueo/desbloqueo
   - Basic Auth via middleware (ADMIN_USERNAME/ADMIN_PASSWORD)

2. **Estructura:**
   - src/app/layout.tsx, page.tsx (dashboard)
   - src/app/incidents/page.tsx (lista), [id]/page.tsx (detalle), [id]/IncidentActions.tsx (acciones client)
   - src/app/segments/page.tsx (gestion de segmentos)
   - src/components/StatusBadge.tsx, Header.tsx
   - src/lib/api.ts, auth.ts
   - src/middleware.ts (Basic Auth)

---

### 2026-03-28 — T5.5: Notificaciones Push [FR-505]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/services/notificationService.ts** — Envio via Expo Push API:
   - `isValidExpoPushToken()` — Validacion de formato
   - `notifySegmentSubscribers()` — Envia push a suscriptores de segmento

2. **server/src/routes/notifications.ts** — 2 endpoints:
   - POST /api/notifications/subscribe — Suscribir con upsert
   - DELETE /api/notifications/unsubscribe — Desuscribir

3. **apps/mobile/src/services/notificationService.ts** — Client-side:
   - subscribeToSegments, unsubscribeFromSegments

4. **apps/mobile/src/hooks/useNotifications.ts** — Permisos + suscripcion automatica

5. **Integracion** — Al validar incidencia, se notifica a suscriptores del segmento

6. **Tests** — 5 service tests + 3 route tests

---

## Mapa de Arquitectura — Fase 5

```
apps/mobile/
  src/store/incidentStore.ts          [FR-501] Zustand store
  src/screens/ReportIncidentScreen.tsx [FR-502] Formulario de reporte
  src/screens/MapScreen.tsx            [FR-502] FAB + marcadores incidencias
  src/components/IncidentTypeSelector  [FR-502] Selector accesible
  src/components/IncidentCard          [FR-502] Tarjeta incidencia
  src/components/IncidentMarker        [FR-502] Marcador mapa
  src/services/incidentService.ts      [FR-501] API calls
  src/services/deviceIdService.ts      [FR-502] UUID anonimo
  src/services/notificationService.ts  [FR-505] Push client
  src/services/apiClient.ts            [FR-501] +apiPatch, +apiDelete
  src/hooks/useIncidents.ts            [FR-502] Fetch nearby
  src/hooks/useReportIncident.ts       [FR-502] Submit report
  src/hooks/useNotifications.ts        [FR-505] Push permissions

apps/admin-web/                        [FR-504] Next.js admin panel
  src/app/page.tsx                     Dashboard stats
  src/app/incidents/                   Incident list + detail + actions
  src/app/segments/                    Segment management
  src/middleware.ts                    Basic Auth

server/
  prisma/schema.prisma                 [FR-501] +Incident, +PushSubscription
  src/routes/incidents.ts              [FR-501] CRUD + validation + auto-block
  src/routes/segments.ts               [FR-506] Block/unblock
  src/routes/notifications.ts          [FR-505] Subscribe/unsubscribe
  src/services/incidentValidator.ts    [FR-503] AI + template validation
  src/services/routeUpdateService.ts   [FR-506] Auto-block logic
  src/services/notificationService.ts  [FR-505] Expo push sender
  src/services/routingService.ts       [FR-506] +temporarilyBlocked weight

packages/shared-types/
  src/incident.ts                      [FR-501] Shared types + labels
```
