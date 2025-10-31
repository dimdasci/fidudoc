import { Button } from "@shared/ui/Button/Button";
import {
  SelectItem,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/Select";
import { useState } from "react";
import type { PermissionAction, PermissionObject } from "../api/roles.types";
import {
  ACTION_LABELS,
  OBJECT_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_OBJECTS,
} from "../lib/constants";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface AddPermissionFormProps {
  onAdd: (object: PermissionObject, action: PermissionAction) => void;
  isAdding: boolean;
  existingPermissions: Set<string>;
  t: TranslateFn;
}

export function AddPermissionForm({
  onAdd,
  isAdding,
  existingPermissions,
  t,
}: AddPermissionFormProps) {
  const [selectedObject, setSelectedObject] = useState<PermissionObject | "">(
    "",
  );
  const [selectedAction, setSelectedAction] = useState<PermissionAction | "">(
    "",
  );

  const handleAdd = () => {
    if (selectedObject && selectedAction) {
      onAdd(selectedObject, selectedAction);
      // Reset form
      setSelectedObject("");
      setSelectedAction("");
    }
  };

  const permissionKey =
    selectedObject && selectedAction
      ? `${selectedObject}:${selectedAction}`
      : "";
  const isDuplicate = permissionKey && existingPermissions.has(permissionKey);
  const canAdd = selectedObject && selectedAction && !isDuplicate && !isAdding;

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label
          htmlFor="permission-object"
          className="block text-body-sm font-medium text-primary mb-2"
        >
          {t("roles.permissions.object")}
        </label>
        <SelectRoot
          value={selectedObject}
          onValueChange={(value) =>
            setSelectedObject(value as PermissionObject | "")
          }
          disabled={isAdding}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select object" />
          </SelectTrigger>
          <SelectPopup>
            {PERMISSION_OBJECTS.map((obj) => (
              <SelectItem key={obj} value={obj}>
                {t(OBJECT_LABELS[obj])}
              </SelectItem>
            ))}
          </SelectPopup>
        </SelectRoot>
      </div>

      <div className="flex-1">
        <label
          htmlFor="permission-action"
          className="block text-body-sm font-medium text-primary mb-2"
        >
          {t("roles.permissions.action")}
        </label>
        <SelectRoot
          value={selectedAction}
          onValueChange={(value) =>
            setSelectedAction(value as PermissionAction | "")
          }
          disabled={isAdding}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectPopup>
            {PERMISSION_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(ACTION_LABELS[action])}
              </SelectItem>
            ))}
          </SelectPopup>
        </SelectRoot>
      </div>

      <Button
        onClick={handleAdd}
        disabled={!canAdd}
        variant="primary"
        size="md"
      >
        {t("roles.permissions.add")}
      </Button>
    </div>
  );
}
