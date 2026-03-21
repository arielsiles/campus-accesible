// FR-302: Text-to-speech wrapper service
import * as Speech from "expo-speech";

export interface TTSOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  onDone?: () => void;
}

const DEFAULT_OPTIONS: TTSOptions = {
  language: "es-ES",
  rate: 0.9,
  pitch: 1.0,
};

let isSpeaking = false;
let isEnabled = true;

export const ttsService = {
  /** Speak text aloud, queuing if already speaking */
  async speak(text: string, options?: TTSOptions): Promise<void> {
    if (!isEnabled || !text) return;

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

    isSpeaking = true;
    await Speech.speak(text, {
      language: mergedOptions.language,
      rate: mergedOptions.rate,
      pitch: mergedOptions.pitch,
      onDone: () => {
        isSpeaking = false;
        mergedOptions.onDone?.();
      },
      onError: () => {
        isSpeaking = false;
      },
    });
  },

  /** Stop any current speech */
  async stop(): Promise<void> {
    await Speech.stop();
    isSpeaking = false;
  },

  /** Check if currently speaking */
  getIsSpeaking(): boolean {
    return isSpeaking;
  },

  /** Enable or disable TTS globally */
  setEnabled(enabled: boolean): void {
    isEnabled = enabled;
    if (!enabled) {
      Speech.stop();
      isSpeaking = false;
    }
  },

  /** Check if TTS is enabled */
  getIsEnabled(): boolean {
    return isEnabled;
  },
};
