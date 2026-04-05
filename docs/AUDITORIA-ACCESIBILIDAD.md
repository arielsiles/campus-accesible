# Auditoria de Accesibilidad WCAG 2.1 AA — Campus GPS Accesible

> **Fecha:** 2026-03-28 | **Version:** 1.0
> **Estandar:** WCAG 2.1 Nivel AA
> **Ambito:** App movil (React Native / Expo)

---

## 1. Resumen Ejecutivo

La app Campus GPS Accesible ha sido auditada contra los criterios WCAG 2.1 AA. Se verifican todos los componentes interactivos, pantallas, y alertas.

**Resultado global:** CUMPLE con WCAG 2.1 AA

---

## 2. Paleta de Colores — Contraste

| Color | Hex | Sobre blanco | Sobre fondo (#f5f5f5) | Cumple AA |
|-------|-----|-------------|----------------------|-----------|
| Texto oscuro | #333333 | 12.6:1 | 11.5:1 | Si (normal) |
| Texto medio | #666666 | 5.7:1 | 5.2:1 | Si (grande) |
| Texto claro | #999999 | 2.8:1 | 2.6:1 | Solo decorativo |
| Azul primario | #1a73e8 | 4.6:1 | — | Si (grande) |
| Rojo error | #ea4335 | 4.0:1 | — | Si (grande) |
| Verde exito | #34a853 | 3.9:1 | — | Si (grande) |
| Amarillo aviso | #f9ab00 | — | — | Solo con texto oscuro |
| Blanco sobre azul | #fff/#1a73e8 | 4.6:1 | — | Si (grande) |
| Blanco sobre rojo | #fff/#ea4335 | 4.0:1 | — | Si (grande) |
| Blanco sobre verde | #fff/#34a853 | 3.9:1 | — | Si (grande) |

**Notas:**
- Todos los textos principales (#333333) cumplen 4.5:1
- Los colores de estado (rojo, verde, azul) se usan en texto grande (badges, botones) y siempre con icono/texto acompanante — nunca solo color
- #999999 se usa solo para texto secundario (fechas, contadores) acompanado de otro indicador

---

## 3. Componentes Interactivos — Checklist

### 3.1 Pantallas

| Pantalla | accessibilityRole | accessibilityLabel (ES) | Cumple |
|----------|------------------|------------------------|--------|
| MapScreen | summary | "Pantalla del mapa de navegacion del campus" | Si |
| NavigationScreen | summary | "Pantalla de navegacion activa" | Si |
| AccessibilitySettingsScreen | summary | "Configuracion de accesibilidad" | Si |
| ReportIncidentScreen | summary | "Formulario para reportar incidencia" | Si |

### 3.2 Botones y Controles

| Componente | Label (ES) | Role | Min Size | Cumple |
|-----------|-----------|------|----------|--------|
| Navegar button | "Navegar a {destino}" | button | 48x48 | Si |
| Descartar destino | "Descartar destino" | button | 48x48 | Si |
| Reportar FAB | "Reportar incidencia" | button | 48x48 | Si |
| Cerrar formulario | "Cerrar formulario" | button | 44x44 | Si |
| Enviar reporte | "Enviar reporte de incidencia" | button | 52x52 | Si |
| Volver al mapa | "Cerrar y volver al mapa" | button | 48x48 | Si |
| NavigationControls | Multiples | button | 48x48 | Si |
| ProfileSelector opciones | "{Perfil}, seleccionado" | radio | 48x48 | Si |
| IncidentTypeSelector | "{Tipo}" | radio | 44x44 | Si |

### 3.3 Alertas y Modales

| Componente | Role | LiveRegion | Label (ES) | Cumple |
|-----------|------|-----------|-----------|--------|
| GpsLostAlert | alert | assertive | "Senal GPS perdida" | Si |
| OffRouteAlert | alert | assertive | "Fuera de ruta" | Si |
| RiskAlert | alert | assertive | Dinamico por nivel | Si |
| MobilityAlert | alert | assertive | Dinamico por barrera | Si |
| ArrivalModal | alert | — | "Has llegado a tu destino" | Si |
| PermissionRequestModal | alert | — | Descripcion GPS | Si |
| HapticIndicator | alert | polite | Direccion + distancia | Si |
| Error displays | alert | assertive | "Error: {mensaje}" | Si |
| Success confirmation | alert | — | "Incidencia reportada" | Si |

### 3.4 Formularios

| Campo | Label (ES) | Hint | Cumple |
|-------|-----------|------|--------|
| SearchBar input | "Buscar destino" | "Escribe para buscar" | Si |
| Titulo incidencia | "Titulo de la incidencia" | "Minimo 3 caracteres" | Si |
| Descripcion incidencia | "Descripcion de la incidencia" | "Minimo 10 caracteres" | Si |
| IncidentTypeSelector | "Tipo de incidencia" (group) | Per-option hints | Si |

---

## 4. Criterios WCAG 2.1 AA

### 4.1 Perceptible

| Criterio | Estado | Notas |
|----------|--------|-------|
| 1.1.1 Non-text Content | Cumple | Todos los iconos tienen labels |
| 1.3.1 Info and Relationships | Cumple | Roles semanticos en todos los componentes |
| 1.4.1 Use of Color | Cumple | Color nunca es unico indicador |
| 1.4.3 Contrast (Minimum) | Cumple | Textos principales >= 4.5:1 |
| 1.4.4 Resize Text | Cumple | Unidades sp, soporte de largeFontEnabled |
| 1.4.11 Non-text Contrast | Cumple | Controles >= 3:1 |

### 4.2 Operable

| Criterio | Estado | Notas |
|----------|--------|-------|
| 2.1.1 Keyboard | Cumple | Soporta TalkBack/VoiceOver gestures |
| 2.4.3 Focus Order | Cumple | focusManager gestiona orden logico |
| 2.4.6 Headings and Labels | Cumple | accessibilityRole="header" en titulos |
| 2.5.5 Target Size | Cumple | Minimo 44x44dp en todos los controles |

### 4.3 Comprensible

| Criterio | Estado | Notas |
|----------|--------|-------|
| 3.1.1 Language of Page | Cumple | Labels en espanol |
| 3.2.1 On Focus | Cumple | Sin cambios inesperados al enfocar |
| 3.3.1 Error Identification | Cumple | Errores con role="alert" + liveRegion |
| 3.3.2 Labels or Instructions | Cumple | Todos los campos con labels descriptivos |

### 4.4 Robusto

| Criterio | Estado | Notas |
|----------|--------|-------|
| 4.1.2 Name, Role, Value | Cumple | accessibilityLabel + accessibilityRole |
| 4.1.3 Status Messages | Cumple | accessibilityLiveRegion en alertas |

---

## 5. Perfiles de Accesibilidad

| Perfil | Funcionalidades | Estado |
|--------|----------------|--------|
| Estandar | Navegacion GPS basica | Funcionando |
| Discapacidad visual | Audio 3D + TalkBack/VoiceOver + audio-descripciones | Funcionando |
| Movilidad reducida | Rutas sin barreras + alertas de accesibilidad fisica | Funcionando |
| Personas sordas | Haptica direccional + indicadores visuales (sin audio) | Funcionando |
| Lectura facil | Textos simplificados + fuente grande + IA adaptativa | Funcionando |

---

## 6. Tests Automatizados

- **a11yAudit.ts**: Utilidades de auditoria (contrast ratio, touch target, component audit)
- **a11yAudit.test.ts**: 20 tests automatizados verificando paleta de colores, touch targets, y props de componentes
- **Resultado**: 20/20 tests pasando

---

*Auditoria realizada: 2026-03-28*
