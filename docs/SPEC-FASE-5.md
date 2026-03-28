# Especificacion de Desarrollo — Fase 5: Sistema Colaborativo e Incidencias

> **Version:** 1.0 | **Fecha:** 2026-03-28 | **Estado:** Draft
> **Prefijo IDs:** FR-5XX (funcionales), NFR-5XX (no funcionales)
> **Fase anterior:** Fase 4 completada (2026-03-21) — ver `SPEC-FASE-4.md`

---

## 1. Alcance

### En Scope (Fase 5)

Las 6 tareas del plan maestro para esta fase:
- Modelo de datos y API CRUD de incidencias (obras, obstaculos temporales, superficies danadas, ascensores averiados, rampas bloqueadas)
- Reporte de incidencias desde la app movil con formulario accesible
- Agente IA validador de incidencias que filtra informacion no veraz con fallback por plantillas
- Panel de administracion web (Next.js) para gestionar incidencias y segmentos
- Notificaciones push para incidencias en rutas habituales del usuario
- Sistema de actualizacion de rutas: bloqueo automatico de segmentos por incidencias validadas

### Fuera de Scope

- Autenticacion de usuarios completa / modelo User (se usa deviceId anonimo)
- Subida de fotos al servidor (se almacena URL, no archivo)
- Panel admin con roles/permisos (solo Basic Auth con env vars)
- Publicacion en tiendas (Fase 6)
- Precision GPS submetrica / RTK (Fase 6)

### Dependencias de Fase 4

| Componente | Estado | Notas |
|-----------|--------|-------|
| Perfil Movilidad Reducida | Funcionando | Datos de accesibilidad fisica por segmento |
| Lectura Facil con IA | Funcionando | Infraestructura @anthropic-ai/sdk reutilizable |
| Haptica Direccional | Funcionando | expo-haptics instalado |
| Selector Multi-Perfil | Funcionando | 5 perfiles en accessibilityStore |
| Pesos por Perfil | Funcionando | profileWeights + routingService |

---

## 2. Requisitos Funcionales

### FR-501: Modelo de Datos y API de Incidencias

**Descripcion:** Sistema CRUD completo para incidencias reportadas por usuarios. Cada incidencia tiene tipo, estado, ubicacion, y vinculacion opcional a un segmento de ruta. Identificacion anonima por deviceId.

**Criterios de aceptacion:**

```gherkin
Given un usuario con la app instalada
When reporta una incidencia con tipo, titulo, descripcion y ubicacion
Then se crea una incidencia con status "pending" y se almacena en BD

Given una incidencia creada
When consulto la lista de incidencias
Then puedo filtrar por status, type y segmentId con paginacion

Given una incidencia existente
When consulto su detalle por ID
Then obtengo todos los campos incluyendo resultado de validacion IA

Given un administrador
When cambia el estado de una incidencia (validated, rejected, resolved)
Then el estado se actualiza y se registra la fecha de resolucion si aplica

Given unas coordenadas y un radio
When consulto incidencias cercanas
Then obtengo las incidencias dentro del radio especificado

Given un dispositivo que ha reportado 5 incidencias en la ultima hora
When intenta reportar otra
Then se rechaza con error de rate limiting
```

**Tipos de incidencia:**
| Enum | Label (ES) | Descripcion |
|------|-----------|-------------|
| `obras` | Obras | Construccion o reparacion en la ruta |
| `obstaculo_temporal` | Obstaculo temporal | Objeto o vehiculo bloqueando el paso |
| `superficie_danada` | Superficie danada | Pavimento roto, socavon, baldosa suelta |
| `ascensor_averiado` | Ascensor averiado | Ascensor fuera de servicio |
| `rampa_bloqueada` | Rampa bloqueada | Rampa de accesibilidad obstruida |
| `otro` | Otro | Otra incidencia no categorizada |

**Estados:**
| Enum | Label (ES) | Descripcion |
|------|-----------|-------------|
| `pending` | Pendiente | Recien creada, esperando validacion |
| `validated` | Validada | Confirmada por IA o administrador |
| `rejected` | Rechazada | Descartada por IA o administrador |
| `resolved` | Resuelta | Problema solucionado |

