# Especificacion de Desarrollo — Fase 9: Multi-Campus y Comunidad

> **Version:** 1.0 | **Fecha:** 2026-04-05 | **Estado:** Draft
> **Prefijo IDs:** FR-9XX (funcionales), NFR-9XX (no funcionales)
> **Fase anterior:** Fase 8 — ver `SPEC-FASE-8.md`

---

## 1. Alcance

### En Scope (Fase 9)

- Autenticacion de usuarios: registro e inicio de sesion con email
- Modelo User con roles: contributor, reviewer, admin
- Pantalla de seleccion de campus al iniciar la app
- Descubrimiento de campus: lista publica de ubicaciones disponibles
- Workflow de moderacion: rutas creadas pasan por revision antes de ser publicas
- Estadisticas por campus: rutas, usuarios activos, cobertura de accesibilidad
- Perfil de usuario con historial de rutas creadas e incidencias reportadas

### Fuera de Scope

- Login social (Google, Apple) — se implementa solo email/password en esta fase
- Monetizacion / suscripciones
- Chat o mensajeria entre usuarios
- API publica para terceros (Fase 10)

---

## 2. Requisitos Funcionales

### FR-901: Autenticacion de Usuarios

**Descripcion:** Sistema de registro e inicio de sesion con email y contrasena. JWT tokens para sesion. El deviceId anonimo de Fase 5 se vincula al usuario al registrarse.

**Criterios de aceptacion:**

```gherkin
Given un usuario nuevo
When se registra con email y contrasena
Then se crea la cuenta y se le asigna rol "contributor"

Given un usuario registrado
When inicia sesion con credenciales correctas
Then recibe un JWT token y accede a la app

Given un usuario no registrado
When usa la app
Then puede navegar rutas publicas pero NO crear rutas ni ver rutas pendientes

Given un usuario con incidencias anteriores (deviceId)
When se registra
Then sus incidencias existentes se vinculan a su cuenta

Given la pantalla de login
When TalkBack esta activo
Then todos los campos tienen labels accesibles en espanol
```

**Archivos requeridos:**
- `server/prisma/schema.prisma` — modelo User con roles
- `server/src/routes/auth.ts` — POST /api/auth/register, POST /api/auth/login
- `server/src/services/authService.ts` — hashing, JWT, validacion
- `apps/mobile/src/screens/LoginScreen.tsx`
- `apps/mobile/src/screens/RegisterScreen.tsx`
- `apps/mobile/src/store/authStore.ts` — estado de sesion

---

### FR-902: Modelo de Campus Multi-Ubicacion

**Descripcion:** Modelo de datos Campus que agrupa rutas, waypoints y segmentos bajo una ubicacion. Cada campus tiene nombre, centro, bounding box, y administrador.

**Criterios de aceptacion:**

```gherkin
Given la base de datos
When existen multiples campus
Then cada ruta pertenece a exactamente un campus

Given un usuario abriendo la app
When hay multiples campus disponibles
Then ve una pantalla de seleccion con nombre, imagen, y numero de rutas

Given un campus seleccionado
When el usuario navega
Then solo ve rutas, waypoints e incidencias de ese campus

Given un administrador
When crea un nuevo campus
Then define nombre, descripcion, coordenadas centro, y bounding box
```

**Archivos requeridos:**
- `server/prisma/schema.prisma` — modelo Campus
- `server/src/routes/campuses.ts` — CRUD de campus
- `apps/mobile/src/screens/CampusSelectionScreen.tsx`
- `apps/mobile/src/store/campusStore.ts`

---

### FR-903: Roles y Permisos

**Descripcion:** Sistema de roles que determina que puede hacer cada usuario.

| Rol | Crear rutas | Revisar rutas | Gestionar campus | Gestionar usuarios |
|-----|------------|--------------|-----------------|-------------------|
| contributor | Si (pendientes) | No | No | No |
| reviewer | Si (pendientes) | Si (aprobar/rechazar) | No | No |
| admin | Si (auto-aprobadas) | Si | Si | Si |

---

