import { create } from "zustand";

type UI = {
  selectedId: number | null;
  setSelected: (id: number | null) => void;
};

export const useUI = create<UI>((set) => ({
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}));
