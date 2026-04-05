# Guia para Replicar en un Nuevo Campus o Espacio

> **Version:** 1.0 | **Fecha:** 2026-04-05
> Guia paso a paso para adaptar Campus GPS Accesible a cualquier ubicacion.

---

## 1. Vision General del Proceso

```
Paso 1: Reconocimiento del terreno (ir fisicamente)
   ↓
Paso 2: Toma de coordenadas GPS (con app movil)
   ↓
Paso 3: Crear archivo GeoJSON con rutas
   ↓
Paso 4: Importar datos al servidor via API
   ↓
Paso 5: Configurar la app y probar
```

**Tiempo estimado:** 2-4 horas para un espacio con 3-5 rutas

---

## 2. Requisitos Previos

### Hardware
- Telefono con GPS (Android o iOS)
- Ordenador con Node.js 20+ instalado

### Software
- App de GPS para tomar coordenadas: **GPS Coordinates** (gratuita) o similar
- Editor de texto (VS Code recomendado)
- PostgreSQL 16+ con PostGIS 3.4+ corriendo
- El monorepo clonado y configurado

### Conocimientos
- Saber editar archivos JSON
- Conceptos basicos de coordenadas GPS (latitud/longitud)

---

## 3. Paso 1: Reconocimiento del Terreno

### Que hacer
1. **Ve fisicamente** al espacio (parque, campus, centro comercial)
2. **Camina las rutas** que quieres mapear
3. Identifica:
   - **Puntos de interes**: entradas, edificios, cruces, paradas, bancos
   - **Tramos entre puntos**: tipo de suelo, ancho, pendiente, riesgos
   - **Barreras de accesibilidad**: escaleras, rampas, pasos estrechos

### Que anotar por cada PUNTO (waypoint)
- Nombre del lugar
- Tipo: entrada, edificio, cruce, parada, punto de referencia, zona de descanso
- Descripcion breve (en espanol)
- Coordenadas GPS (las tomaras con la app)

### Que anotar por cada TRAMO (segmento entre dos puntos)
- Tipo de superficie: pavimentado, adoquinado, grava, tierra
- Ancho del camino (en metros, aproximado)
- Hay pendiente? Cuanta? (estimada en %)
- Hay escaleras? Hay rampa alternativa?
- Riesgos: cruces, trafico, mala iluminacion, suelo irregular
- Calidad del suelo: bueno, aceptable, malo

### Consejo
Lleva una libreta o usa las notas del telefono. Toma fotos de referencia.

---

## 4. Paso 2: Toma de Coordenadas GPS

### Proceso
1. Abre la app **GPS Coordinates** en tu telefono
2. Ve a cada punto de interes
3. Espera a que el GPS se estabilice (precision < 5m)
4. Anota las coordenadas: `latitud, longitud`

### Ejemplo de anotaciones

```
Punto 1: Entrada Norte del Parque
  Lat: 40.4160, Lng: -3.6850
  Tipo: entrance
  
Punto 2: Fuente ornamental
  Lat: 40.4155, Lng: -3.6845
  Tipo: landmark

Punto 3: Area de juegos
  Lat: 40.4148, Lng: -3.6840
  Tipo: rest_area
```

### IMPORTANTE: Orden de coordenadas
- En tu app GPS: **latitud, longitud** (ej: 40.4160, -3.6850)
- En GeoJSON: **[longitud, latitud]** (ej: [-3.6850, 40.4160]) — **INVERTIDO**

### Para los segmentos
Tambien puedes tomar puntos intermedios del camino. Si el camino hace una curva, toma 2-3 puntos intermedios para que la linea se ajuste al trazado real.

---

## 5. Paso 3: Crear el Archivo GeoJSON

### Estructura basica

Usa el formato documentado en `FORMATO-DATOS-RUTAS.md`. Aqui un resumen:

```json
{
  "type": "FeatureCollection",
  "properties": {
    "id": "ruta-mi-parque-1",
    "name": "Entrada Norte → Area de Juegos",
    "description": "Ruta accesible por el camino principal"
  },
  "features": [
    // Primero TODOS los waypoints en orden
    { "type": "Feature", "geometry": { "type": "Point", "coordinates": [LNG, LAT] }, "properties": { "featureType": "waypoint", "waypointId": "wp-UNICO", "name": "...", "description": "...", "waypointType": "...", "orderIndex": 0 } },
    { "...mas waypoints..." },
    // Luego TODOS los segmentos en orden
    { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [[LNG1,LAT1],[LNG2,LAT2]] }, "properties": { "featureType": "route-segment", "segmentId": "seg-UNICO", "name": "...", "surfaceType": "paved", "orderIndex": 0, "...accesibilidad..." } },
    { "...mas segmentos..." }
  ]
}
```

### Reglas importantes

1. **waypointId** debe ser unico en todo el campus (ej: `wp-parque-entrada-norte`)
2. **segmentId** debe ser unico en todo el campus (ej: `seg-parque-entrada-fuente`)
3. Los **orderIndex** empiezan en 0 y son consecutivos
4. Cada segmento conecta el waypoint N con el waypoint N+1
5. Las coordenadas del LineString deben empezar en el waypoint de origen y terminar en el de destino

