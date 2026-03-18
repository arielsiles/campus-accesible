# Gobernanza del Proyecto — Campus GPS Accesible

> Versión: 1.0 | Fecha: 2026-03-11 | Estado: Draft

---

## 1. Modelo de Gobernanza

### 1.1 Roles

| Rol | Responsable | Responsabilidades |
|-----|-------------|-------------------|
| **Project Owner** | Humano | Aprueba specs, revisa PRs, decide arquitectura, acepta entregables |
| **Development Agent** | Claude Code | Implementa según spec, escribe tests, propone soluciones técnicas |

### 1.2 Matriz de Autoridad

| Decisión | Quién Decide | Quién Propone |
|----------|-------------|---------------|
| Arquitectura y stack | Project Owner | Claude Code |
| Enfoque de bug fix | Claude Code (ejecuta) | Claude Code |
| Nuevas dependencias | Project Owner | Claude Code |
| Diseño de API/modelos | Project Owner | Claude Code |
| Convenciones de código | Project Owner (via CLAUDE.md) | Claude Code |
| Contenido de accesibilidad (labels, textos) | Project Owner | Claude Code |
| Merge a main | Project Owner | Claude Code (crea PR) |

### 1.3 Protocolo de Sesión Claude Code

1. Leer `CLAUDE.md` (automático)
2. Declarar intención: qué tarea va a abordar y qué spec IDs cubre
3. Referenciar specs antes de escribir código
4. Implementar con tests (TDD o junto a implementación)
5. Commit con formato estándar y spec IDs
6. Resumen de lo realizado al finalizar

---

## 2. Estrategia de Trazabilidad

### 2.1 Cadena de Trazabilidad

```
Requirement (SPEC) → Issue (GitHub) → Branch → Code (comentario spec) → Test (validates) → PR → Docs
```

### 2.2 Convención de IDs

| Prefijo | Significado | Ejemplo |
|---------|-------------|---------|
| `FR-NNN` | Requisito funcional | FR-001 (Monorepo Structure) |
| `NFR-NNN` | Requisito no funcional | NFR-001 (Performance) |
| `T[fase].[número]` | Tarea de desarrollo | T1.1 (Monorepo setup) |
| `TST-[FR/NFR]-NNN` | Test case | TST-FR-001 (test monorepo build) |
| `ADR-NNN` | Architecture Decision Record | ADR-001 (Turborepo) |

### 2.3 Auditoría de Fase

Antes de cerrar cada fase:
1. Generar matriz de trazabilidad completa (FR/NFR → código → test)
2. Verificar que todos los spec IDs tienen al menos un test
3. Documentar tech debt pendiente
4. Actualizar `CLAUDE.md` con lecciones aprendidas

---

## 3. Mitigación de Riesgos — Fase 1

| ID | Riesgo | Prob. | Impacto | Mitigación |
|----|--------|-------|---------|------------|
| R-001 | MapLibre incompatible con Expo SDK 52+ | Media | Alto | Spike de validación primero (2h). Fallback: react-native-maps |
| R-002 | PostGIS en Windows problemático | Media | Medio | Docker como path principal para DB |
| R-003 | Metro bundler + monorepo conflictos | Media | Medio | Configurar metro.config.js temprano, validar en spike |
| R-004 | GPS simulation en emulador insuficiente | Baja | Medio | Mock de expo-location para dev, device físico para validación |
| R-005 | Prisma + PostGIS tipos geoespaciales | Media | Medio | Spike de validación, SQL raw como alternativa |

---

## 4. Spikes de Validación (Antes de Implementar)

Cada spike tiene un timebox de **2 horas máximo**. Si no se resuelve, escalar al Project Owner.

| # | Spike | Objetivo | Criterio de Éxito |
|---|-------|----------|-------------------|
| 1 | Expo + MapLibre GL Native | ¿Compila el módulo nativo en Android? | App arranca con mapa visible en emulador |
| 2 | Prisma + PostGIS | ¿Maneja tipos geoespaciales? ¿Qué SQL raw necesita? | CRUD con columna geometry funciona |
| 3 | Turborepo + Expo | ¿Metro bundler resuelve el monorepo? | `turbo build` exitoso, app importa shared-types |

