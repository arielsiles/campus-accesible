# Formato de Datos de Rutas — Campus GPS Accesible

> **Version:** 1.0 | **Fecha:** 2026-04-05
> Especificacion del formato GeoJSON para definir rutas accesibles en un campus.

---

## 1. Vision General

Cada ruta se representa como un **GeoJSON FeatureCollection** (RFC 7946) que contiene dos tipos de features:

- **Waypoints** (Point): Puntos de interes a lo largo de la ruta (edificios, cruces, paradas)
- **Segments** (LineString): Tramos entre waypoints consecutivos con datos de accesibilidad

```
Ruta = FeatureCollection
  ├── Waypoint A (Point)    ← origen
  ├── Waypoint B (Point)    ← punto intermedio
  ├── Waypoint C (Point)    ← destino
  ├── Segment A→B (LineString)
  └── Segment B→C (LineString)
```

---

## 2. Estructura de una Ruta

```json
{
  "type": "FeatureCollection",
  "properties": {
    "id": "ruta-parque-norte",
    "name": "Entrada Norte → Fuente Central",
    "description": "Ruta accesible desde la entrada norte hasta la fuente central del parque"
  },
  "features": [
    { "...waypoints..." },
    { "...segments..." }
  ]
}
```

### Campos del FeatureCollection

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `properties.id` | string | Si | Identificador unico de la ruta |
| `properties.name` | string | Si | Nombre descriptivo (origen → destino) |
| `properties.description` | string | Si | Descripcion accesible de la ruta |

---

## 3. Waypoints (Puntos de Interes)

Un waypoint es un **Feature** con geometria **Point**.

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-3.7267, 40.4489]
  },
  "properties": {
    "featureType": "waypoint",
    "waypointId": "wp-entrada-norte",
    "name": "Entrada Norte del Parque",
    "description": "Puerta principal con rampa de acceso y paso adaptado",
    "waypointType": "entrance",
    "orderIndex": 0
  }
}
```

### Campos del Waypoint

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `geometry.coordinates` | [lng, lat] | Si | Coordenadas GPS en formato [longitud, latitud] |
| `properties.featureType` | `"waypoint"` | Si | Siempre "waypoint" |
| `properties.waypointId` | string | Si | ID unico (ej: `wp-entrada-norte`) |
| `properties.name` | string | Si | Nombre del punto en espanol |
| `properties.description` | string | Si | Descripcion accesible en espanol |
| `properties.waypointType` | enum | Si | Tipo de punto (ver tabla abajo) |
| `properties.orderIndex` | number | Si | Posicion en la secuencia (0, 1, 2...) |
| `properties.transportType` | enum | No | Solo para `transport_stop`: metro, bus, intercambiador, cercanias |
| `properties.transportLines` | string[] | No | Lineas de transporte (ej: ["6", "3"]) |

### Tipos de Waypoint

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| `entrance` | Entrada a un recinto | Puerta principal del parque |
| `building` | Edificio o estructura | Cafeteria, centro de visitantes |
| `intersection` | Cruce de caminos | Bifurcacion del sendero |
| `transport_stop` | Parada de transporte | Parada de autobus |
| `landmark` | Punto de referencia | Fuente, estatua, monumento |
| `hazard` | Zona de peligro | Escaleras sin barandilla |
| `rest_area` | Zona de descanso | Banco, area con sombra |
| `information_point` | Punto de informacion | Cartel, mapa del parque |

---

## 4. Segmentos (Tramos de Ruta)

Un segmento es un **Feature** con geometria **LineString** que conecta dos waypoints consecutivos.

```json
{
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-3.7267, 40.4489],
      [-3.7263, 40.4485],
      [-3.7258, 40.4479]
    ]
  },
  "properties": {
    "featureType": "route-segment",
    "segmentId": "seg-entrada-fuente",
    "name": "Entrada Norte a Fuente Central",
    "surfaceType": "paved",
    "elevationChange": -1.5,
    "riskLevel": "none",
    "orderIndex": 0,
    "hasRamp": true,
    "hasStairs": false,
    "pathWidth": 2.5,
    "maxSlope": 3.0,
    "surfaceQuality": "good",
    "audioDescription": "Camino pavimentado con ligero descenso hacia la fuente"
  }
}
```

### Campos del Segmento

| Campo | Tipo | Requerido | Default | Descripcion |
|-------|------|-----------|---------|-------------|
| `geometry.coordinates` | [lng,lat][] | Si | — | Array de coordenadas del trazado |
| `properties.featureType` | `"route-segment"` | Si | — | Siempre "route-segment" |
| `properties.segmentId` | string | Si | — | ID unico (ej: `seg-entrada-fuente`) |
| `properties.name` | string | Si | — | Nombre descriptivo del tramo |
| `properties.surfaceType` | enum | Si | — | Tipo de superficie |
| `properties.elevationChange` | number | No | 0 | Cambio de elevacion en metros (+subida, -bajada) |
| `properties.riskLevel` | enum | No | "none" | Nivel de riesgo |
| `properties.orderIndex` | number | Si | — | Posicion en la secuencia |
| `properties.hasRamp` | boolean | No | false | Tiene rampa de acceso |
| `properties.hasStairs` | boolean | No | false | Tiene escaleras |
| `properties.pathWidth` | number | No | 2.0 | Ancho del camino en metros |
| `properties.maxSlope` | number | No | 0 | Pendiente maxima en porcentaje |
| `properties.surfaceQuality` | enum | No | "good" | Calidad de la superficie |
| `properties.riskDescription` | string | No | null | Descripcion del riesgo en espanol |
| `properties.riskFactors` | string[] | No | [] | Factores de riesgo especificos |
| `properties.audioDescription` | string | No | null | Audio-descripcion del tramo en espanol |

### Tipos de Superficie

| Tipo | Descripcion |
|------|-------------|
| `paved` | Pavimentado (asfalto, baldosa) |
| `cobblestone` | Adoquinado |
| `gravel` | Grava |
| `dirt` | Tierra |
| `tactile` | Pavimento tactil (podotactil) |

### Niveles de Riesgo

| Nivel | Descripcion |
|-------|-------------|
| `none` | Sin riesgo |
| `low` | Riesgo bajo (ej: superficie irregular) |
| `medium` | Riesgo medio (ej: cruce sin semaforo) |
| `high` | Riesgo alto (ej: trafico intenso) |

### Calidad de Superficie

| Valor | Descripcion |
|-------|-------------|
| `good` | Buen estado, sin irregularidades |
| `fair` | Estado aceptable, alguna irregularidad |
| `poor` | Mal estado, multiples irregularidades |

### Factores de Riesgo Disponibles

| Factor | Descripcion |
|--------|-------------|
| `cruce_sin_semaforo` | Cruce peatonal sin semaforo |
| `mala_iluminacion` | Poca iluminacion nocturna |
| `superficie_irregular` | Pavimento irregular o danado |
| `pendiente_pronunciada` | Pendiente > 8% |
| `trafico_vehicular` | Zona con trafico de vehiculos |
| `obras_temporales` | Obras en la via |
| `escalones` | Escalones sin alternativa |
| `sin_barandilla` | Escalera/rampa sin barandilla |
| `paso_estrecho` | Paso de ancho < 1.5m |

---

## 5. Campus Bundle (Exportacion/Importacion)

Para exportar o importar un campus completo, se usa un **Campus Bundle**:

```json
{
  "campus": {
    "name": "Parque del Retiro",
    "center": [-3.6833, 40.4153],
    "version": "1.0"
  },
  "routes": [
    { "...FeatureCollection ruta 1..." },
    { "...FeatureCollection ruta 2..." }
  ],
  "metadata": {
    "exportedAt": "2026-04-05T10:00:00Z",
    "routeCount": 2,
    "waypointCount": 8,
    "segmentCount": 6
  }
}
```

### Endpoints de la API

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/campus/export` | Exporta todo el campus como bundle |
| POST | `/api/campus/validate` | Valida un bundle sin importar |
| POST | `/api/campus/import` | Importa un bundle y reconstruye el grafo |