### Herramientas utiles

- **geojson.io**: Editor visual de GeoJSON en el navegador
- **VS Code + GeoJSON extension**: Previsualiza el archivo en el editor
- **Google My Maps**: Puedes crear un mapa y exportar como KML, luego convertir a GeoJSON

---

## 6. Paso 4: Importar al Servidor

### Opcion A: Via API (recomendado)

#### 1. Crear un Campus Bundle

Envuelve tus rutas en un bundle:

```json
{
  "campus": {
    "name": "Parque del Retiro",
    "center": [-3.6833, 40.4153],
    "version": "1.0"
  },
  "routes": [
    { "...tu FeatureCollection ruta 1..." },
    { "...tu FeatureCollection ruta 2..." }
  ],
  "metadata": {
    "exportedAt": "2026-04-05T10:00:00Z",
    "routeCount": 2,
    "waypointCount": 8,
    "segmentCount": 6
  }
}
```

#### 2. Validar primero

```bash
curl -X POST http://localhost:3000/api/campus/validate \
  -H "Content-Type: application/json" \
  -d @mi-campus-bundle.json
```

Respuesta exitosa:
```json
{ "valid": true, "errors": [] }
```

#### 3. Importar

```bash
curl -X POST http://localhost:3000/api/campus/import \
  -H "Content-Type: application/json" \
  -d @mi-campus-bundle.json
```

Respuesta exitosa:
```json
{ "success": true, "routesCreated": 2, "waypointsCreated": 8, "segmentsCreated": 6 }
```

### Opcion B: Via Seed (para desarrollo)

Modifica `server/prisma/seed.ts` con tus datos directamente. Ver el archivo existente como ejemplo.

```bash
cd server
pnpm db:seed
```

---

## 7. Paso 5: Configurar y Probar

### 1. Configurar variables de entorno

```bash
# server/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/campus_gps"
ANTHROPIC_API_KEY="sk-ant-..."  # Opcional, para IA
PORT=3000
```

```bash
# apps/mobile/.env (o app.json)
EXPO_PUBLIC_API_URL="http://TU_IP_LOCAL:3000/api"
```

### 2. Iniciar el servidor

```bash
cd server
pnpm db:migrate
pnpm db:seed   # o importar via API
pnpm dev
```

### 3. Iniciar la app

```bash
cd apps/mobile
expo run:android  # o expo start para Expo Go
```

### 4. Probar en el terreno

1. Abre la app en tu telefono
2. Busca un destino (el buscador usa los nombres de tus waypoints)
3. Pulsa "Navegar"
4. Camina por la ruta — la app deberia:
   - Mostrarte en el mapa
   - Darte instrucciones turn-by-turn
   - Avisarte si te sales de la ruta
   - Mostrarte alertas de riesgo
   - Vibrar en las direcciones (perfil sordo)

---

## 8. Ajustar el Centro del Mapa

El centro del mapa por defecto es Ciudad Universitaria (40.4468, -3.7264). Para cambiarlo:

En `apps/mobile/src/store/mapStore.ts`, cambia las coordenadas del centro:

```typescript
center: [TU_LONGITUD, TU_LATITUD],  // [lng, lat]
```

---

## 9. Checklist Pre-Lanzamiento

- [ ] Todas las rutas importadas y visibles en el mapa
- [ ] Navegacion funcional entre al menos 2 puntos
- [ ] GPS tracking funciona en el terreno real
- [ ] Instrucciones turn-by-turn coherentes con el terreno
- [ ] Alertas de riesgo aparecen donde corresponde
- [ ] Snap-to-route funciona (no muestra "fuera de ruta" en camino)
- [ ] Datos de accesibilidad fisica correctos (rampas, escaleras, anchos)
- [ ] Audio-descripciones coherentes con el entorno
- [ ] Perfil de movilidad reducida evita escaleras correctamente
- [ ] Perfil de personas sordas vibra en las direcciones
- [ ] Busqueda de destinos funciona con los nombres definidos
- [ ] Reporte de incidencias funcional
- [ ] Panel admin accesible via navegador

---

## 10. Resolucion de Problemas

| Problema | Solucion |
|----------|----------|
| "No se encontro ruta" | Los waypoints deben estar conectados por segmentos consecutivos. Verifica orderIndex |
| GPS no preciso | Espera mas tiempo al tomar coordenadas. Evita zonas con edificios altos |
| Ruta se ve recta en vez de curva | Anade coordenadas intermedias en el LineString del segmento |
| "Fuera de ruta" constante | El threshold es 30m. Si tus coordenadas son imprecisas, incrementalo en snapToRouteService.ts |
| Navegacion no inicia | Verifica que el servidor esta corriendo y la URL de API es correcta |
| Importacion falla | Ejecuta primero /api/campus/validate para ver errores especificos |

---

*Documento creado: 2026-04-05*
