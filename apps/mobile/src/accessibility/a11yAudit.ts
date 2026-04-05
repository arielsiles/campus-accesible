// FR-602: Accessibility audit utilities for WCAG 2.1 AA compliance

/**
 * FR-602: Check color contrast ratio (WCAG 2.1 AA)
 * Returns ratio between foreground and background luminances
 */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const fgL = relativeLuminance(fgHex);
  const bgL = relativeLuminance(bgHex);
  const lighter = Math.max(fgL, bgL);
  const darker = Math.min(fgL, bgL);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * FR-602: Calculate relative luminance per WCAG 2.1
 */
function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = rgb.map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.substring(0, 2), 16),
    parseInt(clean.substring(2, 4), 16),
    parseInt(clean.substring(4, 6), 16),
  ];
}

/**
 * FR-602: Check if contrast meets WCAG 2.1 AA for normal text (>= 4.5:1)
 */
export function meetsContrastAA(fgHex: string, bgHex: string): boolean {
  return contrastRatio(fgHex, bgHex) >= 4.5;
}

/**
 * FR-602: Check if contrast meets WCAG 2.1 AA for large text/graphics (>= 3:1)
 */
export function meetsContrastAALarge(fgHex: string, bgHex: string): boolean {
  return contrastRatio(fgHex, bgHex) >= 3.0;
}

/**
 * FR-602: Check if touch target meets minimum size (44x44 dp)
 */
export function meetsTouchTarget(width: number, height: number): boolean {
  return width >= 44 && height >= 44;
}

/**
 * FR-602: Validate component accessibility props
 */
export interface A11yProps {
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
  accessibilityLiveRegion?: string;
}

export interface A11yAuditResult {
  component: string;
  hasLabel: boolean;
  labelIsSpanish: boolean;
  hasRole: boolean;
  issues: string[];
}

// Common Spanish characters that indicate Spanish text
const SPANISH_PATTERN = /[áéíóúñ¿¡]|^(Pulsa|Cerrar|Navegar|Reportar|Enviar|Volver|Cargando|Error|Pantalla|Mapa|Ruta|Incidencia|Destino|Tipo|Titulo|Descripcion|Ubicacion)/i;

/**
 * FR-602: Audit a component's accessibility properties
 */
export function auditComponent(
  componentName: string,
  props: A11yProps
): A11yAuditResult {
  const issues: string[] = [];

  const hasLabel = Boolean(props.accessibilityLabel);
  if (!hasLabel) {
    issues.push("Missing accessibilityLabel");
  }

  const labelIsSpanish = hasLabel && SPANISH_PATTERN.test(props.accessibilityLabel!);
  if (hasLabel && !labelIsSpanish) {
    issues.push("accessibilityLabel may not be in Spanish");
  }

  const hasRole = Boolean(props.accessibilityRole);
  if (!hasRole) {
    issues.push("Missing accessibilityRole");
  }

  return { component: componentName, hasLabel, labelIsSpanish, hasRole, issues };
}
