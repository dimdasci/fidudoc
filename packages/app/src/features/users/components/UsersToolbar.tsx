import { Button } from "@shared/ui/Button/Button";
import { UserPlus } from "lucide-react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface UsersToolbarProps {
  onAddUser: () => void;
  t: TranslateFn;
}

export function UsersToolbar({ onAddUser, t }: UsersToolbarProps) {
  return (
    <div className="flex justify-end mb-6">
      <Button
        onClick={onAddUser}
        variant="primary"
        size="sm"
        icon={<UserPlus size={16} />}
      >
        {t("users.actions.add")}
      </Button>
    </div>
  );
}
