// FR-301: Compass hook — provides device heading from magnetometer
import { useState, useEffect, useCallback } from "react";
import { Magnetometer } from "expo-sensors";

export interface CompassData {
  /** Heading in degrees, 0-360, 0 = North */
  heading: number;
  /** Whether the compass is available */
  isAvailable: boolean;
  /** Whether the compass is actively tracking */
  isTracking: boolean;
}

/**
 * FR-301: Hook that provides compass heading using the device magnetometer.
 * Updates at ~10Hz (100ms interval) per NFR-301 latency requirements.
 *
 * @returns CompassData with heading, availability, and tracking state
 */
export function useCompass(): CompassData {
  const [heading, setHeading] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const calculateHeading = useCallback(
    (magnetometerData: { x: number; y: number; z: number }) => {
      const { x, y } = magnetometerData;
      // Calculate heading from magnetometer x,y
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      // Normalize to 0-360
      angle = (angle + 360) % 360;
      // TST-FR-301-003: Return heading normalized 0-360
      setHeading(Math.round(angle));
    },
    [],
  );

  useEffect(() => {
    let subscription: ReturnType<typeof Magnetometer.addListener> | null = null;

    const startCompass = async () => {
      const available = await Magnetometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) return;

      // NFR-301: Update interval 100ms for < 100ms latency
      Magnetometer.setUpdateInterval(100);

      subscription = Magnetometer.addListener(calculateHeading);
      setIsTracking(true);
    };

    startCompass();

    return () => {
      if (subscription) {
        subscription.remove();
        setIsTracking(false);
      }
    };
  }, [calculateHeading]);

  return { heading, isAvailable, isTracking };
}
