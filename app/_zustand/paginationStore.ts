import { create } from "zustand";

export type State = {
  page: number;
  totalPages: number;
};

export type Actions = {
  incrementPage: () => void;
  decrementPage: () => void;
  setPage: (page: number) => void;
  setTotalPages: (totalPages: number) => void;
};

export const usePaginationStore = create<State & Actions>((set) => ({
  page: 1,
  totalPages: 1,
  incrementPage: () => {
    set((state) => {
      const nextPage = Math.min(state.page + 1, Math.max(1, state.totalPages));
      return { page: nextPage };
    });
  },
  decrementPage: () => {
    set((state) => {
      const nextPage = Math.max(1, state.page - 1);
      return { page: nextPage };
    });
  },
  setPage: (page) => {
    set((state) => ({
      page: Math.min(Math.max(1, page), Math.max(1, state.totalPages)),
    }));
  },
  setTotalPages: (totalPages) => {
    const normalizedTotalPages = Math.max(1, totalPages);
    set((state) => ({
      totalPages: normalizedTotalPages,
      page: Math.min(state.page, normalizedTotalPages),
    }));
  },
}));