**Archivos requeridos:**
- `packages/shared-types/src/incident.ts` (tipos compartidos)
- `server/prisma/schema.prisma` (modelos Incident, PushSubscription, enums)
- `server/src/routes/incidents.ts` (endpoints CRUD)
- `server/src/routes/incidents.test.ts`
- `server/prisma/seed.ts` (incidencias de ejemplo)

---

### FR-502: Reporte de Incidencias desde Mobile

**Descripcion:** Pantalla de reporte accesible en la app movil. El usuario puede seleccionar tipo, escribir titulo y descripcion, y la ubicacion se toma del GPS actual. Las incidencias cercanas se muestran como marcadores en el mapa.

**Criterios de aceptacion:**

```gherkin
Given la pantalla del mapa
When el usuario pulsa el boton de reportar incidencia
Then se abre el formulario de reporte con la ubicacion GPS actual

Given el formulario de reporte
When el usuario selecciona tipo, escribe titulo (min 3 chars) y descripcion (min 10 chars)
Then puede enviar el reporte

Given un reporte enviado con exito
When el servidor responde con la incidencia creada
Then se muestra confirmacion y se anade marcador al mapa

Given el mapa con incidencias cercanas
When hay incidencias validadas en la zona visible
Then se muestran como marcadores con icono segun tipo

Given el formulario de reporte
When TalkBack/VoiceOver esta activo
Then todos los campos tienen accessibilityLabel en espanol y el selector de tipo usa accessibilityRole="radio"

Given un dispositivo sin conexion
When intenta reportar
Then se muestra error accesible "Sin conexion. Intenta mas tarde."
```

**Archivos requeridos:**
- `apps/mobile/src/store/incidentStore.ts`
- `apps/mobile/src/screens/ReportIncidentScreen.tsx`
- `apps/mobile/src/components/IncidentCard.tsx`
- `apps/mobile/src/components/IncidentMarker.tsx`
- `apps/mobile/src/components/IncidentTypeSelector.tsx`
- `apps/mobile/src/services/incidentService.ts`
- `apps/mobile/src/services/deviceIdService.ts`
- `apps/mobile/src/hooks/useIncidents.ts`
- `apps/mobile/src/hooks/useReportIncident.ts`

---

### FR-503: Validacion IA de Incidencias

**Descripcion:** Servicio que valida automaticamente cada incidencia reportada usando Claude Haiku. Evalua plausibilidad, detecta spam, y sugiere re-categorizacion. Fallback por plantillas cuando la API no esta disponible.

**Criterios de aceptacion:**

```gherkin
Given una incidencia recien creada
When el servidor la procesa
Then se ejecuta validacion IA y se almacenan: aiValidation, aiConfidence, aiReason, validationSource

Given coordenadas fuera de Ciudad Universitaria (lat <40.44 o >40.46, lng <-3.74 o >-3.72)
When se valida la incidencia
Then se marca como no plausible con razon "Ubicacion fuera del campus"

Given un titulo con caracteres repetidos o URLs
When se valida la incidencia
Then se marca como no plausible con razon "Contenido sospechoso de spam"

Given la API de Claude no disponible
When se valida la incidencia
Then se usa validacion por plantilla con source="template"

Given una incidencia con aiValidation=false y aiConfidence > 0.8
When se procesa
Then se cambia automaticamente a status "rejected"

Given una incidencia plausible segun IA
When se procesa
Then permanece en status "pending" para revision admin (no auto-validate)
```

**Archivos requeridos:**
- `server/src/services/incidentValidator.ts`
- `server/src/services/incidentValidator.test.ts`

---

### FR-504: Panel de Administracion Web

**Descripcion:** Aplicacion web Next.js para que administradores gestionen incidencias y segmentos. Autenticacion Basic Auth con credenciales en variables de entorno.

**Criterios de aceptacion:**

```gherkin
Given un usuario sin credenciales
When accede al panel admin
Then el navegador muestra dialogo de Basic Auth

Given credenciales validas (ADMIN_USERNAME/ADMIN_PASSWORD)
When se autentica
Then accede al dashboard con estadisticas de incidencias por estado

Given la lista de incidencias
When el admin filtra por estado o tipo
Then se muestra la lista filtrada con titulo, tipo, estado, fecha y segmento

Given el detalle de una incidencia
When el admin pulsa "Validar", "Rechazar" o "Marcar resuelta"
Then se actualiza el estado via API y se refleja en la interfaz

Given la lista de segmentos
When el admin pulsa "Bloquear" o "Desbloquear"
Then se actualiza el estado del segmento via API
```