### FR-904: Workflow de Moderacion de Rutas

**Descripcion:** Las rutas creadas por contributors tienen estado "draft" o "pending_review". Los reviewers pueden aprobar, pedir cambios, o rechazar. Solo rutas "published" son visibles para todos.

**Criterios de aceptacion:**

```gherkin
Given un contributor que crea una ruta
When la sube al servidor
Then la ruta tiene estado "pending_review" y solo es visible para el creador y reviewers

Given un reviewer
When revisa una ruta pendiente
Then puede "aprobar" (→ published), "pedir cambios" (→ changes_requested), o "rechazar" (→ rejected)

Given una ruta aprobada
When se publica
Then es visible para todos los usuarios del campus y se integra al grafo de navegacion

Given un admin que crea una ruta
When la sube
Then se auto-aprueba y se publica inmediatamente
```

**Estados de ruta:**
| Estado | Visible para | En grafo |
|--------|-------------|----------|
| draft | Solo creador | No |
| pending_review | Creador + reviewers | No |
| changes_requested | Solo creador | No |
| published | Todos | Si |
| rejected | Solo creador + reviewers | No |
| archived | Nadie (soft delete) | No |

---

### FR-905: Estadisticas de Campus

**Descripcion:** Dashboard de estadisticas por campus accesible desde la app y el panel admin.

**Metricas:**
- Numero de rutas publicadas
- Numero de waypoints y segmentos
- Cobertura de accesibilidad (% segmentos con datos completos)
- Incidencias activas vs resueltas
- Usuarios activos (ultimo mes)
- Rutas pendientes de revision

---

### FR-906: Perfil de Usuario

**Descripcion:** Pantalla de perfil con historial de contribuciones.

**Contenido:**
- Nombre, email, rol, fecha de registro
- Rutas creadas (con estado)
- Incidencias reportadas
- Campus a los que contribuye

---

## 3. Requisitos No Funcionales

### NFR-901: Seguridad

| Criterio | Detalle |
|----------|---------|
| Contrasenas | Hashing con bcrypt (min 10 rounds) |
| JWT | Expiracion 7 dias, refresh token opcional |
| Autorizacion | Middleware que verifica rol en cada endpoint protegido |
| Rate limiting | Max 5 intentos de login por minuto por IP |

### NFR-902: Escalabilidad

| Criterio | Detalle |
|----------|---------|
| Campus simultaneos | Soportar 50+ campus sin degradacion |
| Usuarios por campus | Soportar 1000+ usuarios por campus |
| Rutas por campus | Soportar 200+ rutas por campus |

---

## 4. Modelos de Datos

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  name      String
  role      UserRole @default(contributor)
  deviceId  String?  @map("device_id") // vinculado de Fase 5
  createdAt DateTime @default(now())
  
  routes    Route[]     @relation("CreatedRoutes")
  reviews   RouteReview[]
  
  @@map("users")
}

model Campus {
  id          String   @id @default(cuid())
  name        String
  description String
  centerLng   Float
  centerLat   Float
  boundingBox Json     // { minLng, minLat, maxLng, maxLat }
  createdAt   DateTime @default(now())
  
  routes Route[]
  
  @@map("campuses")
}

enum UserRole {
  contributor
  reviewer
  admin
  @@map("user_role")
}

enum RouteStatus {
  draft
  pending_review
  changes_requested
  published
  rejected
  archived
  @@map("route_status")
}

// Anadir a Route existente:
//   status    RouteStatus @default(draft)
//   creatorId String?
//   campusId  String?
```

---

## 5. Orden de Implementacion

1. **T9.1** — Modelo User + Auth (register/login/JWT)
2. **T9.2** — Modelo Campus + CRUD + seleccion en app
3. **T9.3** — Roles y middleware de autorizacion
4. **T9.4** — RouteStatus + workflow de moderacion
5. **T9.5** — Estadisticas de campus
6. **T9.6** — Perfil de usuario

**Camino critico:** T9.1 → T9.3 → T9.4

---

*Documento creado: 2026-04-05*
