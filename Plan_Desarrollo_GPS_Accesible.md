# PLAN DE DESARROLLO
## Aplicacion de Guiado GPS Accesible para Ciudad Universitaria

> Desarrollo Completo con Inteligencia Artificial y Agentes Claude
> Marzo 2026

---

## TABLA DE CONTENIDOS

1. [Analisis del Proyecto](#1-analisis-del-proyecto)
2. [Estructura de Archivos y Carpetas](#2-estructura-de-archivos-y-carpetas)
3. [Fases de Desarrollo](#3-fases-de-desarrollo)
4. [Stack Tecnologico Recomendado](#4-stack-tecnologico-recomendado)
5. [Herramientas de Desarrollo con IA](#5-herramientas-de-desarrollo-con-ia)
6. [Proyectos Open Source de Referencia](#6-proyectos-open-source-de-referencia)
7. [Estrategias de Desarrollo Basadas en Open Source](#7-estrategias-de-desarrollo-basadas-en-open-source)
8. [Roadmap y Estimaciones](#8-roadmap-y-estimaciones)

---

## 1. ANALISIS DEL PROYECTO

### 1.1 Resumen Funcional

La aplicacion es un **sistema de navegacion GPS accesible para Ciudad Universitaria**, disenado principalmente para personas con discapacidad visual, movilidad reducida, diversidad intelectual y personas sordas, aunque tambien esta abierto a cualquier usuario del campus.

### Funcionalidades Clave Identificadas

| # | Funcionalidad | Descripcion |
|---|--------------|-------------|
| 1 | **Navegacion GPS de alta precision** | Submetrica (< 1 metro), con trazados topograficos pregrabados |
| 2 | **Audio 3D espacializado** | Sonido que cambia de direccion para guiar al usuario (modelo tipo Soundscape) |
| 3 | **Audio-descripciones accesibles** | Informacion contextual del recorrido (obstaculos, desniveles, cruces, firme irregular) |
| 4 | **Multiples perfiles de accesibilidad** | Visual, movilidad reducida, diversidad intelectual, personas sordas |
| 5 | **Sistema de rutas tipo "metro en superficie"** | Cualquier punto puede ser origen o destino, conexion con transporte publico |
| 6 | **Niveles de riesgo** | Evaluacion y advertencia de riesgos en el recorrido (medio, alto, intolerable) |
| 7 | **Retroalimentacion haptica** | Vibracion para usuarios sordos |
| 8 | **Lectura facil** | Lenguaje simplificado para personas con diversidad intelectual |
| 9 | **Herramienta colaborativa** | Reporte de incidencias por usuarios |
| 10 | **Escalabilidad** | Posibilidad de anadir nuevas rutas y actualizar las existentes |

### 1.2 Desafios Tecnicos Principales

| Desafio | Descripcion |
|---------|-------------|
| **Precision GPS** | GPS estandar tiene ~3-5m de error. Se necesita RTK-GPS o mapas topograficos pregrabados con waypoints de alta precision |
| **Audio 3D** | Implementar HRTF (Head-Related Transfer Function) para audio espacializado requiere procesamiento en tiempo real |
| **Perfiles multiples** | Cada tipo de discapacidad requiere una UX completamente diferente: audio, haptica, lectura facil |
| **Rutas no lineales** | El sistema de grafo donde cualquier nodo es origen/destino necesita un motor de routing flexible |
| **Datos topograficos** | Requiere levantamiento de campo con equipo topografico para precision submetrica |

---

## 2. ESTRUCTURA DE ARCHIVOS Y CARPETAS

La estructura sigue el patron de un **monorepo** con separacion clara entre app movil, backend, datos topograficos y herramientas de IA. Arquitectura optimizada para desarrollo asistido por agentes de IA (Claude Code).

### 2.1 Estructura General del Monorepo

```
campus-guiado-gps/
├── apps/
│   ├── mobile/                    # App React Native (Expo)
│   │   ├── src/
│   │   │   ├── components/        # Componentes UI reutilizables
│   │   │   ├── screens/           # Pantallas principales
│   │   │   ├── navigation/        # Configuracion de rutas de navegacion
│   │   │   ├── services/          # Logica de negocio (GPS, audio, routing)
│   │   │   ├── hooks/             # Custom hooks
│   │   │   ├── store/             # Estado global (Zustand)
│   │   │   ├── accessibility/     # Modulos de accesibilidad por perfil
│   │   │   ├── audio/             # Motor de audio 3D espacializado
│   │   │   ├── haptics/           # Retroalimentacion haptica
│   │   │   ├── i18n/              # Internacionalizacion y lectura facil
│   │   │   └── utils/             # Utilidades generales
│   │   ├── assets/                # Imagenes, sonidos, fuentes
│   │   ├── app.json
│   │   └── package.json
│   └── admin-web/                 # Panel admin (Next.js)
│       ├── src/
│       └── package.json
├── packages/
│   ├── routing-engine/            # Motor de calculo de rutas
│   ├── map-data-processor/        # Procesamiento de datos topograficos
│   ├── accessibility-profiles/    # Perfiles de accesibilidad compartidos
│   └── shared-types/              # Tipos TypeScript compartidos
├── server/
│   ├── src/
│   │   ├── api/                   # Endpoints REST/GraphQL
│   │   ├── routes/                # Datos y logica de rutas
│   │   ├── incidents/             # Sistema de incidencias colaborativo
│   │   ├── auth/                  # Autenticacion
│   │   └── ai/                    # Agentes IA para procesamiento
│   ├── prisma/                    # Schema de base de datos
│   └── package.json
├── data/
│   ├── topographic/               # Datos topograficos (GeoJSON, GPX)
│   ├── routes/                    # Definiciones de rutas
│   ├── poi/                       # Puntos de interes
│   ├── accessibility-annotations/ # Anotaciones de accesibilidad
│   └── audio-descriptions/        # Textos de audio-descripciones
├── ai-agents/
│   ├── route-optimizer/           # Agente optimizador de rutas
│   ├── description-generator/     # Generador IA de audio-descripciones
│   ├── easy-read-adapter/         # Adaptador a lectura facil
│   └── incident-validator/        # Validador de incidencias reportadas
├── docs/                          # Documentacion del proyecto
├── tests/                         # Tests e2e y de integracion
├── .claude/                       # Configuracion de Claude Code
│   ├── settings.json
│   └── CLAUDE.md                  # Instrucciones para el agente
├── turbo.json                     # Configuracion Turborepo
└── package.json                   # Raiz del monorepo
```

### 2.2 Justificacion de la Estructura

| Decision | Justificacion |
|----------|--------------|
| **Monorepo con Turborepo** | Permite que Claude Code trabaje en cualquier parte del proyecto con contexto completo. Facilita compartir tipos y logica entre app movil, servidor y herramientas |
| **Separacion `data/`** | Los datos topograficos y de rutas son independientes del codigo. Los agentes IA pueden generar y validar estos datos sin tocar la app |
| **Carpeta `ai-agents/`** | Agentes especializados para tareas especificas: generar descripciones, adaptar a lectura facil, validar incidencias |
| **Carpeta `.claude/`** | `CLAUDE.md` contiene instrucciones persistentes para que Claude Code entienda el contexto del proyecto en cada sesion |

---

## 3. FASES DE DESARROLLO

El desarrollo se estructura en **6 fases progresivas**. Cada fase produce un entregable funcional y testeable. Los agentes de IA (Claude Code) participan activamente en cada fase.

---

### FASE 1: Fundacion y Prototipo Basico (Semanas 1-4)

**Objetivo:** App funcional minima con mapa y GPS basico.

**Tareas:**
- [ ] Inicializar monorepo con Turborepo + pnpm
- [ ] Configurar Expo (React Native) con TypeScript
- [ ] Integrar MapLibre GL (open source) como motor de mapas
- [ ] Implementar geolocalizacion GPS nativa con `expo-location`
- [ ] Crear modelo de datos GeoJSON para rutas del campus
- [ ] Configurar servidor basico con Hono + Prisma + PostgreSQL/PostGIS
- [ ] Implementar primera ruta de prueba con waypoints estaticos
- [ ] Configurar CI/CD basico con GitHub Actions

**Rol de la IA en esta fase:**
- Claude Code genera el scaffolding completo del proyecto
- Genera los esquemas Prisma y los tipos TypeScript compartidos
- Escribe los tests unitarios de cada modulo

> **Entregable:** App que muestra un mapa con una ruta y la posicion GPS del usuario.

---

### FASE 2: Motor de Navegacion y Routing (Semanas 5-8)

**Objetivo:** Navegacion punto-a-punto funcional con instrucciones basicas.

**Tareas:**
- [ ] Implementar grafo de rutas (nodos = puntos clave, aristas = segmentos)
- [ ] Desarrollar algoritmo de pathfinding (Dijkstra/A*) adaptado a accesibilidad
- [ ] Sistema de "snap-to-route" para mantener al usuario en la ruta incluso con desviaciones
- [ ] Instrucciones turn-by-turn basicas (texto)
- [ ] Conexion con puntos de transporte (Metro, autobuses, intercambiador)
- [ ] Busqueda de destinos (facultades, edificios, paradas)

**Rol de la IA en esta fase:**
- Claude Code implementa el algoritmo de routing con pesos por accesibilidad
- Genera las instrucciones de navegacion en lenguaje natural
- Ayuda a disenar el modelo de datos del grafo para escalabilidad

> **Entregable:** Navegacion funcional de cualquier punto A a punto B dentro del campus.

---

### FASE 3: Accesibilidad Visual y Audio 3D (Semanas 9-14)

**Objetivo:** Experiencia de navegacion completa para personas con discapacidad visual.

**Tareas:**
- [ ] Implementar audio espacializado 3D con HRTF (usando `expo-av` o nativo)
- [ ] Sistema de audio-descripciones contextuales (obstaculos, desniveles, cruces)
- [ ] Integracion completa con VoiceOver (iOS) y TalkBack (Android)
- [ ] Evaluacion y clasificacion de riesgos por segmento de ruta
- [ ] Perfil de usuario para discapacidad visual con preferencias configurables
- [ ] Compatibilidad con auriculares de conduccion osea
- [ ] Agente IA para generacion automatica de audio-descripciones a partir de datos topograficos

**Referencia clave: Microsoft Soundscape**
> El codigo fuente de Microsoft Soundscape (disponible en GitHub bajo licencia MIT) es la referencia principal para la implementacion de audio 3D espacializado. El proyecto comunitario `soundscape-community/soundscape` continua desarrollando esta tecnologia.

> **Entregable:** Navegacion funcional completa para usuarios con discapacidad visual.

---

### FASE 4: Perfiles Adicionales de Accesibilidad (Semanas 15-20)

**Objetivo:** Soporte para movilidad reducida, diversidad intelectual y personas sordas.

**Tareas:**
- [ ] Perfil de **movilidad reducida**: valoracion de accesibilidad (pendientes, pasos adaptados, tipo de firme)
- [ ] Perfil de **diversidad intelectual**: lectura facil con agente IA que simplifica el lenguaje
- [ ] Perfil de **personas sordas**: sistema de vibracion haptica direccional
- [ ] Selector de perfil en onboarding y configuracion
- [ ] Tests de usabilidad con usuarios reales de cada perfil

**Rol de la IA en esta fase:**
- Agente Claude especializado en adaptar textos a lectura facil (siguiendo guias de Plena Inclusion)
- Generacion de patrones hapticos optimizados con IA

> **Entregable:** App con 4 perfiles de accesibilidad funcionales.

---

### FASE 5: Sistema Colaborativo e Incidencias (Semanas 21-24)

**Objetivo:** Los usuarios pueden reportar y consultar incidencias en las rutas.

**Tareas:**
- [ ] Sistema de reporte de incidencias (obras, obstaculos temporales)
- [ ] Agente IA validador de incidencias (filtra informacion no veraz)
- [ ] Panel de administracion web (Next.js) para gestionar rutas e incidencias
- [ ] Sistema de actualizacion de rutas (al menos anual, segun el documento)
- [ ] Notificaciones push para incidencias en rutas habituales

> **Entregable:** Sistema colaborativo funcional con moderacion por IA.

---

### FASE 6: Optimizacion, Escalabilidad y Lanzamiento (Semanas 25-30)

**Objetivo:** Preparar la app para produccion y facilitar la expansion a otros campus.

**Tareas:**
- [x] Optimizacion de rendimiento (battery, GPS, audio)
- [x] Tests de accesibilidad automatizados
- [x] Documentacion completa para anadir nuevas rutas
- [x] Sistema de exportacion/importacion de campus (para replicar en otras universidades)
- [x] Auditoria de accesibilidad WCAG 2.1 AA

> **Entregable:** App optimizada con sistema de replicacion. ✅ Completada

---

### FASE 7: Herramienta de Creacion de Rutas (Semanas 31-36)

**Objetivo:** Los usuarios pueden crear rutas directamente desde la app, caminando por el lugar y grabando el trazado GPS.

**Tareas:**
- [ ] Modo "Grabacion GPS": caminar y grabar track con marcado de waypoints
- [ ] Modo "Edicion en mapa": colocar y ajustar puntos tocando el mapa
- [ ] Formulario de anotacion de segmentos (superficie, ancho, escaleras, riesgos)
- [ ] Vista previa y validacion de ruta antes de subir
- [ ] API de creacion de rutas (POST/PUT/DELETE /api/routes)
- [ ] Reconstruccion automatica del grafo tras crear/editar ruta
- [ ] Store de grabacion con estado del track en tiempo real

**Rol de la IA en esta fase:**
- Claude genera auto-descripciones para los segmentos a partir de los datos anotados
- Sugiere tipos de waypoint basandose en la ubicacion

> **Entregable:** Cualquier usuario puede crear rutas funcionales caminando por un espacio.

---

### FASE 8: Integracion Activa con OpenStreetMap (Semanas 37-40)

**Objetivo:** Aprovechar los datos de OSM para acelerar la creacion de rutas y enriquecer la informacion del mapa.

**Tareas:**
- [ ] Integracion con Overpass API para consultar edificios, caminos y paradas cercanos
- [ ] Geocodificacion con Nominatim (buscar por nombre → coordenadas)
- [ ] Auto-sugerencia de waypoints desde datos OSM al grabar rutas
- [ ] Pre-poblado de segmentos usando caminos peatonales de OSM (highway=footway)
- [ ] Enriquecimiento de POIs: horarios, tipo de edificio, servicios disponibles
- [ ] Cache offline de datos OSM por zona

**Referencia: Overpass Turbo**
> La API de Overpass permite consultas geoespaciales sobre datos OSM en tiempo real. Por ejemplo: "todos los edificios dentro de 500m de mi posicion" o "todos los caminos peatonales en esta area".

> **Entregable:** Creacion de rutas asistida por datos OSM, reduciendo tiempo de campo a la mitad.

---

### FASE 9: Multi-Campus y Comunidad (Semanas 41-46)

**Objetivo:** Soportar multiples ubicaciones y contribuciones comunitarias con moderacion.

**Tareas:**
- [ ] Autenticacion de usuarios (registro/login con email o social)
- [ ] Pantalla de seleccion de campus al iniciar la app
- [ ] Descubrimiento de campus: lista de ubicaciones publicas
- [ ] Roles de usuario: creador de rutas, revisor, administrador
- [ ] Workflow de moderacion: rutas pendientes → revision → publicacion
- [ ] Estadisticas por campus: rutas, usuarios, cobertura de accesibilidad
- [ ] Perfil de usuario con historial de contribuciones

> **Entregable:** Plataforma multi-campus con contribuciones comunitarias moderadas.

---

### FASE 10: Financiamiento y Lanzamiento Publico (Semanas 47-52)

**Objetivo:** Preparar el proyecto para financiamiento y publicacion en tiendas.

**Tareas:**
- [ ] Dashboard de metricas de impacto (rutas, usuarios, incidencias resueltas)
- [ ] Cumplimiento EN 301 549 (directiva europea de accesibilidad digital)
- [ ] Pitch deck y materiales de presentacion
- [ ] Partnership con universidad piloto (UCM)
- [ ] Publicacion en App Store y Google Play
- [ ] Documentacion de API publica para integraciones de terceros

> **Entregable:** Version 1.0 publicada en tiendas con metricas de impacto para financiadores.

---

### FASE 11: Camara Inteligente con Vision IA (Semanas 53-58)

**Objetivo:** Integrar la camara del dispositivo con Claude Vision API para describir el entorno en tiempo real, adaptado al perfil de accesibilidad del usuario.

**Tareas:**
- [ ] Integracion de camara con react-native-vision-camera
- [ ] Modo "Que veo?": captura de imagen + descripcion IA del entorno
- [ ] Prompts adaptados por perfil (visual, movilidad, sordo, lectura facil)
- [ ] Contexto GPS + ruta activa enriquece la descripcion
- [ ] Historial de capturas con descripciones
- [ ] Modo continuo: descripcion automatica cada 15-30s durante navegacion

**Tecnologias clave:** react-native-vision-camera, Claude Vision API, TTS existente

> **Entregable:** Usuario apunta la camara → IA describe el entorno en espanol, adaptado a su perfil de accesibilidad.

---

### FASE 12: OCR e Informacion Contextual (Semanas 59-62)

**Objetivo:** Leer texto de carteles/senalizacion y mostrar informacion contextual rica (comercios, clima, transporte).

**Tareas:**
- [ ] OCR on-device con Google ML Kit (sin internet, tiempo real)
- [ ] Lectura automatica de carteles y senalizaciones via TTS
- [ ] Google Places API: comercios cercanos con horarios y tipo
- [ ] OpenWeatherMap: clima actual y alertas de accesibilidad
- [ ] APIs de transporte: tiempos reales de bus/metro
- [ ] Panel de informacion contextual unificado

**Tecnologias clave:** Google ML Kit, Google Places API, OpenWeatherMap

> **Entregable:** App lee carteles automaticamente y muestra info de comercios, clima, y transporte cercano.

---

### FASE 13: Navegacion con Realidad Aumentada (Semanas 63-70)

**Objetivo:** Vista de camara con overlays de navegacion: flechas de direccion, marcadores de POIs, alertas de riesgo. AR basada en brujula (no ARCore).

**Tareas:**
- [ ] Vista AR con camara + overlays 2D de navegacion
- [ ] Flechas de direccion grandes y accesibles sobre la camara
- [ ] Marcadores de POIs posicionados por bearing (brujula + GPS)
- [ ] Alertas de riesgo superpuestas (escaleras, cruces peligrosos)
- [ ] Toggle mapa/AR durante navegacion
- [ ] Modo simplificado accesible (solo flecha + distancia)

**Enfoque tecnico:** Compass-based AR (brujula + GPS + overlays 2D). No requiere ARCore/ARKit.

> **Entregable:** Navegacion con realidad aumentada accesible — flechas y marcadores sobre la camara en tiempo real.

---

## 4. STACK TECNOLOGICO RECOMENDADO

La seleccion prioriza tecnologias **open source**, con buen soporte de accesibilidad y compatibles con desarrollo asistido por IA.

### 4.1 Frontend Movil

| Componente | Tecnologia | Justificacion |
|-----------|-----------|---------------|
| Framework | **React Native + Expo SDK 52+** | Cross-platform, excelente soporte de accesibilidad, Claude lo domina |
| Lenguaje | **TypeScript** | Tipado fuerte facilita la generacion de codigo por IA |
| Mapas | **MapLibre GL Native** | Fork open source de Mapbox GL. Soporte de tiles vectoriales, estilos custom |
| Estado | **Zustand** | Ligero, simple, compatible con TypeScript |
| Audio 3D | **expo-av + nativo (HRTF)** | Para audio espacializado. Referencia: Soundscape |
| Accesibilidad | **React Native AMA** | Toolkit que enforza accesibilidad en desarrollo |
| GPS | **expo-location** | API unificada iOS/Android con alta precision |
| Navegacion | **React Navigation 7+** | Accesible por defecto, soporte de deep linking |
| Haptica | **expo-haptics** | Control fino de vibracion, necesario para perfil sordo |

### 4.2 Backend

| Componente | Tecnologia | Justificacion |
|-----------|-----------|---------------|
| Runtime | **Node.js / Bun** | JavaScript/TypeScript end-to-end |
| Framework | **Hono** | Ultraligero, edge-ready, TypeScript nativo |
| ORM | **Prisma** | Type-safe, migraciones, soporte PostGIS |
| Base de Datos | **PostgreSQL + PostGIS** | Extension geoespacial esencial para routing |
| Hosting | **Railway / Fly.io / VPS** | Opciones asequibles con PostgreSQL incluido |
| IA Backend | **Anthropic Claude API** | Para agentes de generacion de descripciones y validacion |
| Geoespacial | **Turf.js + OSRM** | Calculos geoespaciales y routing open source |

### 4.3 Datos Geoespaciales

| Componente | Tecnologia | Justificacion |
|-----------|-----------|---------------|
| Mapas base | **OpenStreetMap** | Datos abiertos, comunidad activa, editable |
| Tiles | **Protomaps / MapTiler (free tier)** | Tiles vectoriales autohosteables |
| Formato rutas | **GeoJSON + GPX** | Estandares abiertos, interoperables |
| Geocoding | **Nominatim / Photon** | Geocodificacion open source basada en OSM |
| Routing | **OSRM / Valhalla** | Motores de routing open source con perfiles personalizables |

---

## 5. HERRAMIENTAS DE DESARROLLO CON IA

El desarrollo se basa en un flujo donde la IA genera, revisa y prueba codigo.

### 5.1 Herramientas Principales

| Herramienta | Uso | Detalles |
|------------|-----|---------|
| **Claude Code** | Agente de desarrollo principal | Linea de comandos. Genera codigo, ejecuta tests, hace commits. Ideal para este proyecto |
| **Claude.ai Pro** | Diseno y planificacion | Para arquitectura, revision de codigo, documentacion. Interfaz conversacional |
| **Cursor / Windsurf** | IDE con IA integrada | Alternativa visual a Claude Code. Autocomplete y chat en el editor |
| **GitHub Copilot** | Autocompletado en VS Code | Complementario para sugerencias inline |
| **Expo** | Build y preview | EAS Build para compilar, Expo Go para preview rapido |
| **Git + GitHub** | Control de versiones | Claude Code hace commits automaticos con mensajes descriptivos |
| **Vitest** | Testing | Framework de tests rapido, compatible con TypeScript |
| **Detox** | Tests E2E movil | Tests de accesibilidad automatizados en iOS y Android |

### 5.2 Flujo de Trabajo Recomendado con Claude Code

1. Escribir el archivo `CLAUDE.md` con el contexto completo del proyecto (que es, que tecnologias usa, convenciones de codigo)
2. Para cada feature: describir en lenguaje natural lo que necesitas. Claude Code genera el codigo, los tests y la documentacion
3. Revisar el codigo generado, pedir ajustes si es necesario
4. Claude Code ejecuta los tests automaticamente y corrige errores
5. Commit y PR automatico. Tu revisas y apruebas

> Este flujo permite que un ingeniero de software gestionando el proyecto pueda producir resultados equivalentes a un equipo pequeno, delegando la implementacion a los agentes de IA.

---

## 6. PROYECTOS OPEN SOURCE DE REFERENCIA

### 6.1 Microsoft Soundscape (Referencia Principal)

| Atributo | Detalle |
|----------|---------|
| **GitHub** | `microsoft/soundscape` + `soundscape-community/soundscape` |
| **Licencia** | MIT |
| **Plataforma** | iOS (Swift) - La comunidad trabaja en portar a mas plataformas |
| **Relevancia** | Audio 3D espacializado con HRTF, rutas guiadas, integracion con OSM, audio beacons. Es la implementacion mas madura de navegacion por audio para personas ciegas |
| **Que aprovechar** | Algoritmos de audio espacializado, logica de audio beacons, herramienta de autoria de rutas guiadas, arquitectura de servicios de localizacion |

### 6.2 OsmAnd

| Atributo | Detalle |
|----------|---------|
| **GitHub** | `osmandapp/OsmAnd` |
| **Licencia** | GPL v3 |
| **Plataforma** | Android (Java/Kotlin) + iOS |
| **Relevancia** | Navegacion offline completa con OSM. Motor de routing maduro con perfiles de vehiculos y peatones. Soporte de GPX tracks |
| **Que aprovechar** | Motor de routing offline, sistema de perfiles personalizables, gestion de datos OSM, TTS para navegacion |

### 6.3 Otros Proyectos Relevantes

| Proyecto | Licencia | Plataforma | Relevancia |
|----------|----------|-----------|------------|
| **OpenIndoorMaps** | Open Source | Web (OSM-based) | Navegacion indoor/outdoor con OSM, admin panel |
| **Organic Maps** | Apache 2.0 | iOS + Android | Navegacion offline minimalista, codigo limpio |
| **OSRM** | BSD 2-Clause | Servidor | Motor de routing rapido, perfiles custom |
| **Valhalla** | MIT | Servidor | Routing con soporte de accesibilidad y multimodal |
| **Blind-Nav** | Open Source | Android (Kotlin) | Navegacion para ciegos con Gemini AI |
| **React Native AMA** | MIT | React Native | Toolkit de accesibilidad para RN |
| **SightWalk** | Open Source | Python/ML | Deteccion de obstaculos con CNN para ciegos |
| **APH Beacon Project** | Open Source | iOS | Beacons BT para nav. indoor de ciegos + OSM |

### 6.4 Aplicaciones Comerciales de Referencia (No Open Source)

- **BlindSquare**: La app GPS mas usada por personas ciegas. Usa Foursquare + OSM. Referencia para UX de accesibilidad
- **Lazarillo**: App gratuita con exploracion de entorno y navegacion. Muy popular en Latinoamerica
- **Seeing Eye GPS**: Navegacion turn-by-turn disenada para baston y perro guia
- **ViaOpta Nav**: De Novartis. Incluye informacion de accesibilidad en intersecciones

---

## 7. ESTRATEGIAS DE DESARROLLO BASADAS EN OPEN SOURCE

### Estrategia C: Desarrollo Nuevo con Componentes Open Source (Recomendada)

| Aspecto | Detalle |
|---------|---------|
| **Base** | React Native + Expo + MapLibre + OSRM/Valhalla (todo MIT/BSD) |
| **Ventajas** | Arquitectura limpia, TypeScript end-to-end, cross-platform desde dia 1, facil de mantener, ideal para desarrollo con IA |
| **Desventajas** | Audio 3D debe implementarse desde cero o portarse de Soundscape. Mas tiempo inicial |
| **Enfoque** | Construir la app con React Native, usar OSRM para routing, integrar audio 3D portandolo de Soundscape como modulo nativo |
| **Esfuerzo** | Medio. Con Claude Code, el scaffolding y la mayoria del codigo se generan rapidamente |

### 7.1 Recomendacion Final

La recomendacion es la **Estrategia C** (Desarrollo nuevo con componentes open source), combinada con elementos de la Estrategia A (extraer audio 3D de Soundscape):

1. **Arquitectura nueva** en React Native + Expo + TypeScript para maxima compatibilidad con desarrollo por IA
2. **MapLibre GL** como motor de mapas (open source, tiles vectoriales)
3. **OSRM o Valhalla** para routing con perfiles de accesibilidad custom
4. **Portar la logica de audio 3D** de Soundscape como modulo nativo
5. **Claude API** para agentes de generacion de descripciones y lectura facil
6. **OpenStreetMap** como base de datos geografica

> Esta combinacion ofrece el mejor balance entre: licencias permisivas (MIT/BSD), compatibilidad con IA para desarrollo, cross-platform desde el dia uno, y reutilizacion de lo mas dificil de implementar (audio 3D).

---

## 8. ROADMAP Y ESTIMACIONES

### 8.1 Fases Core (Completadas)

| Fase | Descripcion | Duracion | Estado |
|------|------------|----------|--------|
| **Fase 1** | Fundacion y prototipo basico | 4 semanas | ✅ Completada |
| **Fase 2** | Motor de navegacion y routing | 4 semanas | ✅ Completada |
| **Fase 3** | Accesibilidad visual y audio 3D | 6 semanas | ✅ Completada |
| **Fase 4** | Perfiles adicionales de accesibilidad | 6 semanas | ✅ Completada |
| **Fase 5** | Sistema colaborativo e incidencias | 4 semanas | ✅ Completada |
| **Fase 6** | Optimizacion y escalabilidad | 6 semanas | ✅ Completada |

### 8.2 Fases de Crecimiento

| Fase | Descripcion | Duracion | Estado |
|------|------------|----------|--------|
| **Fase 7** | Herramienta de creacion de rutas in-app | 6 semanas | ✅ Completada |
| **Fase 8** | Integracion activa con OpenStreetMap | 4 semanas | ✅ Completada |
| **Fase 9** | Multi-campus y comunidad | 6 semanas | Planificada |
| **Fase 10** | Financiamiento y lanzamiento publico | 6 semanas | Planificada |

### 8.3 Fases de Innovacion (Vision IA + AR)

| Fase | Descripcion | Duracion | Prioridad |
|------|------------|----------|-----------|
| **Fase 11** | Camara inteligente con Vision IA | 6 semanas | Alta |
| **Fase 12** | OCR e informacion contextual | 4 semanas | Alta |
| **Fase 13** | Navegacion con realidad aumentada | 8 semanas | Media |

> **Fases 1-8:** 40 semanas completadas.
> **Fases 9-10:** 12 semanas (plataforma + lanzamiento).
> **Fases 11-13:** 18 semanas (vision IA + AR).
> **Total del proyecto:** 70 semanas (~16 meses) con un desarrollador + agentes IA.

### 8.3 Consideraciones Importantes

- **Fase 7 es el desbloqueante clave:** Sin ella, crear rutas requiere edicion manual de JSON. Con ella, cualquier persona puede crear rutas caminando por un lugar.
- **Levantamiento topografico:** Con la Fase 7, el levantamiento se integra en la propia app. No se necesita equipo topografico profesional para precision a nivel peatonal (3-5m GPS es suficiente con snap-to-route).
- **Tests con usuarios reales:** Fase 7 permite pruebas de campo inmediatas en cualquier espacio (parque, centro comercial, otro campus).
- **OpenStreetMap (Fase 8):** Acelera la creacion de rutas pero no la bloquea. La Fase 7 funciona sin OSM.
- **Financiamiento (Fase 10):** Requiere demo funcional con datos reales. Fases 7+8 proporcionan esa demo.
- **Regulaciones:** EN 301 549 (directiva europea de accesibilidad digital) se cumple desde Fase 6 (auditoria WCAG 2.1 AA).

---

*Documento generado con asistencia de IA - Claude (Anthropic)*
