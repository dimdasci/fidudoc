import { Button } from "@shared/ui/Button/Button";
import { ChevronDownIcon } from "@shared/ui/icons/ChevronDownIcon";
import { Input } from "@shared/ui/Input";
import { MenuItem, MenuPopup, MenuRoot, MenuTrigger } from "@shared/ui/Menu";
import { ToolbarGroup, ToolbarRoot, ToolbarSeparator } from "@shared/ui/Toolbar";
import { Check, Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface InboxToolbarProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onUpload: () => void;
  t: TranslateFn;
}

const STATUS_OPTIONS: Array<{ value: string; labelKey: string }> = [
  { value: "all", labelKey: "inbox.filter.all" },
  { value: "pending", labelKey: "inbox.filter.pending" },
  { value: "approved", labelKey: "inbox.filter.approved" },
  { value: "rejected", labelKey: "inbox.filter.rejected" },
];

export function InboxToolbar({
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  onApprove,
  onReject,
  onUpload,
  t,
}: InboxToolbarProps) {
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(event.target.value);
  };

  const renderStatusLabel = () => {
    const option = STATUS_OPTIONS.find((opt) => opt.value === statusFilter);
    if (!option) return statusFilter;
    return t(option.labelKey);
  };

  return (
    <>
      <ToolbarRoot className="justify-between mb-6">
        <ToolbarGroup>
          <div className="w-64">
            <Input
              placeholder={t("inbox.search.placeholder")}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="w-40">
            <MenuRoot>
              <MenuTrigger>
                {renderStatusLabel()}
                <ChevronDownIcon />
              </MenuTrigger>
              <MenuPopup>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => onStatusChange(option.value)}
                    selected={statusFilter === option.value}
                  >
                    {t(option.labelKey)}
                  </MenuItem>
                ))}
              </MenuPopup>
            </MenuRoot>
          </div>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" />

        <ToolbarGroup>
          <Button
            onClick={onApprove}
            disabled={selectedCount === 0}
            variant="secondary"
            size="sm"
            icon={<Check size={16} />}
          >
            {t("inbox.button.approve")}
          </Button>
          <Button
            onClick={onReject}
            disabled={selectedCount === 0}
            variant="secondary"
            size="sm"
            icon={<X size={16} />}
          >
            {t("inbox.button.reject")}
          </Button>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" />

        <ToolbarGroup>
          <Button
            onClick={onUpload}
            variant="primary"
            size="sm"
            icon={<Upload size={16} />}
          >
            {t("inbox.button.upload")}
          </Button>
        </ToolbarGroup>
      </ToolbarRoot>

      {selectedCount > 0 && (
        <div className="mb-3 text-body-sm text-secondary">
          {t("inbox.footer.selected", { count: selectedCount })}
        </div>
      )}
    </>
  );
}
