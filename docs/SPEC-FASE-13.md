# Especificacion de Desarrollo — Fase 13: Navegacion con Realidad Aumentada

> **Version:** 1.0 | **Fecha:** 2026-04-07 | **Estado:** Draft
> **Prefijo IDs:** FR-13XX (funcionales), NFR-13XX (no funcionales)
> **Fase anterior:** Fase 12 — ver `SPEC-FASE-12.md`
> **Enfoque:** AR basada en brujula (compass-based), no ARCore/ARKit

---

## 1. Alcance

### En Scope (Fase 13)

- Vista de camara con overlays de navegacion (flechas de direccion, distancias)
- Marcadores de POIs visibles en la camara con nombre y distancia
- Indicadores de riesgo y alertas superpuestos en la vista de camara
- Modo AR de navegacion como alternativa a la vista de mapa
- Overlays de alta accesibilidad (alto contraste, tamano grande, haptica)
- Integracion con brujula/magnetometro para posicionar marcadores

### Fuera de Scope

- ARCore/ARKit con tracking 3D (demasiado complejo, no necesario para navegacion)
- Reconocimiento de objetos 3D
- Mapeado espacial / mesh 3D
- Navegacion indoor con beacons BLE

### Enfoque Tecnico: Compass-Based AR

En lugar de AR "verdadera" (que requiere ARCore y es fragil en exteriores), usamos **AR basada en brujula**:
- La camara es el fondo
- La brujula + GPS determinan la orientacion del usuario
- Los POIs se posicionan en la pantalla segun su bearing relativo al usuario
- Es simple, robusto, y funciona en cualquier telefono con brujula

---

## 2. Requisitos Funcionales

### FR-1301: Vista AR de Navegacion

**Descripcion:** Vista de camara en pantalla completa con overlays 2D que indican la direccion de navegacion, waypoints visibles, y distancias. Reemplaza (o complementa) la vista de mapa durante la navegacion.

**Criterios de aceptacion:**

```gherkin
Given la navegacion activa
When el usuario activa el modo AR
Then la camara se abre con overlays de navegacion superpuestos

Given la vista AR activa
When el usuario apunta la camara en la direccion correcta
Then una flecha grande verde indica "Sigue recto" con distancia

Given la vista AR activa
When el proximo giro esta a < 20m
Then aparece una flecha de giro (izquierda/derecha) con indicacion

Given el usuario apuntando la camara
When hay un waypoint en la direccion que mira (bearing ± 30 grados)
Then aparece un marcador con nombre y distancia

Given el modo AR
When el usuario quiere volver al mapa
Then puede pulsar un boton para cambiar a vista de mapa
```

**Archivos requeridos:**
- `apps/mobile/src/screens/ARNavigationScreen.tsx` — vista AR completa
- `apps/mobile/src/components/ARDirectionArrow.tsx` — flecha de direccion
- `apps/mobile/src/components/ARWaypointMarker.tsx` — marcador de POI en AR
- `apps/mobile/src/components/ARRiskOverlay.tsx` — alerta de riesgo en AR
- `apps/mobile/src/hooks/useARPositioning.ts` — calculos de posicionamiento

---

### FR-1302: Posicionamiento de Marcadores con Brujula

**Descripcion:** Usar la brujula (magnetometro) del dispositivo junto con GPS para calcular la posicion en pantalla de cada POI. El calculo usa bearing entre el usuario y el POI, comparado con el heading actual del dispositivo.

**Criterios de aceptacion:**

```gherkin
Given la brujula indicando heading 90 (Este)
When hay un waypoint al Norte (bearing 0)
Then el marcador aparece a la izquierda de la pantalla

Given la brujula indicando heading 0 (Norte)
When hay un waypoint al Norte (bearing 0)
Then el marcador aparece centrado en la pantalla

Given un waypoint a 500m de distancia
When se calcula su posicion
Then el marcador es mas pequeno y transparente que uno a 50m

Given el campo de vision de la camara (aproximadamente 60 grados)
When un waypoint esta fuera del campo de vision (> 30 grados del centro)
Then no se muestra, pero una flecha en el borde indica su direccion
```

**Calculos:**
```
screenX = (waypointBearing - deviceHeading + 180) % 360 - 180
         → mapear a posicion X en la pantalla (-30° a +30° → 0 a width)

markerSize = max(20, 60 - (distance / 20))
         → mas grande = mas cerca

markerOpacity = max(0.3, 1 - (distance / 500))
         → mas opaco = mas cerca
```

---

### FR-1303: Indicadores de Direccion Accesibles

**Descripcion:** Flechas de navegacion grandes, con alto contraste, y feedback haptico. Disenadas para ser utiles para personas con baja vision.

**Criterios de aceptacion:**

