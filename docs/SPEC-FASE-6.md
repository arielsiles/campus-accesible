# Especificacion de Desarrollo — Fase 6: Optimizacion, Escalabilidad y Lanzamiento

> **Version:** 1.0 | **Fecha:** 2026-03-28 | **Estado:** Draft
> **Prefijo IDs:** FR-6XX (funcionales), NFR-6XX (no funcionales)
> **Fase anterior:** Fase 5 completada (2026-03-28) — ver `SPEC-FASE-5.md`
> **Nota:** Se omite publicacion en tiendas de aplicaciones

---

## 1. Alcance

### En Scope (Fase 6)

- Optimizacion de rendimiento: cache API, GPS adaptativo, debounce de persistencia, snap-to-route optimizado
- Auditoria de accesibilidad WCAG 2.1 AA con tests automatizados
- Sistema de exportacion/importacion de campus (GeoJSON bundle)
- Documentacion completa para replicar en otras universidades
- Configuracion de cobertura de tests y CI

### Fuera de Scope

- Publicacion en App Store y Google Play
- Precision GPS submetrica / RTK
- Tests con usuarios reales (pendiente coordinacion externa)

---

## 2. Requisitos Funcionales

### FR-601: Optimizacion de Rendimiento

**Descripcion:** Optimizar el consumo de recursos (bateria, red, CPU) de la app mediante caching de API, GPS adaptativo, debounce de persistencia, y optimizacion de calculos geometricos.

**Criterios de aceptacion:**

```gherkin
Given la app realizando peticiones GET al API
When se solicita la misma URL dentro de un periodo TTL (30s)
Then se devuelve el resultado cacheado sin llamada de red

Given el usuario estacionario (sin movimiento > 5m en 10s)
When el GPS esta activo
Then el intervalo de actualizacion se reduce a 5 segundos

Given el usuario caminando (movimiento detectado)
When el GPS esta activo
Then el intervalo de actualizacion es 1 segundo

Given el usuario cambiando ajustes de accesibilidad rapidamente
When toglea multiples opciones en < 500ms
Then AsyncStorage se escribe UNA sola vez (debounced)

Given el servicio snap-to-route procesando posicion GPS
When calcula distancia a segmentos
Then usa early exit para segmentos lejanos (> 100m) sin calculos completos
```

### FR-602: Auditoria de Accesibilidad WCAG 2.1 AA

**Descripcion:** Validar que todos los componentes interactivos cumplen WCAG 2.1 AA. Crear tests automatizados y documentar resultado de auditoria.

**Criterios de aceptacion:**

```gherkin
Given cualquier componente interactivo en la app
When se inspecciona su accesibilidad
Then tiene accessibilityLabel en espanol y accessibilityRole

Given cualquier boton o control tactil
When se mide su area de toque
Then es >= 44x44 dp

Given cualquier texto en la interfaz
When se mide su contraste con el fondo
Then cumple >= 4.5:1 (texto normal) o >= 3:1 (texto grande/graficos)

Given cualquier informacion visual
When se evalua
Then nunca se transmite solo por color

Given la auditoria completa
When se documenta
Then incluye checklist WCAG 2.1 AA con resultado por componente
```

### FR-603: Sistema de Exportacion/Importacion de Campus

**Descripcion:** Endpoints para exportar todos los datos de un campus (rutas, waypoints, segmentos, metadatos de accesibilidad) como un bundle GeoJSON, e importar un bundle para crear un nuevo campus.

**Criterios de aceptacion:**

```gherkin
Given un campus con rutas configuradas
When se exporta via GET /api/campus/export
Then se obtiene un bundle JSON con campus info, rutas como FeatureCollections, y metadata

Given un bundle de campus valido
When se importa via POST /api/campus/import
Then se crean todas las rutas, waypoints, segmentos y se reconstruye el grafo

Given un bundle con formato invalido
When se intenta importar
Then se rechaza con errores de validacion detallados

Given un bundle importado
When se calcula una ruta en el nuevo campus
Then funciona con navegacion turn-by-turn completa

Given el bundle exportado
When se inspecciona su estructura
Then sigue el schema campus-bundle.schema.json
```

### FR-604: Documentacion de Replicacion

**Descripcion:** Guia completa para que otra universidad pueda replicar el sistema con sus propias rutas y datos topograficos.

### FR-605: Cobertura de Tests y CI

**Descripcion:** Configurar thresholds de cobertura (>= 70% services, >= 50% global), scripts de coverage, y validacion en CI.

---

## 3. Requisitos No Funcionales

### NFR-601: Rendimiento

| Metrica | Criterio |
|---------|----------|
| Cache hit ratio | >= 60% en requests repetidos |
| GPS battery | Reduccion >= 30% en modo estacionario |
| AsyncStorage writes | <= 1 write per 500ms |
| Snap-to-route | < 10ms para 50 segmentos |

### NFR-602: Accesibilidad

| Criterio | Detalle |
|----------|---------|
| WCAG 2.1 AA | 100% componentes interactivos auditados |
| Touch targets | 100% >= 44x44dp |
| Contraste | 100% textos >= 4.5:1 |
| Labels | 100% en espanol |

### NFR-603: Exportacion

| Criterio | Detalle |
|----------|---------|
| Export time | < 5s para campus con 50 rutas |
| Import validation | < 2s para bundle de 50 rutas |
| Bundle size | < 5MB para campus tipico |

---

## 4. Definition of Done por Tarea

### T6.1 — Optimizacion de Rendimiento
- **Spec IDs:** FR-601, NFR-601
- **Tests:** cache hit/miss, GPS interval change, debounce timing, snap-to-route speed
- **Done:** API cache funcional, GPS adaptativo, store debounced, snap optimizado

### T6.2 — Auditoria de Accesibilidad
- **Spec IDs:** FR-602, NFR-602
- **Tests:** automated a11y checks on component definitions
- **Done:** Documento de auditoria completo, tests pasando

### T6.3 — Exportacion/Importacion de Campus
- **Spec IDs:** FR-603, NFR-603
- **Tests:** export roundtrip, import validation, schema compliance
- **Done:** Export + import funcional con validacion

### T6.4 — Documentacion de Replicacion
- **Spec IDs:** FR-604
- **Done:** GUIA-NUEVO-CAMPUS.md y FORMATO-DATOS-RUTAS.md creados

### T6.5 — Cobertura de Tests
- **Spec IDs:** FR-605
- **Done:** vitest.config.ts con thresholds, scripts coverage

---

*Documento creado: 2026-03-28*
