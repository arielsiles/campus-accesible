// FR-901: Authentication state management
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserPublic } from "@campus-gps/shared-types";
import { apiPost, apiGet } from "../services/apiClient";

const AUTH_TOKEN_KEY = "@campus-gps/auth-token";
const AUTH_USER_KEY = "@campus-gps/auth-user";

interface AuthState {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiPost<{ token: string; user: UserPublic }>(
        "/auth/login",
        { email, password }
      );
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiPost<{ token: string; user: UserPublic }>(
        "/auth/register",
        { email, password, name }
      );
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al registrarse";
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
    await AsyncStorage.removeItem("@campus-gps/selected-campus");
    set({ user: null, token: null, error: null });
  },

  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (token && userJson) {
        const user = JSON.parse(userJson) as UserPublic;
        set({ user, token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
