# Especificacion de Desarrollo — Fase 10: Financiamiento y Lanzamiento Publico

> **Version:** 1.0 | **Fecha:** 2026-04-05 | **Estado:** Draft
> **Prefijo IDs:** FR-10XX (funcionales), NFR-10XX (no funcionales)
> **Fase anterior:** Fase 9 — ver `SPEC-FASE-9.md`

---

## 1. Alcance

### En Scope (Fase 10)

- Dashboard de metricas de impacto para presentar a financiadores
- Verificacion de cumplimiento EN 301 549 (directiva europea)
- Publicacion en App Store y Google Play
- API publica documentada para integraciones de terceros
- Materiales de presentacion (pitch deck data)
- Framework de partnership universitario

### Fuera de Scope

- Monetizacion activa (suscripciones, anuncios)
- Expansion internacional (fuera de Espana)
- Integracion con sistemas universitarios (matricula, horarios)

---

## 2. Requisitos Funcionales

### FR-1001: Dashboard de Metricas de Impacto

**Descripcion:** Panel web que muestra metricas agregadas del proyecto para presentar a potenciales financiadores, universidades socias, y entidades de accesibilidad.

**Metricas clave:**
- Total de campus registrados
- Total de rutas publicadas (por campus y global)
- Metros de camino mapeado con datos de accesibilidad
- Incidencias reportadas y resueltas (tasa de resolucion)
- Usuarios activos (diario, mensual)
- Desglose por perfil de accesibilidad (% usuarios por tipo)
- Cobertura de accesibilidad (% segmentos con datos completos)
- Tiempo promedio de moderacion de rutas

**Archivos requeridos:**
- `apps/admin-web/src/app/metrics/page.tsx` — dashboard de metricas
- `server/src/routes/metrics.ts` — API de metricas agregadas
- `server/src/services/metricsService.ts` — consultas de agregacion

---

### FR-1002: Cumplimiento EN 301 549

**Descripcion:** Verificacion y documentacion de cumplimiento con la norma europea de accesibilidad para productos y servicios TIC (EN 301 549), que implementa la Directiva (UE) 2016/2102.

**Requisitos a verificar:**
- Clausula 11: Software (aplica a la app movil)
- Clausula 12: Documentacion y servicios de soporte
- Criterios WCAG 2.1 AA (ya auditado en Fase 6)
- Compatibilidad con tecnologias de asistencia (TalkBack, VoiceOver)
- Documentacion de accesibilidad de la app

**Archivos requeridos:**
- `docs/CUMPLIMIENTO-EN-301-549.md` — declaracion de conformidad
- `docs/DECLARACION-ACCESIBILIDAD.md` — declaracion publica de accesibilidad

---

### FR-1003: Publicacion en Tiendas

**Descripcion:** Preparar y publicar la app en Apple App Store y Google Play Store.

**Tareas:**
- Configurar EAS Build para produccion
- Crear assets de tienda: iconos, screenshots, descripciones (en espanol)
- Configurar firma de app (keystore Android, certificados iOS)
- Rellenar fichas de tienda con informacion de accesibilidad
- Completar cuestionarios de accesibilidad de Google/Apple
- Configurar TestFlight (iOS) y Google Play Internal Testing

---

### FR-1004: API Publica Documentada

**Descripcion:** Documentacion OpenAPI/Swagger de los endpoints publicos para que otras universidades o desarrolladores puedan integrar con el sistema.

**Endpoints publicos:**
- Campus: listar, detalle
- Rutas: listar, detalle, calcular
- Waypoints: buscar
- Exportacion: campus bundle

**Archivos requeridos:**
- `server/src/routes/docs.ts` — endpoint de documentacion Swagger
- `docs/API-PUBLICA.md` — guia de integracion

---

### FR-1005: Framework de Partnership Universitario

**Descripcion:** Documentacion y proceso para que una universidad se sume como campus piloto.

**Contenido:**
- Requisitos tecnicos minimos (servidor, base de datos)
- Proceso de onboarding (crear campus, importar rutas)
- Roles y responsabilidades (quien mantiene los datos)
- SLA de soporte y actualizaciones
- Template de acuerdo de colaboracion

**Archivos requeridos:**
- `docs/PARTNERSHIP-UNIVERSITARIO.md`

---

## 3. Requisitos No Funcionales

### NFR-1001: Disponibilidad para Produccion

| Criterio | Detalle |
|----------|---------|
| Uptime | >= 99.5% (servidor) |
| Tiempo de respuesta API | P95 < 500ms |
| App crash rate | < 1% sesiones |
| Tamano de la app | < 50MB (APK/IPA) |

### NFR-1002: Seguridad para Produccion

| Criterio | Detalle |
|----------|---------|
| HTTPS | Obligatorio en produccion |
| API keys | Rotacion trimestral |
| Datos personales | Cumplimiento RGPD (email + contrasena) |
| Backup BD | Diario automatico |

---

## 4. Orden de Implementacion

1. **T10.1** — Metricas de impacto (API + dashboard)
2. **T10.2** — Cumplimiento EN 301 549 (documentacion)
3. **T10.3** — API publica documentada (OpenAPI)
4. **T10.4** — Framework de partnership (documentacion)
5. **T10.5** — Publicacion en tiendas (build + deploy)

---

*Documento creado: 2026-04-05*