---

## 6. Como Obtener las Coordenadas

### Opcion A: Google Maps
1. Abre Google Maps en el navegador
2. Haz clic derecho en el punto deseado
3. Copia las coordenadas (aparecen como `latitud, longitud`)
4. **IMPORTANTE:** En GeoJSON el orden es `[longitud, latitud]` (invertido)

### Opcion B: Aplicacion GPS (recomendado)
1. Usa una app como **GPS Coordinates** (Android/iOS)
2. Ve fisicamente al punto
3. Anota latitud y longitud con maxima precision

### Opcion C: OpenStreetMap
1. Abre openstreetmap.org
2. Navega a la ubicacion
3. Haz clic derecho → "Show address" para ver coordenadas

---

## 7. Ejemplo Completo: Ruta de Parque

```json
{
  "type": "FeatureCollection",
  "properties": {
    "id": "ruta-parque-ejemplo",
    "name": "Entrada Principal → Area de Juegos",
    "description": "Ruta accesible desde la entrada al area de juegos infantiles"
  },
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-3.6850, 40.4160] },
      "properties": {
        "featureType": "waypoint",
        "waypointId": "wp-entrada",
        "name": "Entrada principal",
        "description": "Entrada con rampa de acceso",
        "waypointType": "entrance",
        "orderIndex": 0
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-3.6845, 40.4155] },
      "properties": {
        "featureType": "waypoint",
        "waypointId": "wp-fuente",
        "name": "Fuente ornamental",
        "description": "Fuente circular con bancos alrededor",
        "waypointType": "landmark",
        "orderIndex": 1
      }
    },
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-3.6840, 40.4148] },
      "properties": {
        "featureType": "waypoint",
        "waypointId": "wp-juegos",
        "name": "Area de juegos",
        "description": "Zona infantil con suelo de caucho",
        "waypointType": "rest_area",
        "orderIndex": 2
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[-3.6850, 40.4160], [-3.6847, 40.4157], [-3.6845, 40.4155]]
      },
      "properties": {
        "featureType": "route-segment",
        "segmentId": "seg-entrada-fuente",
        "name": "Entrada a Fuente",
        "surfaceType": "paved",
        "elevationChange": -0.5,
        "riskLevel": "none",
        "orderIndex": 0,
        "hasRamp": true,
        "hasStairs": false,
        "pathWidth": 3.0,
        "maxSlope": 2.0,
        "surfaceQuality": "good",
        "audioDescription": "Camino ancho y pavimentado con ligero descenso"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[-3.6845, 40.4155], [-3.6842, 40.4151], [-3.6840, 40.4148]]
      },
      "properties": {
        "featureType": "route-segment",
        "segmentId": "seg-fuente-juegos",
        "name": "Fuente a Juegos",
        "surfaceType": "gravel",
        "elevationChange": 0,
        "riskLevel": "low",
        "riskDescription": "Grava suelta en zona central",
        "riskFactors": ["superficie_irregular"],
        "orderIndex": 1,
        "hasRamp": false,
        "hasStairs": false,
        "pathWidth": 2.0,
        "maxSlope": 1.0,
        "surfaceQuality": "fair",
        "audioDescription": "Camino de grava hacia la zona de juegos"
      }
    }
  ]
}
```

---

*Documento creado: 2026-04-05*
