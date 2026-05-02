# Historial de Cambios — Fase 13: Navegacion con Realidad Aumentada

> **Estado:** ✅ Completada (2026-05-02)
> **Spec:** `docs/SPEC-FASE-13.md`
> **Enfoque:** AR basada en brujula (compass-based), sin ARCore/ARKit

---

## Estado de Tareas — Fase 13

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T13.1 — Hook AR Positioning | FR-1302 | ✅ Completada | ██████████ 100% |
| T13.2 — AR Navigation Screen | FR-1301 | ✅ Completada | ██████████ 100% |
| T13.3 — AR Waypoint Markers | FR-1305 | ✅ Completada | ██████████ 100% |
| T13.4 — AR Risk Overlay | FR-1304 | ✅ Completada | ██████████ 100% |
| T13.5 — Toggle Mapa/AR | FR-1301 | ✅ Completada | ██████████ 100% |
| T13.6 — Modo simplificado | FR-1303 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 13:** ██████████ 100% (6/6 tareas)

---

## Que es AR compass-based

**Realidad Aumentada (AR)** = superponer informacion digital sobre la vista real del mundo (mostrada por la camara). En esta app:

- La **camara** es el fondo (vista del mundo real)
- La **brujula** del telefono indica hacia donde mira el usuario
- El **GPS** indica donde esta el usuario
- Los **waypoints** del grafo se calculan: ¿estan en el campo de vision de la camara? Si si, en que posicion de la pantalla?

### Compass-based vs ARCore

| Aspecto | Compass-based (elegido) | ARCore |
|---------|------------------------|--------|
| Complejidad | Baja | Alta |
| Compatibilidad | Cualquier telefono con brujula | Solo telefonos compatibles ARCore |
| Precision exterior | Suficiente (±15°) | Alta |
| Bateria | Moderada | Alta |
| Implementacion | 4-6 semanas | 10-14 semanas |

Ventaja clave: **funciona en cualquier telefono Android** (todos tienen brujula y GPS), incluyendo gama baja sin ARCore.

## Funcionamiento

```
GPS (lat/lng del usuario) + Brujula (heading 0-360°)
       ↓
Para cada waypoint del grafo de la ruta:
  1. Calcular bearing (angulo entre usuario y waypoint)
  2. Calcular distancia (Haversine)
  3. relativeAngle = bearing - heading (normalizado a -180..180)
  4. Si |relativeAngle| <= 30° (FOV camara) → marcador VISIBLE
  5. screenX = (relativeAngle + 30) / 60     ← posicion 0..1 en pantalla
  6. size = max(20, 60 - distancia/20)        ← mas cerca = mas grande
  7. opacity = max(0.3, 1 - distancia/500)    ← mas cerca = mas opaco
```

## Componentes implementados

| Archivo | Que hace |
|---------|----------|
| `hooks/useARPositioning.ts` | Calculo bearing/distancia/screenX (15 tests pasando) |
| `screens/ARNavigationScreen.tsx` | Pantalla full-screen camara + overlays |
| `components/ARDirectionArrow.tsx` | Flecha grande (100dp) con instruccion + distancia |
| `components/ARWaypointMarker.tsx` | Marcador POI con nombre + distancia, posicionado |
| `components/ARRiskOverlay.tsx` | Banner de alerta (escaleras/rampa/obstaculo/riesgo) |

## Reutilizacion

La fase reutiliza modulos existentes:
- `useCompass` (Fase 3) — heading del magnetometro
- `useLocationStore` — posicion GPS
- `useCamera` (Fase 11) — permisos camara
- `expo-camera` (Fase 11) — vista de fondo
- `expo-haptics` (Fase 4) — feedback haptico
- `Speech` (Fase 11) — anuncios TTS
- `NavigationInstruction` (Fase 2) — instrucciones del motor de routing

## Acceso desde la app

1. Iniciar navegacion como siempre (FAB Rutas → Navegar)
2. En la pantalla de navegacion, FAB morado **📷 AR** (parte derecha)
3. Tap → cambia a vista AR con la camara
4. Boton **← Mapa** para volver a la vista clasica
5. Toggle **Modo simple** (esquina sup. derecha) — oculta marcadores POI, deja solo la flecha

## Modo simplificado (T13.6)

Cuando el usuario tiene baja vision o solo quiere lo esencial:
- Activa el switch "Modo simple" en la barra superior
- Solo se muestra: flecha grande + texto de instruccion + distancia
- Se ocultan los marcadores de POIs

## Accesibilidad (NFR-1302)

| Criterio | Implementacion |
|----------|----------------|
| Contraste >= 4.5:1 | Fondo oscuro semi-transparente (`rgba(0,0,0,0.75)`) detras de texto blanco |
| Tamano flechas >= 100dp | `fontSize: 100` para arrow symbol |
| Feedback multimodal | Visual + haptic (Fase 4) + TTS (Fase 11) |
| TalkBack | accessibilityLabel/Role/LiveRegion en todos los componentes |
| Modo simplificado | Toggle en la barra superior |

## Limitaciones conocidas

- La precision del bearing depende de la calibracion de la brujula del dispositivo
- En interiores, la senal magnetica puede distorsionarse y reducir la precision
- Funciona mejor en exteriores con buena senal GPS
- No hay tracking 3D (un waypoint detras de un edificio se sigue mostrando como si estuviera visible)

## Tests

- `useARPositioning.test.ts` — 15 tests pasando
  - bearingBetween (4 direcciones cardinales)
  - haversineMeters (distancia)
  - normalizeAngleDiff (wraparound)
  - positionMarker (FOV, screenX, size, opacity)

---

*Documento creado: 2026-05-02*