**Archivos requeridos:**
- `apps/admin-web/` (aplicacion Next.js completa)

---

### FR-505: Notificaciones Push

**Descripcion:** Sistema de notificaciones push para alertar a usuarios cuando una incidencia validada afecta segmentos de sus rutas habituales. Usa expo-notifications en mobile y expo-server-sdk en servidor.

**Criterios de aceptacion:**

```gherkin
Given un usuario navegando una ruta
When la navegacion se inicia
Then el dispositivo se suscribe a notificaciones de todos los segmentos de esa ruta

Given un dispositivo suscrito a un segmento
When se valida una nueva incidencia en ese segmento
Then recibe una push notification: "Incidencia en tu ruta: {titulo}"

Given un dispositivo suscrito
When solicita desuscribirse
Then se eliminan sus suscripciones

Given el endpoint de suscripcion
When se envia deviceId + pushToken + segmentIds
Then se crean suscripciones (upsert, sin duplicados)

Given un dispositivo sin permiso de notificaciones
When se intenta suscribir
Then se solicita permiso y se procede solo si es concedido
```

**Archivos requeridos:**
- `server/src/routes/notifications.ts`
- `server/src/services/notificationService.ts`
- `apps/mobile/src/services/notificationService.ts`
- `apps/mobile/src/hooks/useNotifications.ts`

---

### FR-506: Actualizacion de Rutas por Incidencias

**Descripcion:** Las incidencias validadas de tipos bloqueantes (obras, rampa_bloqueada, ascensor_averiado) bloquean automaticamente el segmento vinculado. El motor de routing evita segmentos bloqueados asignando peso muy alto. Al resolver la incidencia, se desbloquea.

**Criterios de aceptacion:**

```gherkin
Given una incidencia tipo "obras" vinculada a un segmento
When se valida la incidencia
Then el segmento se marca como temporarilyBlocked=true

Given un segmento bloqueado temporalmente
When se calcula una ruta que pasaria por ese segmento
Then el motor de routing lo evita (peso 999999) y busca alternativa

Given una incidencia de tipo bloqueante
When se marca como resuelta
Then el segmento se desbloquea automaticamente

Given el endpoint PATCH /api/segments/:id/block
When un admin envia blocked=true con razon
Then el segmento se bloquea manualmente con la razon indicada

Given un segmento bloqueado
When no existe ruta alternativa
Then la ruta se calcula igualmente pero incluye advertencia de bloqueo
```

**Archivos requeridos:**
- `server/src/routes/segments.ts`
- `server/src/services/routeUpdateService.ts`

---

## 3. Requisitos No Funcionales

### NFR-501: Rendimiento de API

| Metrica | Criterio |
|---------|----------|
| Crear incidencia | < 500ms (incluyendo validacion IA) |
| Listar incidencias | < 200ms para 100 registros |
| Consulta nearby | < 300ms con radio 500m |
| Validacion template | < 50ms |

### NFR-502: Accesibilidad Mobile

| Criterio | Detalle |
|----------|---------|
| Touch targets | Minimo 44x44dp en todos los controles |
| Labels | accessibilityLabel en espanol en TODOS los interactivos |
| Roles | accessibilityRole en formularios, botones, alertas |
| Live regions | accessibilityLiveRegion="assertive" en confirmaciones y errores |
| Color | Nunca transmitir info solo por color |

### NFR-503: Seguridad

| Criterio | Detalle |
|----------|---------|
| Rate limiting | Max 5 incidencias por dispositivo por hora |
| Input validation | Zod en todos los endpoints, sanitizacion de texto |
| Admin auth | Basic Auth con credenciales en env vars (no hardcoded) |
| SQL injection | Prevenido por Prisma ORM |
| XSS | Sanitizacion de titulo y descripcion |

### NFR-504: Disponibilidad

