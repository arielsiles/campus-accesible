# Campus GPS Accesible

App de navegación GPS universal e inclusiva para Ciudad Universitaria. Para toda la comunidad universitaria — estudiantes, profesorado, personal y visitantes — con diseño universal que atiende especialmente a personas con diversidad funcional. La accesibilidad NO es un añadido: es un principio de diseño que beneficia a todos.

## Tech Stack

- **Mobile:** React Native + Expo SDK 52+, TypeScript strict
- **Maps:** MapLibre GL Native (`@maplibre/maplibre-react-native`)
- **State:** Zustand
- **Server:** Hono + Node.js 20 LTS
- **ORM:** Prisma (PostgreSQL 16+ / PostGIS 3.4+)
- **Validation:** Zod
- **Testing:** Vitest
- **Monorepo:** Turborepo + pnpm 9.x
- **CI:** GitHub Actions

## Monorepo Structure

```
apps/mobile/src/    → React Native app (screens, components, services, hooks, store)
server/src/         → Hono API server
server/prisma/      → Schema, migrations, seed
packages/shared-types/ → TypeScript interfaces, enums, API types
data/routes/        → GeoJSON route files
data/schemas/       → JSON schemas
docs/               → Specs, setup guide, governance
```

## Code Conventions

- **Components:** PascalCase.tsx (e.g., `MapView.tsx`)
- **Services/hooks/utils:** camelCase.ts (e.g., `locationService.ts`)
- **Tests:** Adjacent to source: `locationService.test.ts` next to `locationService.ts`
- **TypeScript:** strict mode, NO `any`, interfaces for shapes, types for unions
- **React Native:** Functional components only, `StyleSheet.create` for styles
- **Imports order:** react → expo → external libs → @campus-gps/* → relative
- **Server:** Zod for all input validation, error envelope: `{ error: { code, message } }`

## Accessibility Rules — MANDATORY

- `accessibilityLabel` on EVERY interactive element, in Spanish
- `accessibilityRole` on all screens and interactive components
- `accessibilityHint` when action is not obvious from label
- Touch targets: minimum 44x44 dp
- Color contrast: ≥4.5:1 text, ≥3:1 graphics
- Never convey info by color alone

## Testing

- Write tests BEFORE or WITH implementation, never after
- Framework: Vitest
- Coverage: ≥70% services, ≥50% global
- Test files adjacent to source: `*.test.ts`

## Git Workflow

- Branch naming: `fase[N]/T[N].[M]-descripcion` (e.g., `fase1/T1.3-maplibre-integration`)
- Commit format: `type(scope): description [SPEC-ID]` (e.g., `feat(map): render MapLibre view [FR-003]`)
- Types: feat, fix, refactor, test, docs, chore

## Spec Driven Development

- NEVER implement without referencing a spec ID from `docs/SPEC-FASE-1.md`
- Include spec ID in code comments where non-obvious: `// FR-003: Map centered on CU`
- Include spec ID in test descriptions: `it('renders map centered on CU [FR-003]')`
- If a requirement is unclear, ASK before implementing

## Language Policy

- **Code:** English (variables, functions, comments)
- **UI text:** Spanish
- **Documentation:** Spanish
- **Commits:** English
- **Accessibility labels:** Spanish
- **Test descriptions:** English with spec IDs

## Anti-Patterns — DO NOT

- Use `any` type
- Use inline styles (use `StyleSheet.create`)
- Hardcode URLs or API endpoints (use env vars)
- Write accessibility labels in English
- Skip accessibilityLabel on interactive elements
- Commit `.env` files or secrets
- Implement features not in current phase spec
- Write tests after implementation is "done"
- Use `console.log` in production code (use proper logging)
- Import from `../../..` deep paths (use package aliases)

## Current Phase

**Fase 7: Herramienta de Creacion de Rutas** ✅ Completada
- Spec: `docs/SPEC-FASE-7.md`
- Changelog: `docs/CHANGELOG-FASE-7.md`
- Governance: `docs/GOBERNANZA-PROYECTO.md`

**Fase 8: Integracion Activa con OpenStreetMap** ✅ Completada
- Spec: `docs/SPEC-FASE-8.md`
- Changelog: `docs/CHANGELOG-FASE-8.md`

**Fase 9: Multi-Campus y Comunidad** ✅ Completada
- Spec: `docs/SPEC-FASE-9.md`
- Changelog: `docs/CHANGELOG-FASE-9.md`

**Fase 10: Financiamiento y Lanzamiento Publico** (planificada)
- Spec: `docs/SPEC-FASE-10.md`
- Changelog: `docs/CHANGELOG-FASE-10.md`

**Fase 11: Camara Inteligente con Vision IA** ✅ Completada
- Spec: `docs/SPEC-FASE-11.md`
- Changelog: `docs/CHANGELOG-FASE-11.md`

**Fase 12: OCR e Informacion Contextual** ✅ Completada
- Spec: `docs/SPEC-FASE-12.md`
- Changelog: `docs/CHANGELOG-FASE-12.md`

**Fase 13: Navegacion con Realidad Aumentada** ✅ Completada
- Spec: `docs/SPEC-FASE-13.md`
- Changelog: `docs/CHANGELOG-FASE-13.md`

**Fase 14: Routing Universal con OSM Fallback** ✅ Completada
- Spec: `docs/SPEC-FASE-14.md`
- Changelog: `docs/CHANGELOG-FASE-14.md`

**Fase 15: Crowdsourcing Inteligente y Aprendizaje** ✅ Completada
- Spec: `docs/SPEC-FASE-15.md`
- Changelog: `docs/CHANGELOG-FASE-15.md`

**Fase 6: Optimizacion, Escalabilidad y Lanzamiento** ✅ Completada
- Spec: `docs/SPEC-FASE-6.md`
- Changelog: `docs/CHANGELOG-FASE-6.md`

**Fase 5: Sistema Colaborativo e Incidencias** ✅ Completada
- Spec: `docs/SPEC-FASE-5.md`
- Changelog: `docs/CHANGELOG-FASE-5.md`

**Fase 4: Perfiles Adicionales de Accesibilidad** ✅ Completada
- Spec: `docs/SPEC-FASE-4.md`
- Changelog: `docs/CHANGELOG-FASE-4.md`

**Fase 3: Accesibilidad Visual y Audio 3D** ✅ Completada
- Spec: `docs/SPEC-FASE-3.md`
- Changelog: `docs/CHANGELOG-FASE-3.md`

**Fase 2: Motor de Navegación y Routing** ✅ Completada
- Spec: `docs/SPEC-FASE-2.md`
- Changelog: `docs/CHANGELOG-FASE-2.md`

**Fase 1: Fundación y Prototipo Básico** ✅ Completada
- Spec: `docs/SPEC-FASE-1.md`
- Changelog: `docs/CHANGELOG-FASE-1.md`
