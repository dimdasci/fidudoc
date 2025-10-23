import { useState } from "react";

export function useInboxSelection<T extends string | number = string | number>() {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const setSelected = (ids: Iterable<T>) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const updateSelection = (id: T, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleSelection = (id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return {
    selectedIds,
    setSelected,
    clearSelection,
    updateSelection,
    toggleSelection,
  };
}