---

## 5. Template ADR (Architecture Decision Records)

```markdown
# ADR-NNN: [Título]

- **Estado:** Propuesto | Aceptado | Rechazado | Sustituido
- **Fecha:** YYYY-MM-DD
- **Contexto:** ¿Qué problema o necesidad motiva esta decisión?
- **Decisión:** ¿Qué se decidió?
- **Consecuencias:**
  - Positivas: ...
  - Negativas: ...
- **Alternativas consideradas:**
  1. [Alternativa] — razón de rechazo
  2. [Alternativa] — razón de rechazo
```

### ADRs Iniciales a Crear

| ADR | Título | Estado |
|-----|--------|--------|
| ADR-001 | Turborepo como herramienta de monorepo | Aceptado |
| ADR-002 | MapLibre GL como motor de mapas | Aceptado |
| ADR-003 | Hono como framework de servidor | Aceptado |
| ADR-004 | Prisma + PostGIS para persistencia geoespacial | Aceptado |
| ADR-005 | GeoJSON como formato de datos de rutas | Aceptado |
| ADR-006 | Zustand como gestor de estado | Aceptado |
| ADR-007 | Política de idiomas (código EN, UI ES) | Aceptado |

#### ADR-001: Turborepo como Herramienta de Monorepo

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** El proyecto tiene múltiples packages (mobile, server, shared-types). Se necesita una herramienta que gestione builds, tests y dependencias entre ellos de forma eficiente.
- **Decisión:** Usar Turborepo con pnpm workspaces.
- **Consecuencias:**
  - Positivas: Builds incrementales, cache de tareas, pipeline declarativo, buen soporte de TypeScript.
  - Negativas: Configuración adicional de Metro bundler para resolver packages del monorepo.
- **Alternativas consideradas:**
  1. Nx — Más complejo, más features de las que necesitamos.
  2. Lerna — Menos mantenido, sin cache nativo.

#### ADR-002: MapLibre GL como Motor de Mapas

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** Necesitamos un motor de mapas con tiles vectoriales, estilos custom y soporte de GeoJSON. Debe ser open source.
- **Decisión:** Usar MapLibre GL Native via `@maplibre/maplibre-react-native`.
- **Consecuencias:**
  - Positivas: Open source (BSD), tiles vectoriales, estilos personalizables, soporte GeoJSON nativo.
  - Negativas: Menos estable que Mapbox SDK propietario, requiere validación con Expo SDK actual.
- **Alternativas consideradas:**
  1. react-native-maps (Google Maps) — Propietario, sin tiles vectoriales custom.
  2. Mapbox SDK — Propietario, costoso para uso extensivo.

#### ADR-003: Hono como Framework de Servidor

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** El servidor necesita servir una API REST ligera. TypeScript nativo es requisito.
- **Decisión:** Usar Hono con Node.js.
- **Consecuencias:**
  - Positivas: Ultraligero, TypeScript nativo, API similar a Express, soporte de middleware.
  - Negativas: Ecosistema más pequeño que Express.
- **Alternativas consideradas:**
  1. Express — Más ecosistema pero tipado más débil.
  2. Fastify — Buena opción, pero Hono es más ligero y moderno.

#### ADR-004: Prisma + PostGIS para Persistencia Geoespacial

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** Las rutas tienen componentes geoespaciales (coordenadas, LineStrings). Necesitamos un ORM type-safe con soporte geoespacial.
- **Decisión:** Usar Prisma como ORM con PostgreSQL + extensión PostGIS. Queries geoespaciales via `$queryRaw`.
- **Consecuencias:**
  - Positivas: Type-safe, migraciones automáticas, excelente DX.
  - Negativas: PostGIS requiere SQL raw para operaciones espaciales avanzadas.
- **Alternativas consideradas:**
  1. Drizzle ORM — Más cercano a SQL, pero menos maduro.
  2. TypeORM — Soporte PostGIS pero peor tipado.

