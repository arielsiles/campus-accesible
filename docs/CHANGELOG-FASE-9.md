# Historial de Cambios — Fase 9: Multi-Campus y Comunidad

> Registro cronologico de implementacion y cambios durante la Fase 9 del proyecto **Campus GPS Accesible**.
> **Estado:** ✅ Completada (2026-04-07)
> **Spec:** `docs/SPEC-FASE-9.md`

---

## Estado de Tareas — Fase 9

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T9.1 — Modelo User + Auth | FR-901 | ✅ Completada | ██████████ 100% |
| T9.2 — Modelo Campus + Seleccion | FR-902 | ✅ Completada | ██████████ 100% |
| T9.3 — Roles y Autorizacion | FR-903 | ✅ Completada | ██████████ 100% |
| T9.4 — Workflow de Moderacion | FR-904 | ✅ Completada | ██████████ 100% |
| T9.5 — Estadisticas de Campus | FR-905 | ✅ Completada | ██████████ 100% |
| T9.6 — Perfil de Usuario | FR-906 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 9:** ██████████ 100% (6/6 tareas)

---

## Registro de Cambios

### 2026-04-07 — T9.1: Modelo User + Auth [FR-901]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/prisma/schema.prisma** — Nuevos modelos:
   - `User`: id, email (unique), password (bcrypt), name, role (UserRole), deviceId
   - `UserRole` enum: contributor, reviewer, admin
   - Relaciones: User → Route[], User → RouteReview[]

2. **server/src/services/authService.ts** — Servicio de autenticacion:
   - `hashPassword()` — bcrypt 10 rounds
   - `comparePassword()` — verificar hash
   - `generateToken()` / `verifyToken()` — JWT HS256 con Hono/jwt, expiracion 7 dias
   - `registerUser()` — crear usuario, hashear pass, generar JWT
   - `loginUser()` — verificar credenciales, generar JWT
   - `AuthError` class con codigo de error
   - 3 tests pasando

3. **server/src/routes/auth.ts** — Endpoints:
   - `POST /api/auth/register` — registro con email/password/name, Zod validation
   - `POST /api/auth/login` — login, retorna JWT + user public
   - 5 tests pasando

4. **packages/shared-types/src/auth.ts** — Tipos compartidos:
   - UserRole, RouteStatus, UserPublic, RegisterRequest, LoginRequest, AuthResponse
   - ROUTE_STATUS_LABELS, USER_ROLE_LABELS

5. **apps/mobile/src/store/authStore.ts** — Estado de sesion:
   - login(), register(), logout(), restoreSession()
   - Persistencia en AsyncStorage

6. **apps/mobile/src/screens/LoginScreen.tsx** — Pantalla de login:
   - Formulario accesible con email/password
   - Boton "Crear cuenta" y "Continuar sin cuenta"
   - Labels en espanol, accessibilityRole en todos los campos

7. **apps/mobile/src/screens/RegisterScreen.tsx** — Pantalla de registro:
   - Nombre, email, password, confirmar password
   - Validacion de passwords coincidentes
   - Todos los campos accesibles

---

### 2026-04-07 — T9.2: Modelo Campus + Seleccion [FR-902]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/prisma/schema.prisma** — Modelo Campus:
   - name, description, centerLng, centerLat, boundingBox (JSON), imageUrl
   - Relacion: Campus → Route[]
   - Route extendida con campusId FK

2. **server/src/routes/campuses.ts** — Endpoints:
   - `GET /api/campuses` — lista publica con conteo de rutas publicadas
   - `GET /api/campuses/:id` — detalle de campus
   - `POST /api/campuses` — crear campus (solo admin)

3. **apps/mobile/src/store/campusStore.ts** — Estado:
   - fetchCampuses(), selectCampus(), restoreSelection()
   - Persistencia del campus seleccionado en AsyncStorage

4. **apps/mobile/src/screens/CampusSelectionScreen.tsx** — Seleccion:
   - Lista de campus con nombre, descripcion, conteo de rutas
   - Estado vacio con reintento
   - Totalmente accesible

5. **server/prisma/seed.ts** — Seed actualizado:
   - Campus "Ciudad Universitaria (UCM)" con bounding box
   - Admin user: admin@campusgps.dev / admin123
   - Las 3 rutas asignadas al campus con creatorId

---

### 2026-04-07 — T9.3: Roles y Autorizacion [FR-903]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/middleware/authMiddleware.ts** — Middleware:
   - `requireAuth()` — verifica JWT Bearer token, inyecta user en context
   - `requireRole(...roles)` — verifica que el usuario tenga uno de los roles
   - Mensajes de error en espanol

