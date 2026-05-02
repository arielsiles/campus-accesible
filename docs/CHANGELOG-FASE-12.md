# Historial de Cambios — Fase 12: OCR e Informacion Contextual

> **Estado:** ✅ Completada (2026-05-02)
> **Spec:** `docs/SPEC-FASE-12.md`

---

## Que es OCR

**OCR** (Optical Character Recognition) es la tecnologia que convierte texto que aparece en una imagen a texto digital legible por la computadora. En esta app, OCR permite que la camara apunte a un cartel y la app **lea en voz alta el texto** sin necesidad de internet.

## Estado de Tareas — Fase 12

| Tarea | Spec IDs | Estado | Progreso |
|-------|----------|--------|----------|
| T12.1 — OCR on-device con ML Kit | FR-1201 | ✅ Completada | ██████████ 100% |
| T12.2 — Lugares cercanos | FR-1202 | ✅ Completada | ██████████ 100% |
| T12.3 — Clima en tiempo real | FR-1203 | ✅ Completada | ██████████ 100% |
| T12.4 — Transporte multi-region | FR-1204 | ✅ Completada | ██████████ 100% |
| T12.5 — Panel contextual unificado | FR-1205 | ✅ Completada | ██████████ 100% |

**Progreso global Fase 12:** ██████████ 100% (5/5 tareas)

---

## Decisiones tecnicas vs spec original

| Aspecto | Spec original | Implementacion |
|---------|--------------|----------------|
| OCR library | `@react-native-ml-kit/text-recognition` | ✓ Implementado |
| Lugares cercanos | Google Places API ($17/1000 req) | **OSM Overpass** ($0, ya integrado en Fase 8) |
| Clima | OpenWeatherMap free | ✓ Implementado |
| Transporte | EMT/CRTM Madrid | **Provider abstraction**: EMT Madrid stub + OSM static fallback. Funciona en Bolivia, Madrid u otra region |
| Easy-read OCR | TTS directo | **+ Claude Haiku** para simplificar texto antes de TTS cuando perfil = `easy_read` |

## OCR — diferencia con Vision IA

| Aspecto | Vision IA (Fase 11) | OCR (Fase 12) |
|---------|---------------------|---------------|
| Que hace | Describe entorno completo | Lee texto literal de carteles |
| Modelo | Claude Haiku 4.5 (cloud) | Google ML Kit (on-device) |
| Conexion | Internet requerido | 100% offline |
| Latencia | ~3-5 segundos | ~200ms |
| Costo | $0.0015/captura | $0 |
| Caso de uso | "¿Que hay alrededor?" | "¿Que dice este cartel?" |

## Componentes principales

### Mobile

| Archivo | Que hace |
|---------|----------|
| `services/ocrService.ts` | ML Kit + cliente para `/text/simplify` |
| `services/ocrTextUtils.ts` | Utilidades puras (cleanRecognizedText, isMeaningfulText) |
| `services/contextService.ts` | Cliente para `/api/context/*` |
| `screens/CameraScreen.tsx` | Toggle modo Vision IA / OCR + UI de resultado |
| `screens/ContextPanel.tsx` | Panel con clima + lugares cercanos |

### Server

| Archivo | Que hace |
|---------|----------|
| `services/placesService.ts` | OSM Overpass con cache 30min |
| `services/weatherService.ts` | OpenWeatherMap con cache 10min y alertas accesibles |
| `services/transitService.ts` | Provider abstraction (Madrid + OSM fallback) |
| `routes/context.ts` | Endpoints `/places /weather /transit /all` |
| `routes/textSimplify.ts` | POST `/text/simplify` (Claude Haiku para easy-read) |

## Endpoints expuestos

- `GET /api/context/places?lat=&lng=&radius=` — lugares cercanos OSM
- `GET /api/context/weather?lat=&lng=` — clima + alertas
- `GET /api/context/transit?lat=&lng=&waypointId=` — transporte tiempo real / estatico
- `GET /api/context/all?lat=&lng=` — combinado para panel
- `POST /api/text/simplify` — simplificar texto con Claude Haiku

## Categorias de lugares cercanos

Prioridad accesible (orden de presentacion):
1. 🏥 Farmacia, Hospital
2. 🚻 Banos publicos
3. 🏦 Banco
4. ☕ Cafeteria, 🍴 Restaurante
5. 🛒 Supermercado
6. 🚉 Transporte
7. 🎓 Educacion
8. ℹ️ Informacion
9. 💳 Cajero
10. 📍 Otros

## Alertas climaticas accesibles

| Condicion | Severidad | Mensaje |
|-----------|-----------|---------|
| Lluvia | warning | "Suelo posiblemente resbaladizo" |
| Nieve | danger | "Superficies muy resbaladizas" |
| Tormenta | danger | "Busca refugio si es posible" |
| Niebla | info | "Visibilidad reducida" |
| Calor extremo (>=35°C) | warning | "Hidratate y busca sombra" |
| Frio bajo cero | warning | "Posible hielo en el suelo" |
| Viento >=15 m/s | warning | "Sujeta tus pertenencias" |

## Transporte multi-region

La arquitectura usa una **interfaz `TransitProvider`** que permite agregar APIs de transporte en distintas ciudades sin cambiar el flujo principal.

```
GET /api/context/transit
       ↓
Por cada provider registrado, verificar si "matches" la coordenada GPS
       ↓
Si EMT Madrid (40.30 a 40.55, -3.85 a -3.55) → llamar API EMT
Si otra region → fallback a datos estaticos OSM (transport_lines del waypoint)
```

Para agregar nuevo proveedor (ej. La Paz, Bolivia, en el futuro):
1. Crear `bolivianTransitProvider` con `matches` y `fetchArrivals`
2. Agregar al array `PROVIDERS`
3. La app automaticamente lo usa cuando el GPS este en la zona

## Tests

- `ocrService.test.ts` — 9 tests pasando (utilidades de texto)
- `weatherService.test.ts` — 6 tests pasando (alertas derivadas)

*Documento creado: 2026-05-02*
