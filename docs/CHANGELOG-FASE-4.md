# Historial de Cambios — Fase 4: Perfiles Adicionales de Accesibilidad

> Registro cronológico de implementación y cambios durante la Fase 4 del proyecto **Campus GPS Accesible**.
> **Estado:** 🔲 Pendiente
> **Spec:** `docs/SPEC-FASE-4.md`

---

## Convenciones

- **Formato de fecha:** YYYY-MM-DD
- **Categorías:** `Implementación`, `Fix`, `Configuración`, `Refactor`
- **Progreso:** Barras ████░░░░░░ con porcentaje

---

## Estado de Tareas — Fase 4

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T4.1 — Perfil Movilidad Reducida | FR-401, NFR-403 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T4.2 — Lectura Fácil con IA | FR-402, NFR-402 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T4.3 — Vibración Háptica Direccional | FR-403, NFR-401 | 🔲 Pendiente | ░░░░░░░░░░ 0% |
| T4.4 — Selector Multi-Perfil | FR-404 | ✅ Completada | ██████████ 100% |
| T4.5 — Pesos de Ruta por Perfil | FR-405 | 🔲 Pendiente | ░░░░░░░░░░ 0% |

**Progreso global Fase 4:** ██░░░░░░░░ 20% (1/5 tareas)

---

## Dependencias de Fase 3

| Componente | Commit | Estado |
|-----------|--------|--------|
| Audio Beacons con HRTF | T3.1 | ✅ |
| Audio-Descripciones Contextuales | T3.2 | ✅ |
| Integración TalkBack/VoiceOver | T3.3 | ✅ |
| Evaluación de Riesgos Detallada | T3.4 | ✅ |
| Perfil de Accesibilidad Visual | T3.5 | ✅ |
| Conducción Ósea | T3.6 | ✅ |
| Generador IA de Descripciones | T3.7 | ✅ |

---

## Registro de Cambios

### 2026-03-21 — T4.4: Selector Multi-Perfil [FR-404]

**Categoría:** Implementación
**Branch:** `fase4/T4.4-multi-profile-selector`

#### Cambios realizados:

1. **accessibilityStore.ts** — Extensión del store con 5 perfiles:
   - `AccessibilityProfile` ampliado: standard, visual_disability, reduced_mobility, deaf, easy_read
   - Nuevos estados: `hapticEnabled`, `easyReadEnabled`, `largeFontEnabled`, `mobilityBarriersEnabled`, `avoidStairs`, `maxSlopePercent`, `minPathWidth`
   - `getProfileDefaults()` con switch por perfil y defaults específicos
   - Nuevos setters con validación (clamp en slope 1-20%, width 0.5-3.0m)
   - Persistencia extendida con todos los campos nuevos

2. **ProfileCard.tsx** — Nuevo componente reutilizable:
   - Tarjeta con icono, título, descripción y lista de características
   - Estado visual seleccionado/no seleccionado
   - Accesibilidad completa (label, hint, role, state)

3. **ProfileSelector.tsx** — Actualizado con 5 perfiles:
   - ScrollView para soportar más tarjetas
   - Cada perfil con features descriptivas en español
   - Usa `ProfileCard` para cada opción

4. **AccessibilitySettingsScreen.tsx** — Secciones condicionales por perfil:
   - Grid de 5 botones de perfil en la cabecera
   - Audio beacons: visible para visual_disability y standard
   - Háptica: visible solo para deaf
   - Lectura fácil: visible solo para easy_read
   - Accesibilidad física: visible solo para reduced_mobility (escalones, pendiente, ancho)
   - Audio output: oculto para deaf

5. **Tests** — 17 tests pasando:
   - 9 tests existentes actualizados con nuevos campos
   - 8 tests nuevos: TST-FR-404-001, TST-FR-404-002, defaults por perfil (3), clamping (2), persistencia (1)

---

*Registro creado: 2026-03-21*