| Criterio | Detalle |
|----------|---------|
| AI fallback | Validacion funciona sin Claude API (plantillas) |
| Push fallback | App funciona sin notificaciones (feature opcional) |
| Offline report | Mensaje de error accesible, no crash |

---

## 4. Modelos de Datos

### 4.1 Extension del Prisma Schema

```prisma
// FR-501: Incident type categorization
enum IncidentType {
  obras
  obstaculo_temporal
  superficie_danada
  ascensor_averiado
  rampa_bloqueada
  otro

  @@map("incident_type")
}

// FR-501: Incident lifecycle status
enum IncidentStatus {
  pending
  validated
  rejected
  resolved

  @@map("incident_status")
}

// FR-501: User-reported incident on a route segment
model Incident {
  id          String         @id @default(cuid())
  deviceId    String         @map("device_id")
  type        IncidentType
  status      IncidentStatus @default(pending)
  title       String
  description String
  latitude    Float
  longitude   Float
  photoUrl    String?        @map("photo_url")

  // AI validation results (FR-503)
  aiValidation     Boolean?  @map("ai_validation")
  aiConfidence     Float?    @map("ai_confidence")
  aiReason         String?   @map("ai_reason")
  validationSource String?   @map("validation_source")

  // Linked segment
  segmentId   String?        @map("segment_id")
  segment     RouteSegment?  @relation(fields: [segmentId], references: [id])

  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")
  resolvedAt  DateTime?      @map("resolved_at")

  @@index([status])
  @@index([segmentId])
  @@index([deviceId])
  @@map("incidents")
}

// FR-505: Push notification subscription
model PushSubscription {
  id        String       @id @default(cuid())
  deviceId  String       @map("device_id")
  pushToken String       @map("push_token")
  segmentId String       @map("segment_id")
  segment   RouteSegment @relation(fields: [segmentId], references: [id])
  createdAt DateTime     @default(now()) @map("created_at")

  @@unique([deviceId, segmentId])
  @@index([segmentId])
  @@map("push_subscriptions")
}
```

### 4.2 Extension de RouteSegment

```prisma
// Anadir a RouteSegment existente:
  // FR-506: Temporary blocking
  temporarilyBlocked Boolean @default(false) @map("temporarily_blocked")
  blockReason        String? @map("block_reason")

  // Relations
  incidents      Incident[]
  subscriptions  PushSubscription[]
```

### 4.3 Nuevos tipos compartidos

```typescript
// packages/shared-types/src/incident.ts

export type IncidentType =
  | "obras"
  | "obstaculo_temporal"
  | "superficie_danada"
  | "ascensor_averiado"
  | "rampa_bloqueada"
  | "otro";

export type IncidentStatus = "pending" | "validated" | "rejected" | "resolved";

export interface IncidentSummary {
  id: string;
  type: IncidentType;
  status: IncidentStatus;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  segmentId: string | null;
  createdAt: string;
}

export interface IncidentDetail extends IncidentSummary {
  deviceId: string;
  photoUrl: string | null;
  aiValidation: boolean | null;
  aiConfidence: number | null;
  aiReason: string | null;
  validationSource: string | null;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface CreateIncidentRequest {
  deviceId: string;
  type: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  segmentId?: string;
  photoUrl?: string;
}

export interface UpdateIncidentStatusRequest {
  status: IncidentStatus;
  reason?: string;
}

export interface IncidentValidationResult {
  plausible: boolean;
  confidence: number;
  reason: string;
  suggestedType?: IncidentType;
  source: "ai" | "template";
}

export interface PushSubscriptionRequest {
  deviceId: string;
  pushToken: string;
  segmentIds: string[];
}
```

---

## 5. Contratos de API

### 5.1 Incidencias

```
POST /api/incidents
Body: CreateIncidentRequest
Response 201: { incident: IncidentDetail }
Response 400: { error: { code: "VALIDATION_ERROR", message } }
Response 429: { error: { code: "RATE_LIMITED", message } }

GET /api/incidents?status=pending&type=obras&segmentId=xxx&limit=20&offset=0
Response 200: { incidents: IncidentSummary[], total: number }

GET /api/incidents/:id
Response 200: { incident: IncidentDetail }
Response 404: { error: { code: "NOT_FOUND", message } }

PATCH /api/incidents/:id/status
Body: UpdateIncidentStatusRequest
Response 200: { incident: IncidentDetail }
Response 404: { error: { code: "NOT_FOUND", message } }

GET /api/incidents/near?lat=40.4468&lng=-3.7264&radius=500
Response 200: { incidents: IncidentSummary[] }
Response 400: { error: { code: "VALIDATION_ERROR", message } }
```