#### ADR-005: GeoJSON como Formato de Datos de Rutas

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** Las rutas del campus incluyen segmentos (líneas) y waypoints (puntos). Necesitamos un formato estándar interoperable.
- **Decisión:** Usar GeoJSON (RFC 7946) como formato principal. FeatureCollection con LineString (segmentos) y Point (waypoints).
- **Consecuencias:**
  - Positivas: Estándar abierto, soporte nativo en MapLibre y PostGIS, herramientas de visualización disponibles.
  - Negativas: Verbose para grandes datasets (mitigable con compresión).
- **Alternativas consideradas:**
  1. GPX — Más orientado a tracks, menos flexible para metadatos.
  2. Protocol Buffers — Más eficiente pero no legible ni estándar geoespacial.

#### ADR-006: Zustand como Gestor de Estado

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** La app necesita estado global para ubicación del usuario, estado del mapa y datos de rutas.
- **Decisión:** Usar Zustand.
- **Consecuencias:**
  - Positivas: API minimalista, sin boilerplate, excelente soporte TypeScript, buen rendimiento.
  - Negativas: Menos estructura que Redux para equipos grandes (no aplica en este proyecto).
- **Alternativas consideradas:**
  1. Redux Toolkit — Demasiado boilerplate para el tamaño del proyecto.
  2. Jotai — Atómico, bueno pero Zustand es más intuitivo para stores.

#### ADR-007: Política de Idiomas

- **Estado:** Aceptado
- **Fecha:** 2026-03-11
- **Contexto:** El proyecto sirve a una comunidad universitaria hispanohablante, pero el código debe ser mantenible internacionalmente.
- **Decisión:** Código en inglés, UI en español, documentación en español, commits en inglés, labels de accesibilidad en español.
- **Consecuencias:**
  - Positivas: Código legible internacionalmente, UI accesible para usuarios target.
  - Negativas: Requiere disciplina para mantener la separación.
- **Alternativas consideradas:**
  1. Todo en español — Dificulta colaboración y uso de herramientas IA.
  2. Todo en inglés — UI incomprensible para usuarios target.

---

## 6. Quality Gates — Criterios de Salida Fase 1

- [ ] Todos los FR-001 a FR-009 implementados y testeados
- [ ] Todos los NFR-001 a NFR-005 verificados
- [ ] CI green en main
- [ ] Cobertura de tests: ≥70% services, ≥50% global
- [ ] Matriz de trazabilidad completa (FR/NFR → código → test)
- [ ] Checklist manual completado en emulador Android
- [ ] Accesibilidad base verificada (labels, roles, touch targets)
- [ ] `CLAUDE.md` actualizado con lecciones aprendidas
- [ ] ADRs documentados (ADR-001 a ADR-007)
- [ ] Tech debt documentado si existe

---

## 7. Proceso de Transición Entre Fases

1. Test suite completo pasa en CI
2. Generar reporte de trazabilidad
3. Code review final (Project Owner)
4. Testing manual en emulador Android
5. Retrospectiva: ¿qué funcionó, qué no?
6. Actualizar `CLAUDE.md` con lecciones aprendidas
7. Crear `SPEC-FASE-[N+1].md`
8. Tag release `v0.[fase].0`

---

## 8. Orden de Desarrollo Recomendado — Fase 1

```
T1.1 Monorepo ──→ T1.2 Expo+TS ──→ T1.3 MapLibre ──→ T1.7 Ruta de prueba
                 ↘ T1.5 GeoJSON ──→ T1.6 Server ─────↗
                                  ↘ T1.4 GPS ─────────↗
T1.8 CI/CD (inicia tras T1.1, finaliza al final)
```

### Dependencias Críticas

| Tarea | Depende de | Bloquea a |
|-------|-----------|-----------|
| T1.1 Monorepo | — | Todas las demás |
| T1.2 Expo + TS | T1.1 | T1.3, T1.4 |
| T1.3 MapLibre | T1.2 | T1.7 |
| T1.4 GPS | T1.2 | T1.7 |
| T1.5 GeoJSON | T1.1 | T1.6, T1.7 |
| T1.6 Server | T1.5 | T1.7 |
| T1.7 Ruta de prueba | T1.3, T1.4, T1.6 | — |
| T1.8 CI/CD | T1.1 | — (paralelo) |
