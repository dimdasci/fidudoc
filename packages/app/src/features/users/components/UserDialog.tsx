import { Field } from "@base-ui-components/react/field";
import { Button } from "@shared/ui/Button/Button";
import { Dialog } from "@shared/ui/Dialog";
import { Loader } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { CreateUserData, UpdateUserData, User } from "../api/users.api";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  user?: User;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  isSubmitting: boolean;
  t: TranslateFn;
}

export function UserDialog({
  open,
  onClose,
  mode,
  user,
  onSubmit,
  isSubmitting,
  t,
}: UserDialogProps) {
  const isActiveId = useId();

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    fullName: "",
    isActive: true,
    title: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    displayName: "",
    fullName: "",
  });

  // Initialize form with user data in edit mode
  useEffect(() => {
    if (mode === "edit" && user) {
      setFormData({
        email: user.email,
        displayName: user.displayName,
        fullName: user.fullName,
        isActive: user.isActive,
        title: typeof user.title === "string" ? user.title : "",
      });
    } else if (mode === "create") {
      setFormData({
        email: "",
        displayName: "",
        fullName: "",
        isActive: true,
        title: "",
      });
    }
    // Reset errors when dialog opens/mode changes
    setErrors({
      email: "",
      displayName: "",
      fullName: "",
    });
  }, [mode, user]);

  const validateForm = (): boolean => {
    const newErrors = {
      email: "",
      displayName: "",
      fullName: "",
    };

    let isValid = true;

    // Email validation (required for both create and edit modes)
    if (!formData.email.trim()) {
      newErrors.email = t("users.form.emailRequired");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("users.form.emailInvalid");
      isValid = false;
    }

    // Display name validation
    if (!formData.displayName.trim()) {
      newErrors.displayName = t("users.form.displayNameRequired");
      isValid = false;
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = t("users.form.fullNameRequired");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === "create") {
      const data: CreateUserData = {
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        fullName: formData.fullName.trim(),
        isActive: formData.isActive,
        title: formData.title.trim() || undefined,
      };
      onSubmit(data);
    } else {
      const data: UpdateUserData = {
        email: formData.email.trim(),
        displayName: formData.displayName.trim(),
        fullName: formData.fullName.trim(),
        isActive: formData.isActive,
        title: formData.title.trim() || undefined,
      };
      onSubmit(data);
    }
  };

  const dialogTitle = mode === "create"
    ? t("users.dialog.createTitle")
    : t("users.dialog.editTitle");

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
      title={dialogTitle}
      footer={
        <div className="flex gap-3 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={isSubmitting}>
            {t("users.dialog.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>(
                "form[data-user-form]",
              );
              if (form) {
                form.requestSubmit();
              }
            }}
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {t("users.dialog.saving")}
                </>
              )
              : t("users.dialog.save")}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} data-user-form className="space-y-4">
        {/* Email Field */}
        <Field.Root invalid={!!errors.email}>
          <Field.Label className="block text-body-sm font-medium text-primary mb-2">
            {t("users.form.email")}
          </Field.Label>
          <Field.Control
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t("users.form.emailPlaceholder")}
            disabled={isSubmitting}
            required
            className="w-full px-3 py-2 border border-neutral-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder-secondary"
          />
          {errors.email && (
            <Field.Error className="text-body-sm text-error mt-1">
              {errors.email}
            </Field.Error>
          )}
        </Field.Root>

        {/* Display Name Field */}
        <Field.Root invalid={!!errors.displayName}>
          <Field.Label className="block text-body-sm font-medium text-primary mb-2">
            {t("users.form.displayName")}
          </Field.Label>
          <Field.Control
            type="text"
            value={formData.displayName}
            onChange={(e) =>
              setFormData({ ...formData, displayName: e.target.value })}
            placeholder={t("users.form.displayNamePlaceholder")}
            disabled={isSubmitting}
            required
            className="w-full px-3 py-2 border border-neutral-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder-secondary"
          />
          {errors.displayName && (
            <Field.Error className="text-body-sm text-error mt-1">
              {errors.displayName}
            </Field.Error>
          )}
        </Field.Root>

        {/* Full Name Field */}
        <Field.Root invalid={!!errors.fullName}>
          <Field.Label className="block text-body-sm font-medium text-primary mb-2">
            {t("users.form.fullName")}
          </Field.Label>
          <Field.Control
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder={t("users.form.fullNamePlaceholder")}
            disabled={isSubmitting}
            required
            className="w-full px-3 py-2 border border-neutral-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder-secondary"
          />
          {errors.fullName && (
            <Field.Error className="text-body-sm text-error mt-1">
              {errors.fullName}
            </Field.Error>
          )}
        </Field.Root>

        {/* Title Field (Optional) */}
        <Field.Root>
          <Field.Label className="block text-body-sm font-medium text-primary mb-2">
            {t("users.form.title")}
          </Field.Label>
          <Field.Control
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t("users.form.titlePlaceholder")}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-neutral-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 placeholder-secondary"
          />
        </Field.Root>

        {/* Active Status Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={isActiveId}
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            disabled={isSubmitting}
            className="w-4 h-4 rounded border-neutral-border text-primary focus:ring-2 focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label
            htmlFor={isActiveId}
            className="text-body-sm font-medium text-primary cursor-pointer select-none"
          >
            {t("users.form.isActive")}
          </label>
        </div>
      </form>
    </Dialog>
  );
}