### 5.2 Notificaciones

```
POST /api/notifications/subscribe
Body: PushSubscriptionRequest
Response 200: { subscriptions: number }

DELETE /api/notifications/unsubscribe
Body: { deviceId: string, segmentIds?: string[] }
Response 200: { removed: number }
```

### 5.3 Segmentos

```
PATCH /api/segments/:id/block
Body: { blocked: boolean, reason?: string }
Response 200: { segment: { id, temporarilyBlocked, blockReason } }
Response 404: { error: { code: "NOT_FOUND", message } }
```

---

## 6. Arquitectura de Componentes

### 6.1 Nuevos servicios (server)

| Servicio | Archivo | Responsabilidad |
|----------|---------|----------------|
| IncidentValidator | `services/incidentValidator.ts` | Valida incidencias con IA + fallback |
| NotificationService | `services/notificationService.ts` | Envia push via expo-server-sdk |
| RouteUpdateService | `services/routeUpdateService.ts` | Bloquea/desbloquea segmentos |

### 6.2 Nuevos servicios (mobile)

| Servicio | Archivo | Responsabilidad |
|----------|---------|----------------|
| IncidentService | `services/incidentService.ts` | API calls para incidencias |
| DeviceIdService | `services/deviceIdService.ts` | UUID persistente en AsyncStorage |
| NotificationService | `services/notificationService.ts` | Registro de push token |

### 6.3 Nuevos componentes (mobile)

| Componente | Archivo | Descripcion |
|-----------|---------|-------------|
| ReportIncidentScreen | `screens/ReportIncidentScreen.tsx` | Formulario de reporte |
| IncidentCard | `components/IncidentCard.tsx` | Tarjeta de incidencia |
| IncidentMarker | `components/IncidentMarker.tsx` | Marcador en mapa |
| IncidentTypeSelector | `components/IncidentTypeSelector.tsx` | Selector de tipo accesible |

### 6.4 Nuevos hooks (mobile)

| Hook | Archivo | Returns |
|------|---------|---------|
| `useIncidents(filters)` | `hooks/useIncidents.ts` | `{ incidents, loading, error, refresh }` |
| `useReportIncident()` | `hooks/useReportIncident.ts` | `{ report, loading, error, success }` |
| `useNotifications()` | `hooks/useNotifications.ts` | `{ subscribe, unsubscribe, hasPermission }` |

---

## 7. Mapa de Dependencias

```
apps/mobile -------> expo-notifications (push)
apps/mobile -------> packages/shared-types (tipos incidencia)
apps/admin-web ----> next (App Router)
apps/admin-web ----> packages/shared-types (tipos compartidos)
server ------------> expo-server-sdk (envio push)
server ------------> @anthropic-ai/sdk (validacion IA)
server ------------> packages/shared-types (tipos compartidos)

Build order: shared-types -> server + mobile + admin-web (paralelo)
```

---

## 8. Definition of Done por Tarea

### T5.1 — Modelo de Datos y API de Incidencias
- **Spec IDs:** FR-501, FR-502
- **Archivos:** schema.prisma, shared-types/incident.ts, routes/incidents.ts, seed.ts
- **Tests:** 8 tests (CRUD + filtros + nearby + rate limit + validacion)
- **Done:** API funcional con todos los endpoints, schema migrado, seed con datos

### T5.2 — Reporte de Incidencias Mobile
- **Spec IDs:** FR-502, NFR-502
- **Archivos:** incidentStore.ts, ReportIncidentScreen.tsx, IncidentCard.tsx, IncidentMarker.tsx, incidentService.ts, deviceIdService.ts
- **Tests:** 4 tests (store, service, deviceId)
- **Done:** Reportar incidencia desde la app, ver marcadores en mapa

