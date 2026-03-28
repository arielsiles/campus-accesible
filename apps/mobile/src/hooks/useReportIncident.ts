// FR-502: Hook for submitting incident reports
import { useState, useCallback } from "react";
import { useIncidentStore } from "../store/incidentStore";
import { reportIncident } from "../services/incidentService";
import { getDeviceId } from "../services/deviceIdService";
import type { IncidentType, IncidentSummary } from "@campus-gps/shared-types";

interface ReportData {
  type: IncidentType;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  segmentId?: string;
}

/**
 * FR-502: Submit incident reports with device identification
 */
export function useReportIncident() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const addIncident = useIncidentStore((s) => s.addIncident);

  const report = useCallback(async (data: ReportData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const deviceId = await getDeviceId();
      const incident = await reportIncident({ ...data, deviceId });

      // Add to store as summary
      const summary: IncidentSummary = {
        id: incident.id,
        type: incident.type,
        status: incident.status,
        title: incident.title,
        description: incident.description,
        latitude: incident.latitude,
        longitude: incident.longitude,
        segmentId: incident.segmentId,
        createdAt: incident.createdAt,
      };
      addIncident(summary);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar reporte");
    } finally {
      setLoading(false);
    }
  }, [addIncident]);

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { report, loading, error, success, reset };
}
