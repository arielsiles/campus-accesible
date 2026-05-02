// FR-1501, NFR-1501: Privacy preferences with persistence
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@campus-gps/privacy";

interface PrivacyState {
  /** Whether telemetry has been explicitly accepted by the user */
  telemetryEnabled: boolean;
  /** Whether the user has been shown the consent prompt */
  consentShown: boolean;

  load: () => Promise<void>;
  setTelemetryEnabled: (enabled: boolean) => Promise<void>;
  markConsentShown: () => Promise<void>;
}

interface Persisted {
  telemetryEnabled: boolean;
  consentShown: boolean;
}

async function persist(state: Persisted) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const usePrivacyStore = create<PrivacyState>((set, get) => ({
  telemetryEnabled: false, // FR-1501: opt-in default OFF
  consentShown: false,

  load: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (!json) return;
      const parsed = JSON.parse(json) as Partial<Persisted>;
      set({
        telemetryEnabled: !!parsed.telemetryEnabled,
        consentShown: !!parsed.consentShown,
      });
    } catch {
      // ignore
    }
  },

  setTelemetryEnabled: async (enabled: boolean) => {
    set({ telemetryEnabled: enabled });
    const { consentShown } = get();
    await persist({ telemetryEnabled: enabled, consentShown });
  },

  markConsentShown: async () => {
    set({ consentShown: true });
    const { telemetryEnabled } = get();
    await persist({ telemetryEnabled, consentShown: true });
  },
}));
