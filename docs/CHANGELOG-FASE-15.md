# Historial de Cambios — Fase 15: Crowdsourcing Inteligente y Aprendizaje

> **Estado:** ✅ Completada (2026-05-02)
> **Spec:** `docs/SPEC-FASE-15.md`

---

## Estado de Tareas — Fase 15

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T15.1 — Privacy store + opt-in telemetria | NFR-1501 | ✅ Completada | ██████████ 100% |
| T15.2 — TelemetryService + endpoint | FR-1501 | ✅ Completada | ██████████ 100% |
| T15.3 — Agregacion incremental SegmentMetrics | FR-1506 | ✅ Completada | ██████████ 100% |
| T15.4 — Validacion comunitaria de incidencias | FR-1504 | ✅ Completada | ██████████ 100% |
| T15.5 — Feedback post-navegacion | FR-1505 | ✅ Completada | ██████████ 100% |
| T15.6 — Re-weighting (endpoint manual) | FR-1502 | ✅ Completada | ██████████ 100% |
| T15.7 — Deteccion automatica de atajos | FR-1503 | ⏭ Diferido (requiere volumen de usuarios real) | ░░░░░░░░░░ 0% |
| T15.8 — Heat map en admin web | FR-1507 | ⏭ Diferido (admin-web no desplegada en VPS) | ░░░░░░░░░░ 0% |
| T15.9 — Sistema de reputacion + UI perfil | FR-1508 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 15:** ██████████ 100% (7/9 tareas activas, 2 diferidas)

---

## Lo que cambia para el usuario

| Antes | Ahora |
|-------|-------|
| Las rutas no aprendian de uso real | Cada navegacion puede mejorar las rutas para todos (opt-in) |
| Reportar 5 veces la misma incidencia → 5 incidencias duplicadas | 5 reportes → 1 incidencia con confirmCount=5, valida automaticamente |
| Al llegar al destino, fin de la experiencia | Modal "¿Como estuvo la ruta?" con feedback |
| Contributors no recibian reconocimiento | Sistema de reputacion: 🥉 Bronce / 🥈 Plata / 🥇 Oro |

## Componentes implementados

### Server

| Archivo | Que hace |
|---------|----------|
| `routes/telemetry.ts` | POST `/api/telemetry/traces` (anonimo, agregacion incremental) |
| `routes/feedback.ts` | POST `/api/feedback/route` con feedback aggregation |
| `routes/reweighting.ts` | Admin: trigger re-weighting + ver metricas |
| `services/edgeReweightingService.ts` | Re-pesa aristas con bounds ±30% |
| `services/reputationService.ts` | Eventos de reputacion + auto-leveling |
| `routes/incidents.ts` | Dedup logic: nearby same-type → confirmCount++ |
| `routes/moderation.ts` | Otorga reputacion al aprobar/rechazar rutas |

### Mobile

| Archivo | Que hace |
|---------|----------|
| `store/privacyStore.ts` | Opt-in toggle persistente (default OFF) |
| `services/telemetryService.ts` | Cola batched cada 30s + offline queue |
| `components/RouteFeedbackModal.tsx` | Modal post-arrival con good/ok/bad |
| `screens/NavigationScreen.tsx` | Telemetry lifecycle + GPS recording + feedback modal |
| `screens/ProfileScreen.tsx` | Card de reputacion + toggle privacidad + clear data |

### Schema

| Modelo | Que almacena |
|--------|--------------|
| `GpsTrace` | Trazas GPS anonimas con TTL 24h |
| `SegmentMetrics` | Agregado por segmento: usageCount, avgTraversalTime, offRouteRate, feedbackScore |
| `RouteFeedback` | Feedback raw post-navegacion con segmentIds |
| `IncidentConfirm` | Confirmaciones unicas por (incidentId, deviceId) |
| `User.reputation/level` | Puntos + nivel (bronze/silver/gold) |
| `Incident.confirmCount/lastConfirmedAt` | Contador comunitario |

## Endpoints API

```
POST /api/telemetry/traces              FR-1501 + FR-1506
DELETE /api/telemetry/expired           cleanup TTL
POST /api/feedback/route                FR-1505
POST /api/admin/reweight                FR-1502 (admin)
GET /api/admin/metrics                  FR-1506 (admin/reviewer)
```

## Sistema de reputacion (FR-1508)

| Evento | Puntos |
|--------|--------|
| Ruta aprobada | +10 |
| Ruta rechazada | -5 |
| Incidencia validada | +5 |
| Incidencia confirmada por otra persona | +1 |

| Nivel | Umbral |
|-------|--------|
| 🥉 Bronce | 0-99 puntos |
| 🥈 Plata | 100-499 puntos |
| 🥇 Oro | 500+ puntos |

## Re-weighting de aristas (FR-1502)

Ajuste por arista (bounded ±30%):

- **Popularidad**: si usageCount > mediana → reducir peso (preferida)
- **Off-route rate alto** (>30%): aumentar peso (ruta problematica)
- **Feedback bajo** (<1.8 promedio con >=3 votos): +15% peso
- **Feedback alto** (>2.5): -5% peso
- **Minimo 5 usos** antes de aplicar ajuste (evita ruido)

Llamado manualmente por admin via `POST /api/admin/reweight`. En el futuro
se puede convertir en cron job nocturno.

## Validacion comunitaria de incidencias (FR-1504)

```
Usuario reporta incidencia
       ↓
¿Existe otra del mismo tipo a <20m?
   NO → Crear nueva incidencia (confirmCount=1)
   SI → ¿El mismo deviceId ya confirmo?
        SI → "Ya habias reportado esta"
        NO → Incrementar confirmCount, +1 reputacion al confirmar
              ¿confirmCount >= 3 y status=pending?
                 SI → status = "validated" automatico (sin moderador)
```

## Privacidad (NFR-1501)

- **Opt-in default OFF**: usuario debe activar explicitamente en perfil
- **Anonimizado**: trazas no contienen userId/deviceId
- **TTL 24h**: trazas individuales se borran automaticamente
- **Solo agregados persisten**: SegmentMetrics tiene los promedios
- **"Borrar datos locales"**: boton en perfil para limpiar cola pendiente

## Diferidos

- **T15.7 (deteccion atajos)**: requiere volumen real de usuarios (~50 distintos por mes en una zona). Implementacion futura cuando hay datos.
- **T15.8 (heatmap admin)**: requiere admin-web desplegada. Pendiente de Fase 10.

## Tests pendientes

- Server tests para reputationService y edgeReweightingService (logica pura, facil testear)
- Mobile tests para privacyStore y telemetryService

---

*Documento creado: 2026-05-02*