### T5.3 — Validacion IA de Incidencias
- **Spec IDs:** FR-503
- **Archivos:** incidentValidator.ts, incidentValidator.test.ts
- **Tests:** 5 tests (template validation, AI fallback, spam detection, geo bounds, integration)
- **Done:** Validacion ejecutandose en cada POST /api/incidents

### T5.4 — Panel de Administracion Web
- **Spec IDs:** FR-504
- **Archivos:** apps/admin-web/ completo
- **Tests:** 2 tests (api wrapper, auth validation)
- **Done:** Dashboard funcional con gestion de incidencias y segmentos

### T5.5 — Notificaciones Push
- **Spec IDs:** FR-505
- **Archivos:** routes/notifications.ts, services/notificationService.ts (server + mobile)
- **Tests:** 4 tests (subscribe, unsubscribe, send, mobile register)
- **Done:** Suscripcion al navegar, push al validar incidencia

### T5.6 — Actualizacion de Rutas por Incidencias
- **Spec IDs:** FR-506
- **Archivos:** routes/segments.ts, services/routeUpdateService.ts, routingService.ts
- **Tests:** 4 tests (block, unblock, auto-block on validate, routing avoids blocked)
- **Done:** Segmentos se bloquean/desbloquean, routing los evita

---

## 9. Especificaciones de Tests

### 9.1 Unit Tests (Vitest)

| Test ID | Modulo | Descripcion | Validates |
|---------|--------|-------------|-----------|
| TST-FR-501-001 | incidents route | POST creates incident with valid data | FR-501 |
| TST-FR-501-002 | incidents route | POST returns 400 for invalid body | FR-501 |
| TST-FR-501-003 | incidents route | GET lists incidents with filters | FR-501 |
| TST-FR-501-004 | incidents route | GET returns detail by ID | FR-501 |
| TST-FR-501-005 | incidents route | GET returns 404 for missing incident | FR-501 |
| TST-FR-501-006 | incidents route | PATCH updates incident status | FR-501 |
| TST-FR-502-001 | incidents route | GET near returns incidents in radius | FR-502 |
| TST-FR-501-007 | incidents route | POST rate limits at 5 per hour per device | FR-501, NFR-503 |
| TST-FR-503-001 | incidentValidator | Rejects out-of-bounds coordinates | FR-503 |
| TST-FR-503-002 | incidentValidator | Rejects spam patterns | FR-503 |
| TST-FR-503-003 | incidentValidator | Accepts plausible incident | FR-503 |
| TST-FR-503-004 | incidentValidator | Uses template when no API key | FR-503 |
| TST-FR-503-005 | incidentValidator | Returns source "template" without API | FR-503 |
| TST-FR-505-001 | notifications route | POST subscribe creates subscriptions | FR-505 |
| TST-FR-505-002 | notifications route | DELETE unsubscribe removes subscriptions | FR-505 |
| TST-FR-505-003 | notificationService | Sends to correct push tokens | FR-505 |
| TST-FR-506-001 | segments route | PATCH blocks segment | FR-506 |
| TST-FR-506-002 | segments route | PATCH unblocks segment | FR-506 |
| TST-FR-506-003 | routeUpdateService | Auto-blocks on incident validation | FR-506 |
| TST-FR-506-004 | routingService | Avoids blocked segments in calculation | FR-506 |

---

## 10. Orden de Implementacion

### Dependencias entre tareas

```
T5.1 (Modelo + API) <- fundacion para todo
  ├── T5.3 (Validacion IA) <- se integra en POST incidents
  │     └── T5.6 (Actualizacion Rutas) <- auto-block en validacion
  ├── T5.2 (Mobile Reporting) <- consume API de T5.1
  │     └── T5.5 (Notificaciones) <- suscribe al navegar
  └── T5.4 (Admin Panel) <- consume API de T5.1
```

### Orden sugerido

1. **T5.1** — Modelo de datos y API (base para todo)
2. **T5.3** — Validacion IA (se integra en T5.1)
3. **T5.2** — Mobile reporting (consume API)
4. **T5.4** — Admin panel (consume API, independiente de mobile)
5. **T5.6** — Actualizacion de rutas (depende de T5.3)
6. **T5.5** — Notificaciones push (depende de T5.2)

**Camino critico:** T5.1 -> T5.3 -> T5.6

---

*Documento creado: 2026-03-28*
