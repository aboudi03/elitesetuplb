import { create } from "zustand";

export type CatalogViewMode = "grid" | "list";

type State = {
  viewMode: CatalogViewMode;
  hasHydrated: boolean;
};

type Actions = {
  setViewMode: (viewMode: CatalogViewMode) => void;
  hydrateViewMode: () => void;
};

const STORAGE_KEY = "catalog-view-mode";

export const useCatalogViewStore = create<State & Actions>((set) => ({
  viewMode: "grid",
  hasHydrated: false,
  setViewMode: (viewMode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, viewMode);
    }

    set({ viewMode });
  },
  hydrateViewMode: () => {
    if (typeof window === "undefined") {
      set({ hasHydrated: true });
      return;
    }

    const storedViewMode = window.localStorage.getItem(STORAGE_KEY);
    const nextViewMode = storedViewMode === "list" ? "list" : "grid";

    set({
      viewMode: nextViewMode,
      hasHydrated: true,
    });
  },
}));