2. **Proteccion de endpoints:**
   - POST /api/campuses → requireAuth() + requireRole("admin")
   - POST /api/moderation/* → requireAuth() + requireRole("reviewer", "admin")
   - GET /api/users/* → requireAuth()

---

### 2026-04-07 — T9.4: Workflow de Moderacion [FR-904]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/prisma/schema.prisma** — Modelos:
   - `RouteReview`: routeId, reviewerId, action (ReviewAction), comment
   - `RouteStatus` enum: draft, pending_review, changes_requested, published, rejected, archived
   - `ReviewAction` enum: approved, changes_requested, rejected
   - Route extendida con status (default: published para backward compat)

2. **server/src/routes/moderation.ts** — Endpoints:
   - `GET /api/moderation/pending` — rutas pendientes (reviewer+)
   - `POST /api/moderation/routes/:id/review` — aprobar/rechazar/pedir cambios
   - Rebuild grafo automatico al aprobar

3. **server/src/routes/routeManagement.ts** — Actualizado:
   - POST /api/routes ahora detecta JWT y asigna status segun rol
   - contributor → pending_review, admin → published
   - Solo rebuild grafo para rutas publicadas

4. **server/src/services/routeCreationService.ts** — Actualizado:
   - createRoute() acepta options: creatorId, status, campusId
   - Solo rebuild grafo si status === "published"

5. **server/src/routes/routes.ts** — Filtrado:
   - GET /api/routes solo retorna publicadas por defecto
   - Query param ?campusId para filtrar por campus
   - Query param ?status para admin/reviewer

---

### 2026-04-07 — T9.5: Estadisticas de Campus [FR-905]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/routes/campuses.ts** — GET /api/campuses/:id/stats:
   - publishedRoutes, totalWaypoints, totalSegments
   - accessibilityCoverage (% segmentos con datos completos)
   - activeIncidents, resolvedIncidents
   - pendingRoutes (en revision)
   - Queries paralelas con Promise.all

---

### 2026-04-07 — T9.6: Perfil de Usuario [FR-906]

**Categoria:** Implementacion

#### Cambios realizados:

1. **server/src/routes/users.ts** — Endpoints:
   - `GET /api/users/me` — perfil del usuario autenticado
   - `GET /api/users/:id/routes` — rutas creadas por el usuario

2. **apps/mobile/src/screens/ProfileScreen.tsx** — Pantalla:
   - Avatar con inicial, nombre, email, rol
   - Campus seleccionado
   - Lista de rutas con estado (badge de color)
   - Boton cerrar sesion
   - Totalmente accesible

3. **apps/mobile/App.tsx** — Flujo de navegacion:
   - loading → login/register → campus selection → map → profile
   - "Continuar sin cuenta" salta auth
   - RestoreSession + restoreSelection al iniciar
   - Logout vuelve a login

4. **apps/mobile/src/screens/MapScreen.tsx** — Actualizado:
   - Props: onNavigateProfile, onNavigateCampus
   - FAB de perfil (circulo oscuro, esquina superior izquierda)
   - Importa authStore para mostrar inicial del usuario

5. **apps/mobile/src/services/apiClient.ts** — Auth headers:
   - getAuthHeaders() inyecta Bearer token desde AsyncStorage
   - Todos los metodos (GET, POST, PATCH, DELETE) usan auth headers

---

## Mapa de Arquitectura — Fase 9

```
server/
  prisma/schema.prisma                     [FR-901-904] User, Campus, RouteReview, RouteStatus
  prisma/seed.ts                           [FR-901-902] Admin user + campus CU
  src/services/authService.ts              [FR-901] Register, login, JWT, bcrypt
  src/middleware/authMiddleware.ts          [FR-903] requireAuth, requireRole
  src/routes/auth.ts                       [FR-901] POST register, login
  src/routes/campuses.ts                   [FR-902, FR-905] CRUD campus + stats
  src/routes/moderation.ts                 [FR-904] Review workflow
  src/routes/users.ts                      [FR-906] User profile + routes
  src/routes/routeManagement.ts            [FR-904] Route creation with status
  src/routes/routes.ts                     [FR-904] Filter by status + campus

packages/shared-types/
  src/auth.ts                              [FR-901] UserRole, RouteStatus, AuthResponse types

apps/mobile/
  App.tsx                                  [FR-901-902] Auth + campus flow
  src/store/authStore.ts                   [FR-901] Login, register, session persistence
  src/store/campusStore.ts                 [FR-902] Campus selection + persistence
  src/screens/LoginScreen.tsx              [FR-901] Email/password login
  src/screens/RegisterScreen.tsx           [FR-901] Registration form
  src/screens/CampusSelectionScreen.tsx    [FR-902] Campus picker
  src/screens/ProfileScreen.tsx            [FR-906] User profile + route history
  src/screens/MapScreen.tsx                [FR-901] Profile FAB
  src/services/apiClient.ts               [FR-901] Auth header injection
```