```gherkin
Given la instruccion "gira a la izquierda"
When se muestra en AR
Then aparece una flecha grande (>100dp) a la izquierda con fondo semi-transparente

Given cualquier indicador AR
When se evalua la accesibilidad
Then tiene contraste >= 4.5:1 sobre el fondo de la camara (usa fondo oscuro semi-transparente)

Given el perfil de personas sordas
When hay un cambio de direccion
Then vibra con el patron haptico correspondiente (ya implementado en Fase 4)

Given el modo AR activo
When TalkBack esta activo
Then anuncia las instrucciones de navegacion como texto
```

---

### FR-1304: Alertas de Riesgo en AR

**Descripcion:** Superponer alertas visuales cuando el usuario mira hacia una zona de riesgo detectada (escaleras, cruce peligroso, superficie irregular).

**Criterios de aceptacion:**

```gherkin
Given un segmento con riskLevel "high" adelante
When el usuario apunta la camara en esa direccion
Then aparece un overlay rojo semi-transparente con icono de advertencia

Given un segmento con hasStairs = true
When el usuario se acerca (< 30m)
Then aparece un overlay: "Escaleras a 30m" con icono

Given el perfil de movilidad reducida
When hay barreras adelante
Then los overlays de alerta son mas prominentes (mas grandes, vibracion)
```

---

### FR-1305: Informacion de POIs en AR

**Descripcion:** Los marcadores de POIs en la vista AR muestran informacion contextual al tocarlos.

**Criterios de aceptacion:**

```gherkin
Given un marcador de POI visible en la vista AR
When el usuario lo toca
Then se expande mostrando: nombre, tipo, distancia, y boton "Navegar aqui"

Given informacion de Google Places disponible (Fase 12)
When se toca un marcador de comercio
Then muestra ademas: horario, abierto/cerrado

Given multiples marcadores solapados
When se muestran en AR
Then se agrupan con un indicador "(3 lugares)"
```

---

## 3. Requisitos No Funcionales

### NFR-1301: Rendimiento AR

| Metrica | Criterio |
|---------|----------|
| Frame rate | >= 30 fps con overlays |
| Latencia brujula | < 50ms entre lectura y actualizacion visual |
| Consumo bateria | < 25% por hora en modo AR |
| Precision posicional | Marcadores dentro de ± 15 grados del bearing real |

### NFR-1302: Accesibilidad AR

| Criterio | Detalle |
|----------|---------|
| Contraste de overlays | >= 4.5:1 (fondo oscuro semi-transparente detras de texto) |
| Tamano de flechas | >= 100dp para indicadores de direccion |
| Feedback multimodal | Visual + haptico + audio para cada indicacion |
| Modo simplificado | Solo flecha de direccion + distancia (sin POIs) |

---

## 4. Arquitectura Tecnica

### AR Compass-Based vs ARCore

| Aspecto | Compass-Based (elegido) | ARCore |
|---------|------------------------|--------|
| Complejidad | Baja | Alta |
| Compatibilidad | Todo telefono con brujula | Solo telefonos con ARCore |
| Precision interior | Baja | Alta |
| Precision exterior | Suficiente (± 15°) | Alta |
| Bateria | Moderada | Alta |
| Dependencias | Solo magnetometro + GPS | Google Play Services |
| Tiempo implementacion | 4-6 semanas | 10-14 semanas |

### Stack Tecnico

```
react-native-vision-camera    → vista de camara como fondo
useCompass (ya existente)      → heading del dispositivo
GPS (ya existente)             → posicion del usuario
Calculos de bearing            → posicion de marcadores en pantalla
React Native Views             → overlays 2D sobre camara
expo-haptics (ya existente)    → feedback tactil
TTS (ya existente)             → narrar instrucciones
```

---

## 5. Orden de Implementacion

1. **T13.1** — useARPositioning hook (calculos bearing → screen position)
2. **T13.2** — ARNavigationScreen con camara + flecha de direccion
3. **T13.3** — ARWaypointMarker (marcadores de POIs posicionados)
4. **T13.4** — ARRiskOverlay (alertas de riesgo en AR)
5. **T13.5** — Integracion con navegacion existente (toggle mapa/AR)
6. **T13.6** — Modo simplificado accesible

**Camino critico:** T13.1 → T13.2 → T13.5

---

## 6. Mockup Conceptual

```
+------------------------------------------+
|  [← Mapa]              [Riesgo: Bajo]   |  ← Barra superior
|                                          |
|                                          |
|        📍 Facultad de Medicina           |  ← Marcador AR (bearing match)
|             120m                         |
|                                          |
|                                          |
|              ⬆️                          |  ← Flecha de direccion
|          Sigue recto                     |
|           85 metros                      |
|                                          |
|  [📍 3 lugares cerca]    [☀️ 22°C]      |  ← Info contextual
+------------------------------------------+
```

---

*Documento creado: 2026-04-07*
