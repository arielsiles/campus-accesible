// FR-1203: OpenWeatherMap integration
const API_BASE = "https://api.openweathermap.org/data/2.5";

interface CacheEntry {
  data: WeatherData;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // NFR-1202: 10 min

export interface WeatherData {
  temperature: number; // celsius
  feelsLike: number;
  humidity: number;
  condition: string; // raw OWM condition (e.g. "Rain")
  conditionLocal: string; // Spanish description
  iconCode: string;
  windSpeed: number; // m/s
  /** Accessibility-relevant alerts derived from the data */
  alerts: WeatherAlert[];
}

export interface WeatherAlert {
  severity: "info" | "warning" | "danger";
  /** Spanish message ready for TTS */
  message: string;
}

/**
 * FR-1203: Fetch current weather + derived accessibility alerts.
 * Returns null if API unavailable.
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  apiKey?: string
): Promise<WeatherData | null> {
  const key = apiKey ?? process.env.OPENWEATHER_API_KEY;
  if (!key) return null;

  const cacheKey = `${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const url = `${API_BASE}/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=es&appid=${key}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = (await response.json()) as RawWeatherResponse;

    const temperature = Math.round(json.main.temp);
    const data: WeatherData = {
      temperature,
      feelsLike: Math.round(json.main.feels_like),
      humidity: json.main.humidity,
      condition: json.weather[0]?.main ?? "Unknown",
      conditionLocal: json.weather[0]?.description ?? "Sin datos",
      iconCode: json.weather[0]?.icon ?? "01d",
      windSpeed: json.wind?.speed ?? 0,
      alerts: deriveAlerts({
        temperature,
        condition: json.weather[0]?.main ?? "",
        windSpeed: json.wind?.speed ?? 0,
      }),
    };

    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  } catch {
    return null;
  }
}

interface RawWeatherResponse {
  main: { temp: number; feels_like: number; humidity: number };
  weather: Array<{ main: string; description: string; icon: string }>;
  wind?: { speed: number };
}

/**
 * FR-1203: Derive accessibility-relevant alerts from raw weather.
 */
export function deriveAlerts(input: {
  temperature: number;
  condition: string;
  windSpeed: number;
}): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const cond = input.condition.toLowerCase();

  if (cond.includes("rain") || cond.includes("drizzle")) {
    alerts.push({
      severity: "warning",
      message: "Lluvia detectada. El suelo puede estar resbaladizo, ten precaucion al caminar.",
    });
  }
  if (cond.includes("snow")) {
    alerts.push({
      severity: "danger",
      message: "Nieve. Camina con cuidado, las superficies pueden estar muy resbaladizas.",
    });
  }
  if (cond.includes("thunderstorm")) {
    alerts.push({
      severity: "danger",
      message: "Tormenta electrica. Busca refugio si es posible.",
    });
  }
  if (cond.includes("fog") || cond.includes("mist")) {
    alerts.push({
      severity: "info",
      message: "Niebla. Visibilidad reducida, camina cerca de puntos de referencia.",
    });
  }
  if (input.temperature >= 35) {
    alerts.push({
      severity: "warning",
      message: `Calor extremo (${input.temperature} grados). Hidratate y busca sombra.`,
    });
  }
  if (input.temperature <= 0) {
    alerts.push({
      severity: "warning",
      message: `Temperatura bajo cero (${input.temperature} grados). Posible hielo en el suelo.`,
    });
  }
  if (input.windSpeed >= 15) {
    alerts.push({
      severity: "warning",
      message: "Viento fuerte. Sujeta bien tus pertenencias.",
    });
  }

  return alerts;
}
