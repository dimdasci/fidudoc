import { create } from "zustand";

interface ApiStore {
  isHealthy: boolean;
  lastError: string | null;
  setHealthy: (healthy: boolean) => void;
  setError: (error: string | null) => void;
}

export const useApiStore = create<ApiStore>((set) => ({
  isHealthy: true,
  lastError: null,
  setHealthy: (isHealthy) => set({ isHealthy }),
  setError: (lastError) => set({ lastError }),
}));
